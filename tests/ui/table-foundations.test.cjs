const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const createLoader = require('./helpers/load-ts.cjs');
const load = createLoader();
const { compareSortValues, sortRows } = load('resources/js/Hooks/useSortableData.ts');
const { rowSelectionProps, cardSelectionProps } = load('resources/js/Hooks/useTableSelection.ts');
const Header = load('resources/js/Components/ui/sortable-table-header.tsx').default;
const RecordTable = load('resources/js/Components/ui/record-table.tsx').default;
const SelectionAction = load('resources/js/Components/ui/table-selection-action.tsx').default;

test('numeric quantities and stock numbers sort naturally without mutating the dataset', () => {
    const rows = [{ id: 1, value: '10' }, { id: 2, value: 2 }, { id: 3, value: '100' }];
    const accessors = { value: row => row.value };
    assert.deepEqual(sortRows(rows, accessors, { key: 'value', direction: 'asc' }).map(row => row.id), [2, 1, 3]);
    assert.deepEqual(sortRows(rows, accessors, { key: 'value', direction: 'desc' }).map(row => row.id), [3, 1, 2]);
    assert.deepEqual(rows.map(row => row.id), [1, 2, 3]);
    assert.ok(compareSortValues('Supply 2', 'supply 10') < 0);
    assert.equal(compareSortValues('École', 'ecole'), 0);
});

test('timestamps compare as instants rather than formatted text', () => {
    const rows = [
        { id: 1, date: new Date('2026-11-19T16:00:00Z') },
        { id: 2, date: new Date('2026-11-20T01:00:00+08:00') },
        { id: 3, date: new Date('2026-11-09T10:00:00Z') },
    ];
    assert.deepEqual(sortRows(rows, { date: row => row.date }, { key: 'date', direction: 'asc' }).map(row => row.id), [3, 1, 2]);
    assert.equal(compareSortValues(rows[0].date, new Date('2026-11-20T00:00:00+08:00')), 0);
});

test('null, empty, undefined and invalid values remain last in both directions', () => {
    for (const missing of [null, undefined, '', NaN, Infinity, new Date('invalid')]) {
        for (const direction of ['asc', 'desc']) {
            assert.ok(compareSortValues(missing, 7, direction) > 0);
            assert.ok(compareSortValues(7, missing, direction) < 0);
        }
    }
    const rows = [{ id: 1, value: null }, { id: 2, value: 2 }, { id: 3, value: 10 }, { id: 4 }];
    assert.deepEqual(sortRows(rows, { value: row => row.value }, { key: 'value', direction: 'desc' }).map(row => row.id), [3, 2, 1, 4]);
});

test('equal values preserve order and unsupported client columns preserve records', () => {
    const rows = [{ id: 2, value: 2 }, { id: 1, value: '2' }, { id: 3, value: 2 }];
    assert.deepEqual(sortRows(rows, { value: row => row.value }, { key: 'value', direction: 'desc' }), rows);
    assert.deepEqual(sortRows(rows, {}, { key: 'unknown', direction: 'asc' }), rows);
});

test('headers expose direction through aria-sort and accessible buttons', () => {
    const render = (activeColumn, direction) => renderToStaticMarkup(React.createElement('table', null,
        React.createElement('thead', null, React.createElement('tr', null,
            React.createElement(Header, { column: 'quantity', activeColumn, direction, onSort: () => {} }, 'Quantity')))));
    assert.match(render('quantity', 'asc'), /aria-sort="ascending"/);
    assert.match(render('quantity', 'desc'), /aria-sort="descending"/);
    assert.match(render('other', 'asc'), /aria-sort="none"/);
    assert.match(render('quantity', 'asc'), /<button type="button"/);
    assert.match(render('quantity', 'asc'), /lucide-arrow-up/);
});

test('record tables retain server order and have one toolbar action', () => {
    const rows = [{ id: 9, name: 'Zulu' }, { id: 2, name: 'Alpha' }];
    const table = renderToStaticMarkup(React.createElement(RecordTable, { rows,
        columns: [{ key: 'name', label: 'Name', value: row => row.name }], rowKey: row => row.id,
        sort: { key: 'name', direction: 'asc' }, onSort: () => {}, selectedKey: 2, onSelect: () => {} }));
    assert.ok(table.indexOf('Zulu') < table.indexOf('Alpha'), 'A server page must not be sorted locally.');
    assert.equal((table.match(/aria-selected="true"/g) || []).length, 1);
    assert.doesNotMatch(table.match(/<tbody[\s\S]*<\/tbody>/)[0], /<button/);
    const disabled = renderToStaticMarkup(React.createElement(SelectionAction, { selectedLabel: null, onAction: () => {} }));
    const enabled = renderToStaticMarkup(React.createElement(SelectionAction, { selectedLabel: 'Alpha', onAction: () => {} }));
    assert.equal((enabled.match(/<button/g) || []).length, 1);
    assert.match(disabled, /disabled=""/);
    assert.doesNotMatch(enabled, /disabled=""/);
    assert.match(enabled, /bg-red-950/);
});

