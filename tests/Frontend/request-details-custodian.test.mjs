import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const source = await readFile(`${root}resources/js/Pages/Inventory/Requests/components/RequestDetailsModal.tsx`, 'utf8');

assert.doesNotMatch(source, />\s*Reviewed By\s*</, 'The requester details must not identify the request reviewer as the Property Custodian.');
assert.doesNotMatch(source, /Property Custodian Review/, 'The review section must not mislabel the reviewer as the Property Custodian.');
assert.match(source, /Property Custodian \(Issued By\)/);
assert.match(source, /request\.issuance\.issued_by_name/);
assert.match(source, /Property Custodian Release Details/);
assert.match(source, /Custodian Remarks &amp; Instructions/);
assert.match(source, /request\.review_remarks/);
assert.match(source, /!\(\['Issued', 'Released'\]\.includes\(request\.status\) && request\.issuance\)/);

console.log('Request details: the issuing Property Custodian owns the release identity and custodian remarks remain visible before and after release.');
