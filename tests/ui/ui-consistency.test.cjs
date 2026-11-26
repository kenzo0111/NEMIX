const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const load = require('./helpers/load-ts.cjs')();
const { Button, actionLinkProps } = load('resources/js/Components/ui/button.tsx');
const Field = load('resources/js/Components/ui/field.tsx').default;
const { RequestStatusBadge } = load('resources/js/Pages/Inventory/Requests/components/RequestStatusBadge.tsx');
const { IssuanceStatus } = load('resources/js/Pages/Inventory/Issuance/components/IssuanceStatus.tsx');
const { formatMoney, formatQuantity, formatScreenDate, formatTimestamp } = load('resources/js/utils/displayFormat.ts');
const { getInstitutionalSelectStyles } = load('resources/js/styles/selectStyles.ts');
const render = element => renderToStaticMarkup(element);

test('shared actions retain button semantics, submit intent, loading and link variants', () => {
    assert.match(render(React.createElement(Button, null, 'View')), /type="button"/);
    const submit = render(React.createElement(Button, { type: 'submit', variant: 'primary', loading: true }, 'Saving'));
    assert.match(submit, /type="submit"/);
    assert.match(submit, /disabled=""/);
    assert.match(submit, /aria-busy="true"/);
    assert.match(submit, /data-variant="primary"/);
    const link = render(React.createElement('a', { ...actionLinkProps('primary'), href: '/requests' }, 'Request supplies'));
    assert.match(link, /href="\/requests"/);
    assert.match(link, /data-variant="primary"/);
});
test('fields associate errors and hints without duplicating IDs or forwarding inputId to native controls', () => {
    const html = render(React.createElement(Field, { id: 'supplier', label: 'Supplier', error: 'Required', hint: 'Official name' }, React.createElement('input', { 'aria-describedby': 'supplier-hint' })));
    assert.match(html, /for="supplier"/);
    assert.match(html, /aria-invalid="true"/);
    assert.match(html, /aria-describedby="supplier-hint supplier-error"/);
    assert.match(html, /id="supplier-error" role="alert"|role="alert" id="supplier-error"/);
    assert.doesNotMatch(html, /inputId/);
});
test('equivalent cancellation states share a neutral badge and request phases keep their labels', () => {
    for (const Component of [RequestStatusBadge, IssuanceStatus]) assert.match(render(React.createElement(Component, { status: 'Cancelled' })), /data-tone="neutral"/);
    assert.match(render(React.createElement(RequestStatusBadge, { status: 'Approved' })), /Approved · Awaiting Release/);
    assert.match(render(React.createElement(RequestStatusBadge, { status: 'Pending Verification' })), /Pending Verification/);
});
test('display helpers distinguish missing values from zero and preserve calendar dates', () => {
    assert.equal(formatMoney(null), '—');
    assert.equal(formatMoney(0), '₱0.00');
    assert.equal(formatQuantity(undefined), '—');
    assert.equal(formatQuantity(0), '0');
    assert.equal(formatScreenDate('2026-11-25'), 'Nov 25, 2026');
    assert.match(formatTimestamp('2026-11-24T16:00:00Z'), /Nov 25, 2026/);
    assert.match(formatTimestamp('2026-11-24T16:00:00Z'), /GMT\+8/);
});
test('select errors and disabled controls use shared theme tokens and retain the control height', () => {
    const styles = getInstitutionalSelectStyles();
    const invalid = styles.control({}, { selectProps: { 'aria-invalid': true }, isFocused: true, isDisabled: false, isMulti: false });
    assert.equal(invalid.borderColor, 'var(--danger-text)');
    assert.equal(invalid.minHeight, 'var(--control-height)');
    const disabled = styles.control({}, { selectProps: {}, isFocused: false, isDisabled: true, isMulti: false });
    assert.equal(disabled.cursor, 'not-allowed');
    assert.equal(disabled.backgroundColor, 'var(--surface-muted)');
    assert.equal(styles.groupHeading({}).color, 'var(--brand-text)');
    assert.equal(styles.placeholder({}).whiteSpace, 'nowrap');
    assert.equal(styles.placeholder({}).textOverflow, 'ellipsis');
    assert.equal(styles.singleValue({}).whiteSpace, 'nowrap');
    assert.equal(styles.singleValue({}).textOverflow, 'ellipsis');
});