test('Enter and Space select rows, while embedded controls retain their behavior', () => {
    let selected = 0;
    const row = {};
    const props = rowSelectionProps(false, () => selected++);
    let prevented = 0;
    for (const key of ['Enter', ' ']) props.onKeyDown({ key, target: row, currentTarget: row, preventDefault: () => prevented++ });
    props.onKeyDown({ key: 'Enter', target: {}, currentTarget: row, preventDefault: () => prevented++ });
    props.onClick({ target: { closest: () => ({ tagName: 'BUTTON' }) } });
    assert.equal(selected, 2);
    assert.equal(prevented, 2);
    props.onClick({ target: { closest: () => null } });
    assert.equal(selected, 3);
    assert.equal(props.tabIndex, 0);
    assert.equal(cardSelectionProps(true, () => {})['aria-pressed'], true);
});

test('arrow keys, Home and End move focus and selection together', () => {
    let focused;
    let selected;
    let prevented = 0;
    const rows = [0, 1, 2].map(index => ({ focus: () => focused = index, click: () => selected = index }));
    const parentElement = { querySelectorAll: () => rows };
    rows.forEach(row => row.parentElement = parentElement);
    const invoke = (index, key) => rowSelectionProps(false, () => {}).onKeyDown({ key, target: rows[index], currentTarget: rows[index], preventDefault: () => prevented++ });
    invoke(0, 'ArrowDown'); assert.equal(focused, 1); assert.equal(selected, 1);
    invoke(1, 'End'); assert.equal(focused, 2); assert.equal(selected, 2);
    invoke(2, 'Home'); assert.equal(focused, 0); assert.equal(selected, 0);
    invoke(0, 'ArrowUp'); assert.equal(focused, 0); assert.equal(selected, 0);
    assert.equal(prevented, 4);
});

test('single selection clears after filtering or changing pages', () => {
    const state = [];
    let cursor = 0;
    let effects = [];
    const hooks = { ...React,
        useState: initial => {
            const index = cursor++;
            if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
            return [state[index], value => state[index] = typeof value === 'function' ? value(state[index]) : value];
        },
        useEffect: callback => effects.push(callback),
    };
    const useSelection = createLoader({ react: hooks })('resources/js/Hooks/useTableSelection.ts').useTableSelection;
    const render = rows => { cursor = 0; effects = []; const result = useSelection(rows, row => row.id); effects.forEach(effect => effect()); return result; };
    const rows = [{ id: 1 }, { id: 2 }];
    render(rows).selectRow(rows[0]);
    assert.equal(render(rows).selectedKey, 1);
    render(rows).selectRow(rows[1]);
    assert.equal(render(rows).selectedKey, 2);
    assert.equal(render([rows[0]]).selectedRow, null);
    assert.equal(render(rows).selectedKey, null, 'Reappearing rows must not restore a stale selection.');
});

