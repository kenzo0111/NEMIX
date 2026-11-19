import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../../', import.meta.url));
const result = await build({
    stdin: {
        contents: `
            import React from 'react';
            import { renderToStaticMarkup } from 'react-dom/server';
            import { RequestFormModal } from './resources/js/Pages/Inventory/Requests/components/RequestFormModal';
            export function render(items, lines, request = null, pageProps = {}, formOverrides = {}) {
                globalThis.lines = lines;
                globalThis.pageProps = pageProps;
                globalThis.formOverrides = formOverrides;
                globalThis.validationErrors = {};
                globalThis.sentRequests = [];
                globalThis.submitHandler = null;
                globalThis.departmentSelect = null;
                globalThis.itemSelects = [];
                const html = renderToStaticMarkup(<RequestFormModal show items={items} request={request}
                    onClose={() => {}} onSaved={() => {}} />);
                return { html, selects: globalThis.itemSelects, departmentSelect: globalThis.departmentSelect,
                    submit: globalThis.submitHandler, errors: globalThis.validationErrors, requests: globalThis.sentRequests };
            }
        `,
        resolveDir: root, loader: 'tsx',
    },
    bundle: true, write: false, platform: 'node', format: 'cjs',
    alias: { '@': path.join(root, 'resources/js') },
    plugins: [{
        name: 'form-browser-adapters',
        setup(build) {
            build.onResolve({ filter: /^(@\/Components\/Modal|@inertiajs\/react|react-select)$/ },
                ({ path }) => ({ path, namespace: 'stub' }));
            build.onLoad({ filter: /.*/, namespace: 'stub' }, ({ path }) => ({ contents:
                path === '@inertiajs/react'
                    ? `export const usePage = () => ({ props: globalThis.pageProps });
                       export const useForm = (data) => ({
                           data: { ...data, ...globalThis.formOverrides, items: globalThis.lines }, errors: {}, processing: false,
                           setError: (key, message) => { globalThis.validationErrors[key] = message; },
                           transform: () => {},
                           post: (url) => { globalThis.sentRequests.push({ method: 'post', url }); },
                           put: (url) => { globalThis.sentRequests.push({ method: 'put', url }); },
                       });`
                    : path === 'react-select'
                        ? `export default (props) => { if (props.inputId === 'req_department') globalThis.departmentSelect = props; if (props.inputId?.startsWith('req_item_')) globalThis.itemSelects.push(props); return null; };`
                        : `export default ({ children }) => {
                            const visit = (node) => {
                                if (Array.isArray(node)) return node.forEach(visit);
                                if (node?.type === 'form') globalThis.submitHandler = node.props.onSubmit;
                                if (node?.props?.children) visit(node.props.children);
                            };
                            visit(children);
                            return children;
                        };`,
            }));
        },
    }],
});
const module = { exports: {} };
vm.runInNewContext(result.outputFiles[0].text, {
    module, exports: module.exports, require: createRequire(import.meta.url),
    process, console, Buffer, TextEncoder, TextDecoder, setTimeout, clearTimeout,
    route: (name) => name,
});
const stocked = { id: 1, name: 'Pen', sku: 'PEN', stock: 15 };
const depleted = { id: 2, name: 'Paper', sku: 'PAPER', stock: 0 };
const negative = { id: 3, name: 'Legacy item', sku: 'LEGACY', stock: -1 };
const belowMinimum = { id: 4, name: 'Low stock', sku: 'LOW', stock: 5 };
const atMinimum = { id: 5, name: 'Minimum stock', sku: 'MIN', stock: 10 };
const render = module.exports.render;
const fresh = render([stocked, depleted, negative, belowMinimum, atMinimum], [{ item_id: '', quantity: '' }]);
assert.equal(fresh.selects[0].options.length, 1);
assert.equal(fresh.selects[0].options[0].value, '1');
const draft = render([stocked], [{ item_id: '2', quantity: '2' }], {
    items: [{ item_id: 2, item: depleted }],
});
assert.match(draft.selects[0].value.label, /Paper.*Unserviceable/);
assert.match(draft.html, /Unserviceable for requisition: out of stock/);
assert.match(draft.html, /id="req_qty_0"[^>]*disabled=""/);
const restocked = render([stocked, { ...depleted, stock: 14 }], [{ item_id: '', quantity: '' }]);
assert.equal(restocked.selects[0].options.length, 2);
const multi = render([stocked, { ...depleted, stock: 14 }], [
    { item_id: '1', quantity: '1' }, { item_id: '', quantity: '' },
]);
assert.equal(multi.selects[1].options.length, 1);
assert.equal(multi.selects[1].options[0].value, '2');
console.log('My Requests: depleted items excluded, stale drafts blocked, restocked items selectable.');

