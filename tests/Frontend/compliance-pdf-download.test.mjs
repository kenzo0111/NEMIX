import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../../', import.meta.url));
const result = await build({
    entryPoints: [path.join(root, 'resources/js/Pages/Compliance/Reports/utils/compliancePdfEngine.ts')],
    bundle: true,
    write: false,
    platform: 'node',
    format: 'cjs',
});

const module = { exports: {} };
vm.runInNewContext(result.outputFiles[0].text, {
    module,
    exports: module.exports,
    require: createRequire(import.meta.url),
    process,
    console,
    Buffer,
    URL,
});

const { buildCompliancePdfRequestBody } = module.exports;
const plain = (value) => JSON.parse(JSON.stringify(value));
const formTypes = ['RSMI', 'RPCI', 'STOCK_CARD', 'MR'];
const periods = [
    ['all', 'All Records / Full Ledger'],
    ['yearly', 'Year 2026'],
    ['range', 'October 1–31, 2026'],
    ['monthly', 'October 2026'],
    ['specific', '2026-10-01'],
];

for (const type of formTypes) {
    for (const [periodType, date] of periods) {
        assert.deepEqual(
            plain(buildCompliancePdfRequestBody({
                id: 42,
                type,
                reference: `${type}-2026-TEST`,
                periodType,
                date,
                dateValue: '2026-10-01',
                payload: { snapshot: { sensitive: 'must-not-be-resubmitted' } },
            })),
            { report_id: 42 },
            `${type}/${periodType} must export saved data by report ID only`,
        );
    }
}

assert.deepEqual(
    plain(buildCompliancePdfRequestBody({
        type: 'RSMI',
        periodType: 'range',
        date: 'October 1–31, 2026',
        dateValue: '2026-10-01',
        startDate: '2026-10-01',
        endDate: '2026-10-31',
    })),
    {
        report_id: null,
        type: 'RSMI',
        periodType: 'range',
        date: '2026-10-01',
        startDate: '2026-10-01',
        endDate: '2026-10-31',
    },
    'Unsaved exports must prefer the machine-readable date value.',
);

const source = result.outputFiles[0].text;
assert.ok(!source.includes('html2canvas'), 'The lossy HTML canvas fallback must not be bundled.');
assert.ok(!source.includes('jsPDF'), 'The client-side jsPDF fallback must not be bundled.');

console.log('PASS: All Manage Reports PDFs use authoritative server export inputs without canvas fallback.');
