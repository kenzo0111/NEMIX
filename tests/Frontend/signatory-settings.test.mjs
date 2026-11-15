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

const preview = (markup, form) => {
    const section = markup.match(new RegExp(`<section aria-label="Live ${form} Form Preview"[^>]*>([\\s\\S]*?)</section>`));
    assert.ok(section, `${form} live form preview is missing`);
    return section[1];
};
for (const [form, title] of [
    ['RIS', 'REQUISITION AND ISSUE SLIP'],
    ['RSMI', 'REPORT OF SUPPLIES AND MATERIALS ISSUED'],
    ['RPCI', 'REPORT ON THE PHYSICAL COUNT OF INVENTORIES'],
    ['MOR', 'MEMORANDUM RECEIPT FOR PROPERTY'],
]) {
    assert.ok(preview(html, form).includes(title), `${form} must render its official form`);
}
assert.ok(preview(html, 'RPCI').includes('Legacy Chair'), 'The effective legacy certifier must appear on the form');

const draft = { ...legacy,
    'institution.name': 'Preview Test University',
    'institution.default_fund_cluster': '02 - Special Fund',
    'institution.custodial_office': 'Updated Property Office',
    'institution.responsibility_center_code': '99-777-00',
    'signatories.ris_approved_by_name': 'New Approver',
    'signatories.ris_approved_by_designation': 'New Approval Position',
    'signatories.ris_issued_by_name': 'New RIS Issuer',
    'signatories.ris_issued_by_designation': 'New RIS Position',
    'signatories.ris_oic_active': true,
    'signatories.ris_oic_prefix': 'ACTING, ',
    'signatories.rsmi_certified_by_name': 'New Supply Certifier',
    'signatories.rsmi_posted_by_name': 'New Accounting Staff',
    'signatories.rpci_accountable_officer_name': 'New Accountable Officer',
    'signatories.rpci_accountable_officer_designation': 'New Accountable Position',
    'signatories.rpci_certified_by_name': 'New Committee Chair',
    'signatories.rpci_verified_by_name': 'New Verifier',
    'signatories.rpci_verified_by_position': 'New Verification Position',
    'signatories.mor_issued_by_name': 'New Property Issuer',
    'signatories.mor_issued_by_designation': 'New Property Position',
    'compliance.mor_appendix_number': 'Appendix Preview-42',
};
const draftHtml = render(draft);
for (const [form, values] of [
    ['RIS', ['ACTING, New Approver', 'New Approval Position', 'New RIS Issuer', 'New RIS Position', '99-777-00', 'Updated Property Office']],
    ['RSMI', ['New Supply Certifier', 'New Accounting Staff']],
    ['RPCI', ['New Accountable Officer', 'New Accountable Position', 'New Committee Chair', 'New Verifier', 'New Verification Position']],
    ['MOR', ['New Property Issuer', 'New Property Position', 'Appendix Preview-42']],
]) {
    const formHtml = preview(draftHtml, form);
    for (const value of [...values, 'Preview Test University', '02 - Special Fund']) {
        assert.ok(formHtml.includes(value), `${form} preview did not reflect the draft value: ${value}`);
    }
    assert.ok(!formHtml.includes('Legacy Chair'), `${form} retained a replaced signatory`);
}
assert.ok(preview(render({ ...draft, 'signatories.ris_oic_prefix': '' }), 'RIS').includes('OIC, New Approver'));
const withoutOic = preview(render({ ...draft, 'signatories.ris_oic_active': false }), 'RIS');
assert.ok(withoutOic.includes('New Approver'));
assert.ok(!withoutOic.includes('ACTING, New Approver'));

const cleared = { ...draft };
for (const target of Object.values(SIGNATORY_TARGET_FIELDS)) {
    cleared[target.nameKey] = '';
    if (target.designationKey) cleared[target.designationKey] = '';
    cleared[target.idKey] = null;
}
const clearedHtml = render(cleared);
for (const form of ['RIS', 'RSMI', 'RPCI', 'MOR']) {
    const formHtml = preview(clearedHtml, form);
    for (const target of Object.values(SIGNATORY_TARGET_FIELDS)) {
        assert.ok(!formHtml.includes(draft[target.nameKey]), `${form} retained a cleared signatory`);
    }
}
assert.ok(preview(render(legacy), 'RPCI').includes('Legacy Chair'), 'Resetting settings must reset the preview');
console.log('PASS: Active signatory controls, legacy settings, all four live official forms, unsaved changes, OIC delegation, clearing, and reset.');
