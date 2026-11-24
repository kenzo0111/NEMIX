const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const root = path.resolve(__dirname, '../../resources/js');
const modules = new Map();
let permissions = new Set();
global.route = name => `/${name.replaceAll('.', '/')}`;

function load(file) {
    if (modules.has(file)) return modules.get(file);
    const exports = {};
    modules.set(file, exports);
    const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    const resolve = id => {
        if (id === 'react') return {
            ...React,
            // Render every phase in the queue's All Requests tab.
            useState: initial => React.useState(initial === 'pending' ? 'all' : initial),
        };
        if (id === '@inertiajs/react') return {
            usePage: () => ({ props: { auth: { user: { username: 'inventory.staff' } } } }),
            useForm: data => ({ data, errors: {}, processing: false }),
            router: { post: () => {} },
        };
        if (id === '@/Hooks/useAuthorization') return { default: () => ({ can: name => permissions.has(name) }), __esModule: true };
        if (id === '@/Components/Modal') return { default: ({ show, children }) => show ? React.createElement('div', { role: 'dialog' }, children) : null, __esModule: true };
        if (id.startsWith('.') || id.startsWith('@/')) {
            const base = id.startsWith('@/') ? path.join(root, id.slice(2)) : path.resolve(path.dirname(file), id);
            const target = [base, `${base}.tsx`, `${base}.ts`].find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
            return load(target);
        }
        return require(id);
    };
    new Function('require', 'exports', source)(resolve, exports);
    return exports;
}

const { SupplyRequestQueue } = load(path.join(root, 'Pages/Inventory/Issuance/components/SupplyRequestQueue.tsx'));
const request = {
    id: 1, department: 'Registrar', purpose: 'Office supplies', ris_number: 'RIS-0001',
    created_at: '2026-11-19', reviewed_at: '2026-11-19', review_remarks: 'Partial approval due to allowance.',
    requester: { name: 'Requester' }, reviewer: { name: 'Reviewer' },
    supporting_document_type: 'Approved Letter', supporting_document_name: 'approved.pdf',
    items: [{ id: 10, item_id: 5, quantity: 20, approved_quantity: null, max_approval_quantity: 12,
        item: { name: 'Pens', sku: 'PEN', stock: 30, unit_of_issue: 'piece' } }],
};

function render(status, canApprove = true, document = false) {
    permissions = new Set(['inventory.requests.release', 'inventory.requests.ready', 'inventory.requests.verify-document']);
    if (canApprove) permissions.add('inventory.requests.approve');
    const pending = ['Pending', 'Pending Verification', 'Under Review', 'For Correction'].includes(status);
    return renderToStaticMarkup(React.createElement(SupplyRequestQueue, {
        requests: [{ ...request, status, requires_supporting_document: document,
            items: request.items.map(line => ({ ...line, approved_quantity: pending ? null : 10 })) }],
        onPreview: () => {},
        focusRequestId: 1,
    }));
}

test('quantity adjustments are available during verification and review, with approval after verification', () => {
    for (const status of ['Pending', 'Pending Verification', 'Under Review']) {
        const html = render(status, true, true);
        assert.match(html, /type="number"[^>]*max="12"/);
        assert.match(html, /Quick Adjust:/);
        assert.match(html, /id="remarks-1"/);
        assert.equal(html.includes('Approve Requisition'), status !== 'Pending Verification');
    }
    assert.match(render('Pending Verification', true, true), /Save and Mark Ready/);
    assert.match(render('Pending Verification', true, true), /personally inspected the physical supporting documents/);
    assert.match(render('Pending Verification', true, true), /disabled=""/);
    assert.match(render('Pending Verification', true, true), /adjustments are saved when you approve/);
});

test('approved and pickup phases show final quantities, notes, and release actions without editing', () => {
    for (const status of ['Approved', 'Ready for Pickup']) {
        const html = render(status);
        assert.doesNotMatch(html, /type="number"|Quick Adjust:|Update Quantities|id="remarks-1"|Approve Requisition/);
        assert.match(html, /Final Approved Qty/);
        assert.match(html, /Partial approval due to allowance/);
        assert.match(html, /Preview \/ Print RIS/);
        assert.match(html, /Confirm Signed Handover &amp; Release/);
        assert.match(html, />10<\/span>/);
    }
    assert.match(render('Approved', true, true), /Mark Ready for Pickup &amp; Notify Requester/);
    assert.doesNotMatch(render('Approved', true, true), /Confirm Signed Handover/);
    assert.match(render('Ready for Pickup', true, true), /Confirm Signed Handover/);
});

test('correction and completed requests and viewers without approval permission cannot adjust quantities', () => {
    for (const status of ['For Correction', 'Issued', 'Released', 'Rejected', 'Cancelled']) {
        assert.doesNotMatch(render(status), /type="number"|Quick Adjust:|id="remarks-1"/);
    }
    assert.doesNotMatch(render('Pending Verification', false, true), /type="number"|Quick Adjust:|id="remarks-1"/);
});