const coordinatorPage = { auth: { capabilities: { coordinatorInventory: true } }, departmentAssignment: {
    department: 'Finance', recipient: 'Finance Head', recipient_designation: 'Department Head', ready: true,
} };
const assigned = render([stocked], [{ item_id: '1', quantity: '1' }], null, coordinatorPage);
assert.equal(assigned.departmentSelect.value.value, 'Finance');
assert.equal(assigned.departmentSelect.isDisabled, true);
assert.match(assigned.html, /id="req_recipient"[^>]*readonly=""[^>]*value="Finance Head"/);
assert.match(assigned.html, /id="req_recipient_designation"[^>]*readonly=""[^>]*value="Department Head"/);
assert.doesNotMatch(assigned.html, /type="submit"[^>]*disabled=""/);
const unassigned = render([stocked], [], null, { ...coordinatorPage, departmentAssignment: null });
assert.match(unassigned.html, /Ask an administrator to assign your Delivery Unit/);
assert.match(unassigned.html, /type="submit"[^>]*disabled=""/);
assert.match(unassigned.html, /<button type="button"(?![^>]* disabled=)[^>]*>Cancel<\/button>/);
const historical = render([stocked], [], { recipient: 'Previous Head', recipient_designation: 'Former Head', department: 'Previous Unit' }, coordinatorPage);
assert.equal(historical.departmentSelect.value.value, 'Previous Unit');
assert.match(historical.html, /value="Previous Head"/);
console.log('Department assignment: office-head autofill, locked unit, historical details, and missing-assignment guidance passed.');

const plentiful = { ...stocked, stock: 1500, unit_of_issue: 'piece' };
const authorizedPage = { auth: {
    roles: ['Authorized Personnel'], user: { name: 'Requester' },
    capabilities: { coordinatorInventory: true, requiresSupportingDocument: true },
} };
const document = { supporting_document_type: 'Approved Letter', supporting_document: { name: 'approved.pdf' } };
for (const page of [coordinatorPage, authorizedPage]) {
    const excessive = render([plentiful], [{ item_id: '1', quantity: '1499' }], null, page, document);
    assert.match(excessive.html, /id="req_qty_0"[^>]*max="1490"/);
    assert.match(excessive.html, /Request at most 1490 piece to keep the minimum stock of 10 piece/);
    assert.match(excessive.html, /id="req_qty_0"[^>]*aria-invalid="true"/);
    assert.match(excessive.html, /type="submit"[^>]*disabled=""/);
    excessive.submit({ preventDefault() {} });
    assert.equal(excessive.requests.length, 0);
    assert.match(excessive.errors['items.0.quantity'], /minimum stock of 10/);

    const boundary = render([plentiful], [{ item_id: '1', quantity: '1490' }], null, page, document);
    assert.doesNotMatch(boundary.html, /type="submit"[^>]*disabled=""/);
    boundary.submit({ preventDefault() {} });
    assert.equal(boundary.requests.length, 1);
}

const reserved = render([{ ...plentiful, max_request_quantity: 90 }], [{ item_id: '1', quantity: '91' }]);
assert.match(reserved.html, /id="req_qty_0"[^>]*max="90"/);
assert.match(reserved.html, /Request at most 90 piece/);
assert.match(reserved.selects[0].value.label, /Max request: 90/);
assert.match(reserved.html, /type="submit"[^>]*disabled=""/);

const configured = render([plentiful], [{ item_id: '1', quantity: '1481' }], null, { minimumStockThreshold: 20 });
assert.match(configured.html, /id="req_qty_0"[^>]*max="1480"/);
assert.match(configured.html, /minimum stock of 20/);
assert.match(configured.html, /type="submit"[^>]*disabled=""/);

const protectedDraft = render([], [{ item_id: '5', quantity: '1' }], { items: [{ item_id: 5, item: atMinimum }] });
assert.match(protectedDraft.html, /Unavailable for requisition: the minimum stock of 10 units/);
assert.match(protectedDraft.html, /id="req_qty_0"[^>]*disabled=""/);
assert.match(protectedDraft.html, /type="submit"[^>]*disabled=""/);
protectedDraft.submit({ preventDefault() {} });
assert.equal(protectedDraft.requests.length, 0);
assert.match(protectedDraft.errors['items.0.item_id'], /minimum stock/);

console.log('Minimum stock: both roles block excessive submissions, allow the boundary, and honor reservations and configured thresholds.');
