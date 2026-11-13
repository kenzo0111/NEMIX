const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const source = read('resources/js/Pages/Admin/systemAdminWalkthrough.ts');
const exportsObject = {};
new Function('exports', ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText)(exportsObject);

const {
    buildSystemAdminWalkthrough,
    readSystemAdminTourProgress,
    saveSystemAdminTourProgress,
    SYSTEM_ADMIN_DAILY_CHECKLIST,
    SYSTEM_ADMIN_TOUR_CHAPTERS,
    SYSTEM_ADMIN_TOUR_STEPS,
    systemAdminTourDestinationMatches,
    systemAdminTourPanelPosition,
    systemAdminTourStorageKey,
} = exportsObject;

const routePages = {
    dashboard: [
        'resources/js/Pages/Admin/SystemDashboard.tsx',
        'resources/js/Components/DashboardControls.tsx',
        'resources/js/Components/SystemModeBadge.tsx',
    ],
    'access-control.staffs': [
        'resources/js/Pages/AccessControl/ManageStaffs/components/StaffFilters.tsx',
        'resources/js/Pages/AccessControl/ManageStaffs/components/StaffTable.tsx',
    ],
    'access-control.role-permission': [
        'resources/js/Pages/AccessControl/Roles/Index.tsx',
        'resources/js/Pages/AccessControl/Roles/Components/RoleTable.tsx',
    ],
    'system.settings.index': [
        'resources/js/Pages/Admin/SystemSettings/Index.tsx',
        'resources/js/Pages/Admin/SystemSettings/Components/OperationsSettings.tsx',
        'resources/js/Pages/Admin/SystemSettings/Components/RfidSettings.tsx',
    ],
    'inventory.index': ['resources/js/Pages/Inventory/AllItems/Index.tsx'],
    'inventory.receiving': ['resources/js/Pages/Inventory/Receiving/Index.tsx'],
    'inventory.requests.index': ['resources/js/Pages/Inventory/Requests/Index.tsx'],
    'inventory.issuance': ['resources/js/Pages/Inventory/Issuance/Index.tsx'],
    'suppliers.index': ['resources/js/Pages/Suppliers/ManageSupplier.tsx'],
    'compliance.reports': ['resources/js/Pages/Compliance/Reports/Index.tsx'],
    'compliance.analytics': ['resources/js/Pages/Compliance/Analytics/Index.tsx'],
    'rfid-scanner.index': ['resources/js/Pages/RFID-Scanner/Components/RFIDScannerWorkspace.tsx'],
    'audit-logs.login-trails': ['resources/js/Pages/AuditLogs/Login/Index.tsx'],
    'audit-logs.transaction-trails': ['resources/js/Pages/AuditLogs/Transactions/Index.tsx'],
};
const makeHref = (name, params = {}) => `http://localhost/${name.replaceAll('.', '/')}?${new URLSearchParams(params)}`;

test('the admin walkthrough covers every chapter with usable task instructions', () => {
    assert.ok(SYSTEM_ADMIN_TOUR_STEPS.length >= 30);
    assert.equal(new Set(SYSTEM_ADMIN_TOUR_STEPS.map(step => step.id)).size, SYSTEM_ADMIN_TOUR_STEPS.length);
    assert.deepEqual([...new Set(SYSTEM_ADMIN_TOUR_STEPS.map(step => step.chapter))], SYSTEM_ADMIN_TOUR_CHAPTERS);
    for (const step of SYSTEM_ADMIN_TOUR_STEPS) {
        assert.ok(step.title && step.description && step.outcome, `Incomplete guidance: ${step.id}`);
        assert.ok(step.instructions.length >= 3, `Missing procedure: ${step.id}`);
        assert.ok(routePages[step.routeName], `Unexpected destination: ${step.routeName}`);
    }
    assert.equal(SYSTEM_ADMIN_TOUR_STEPS[0].routeName, 'dashboard');
    assert.equal(SYSTEM_ADMIN_TOUR_STEPS.at(-1).routeName, 'dashboard');
    assert.ok(SYSTEM_ADMIN_DAILY_CHECKLIST.length >= 5);
});

test('each walkthrough target exists on its destination screen, including settings tabs', () => {
    const settingsTabs = read('resources/js/Pages/Admin/SystemSettings/tabs.ts');
    for (const step of SYSTEM_ADMIN_TOUR_STEPS) {
        const anchor = step.selector.match(/^\[data-tour="([^"]+)"\]$/)?.[1];
        assert.ok(anchor, `Unsupported target: ${step.selector}`);
        const page = routePages[step.routeName].map(read).join('\n');
        if (anchor.startsWith('system-admin-settings-') && anchor !== 'system-admin-settings-save') {
            assert.ok(page.includes('data-tour={`system-admin-settings-${activeTab}`}'));
            assert.equal(anchor, `system-admin-settings-${step.params.tab}`);
        } else {
            assert.ok(page.includes(`data-tour="${anchor}"`), `Missing ${anchor} on ${step.routeName}`);
        }
        if (step.routeName === 'system.settings.index') {
            assert.ok(settingsTabs.includes(`id: '${step.params.tab}'`), `Unknown settings category: ${step.id}`);
        }
    }
    assert.deepEqual([...new Set(SYSTEM_ADMIN_TOUR_STEPS.filter(step => step.params?.tab).map(step => step.params.tab))],
        ['institution', 'signatories', 'inventory', 'numbering', 'rfid', 'mail', 'operations']);
});

