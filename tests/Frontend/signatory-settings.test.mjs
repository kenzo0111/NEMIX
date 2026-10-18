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
            import SignatorySettings, { SIGNATORY_TARGET_FIELDS } from './resources/js/Pages/Admin/SystemSettings/Components/SignatorySettings';
            import { normalizeSystemSettings } from './resources/js/Pages/Admin/SystemSettings/normalizeSettings';
            export { normalizeSystemSettings, SIGNATORY_TARGET_FIELDS };
            export function render(settings) {
                return renderToStaticMarkup(<SignatorySettings settings={settings} onChange={() => {}}
                    signatories={[]} onAddSignatory={() => {}} onDeleteSignatory={() => {}} />);
            }
        `,
        resolveDir: root,
        loader: 'tsx',
    },
    bundle: true, write: false, platform: 'node', format: 'cjs',
    alias: { '@': path.join(root, 'resources/js') },
    plugins: [{
        name: 'settings-auth-context',
        setup(builder) {
            builder.onResolve({ filter: /^@\/Hooks\/useAuthorization$/ }, () => ({ path: 'auth', namespace: 'stub' }));
            builder.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: 'export const useAuthorization = () => ({ can: () => true });' }));
        },
    }],
});
const module = { exports: {} };
vm.runInNewContext(result.outputFiles[0].text, {
    module, exports: module.exports, require: createRequire(import.meta.url),
    process, console, Buffer, TextEncoder, TextDecoder, setTimeout, clearTimeout,
});
const { normalizeSystemSettings, SIGNATORY_TARGET_FIELDS, render } = module.exports;
const grouped = (values) => ({ signatories: Object.entries(values).map(([key, value]) => ({ key, value })) });
const retired = [
    'signatories.rsmi_certified_by_designation', 'signatories.rsmi_posted_by_designation',
    'signatories.rpci_certified_by_position', 'signatories.stock_card_custodian',
    'signatories.stock_card_custodian_id', 'signatories.mor_issued_by_office',
    'signatories.rpci_committee_chair', 'signatories.rpci_committee_chair_id',
];
const legacy = normalizeSystemSettings(grouped({
    ...Object.fromEntries(retired.map((key) => [key, 'Retired value'])),
    'signatories.rpci_certified_by_name': '',
    'signatories.rpci_committee_chair': 'Legacy Chair',
    'signatories.rpci_committee_chair_id': 42,
}));
assert.equal(legacy['signatories.rpci_certified_by_name'], 'Legacy Chair');
assert.equal(legacy['signatories.rpci_certified_by_id'], 42);
for (const key of retired) assert.ok(!(key in legacy), `${key} must not be silently resubmitted`);

const canonical = normalizeSystemSettings(grouped({
    'signatories.rpci_certified_by_name': 'Current Certifier',
    'signatories.rpci_certified_by_id': 7,
    'signatories.rpci_committee_chair': 'Different Old Chair',
    'signatories.rpci_committee_chair_id': 42,
}));
assert.equal(canonical['signatories.rpci_certified_by_name'], 'Current Certifier');
assert.equal(canonical['signatories.rpci_certified_by_id'], 7);
assert.equal(normalizeSystemSettings(null)['signatories.rpci_certified_by_name'], '');

const html = render(legacy);
for (const label of ['Certification Designation', 'Accounting Designation', 'Inventory Committee Chairman',
    'Certified Correct By - Designation', 'Stock Card Storekeeper / Custodian', 'Issuing / Custodial Office Title']) {
    assert.ok(!html.includes(label), `Retired input still rendered: ${label}`);
}
for (const label of ['Approving Officer', 'Issuing Custodian', 'Certified Correct By (Supply Custodian)',
    'Posted By (Accounting Representative)', 'Certified Correct By (Inventory Committee Chair)',
    'Verified By - Name', 'Issued / Released By (Property Custodian)', 'Form Appendix Header Number']) {
    assert.ok(html.includes(label), `Active input missing: ${label}`);
}
assert.ok(html.includes('Legacy Chair'), 'The effective legacy chair must remain visible');
assert.equal(Object.keys(SIGNATORY_TARGET_FIELDS).length, 8);
for (const target of Object.values(SIGNATORY_TARGET_FIELDS)) {
    assert.ok(!retired.includes(target.nameKey));
    assert.ok(!retired.includes(target.designationKey));
    assert.ok(!retired.includes(target.idKey));
}
console.log('PASS: Inactive inputs are absent, active controls remain, legacy RPCI selection is preserved, and hidden retired values are not submitted.');