test('toolbar controls share the exact 40px height token and React Select references it', () => {
    const fs = require('node:fs');
    const css = fs.readFileSync('resources/css/app.css', 'utf8');
    assert.match(css, /--control-height:\s*40px;/, 'CSS root must define --control-height: 40px');
    assert.match(css, /\.table-control\s*\{[^}]*height:\s*var\(--control-height\);/s, '.table-control must use --control-height');
    assert.match(css, /\.table-toolbar\s+:is\([^)]+\)[^{]*\{[^}]*height:\s*var\(--control-height\);/s, '.table-toolbar inputs and buttons must use --control-height');

    const { getInstitutionalSelectStyles } = load('resources/js/styles/selectStyles.ts');
    const styles = getInstitutionalSelectStyles(false);
    const controlStyle = styles.control({}, { isFocused: false, isMulti: false });
    assert.equal(controlStyle.minHeight, 'var(--control-height)');
    assert.equal(controlStyle.height, 'var(--control-height)');
    const multiControlStyle = styles.control({}, { isFocused: false, isMulti: true });
    assert.equal(multiControlStyle.height, 'auto');
    const valueContainer = styles.valueContainer({});
    assert.equal(valueContainer.minHeight, 'calc(var(--control-height) - 2px)');
    const indicators = styles.indicatorsContainer({});
    assert.equal(indicators.height, 'calc(var(--control-height) - 2px)');

    const rfidStylesFile = fs.readFileSync('resources/js/Pages/RFID-Scanner/utils/selectStyles.ts', 'utf8');
    assert.match(rfidStylesFile, /export\s*\{\s*institutionalSelectStyles\s*\}\s*from\s*['"]@\/styles\/selectStyles['"]/);
    assert.doesNotMatch(rfidStylesFile, /38px|42px/);
});

test('active states use institutional maroon while inactive and disabled states use slate/gray', () => {
    const fs = require('node:fs');
    const css = fs.readFileSync('resources/css/app.css', 'utf8');
    assert.match(css, /\[data-selectable-row\]\[data-state='selected'\]\s*\{[^}]*bg-red-50[^}]*inset\s+3px\s+0\s+0\s+#7f1d1d/s);

    const disabledAction = renderToStaticMarkup(React.createElement(SelectionAction, { selectedLabel: null, onAction: () => {} }));
    assert.match(disabledAction, /disabled:bg-slate-200/);
    assert.match(disabledAction, /disabled:text-slate-500/);

    const activeAction = renderToStaticMarkup(React.createElement(SelectionAction, { selectedLabel: 'Selected Item', onAction: () => {} }));
    assert.match(activeAction, /bg-red-950/);
    assert.match(activeAction, /hover:bg-red-900/);
    assert.match(activeAction, /text-white/);
});

test('sidebar control uses Chevrons icons, clear labels, and accessible click targets', () => {
    global.route = () => ({ current: () => false });
    const sidebarLoader = createLoader({
        '@inertiajs/react': {
            __esModule: true,
            usePage: () => ({ props: { auth: { user: { name: 'Admin User' } } } }),
            Link: (props) => React.createElement('a', props),
        },
        '@/Components/ThemeToggle': { __esModule: true, default: () => null },
    });
    const SidebarUser = sidebarLoader('resources/js/Components/Navigation/SidebarUser.tsx').default;

    // Collapsed sidebar
    const collapsed = renderToStaticMarkup(React.createElement(SidebarUser, {
        collapsed: true,
        onToggleCollapse: () => {},
        onOpenLogoutModal: () => {},
    }));
    assert.match(collapsed, /title="Expand sidebar"/);
    assert.match(collapsed, /aria-label="Expand sidebar"/);
    assert.match(collapsed, /aria-expanded="false"/);
    assert.match(collapsed, /min-h-11\s+min-w-11/);
    assert.match(collapsed, /lucide-chevrons-right/);

    // Expanded sidebar
    const expanded = renderToStaticMarkup(React.createElement(SidebarUser, {
        collapsed: false,
        onToggleCollapse: () => {},
        onOpenLogoutModal: () => {},
    }));
    assert.match(expanded, /title="Collapse sidebar"/);
    assert.match(expanded, /aria-label="Collapse sidebar"/);
    assert.match(expanded, /aria-expanded="true"/);
    assert.match(expanded, /Collapse sidebar/);
    assert.match(expanded, /min-h-11/);
    assert.match(expanded, /lucide-chevrons-left/);
});

test('table rows render direct action buttons (View, Edit, RIS Form, Update) on each row', () => {
    const tableLoader = createLoader({
        '@/Hooks/useAuthorization': { __esModule: true, default: () => ({ can: () => true }) },
        '@/utils/dateUtils': { __esModule: true, formatDisplayDate: (d) => d || '2026-11-20' },
        '@/utils/risFormatter': { __esModule: true, formatRisNumber: (n) => n || 'RIS-2026-0001' },
    });

    const IssuanceRow = tableLoader('resources/js/Pages/Inventory/Issuance/components/IssuanceRow.tsx').IssuanceRow;
    const issuanceMarkup = renderToStaticMarkup(React.createElement('table', null,
        React.createElement('tbody', null,
            React.createElement(IssuanceRow, {
                issuance: { id: 1, ris_number: 'RIS-001', recipient: 'Juan Cruz', item: 'Bond Paper', total_quantity: 5, date: '2026-11-20', status: 'Approved' },
                onViewDetails: () => {},
                onViewRisForm: () => {},
            })
        )
    ));
    assert.match(issuanceMarkup, />View<\/button>/);
    assert.match(issuanceMarkup, />RIS Form<\/button>/);

    const SupplierRow = tableLoader('resources/js/Pages/Suppliers/Components/SupplierRow.tsx').SupplierRow;
    const supplierMarkup = renderToStaticMarkup(React.createElement('table', null,
        React.createElement('tbody', null,
            React.createElement(SupplierRow, {
                supplier: { id: 1, name: 'Acme Supplies', tin: '123-456', reg_number: 'REG-001', status: 'active' },
                onView: () => {},
                onEdit: () => {},
            })
        )
    ));
    assert.match(supplierMarkup, />View<\/button>/);
    assert.match(supplierMarkup, />Update<\/button>/);
});

test('audit trail rows render expandable accordion rows with forensic details', () => {
    const auditLoader = createLoader({
        '@/utils/dateUtils': { __esModule: true, formatDisplayDate: () => '11/20/2026', formatDisplayTime: () => '01:00 PM' },
    });
    const LoginAuditTable = auditLoader('resources/js/Pages/AuditLogs/Login/Components/LoginAuditTable.tsx').LoginAuditTable;
    const markup = renderToStaticMarkup(React.createElement(LoginAuditTable, {
        records: [{
            id: 101,
            user: { name: 'Admin User', email: 'admin@unc.edu.ph', role: 'System Administrator' },
            account: 'admin@unc.edu.ph',
            role: 'System Administrator',
            ip_address: '192.168.1.1',
            status: 'Success',
            created_at: '2026-11-20T05:00:00Z',
            user_agent: 'Mozilla/5.0 Chrome',
            failure_reason: null,
        }],
        sort: 'date',
        direction: 'desc',
        onSort: () => {},
    }));
    assert.match(markup, /aria-label="Expand audit details"/);
    assert.match(markup, /192\.168\.1\.1/);
    assert.match(markup, /System Administrator/);
});


