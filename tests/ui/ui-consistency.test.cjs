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
