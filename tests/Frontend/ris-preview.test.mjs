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
            import { RisPreviewModal } from './resources/js/Pages/Inventory/Issuance/components/RisPreviewModal';
            export function render(issuance) {
                return renderToStaticMarkup(<RisPreviewModal show issuance={issuance}
                    onClose={() => {}} institutionName="Test University" responsibilityCenterCode="01"
                    defaultApprovedBy="Approved Officer" defaultApprovedByDesignation="Approver"
                    defaultIssuedBy="Assigned Issuer" defaultIssuedByDesignation="Storekeeper" />);
            }
        `,
        resolveDir: root,
        loader: 'tsx',
    },
    bundle: true,
    write: false,
    platform: 'node',
    format: 'cjs',
    alias: { '@': path.join(root, 'resources/js') },
    plugins: [{
        name: 'inline-modal',
        setup(build) {
            // The modal portal requires a browser. Keep the real preview mapping and form table.
            build.onResolve({ filter: /^@\/Components\/Modal$/ }, () => ({ path: 'modal', namespace: 'stub' }));
            build.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: 'export default ({ children }) => children;' }));
        },
    }],
});
const module = { exports: {} };
vm.runInNewContext(result.outputFiles[0].text, {
    module, exports: module.exports, require: createRequire(import.meta.url),
    process, console, Buffer, TextEncoder, TextDecoder, setTimeout, clearTimeout,
});
const issuance = {
    id: 1, ris_number: 'RIS-2026-10-0001', recipient: 'Recipient Name',
    recipient_designation: 'Department Chair', status: 'Approved',
    requested_at: '2026-10-14', reviewed_at: '2026-10-15', date_issued: '', date: '',
    items: [],
};
const approved = module.exports.render(issuance);
assert.ok(approved.includes('Assigned Issuer'));
assert.ok(approved.includes('Storekeeper'));
assert.equal((approved.match(/Department Chair/g) || []).length, 2);
assert.equal((approved.match(/____________/g) || []).length, 2);
for (const designation of [undefined, '', '   ']) {
    const html = module.exports.render({ ...issuance, recipient_designation: designation });
    assert.equal((html.match(/Requesting Personnel/g) || []).length, 2);
}
const released = module.exports.render({ ...issuance, status: 'Issued', date_issued: '2026-10-16',
    issued_by_name: 'Recorded Issuer', issued_by_position: 'Recorded Position' });
assert.ok(released.includes('Recorded Issuer'));
assert.ok(released.includes('Recorded Position'));
assert.equal((released.match(/10\/16\/2026/g) || []).length, 2);
assert.ok(!released.includes('____________'));
console.log('RIS preview: approval signatories, designation fallbacks, and release dates passed.');
