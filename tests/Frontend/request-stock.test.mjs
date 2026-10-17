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
            export function render(items, lines, request = null) {
                globalThis.lines = lines;
                globalThis.itemSelects = [];
                const html = renderToStaticMarkup(<RequestFormModal show items={items} request={request}
                    onClose={() => {}} onSaved={() => {}} />);
                return { html, selects: globalThis.itemSelects };
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
                    ? `export const useForm = (data) => ({ data: { ...data, items: globalThis.lines }, errors: {}, processing: false });`
                    : path === 'react-select'
                        ? `export default (props) => { if (props.inputId?.startsWith('req_item_')) globalThis.itemSelects.push(props); return null; };`
                        : `export default ({ children }) => children;`,
            }));
        },
    }],
});
const module = { exports: {} };
vm.runInNewContext(result.outputFiles[0].text, {
    module, exports: module.exports, require: createRequire(import.meta.url),
    process, console, Buffer, TextEncoder, TextDecoder, setTimeout, clearTimeout,
});
const stocked = { id: 1, name: 'Pen', sku: 'PEN', stock: 5 };
const depleted = { id: 2, name: 'Paper', sku: 'PAPER', stock: 0 };
const negative = { id: 3, name: 'Legacy item', sku: 'LEGACY', stock: -1 };
const render = module.exports.render;
const fresh = render([stocked, depleted, negative], [{ item_id: '', quantity: '' }]);
assert.equal(fresh.selects[0].options.length, 1);
assert.equal(fresh.selects[0].options[0].value, '1');
const draft = render([stocked], [{ item_id: '2', quantity: '2' }], {
    items: [{ item_id: 2, item: depleted }],
});
assert.match(draft.selects[0].value.label, /Paper.*Unserviceable/);
assert.match(draft.html, /Unserviceable for requisition: out of stock/);
assert.match(draft.html, /id="req_qty_0"[^>]*disabled=""/);
const restocked = render([stocked, { ...depleted, stock: 4 }], [{ item_id: '', quantity: '' }]);
assert.equal(restocked.selects[0].options.length, 2);
const multi = render([stocked, { ...depleted, stock: 4 }], [
    { item_id: '1', quantity: '1' }, { item_id: '', quantity: '' },
]);
assert.equal(multi.selects[1].options.length, 1);
assert.equal(multi.selects[1].options[0].value, '2');
console.log('My Requests: depleted items excluded, stale drafts blocked, restocked items selectable.');
