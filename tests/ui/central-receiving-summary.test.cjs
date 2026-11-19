const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const componentPath = path.resolve(__dirname, '../../resources/js/Pages/Dashboard/Components/CentralReceivingSummary.tsx');
const load = require('./helpers/load-ts.cjs')({ '@inertiajs/react': { Link: ({ children, ...props }) => React.createElement('a', props, children) } });
const CentralReceivingSummary = load(componentPath).default;
global.route = name => `/${name.replaceAll('.', '/')}`;

const summary = {
    period_label: 'November 2026',
    total_quantity: 30,
    quantities_by_unit: [{ unit: 'piece', quantity: 10 }, { unit: 'ream', quantity: 20 }],
    record_count: 8,
    item_types: 2,
    latest_recorded_at: 'Nov 17, 2026 • 10:00 AM',
    recent_records: [{
        id: 7,
        item_name: 'Bond Paper A4',
        stock_no: 'PAPER-A4',
        quantity: 20,
        unit: 'ream',
        date_received: '2026-11-16',
        date_received_formatted: 'Nov 16, 2026',
        recorded_at: '2026-11-17T10:00:00+08:00',
        recorded_at_formatted: 'Nov 17, 2026 • 10:00 AM',
        recorded_by: 'Maria Cruz',
    }],
};

const render = (data = summary, canViewCatalog = true) => renderToStaticMarkup(
    React.createElement(CentralReceivingSummary, { summary: data, canViewCatalog }),
);
const visibleText = html => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

test('received quantities keep different units separate', () => {
    const text = visibleText(render());
    assert.ok(text.includes('Quantities received by unit'));
    assert.ok(text.includes('10 piece'));
    assert.ok(text.includes('20 ream'));
    assert.doesNotMatch(text, /\b30\b/);
    assert.ok(text.includes('Receiving records 8'));
    assert.ok(text.includes('Supply types 2'));
});

test('the receiving table distinguishes receipt dates from recording timestamps and states its coverage', () => {
    const html = render();
    const text = visibleText(html);
    for (const label of ['Date received', 'Supply / stock number', 'Quantity', 'Recorded by', 'Entry timestamp']) {
        assert.ok(text.includes(label));
    }
    for (const detail of ['Bond Paper A4', 'PAPER-A4', '+20 ream', 'Maria Cruz', 'Nov 16, 2026', 'Nov 17, 2026 • 10:00 AM']) {
        assert.ok(text.includes(detail));
    }
    assert.ok(text.includes('Showing 1 of 8 receiving records for November 2026, newest entries first.'));
    assert.match(html, /<caption\b/);
    assert.match(html, /<time dateTime="2026-11-16"/);
    assert.match(html, /<time dateTime="2026-11-17T10:00:00\+08:00"/);
    assert.match(html, /scope="row"/);
});

test('the central catalog link follows the coordinators access', () => {
    assert.match(render(), /href="\/coordinator\/catalog\/index"/);
    assert.doesNotMatch(render(summary, false), /View central catalog|<a\b/);
    assert.doesNotMatch(render(), /<form\b/);
    assert.match(render(), /aria-sort="descending"/);
    assert.equal((render().match(/<button\b/g) || []).length, 5);
});

test('an empty month shows a clear state without older records or a stale timestamp', () => {
    const html = render({
        ...summary,
        total_quantity: 0,
        quantities_by_unit: [],
        record_count: 0,
        item_types: 0,
        latest_recorded_at: null,
        recent_records: [],
    });
    const text = visibleText(html);
    assert.ok(text.includes('No central receiving records for November 2026.'));
    assert.ok(text.includes('No quantities recorded'));
    assert.ok(text.includes('Receiving records 0'));
    assert.doesNotMatch(html, /<table\b|Latest entry for this period|Maria Cruz/);
});
