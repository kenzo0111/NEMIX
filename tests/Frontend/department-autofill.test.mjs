import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../../', import.meta.url));
const result = await build({
    stdin: { contents: `
        import React from 'react';
        import { renderToStaticMarkup } from 'react-dom/server';
        import Fields from './resources/js/Pages/AccessControl/ManageStaffs/components/DepartmentAssignmentFields';
        export function render(data, props) {
            globalThis.pageProps = props;
            globalThis.selects = {};
            const changes = [];
            const html = renderToStaticMarkup(<Fields data={data} errors={{}} required onChange={(field, value) => changes.push([field, value])} />);
            return { html, changes, selects: globalThis.selects };
        }
    `, resolveDir: root, loader: 'tsx' },
    bundle: true, write: false, platform: 'node', format: 'cjs',
    alias: { '@': path.join(root, 'resources/js') },
    plugins: [{ name: 'field-adapters', setup(builder) {
        builder.onResolve({ filter: /^(@inertiajs\/react|react-select(?:\/creatable)?)$/ }, ({ path }) => ({ path, namespace: 'stub' }));
        builder.onLoad({ filter: /.*/, namespace: 'stub' }, ({ path }) => ({ contents:
            path === '@inertiajs/react' ? 'export const usePage = () => ({ props: globalThis.pageProps });'
                : 'export default (props) => { globalThis.selects[props.inputId] = props; return null; };'
        }));
    } }],
});
const module = { exports: {} };
vm.runInNewContext(result.outputFiles[0].text, {
    module, exports: module.exports, require: createRequire(import.meta.url), process, console,
    Buffer, TextEncoder, TextDecoder, setTimeout, clearTimeout,
});
const props = { departments: ['CCMS', 'CoEd'], departmentHeads: { CCMS: 7, CoEd: 8 }, officeHeads: [
    { id: 7, name: 'CCMS Dean', designation: 'Dean, CCMS', is_active: true },
    { id: 8, name: 'Education Dean', designation: 'Dean, College of Education', is_active: true },
] };
const initial = module.exports.render({ department: 'CCMS', office_head_id: '7' }, props);
assert.match(initial.html, /id="staff-head-designation"[^>]*readonly=""[^>]*value="Dean, CCMS"/);
initial.selects['staff-department'].onChange({ value: 'CoEd' });
assert.equal(JSON.stringify(initial.changes), JSON.stringify([['department', 'CoEd'], ['office_head_id', '8']]));
const switched = module.exports.render({ department: 'CoEd', office_head_id: '8' }, props);
assert.equal(switched.selects['staff-office-head'].value.value, '8');
assert.match(switched.html, /value="Dean, College of Education"/);
switched.selects['staff-department'].onCreateOption('Other Office');
assert.equal(JSON.stringify(switched.changes), JSON.stringify([['department', 'Other Office'], ['office_head_id', '']]));
const cleared = module.exports.render({ department: 'CCMS', office_head_id: '7' }, props);
cleared.selects['staff-department'].onChange(null);
assert.equal(JSON.stringify(cleared.changes), JSON.stringify([['department', ''], ['office_head_id', '']]));
console.log('Delivery Unit selection fills the matching dean/designation and clears stale heads when switching to an unmapped office.');
