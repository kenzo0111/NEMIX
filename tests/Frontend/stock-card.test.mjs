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
            import { StockCard } from './resources/Official Forms/Stock Card Report';
            export const render = (entries) => renderToStaticMarkup(<StockCard data={{ item: 'Test Item', entries }} />);
        `,
        resolveDir: root,
        loader: 'tsx',
    },
    bundle: true, write: false, platform: 'node', format: 'cjs',
    alias: { '@': path.join(root, 'resources/js') },
});
const module = { exports: {} };
vm.runInNewContext(result.outputFiles[0].text, {
    module, exports: module.exports, require: createRequire(import.meta.url),
    process, console, Buffer, TextEncoder, TextDecoder, setTimeout, clearTimeout,
});
for (const days of ['OFFICE SUPPLIES', 'Historical Migration', 14, '', undefined]) {
    const html = module.exports.render([{
        date: '2026-10-16', reference: 'RIS-2026-10-0001', issue_qty: 20,
        issue_office: 'Test Office', balance_qty: 30, days_to_consume: days,
    }]);
    assert.ok(html.includes('No. of Days'));
    const row = html.match(/<tr[^>]*>(?:(?!<\/tr>)[\s\S])*RIS-2026-10-0001[\s\S]*?<\/tr>/)?.[0];
    assert.ok(row, 'The transaction row should remain visible');
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((match) => match[1]);
    assert.equal(cells.length, 7);
    assert.equal(cells[3], '20');
    assert.equal(cells[4], 'Test Office');
    assert.equal(cells[5], '30');
    assert.equal(cells[6].replace(/&#160;|&nbsp;|\u00a0/g, '').trim(), '');
}
const openingHtml = module.exports.render([{ date: '', reference: 'Opening balance', balance_qty: 12 }]);
const openingRow = openingHtml.match(/<tr[^>]*>(?:(?!<\/tr>)[\s\S])*Opening balance[\s\S]*?<\/tr>/)?.[0];
assert.ok(openingRow, 'The opening-balance row should remain visible');
const openingCells = [...openingRow.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((match) => match[1]);
assert.equal(openingCells[0].replace(/&#160;|&nbsp;|\u00a0/g, '').trim(), '');
assert.equal(openingCells[1], 'Opening balance');
console.log('PASS: Stock Card keeps opening-balance dates and consumption cells blank while preserving transaction data.');
