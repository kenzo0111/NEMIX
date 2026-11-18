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
            import StockCardDialog from './resources/js/Pages/Inventory/Coordinator/components/StockCardDialog';
            export function render(stock) {
                return renderToStaticMarkup(<StockCardDialog stock={stock} onClose={() => {}} />);
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
        name: 'stock-card-dialog-adapters',
        setup(build) {
            build.onResolve({ filter: /^(@\/Components\/Modal|axios)$/ }, ({ path }) => ({ path, namespace: 'stub' }));
            build.onLoad({ filter: /.*/, namespace: 'stub' }, ({ path }) => ({
                contents: path === 'axios'
                    ? 'export default { get: async () => ({ data: {} }) };'
                    : 'export default ({ children }) => children;',
                loader: 'tsx',
            }));
        },
    }],
});

const module = { exports: {} };
vm.runInNewContext(result.outputFiles[0].text, {
    module,
    exports: module.exports,
    require: createRequire(import.meta.url),
    process,
    console,
    Buffer,
    TextEncoder,
    TextDecoder,
    setTimeout,
    clearTimeout,
    route: (_name, params) => `/delivery-unit/stock-cards/${params.stock}`,
});

const html = module.exports.render({ id: 17, name: 'Bond Paper', sku: 'PAPER-A4', unit: 'ream', quantity: 8, value: '800' });
assert.match(html, />Generate Stock Card</);
assert.match(html, />View Form</);
assert.match(html, />Download PDF</);
assert.match(html, /href="\/delivery-unit\/stock-cards\/17"/);
assert.match(html, /Official Appendix 58/);
console.log('Coordinator Stock Card dialog offers preview and download actions.');