test('react-select controls across modals do not define arbitrary 38px heights', () => {
    const fs = require('node:fs');
    const files = [
        'resources/js/Pages/AccessControl/ManageStaffs/components/CreateStaffModal.tsx',
        'resources/js/Pages/AccessControl/ManageStaffs/components/EditStaffModal.tsx',
    ];
    for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        assert.doesNotMatch(content, /minHeight:\s*['"]38px['"]/);
    }
});

test('the configured Tailwind compiler generates the shared control, status and dialog rules', async () => {
    const fs = require('node:fs');
    const postcss = require('postcss');
    const tailwind = require('tailwindcss');
    const config = require('tailwindcss/loadConfig')(require('node:path').resolve('tailwind.config.js'));
    const css = fs.readFileSync('resources/css/ui.css', 'utf8');
    const compiled = await postcss([tailwind({ ...config, content: [{ raw: '<button class="ui-button"></button><input class="ui-field"><span class="ui-status"></span><table class="ui-data-table"></table><div class="ui-dialog-panel ui-dialog-header ui-dialog-body ui-dialog-footer"></div>' }] })]).process('@tailwind base; @tailwind components; @tailwind utilities;\n' + css, { from: undefined });
    assert.match(compiled.css, /\.ui-button\[data-variant=['"]primary['"]\]/);
    assert.match(compiled.css, /background: var\(--brand-primary\)/);
    assert.match(compiled.css, /\.ui-status\[data-tone=['"]neutral['"]\]/);
    assert.match(compiled.css, /\.ui-dialog-panel/);
    assert.match(compiled.css, /focus-visible/);
});

test('Field injects accessibility attributes onto inputs nested inside relative wrappers', () => {
    const html = render(
        React.createElement(
            Field,
            { id: 'staff-email', label: 'Email', error: 'Invalid email', hint: 'Institutional address' },
            React.createElement(
                'div',
                { className: 'relative' },
                React.createElement('input', { type: 'email', className: 'ui-field w-full' })
            )
        )
    );
    assert.match(html, /<input[^>]*id="staff-email"/);
    assert.match(html, /<input[^>]*aria-invalid="true"/);
    assert.match(html, /<input[^>]*aria-describedby="staff-email-hint staff-email-error"/);
});

test('Button supports compact sm table-action size and new shared primitives render semantically', () => {
    const smBtn = render(React.createElement(Button, { size: 'sm', variant: 'secondary' }, 'View'));
    assert.match(smBtn, /data-size="sm"/);

    const EmptyState = load('resources/js/Components/ui/empty-state.tsx').default;
    const emptyHtml = render(React.createElement(EmptyState, { title: 'No records', description: 'Adjust filters', actionLabel: 'Reset', onAction: () => {} }));
    assert.match(emptyHtml, /No records/);
    assert.match(emptyHtml, /Reset/);
});

test('no invalid Tailwind v3 utilities or native alert/confirm popups remain in UI pages', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    function walk(dir) {
        let out = [];
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) out = out.concat(walk(full));
            else if (full.endsWith('.tsx')) out.push(full);
        }
        return out;
    }
    const tsxFiles = walk('resources/js');
    for (const file of tsxFiles) {
        const content = fs.readFileSync(file, 'utf8');
        assert.doesNotMatch(content, /\b(p-4\.5|py-0\.2|text-2xs|focus:outline-hidden)\b/, `Invalid Tailwind class found in ${file}`);
        assert.doesNotMatch(content, /\b(window\.)?(alert|confirm)\s*\(/, `Native alert/confirm found in ${file}`);
    }
});