test('requester and non-admin sessions cannot build or launch an admin tour', () => {
    let called = false;
    const unexpected = () => { called = true; throw new Error('Admin routes must not be evaluated'); };
    assert.deepEqual(buildSystemAdminWalkthrough(false, unexpected, unexpected, unexpected), []);
    assert.equal(called, false);
    const all = buildSystemAdminWalkthrough(true, () => true, () => true, makeHref);
    assert.equal(all.length, SYSTEM_ADMIN_TOUR_STEPS.length);
    const filtered = buildSystemAdminWalkthrough(true, name => name !== 'inventory.issuance', name => name !== 'rfid-scanner.index', makeHref);
    assert.ok(filtered.every(step => !['inventory.issuance', 'rfid-scanner.index'].includes(step.routeName)));
    assert.ok(filtered.length < all.length);
});

test('navigation distinguishes settings categories and accepts filters on the correct screen', () => {
    const institution = 'http://localhost/admin/system-settings?tab=institution';
    const operations = 'http://localhost/admin/system-settings?tab=operations';
    assert.equal(systemAdminTourDestinationMatches(institution, institution), true);
    assert.equal(systemAdminTourDestinationMatches(operations, institution), false);
    assert.equal(systemAdminTourDestinationMatches(institution, 'http://localhost/admin/system-settings'), false);
    assert.equal(systemAdminTourDestinationMatches(operations, `${operations}&search=anything`), true);
    assert.equal(systemAdminTourDestinationMatches('/inventory', 'http://localhost/inventory?search=paper'), true);
    assert.equal(systemAdminTourDestinationMatches('/inventory', 'http://localhost/inventory/receiving'), false);
    assert.equal(systemAdminTourDestinationMatches('https://other.example/inventory', 'http://localhost/inventory'), false);
    for (const step of buildSystemAdminWalkthrough(true, () => true, () => true, makeHref)) {
        assert.equal(systemAdminTourDestinationMatches(step.href, step.href), true, step.id);
    }
});

test('progress survives page changes by stable topic ID and stays separate for each user', () => {
    const data = new Map();
    const storage = {
        getItem: key => data.get(key) ?? null,
        setItem: (key, value) => data.set(key, value),
        removeItem: key => data.delete(key),
    };
    const firstKey = systemAdminTourStorageKey(1);
    const secondKey = systemAdminTourStorageKey(2);
    const index = SYSTEM_ADMIN_TOUR_STEPS.findIndex(step => step.id === 'policy-snapshot');
    saveSystemAdminTourProgress(storage, firstKey, 'policy-snapshot');
    assert.equal(readSystemAdminTourProgress(storage, firstKey, SYSTEM_ADMIN_TOUR_STEPS), index);
    assert.equal(readSystemAdminTourProgress(storage, secondKey, SYSTEM_ADMIN_TOUR_STEPS), null);
    const reordered = [...SYSTEM_ADMIN_TOUR_STEPS].reverse();
    assert.equal(readSystemAdminTourProgress(storage, firstKey, reordered), reordered.findIndex(step => step.id === 'policy-snapshot'));
    saveSystemAdminTourProgress(storage, firstKey, 'removed-topic');
    assert.equal(readSystemAdminTourProgress(storage, firstKey, SYSTEM_ADMIN_TOUR_STEPS), 0);
    assert.equal(readSystemAdminTourProgress(storage, firstKey, []), null);
    saveSystemAdminTourProgress(storage, firstKey, null);
    assert.equal(readSystemAdminTourProgress(storage, firstKey, SYSTEM_ADMIN_TOUR_STEPS), null);
});

test('blocked browser storage does not crash walkthrough progress handling', () => {
    const blocked = () => { throw new Error('Storage blocked'); };
    const storage = { getItem: blocked, setItem: blocked, removeItem: blocked };
    assert.equal(readSystemAdminTourProgress(storage, 'key', SYSTEM_ADMIN_TOUR_STEPS), null);
    assert.doesNotThrow(() => saveSystemAdminTourProgress(storage, 'key', 'welcome'));
    assert.doesNotThrow(() => saveSystemAdminTourProgress(storage, 'key', null));
});

test('long guide cards stay within desktop, mobile, and landscape viewports', () => {
    for (const [width, height] of [[1440, 900], [1280, 720], [768, 1024], [390, 844], [320, 568], [844, 390]]) {
        for (const panelHeight of [300, 640, 1100]) {
            for (const target of [null,
                { top: 0, left: 0, right: width, bottom: height, width, height },
                { top: 100, left: 20, right: 220, bottom: 180, width: 200, height: 80 },
                { top: height - 80, left: width - 200, right: width, bottom: height, width: 200, height: 80 },
            ]) {
                const position = systemAdminTourPanelPosition(target, width, height, panelHeight);
                assert.ok(position.left >= 12 && position.top >= 12);
                assert.ok(position.left + position.width <= width - 12);
                assert.ok(position.top + Math.min(panelHeight, height - 24) <= height - 12);
            }
        }
    }
});
