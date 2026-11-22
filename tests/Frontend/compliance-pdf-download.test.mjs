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
    platform: 'browser',
    format: 'cjs',
});

const requests = [];
const downloads = [];
const objectUrls = [];
const revokedUrls = [];
const metaToken = 'token-from-login-page';
let sessionToken = 'updated/token+after-login=';
let exportResponse = { status: 200, type: 'application/pdf', body: '%PDF-1.7\nReport' };
const document = {
    cookie: `XSRF-TOKEN=${encodeURIComponent(sessionToken)}`,
    querySelector: () => ({ content: metaToken }),
    createElement: () => {
        const link = { click: () => downloads.push({ href: link.href, name: link.download }) };
        return link;
    },
    body: { appendChild() {}, removeChild() {} },
};
const respond = (headers) => {
    const authorized = (headers['x-csrf-token'] || headers['x-xsrf-token']) === sessionToken;
    const result = authorized ? exportResponse : {
        status: 419, type: 'application/json', body: JSON.stringify({ message: 'CSRF token mismatch.' }),
    };
    return { ...result, blob: new Blob([result.body], { type: result.type }) };
};
class XMLHttpRequest {
    onloadend = null;
    headers = {};
    open(method, url) { this.method = method; this.url = url; }
    setRequestHeader(name, value) { this.headers[name.toLowerCase()] = value; }
    getAllResponseHeaders() { return `content-type: ${this.response.type}\r\n`; }
    send(body) {
        requests.push({ method: this.method, url: this.url, headers: this.headers, body, responseType: this.responseType });
        const result = respond(this.headers);
        this.status = result.status;
        this.response = result.blob;
        queueMicrotask(() => this.onloadend());
    }
}

const module = { exports: {} };
vm.runInNewContext(result.outputFiles[0].text, {
    module,
    exports: module.exports,
    require: createRequire(import.meta.url),
    process,
    console,
    Buffer,
    URL,
    URLSearchParams,
    Blob,
    FormData,
    setTimeout,
    clearTimeout,
    XMLHttpRequest,
    document,
    window: {
        location: { href: 'https://unc-nemix.com/compliance/reports' },
        URL: {
            createObjectURL: (blob) => { objectUrls.push(blob); return `blob:report-${objectUrls.length}`; },
            revokeObjectURL: (url) => revokedUrls.push(url),
        },
    },
    fetch: async (url, options) => {
        const headers = Object.fromEntries(Object.entries(options.headers).map(([name, value]) => [name.toLowerCase(), value]));
        requests.push({ url, headers, body: options.body, method: options.method });
        const result = respond(headers);
        return new Response(result.blob, { status: result.status, headers: { 'Content-Type': result.type } });
    },
});

const { buildCompliancePdfRequestBody, downloadCompliancePdfFromBackend } = module.exports;
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

const report = { id: 42, type: 'RSMI', reference: '2026-11-006', title: 'Supplies and Materials Issued' };
await downloadCompliancePdfFromBackend(report);
assert.equal(requests.length, 1, 'The first download after Inertia login must succeed without a refresh or retry.');
assert.equal(requests[0].headers['x-xsrf-token'], sessionToken);
assert.equal(requests[0].headers['x-csrf-token'], undefined, 'The stale meta token must not override the current cookie.');
assert.equal(requests[0].headers.accept, 'application/json, application/pdf', 'Laravel errors must be requested as JSON.');
assert.equal(requests[0].method, 'POST');
assert.equal(requests[0].url, '/compliance/reports/export-pdf');
assert.equal(requests[0].responseType, 'blob');
assert.deepEqual(JSON.parse(requests[0].body), { report_id: 42 });
assert.equal(downloads[0].name, 'RSMI_2026-11-006_Supplies_and_Materials_Issued.pdf');
assert.equal(await objectUrls[0].text(), exportResponse.body);
assert.deepEqual(revokedUrls, [downloads[0].href]);

// A later session change must be picked up without reloading this module or document.
sessionToken = 'updated/token+after-second-login=';
document.cookie = `other=value; XSRF-TOKEN=${encodeURIComponent(sessionToken)}`;
await downloadCompliancePdfFromBackend({ ...report, type: 'RPCI' });
assert.equal(requests[1].headers['x-xsrf-token'], sessionToken);
assert.equal(downloads.length, 2);

exportResponse = {
    status: 422, type: 'application/json', body: JSON.stringify({ message: 'Report is unavailable.', errors: { report_id: ['Choose an existing report.'] } }),
};
await assert.rejects(downloadCompliancePdfFromBackend(report), (error) => {
    assert.equal(error.response.status, 422);
    assert.equal(error.response.data.message, 'Report is unavailable.', 'Blob errors must be decoded for the notification.');
    assert.deepEqual(plain(error.response.data.errors), { report_id: ['Choose an existing report.'] });
    return true;
});
assert.equal(downloads.length, 2, 'Failed exports must not download error responses.');

exportResponse = { status: 200, type: 'text/html', body: '<html>Sign in</html>' };
await assert.rejects(downloadCompliancePdfFromBackend(report), /did not return a report PDF/);
assert.equal(downloads.length, 2, 'An authentication redirect must not be saved or reported as a PDF.');

console.log('PASS: Manage Reports uses saved export inputs and the current session token; PDF downloads and error responses are handled correctly.');
