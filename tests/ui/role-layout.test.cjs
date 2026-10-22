const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
let page;
function load(file) {
    const exports = {};
    const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true }
    }).outputText;
    function resolve(id) {
        if (id === '@inertiajs/react') return { usePage: () => page };
        if (id === './SystemModeBadge' || id === './ThemeToggle') return { __esModule: true, default: () => null };
        if (id === '@/Components/Sidebar') return { __esModule: true, default: () => React.createElement('aside', { 'aria-label': 'Main navigation' }) };
        if (id === '@/Hooks/useSidebarCollapse') return { useSidebarCollapse: () => [false, () => {}] };
        if (id.startsWith('@/')) return load(path.join('resources/js', id.slice(2)) + (id.endsWith('systemIdentity') ? '.ts' : '.tsx'));
        if (id.startsWith('.')) return load(path.join(path.dirname(file), id) + '.tsx');
        return require(id);
    }
    new Function('require', 'exports', source)(resolve, exports);
    return exports;
}
const { roleDesignation, SYSTEM_TITLE } = load('resources/js/utils/systemIdentity.ts');
const Header = load('resources/js/Components/SystemHeader.tsx').default;
const PageHeader = load('resources/js/Components/PageHeader.tsx').default;
const Layout = load('resources/js/Layouts/DashboardLayout.tsx').default;
function session(role, extra = {}) { return { user: { id: 1, name: 'Test User', primary_role: role }, roles: [role], permissions: [], ...extra }; }
for (const [role, expected] of [
    ['System Admin', 'Administrator'], ['System Administrator', 'Administrator'],
    ['Property Custodian', 'Inventory Custodian'], ['Inventory Custodian', 'Inventory Custodian'],
    ['Inventory Staff', 'SPMO Personnel'], ['SPMO Personnel', 'SPMO Personnel'],
    ['Supply Coordinator', 'Supply Coordinator'], ['Authorized Personnel', 'Authorized Personnel'],
    ['Document verifier', 'Document verifier'],
]) test(`header uses authenticated ${role} designation`, () => {
    page = { props: { auth: session(role) } };
    const html = renderToStaticMarkup(React.createElement(Header));
    assert.ok(html.includes(SYSTEM_TITLE));
    assert.ok(html.includes(`${expected} Dashboard`));
    assert.ok(html.includes('Toggle navigation menu'));
    assert.ok(html.includes('flex-wrap'));
});
test('identity follows replaced Inertia session props and fresh renders', () => {
    page = { props: { auth: session('Supply Coordinator') } };
    assert.match(renderToStaticMarkup(React.createElement(Header)), /Supply Coordinator Dashboard/);
    page.props.auth = session('Authorized Personnel');
    assert.match(renderToStaticMarkup(React.createElement(Header)), /Authorized Personnel Dashboard/);
    page = { props: { auth: session('Property Custodian') } };
    assert.match(renderToStaticMarkup(React.createElement(Header)), /Inventory Custodian Dashboard/);
});
test('primary assigned role takes precedence over additional roles', () => {
    assert.equal(roleDesignation(session('Authorized Personnel', { roles: ['Supply Coordinator', 'Authorized Personnel'] })), 'Authorized Personnel');
    assert.equal(roleDesignation(session('Inventory Staff', { is_system_admin: true })), 'Administrator');
    assert.equal(roleDesignation({ user: null, roles: [], permissions: [] }), 'Staff');
});
test('module title and actions survive the unified header', () => {
    page = { props: { auth: session('System Admin') } };
    const html = renderToStaticMarkup(React.createElement(PageHeader, { title: 'Manage Staff', description: 'Manage user accounts.', actions: React.createElement('button', null, 'Add user') }));
    for (const text of ['Consumable Supply Management', 'Administrator Dashboard', 'Manage Staff', 'Add user', 'Manage user accounts.']) assert.ok(html.includes(text));
});
test('operating mode notice remains visible', () => {
    page = { props: { auth: session('System Admin'), system: { mode: 'MAINTENANCE MODE' } } };
    assert.match(renderToStaticMarkup(React.createElement(Header)), /Maintenance mode: only System Administrators can make changes/);
});
test('shared layout preserves content, skip link, responsive sidebar offset and print behavior', () => {
    const html = renderToStaticMarkup(React.createElement(Layout, null, React.createElement('p', null, 'Existing module')));
    for (const text of ['Existing module', 'Skip to content', 'md:ml-72', 'print:ml-0', 'min-w-0', 'workspace-content']) assert.ok(html.includes(text));
});
