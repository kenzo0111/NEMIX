const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

module.exports = function createLoader(mocks = {}) {
    const root = path.resolve(__dirname, '../../../resources/js');
    const cache = new Map();
    function load(file) {
        if (!path.isAbsolute(file)) file = path.resolve(file);
        file = [file, `${file}.ts`, `${file}.tsx`].find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
        if (!file) throw new Error('TypeScript test module was not found.');
        if (cache.has(file)) return cache.get(file);
        const exports = {};
        cache.set(file, exports);
        const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
            compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
        }).outputText;
        const resolve = id => {
            if (Object.hasOwn(mocks, id)) return mocks[id];
            if (id.startsWith('@/')) return load(path.join(root, id.slice(2)));
            if (id.startsWith('.')) return load(path.resolve(path.dirname(file), id));
            return require(id);
        };
        new Function('require', 'exports', source)(resolve, exports);
        return exports;
    }
    return load;
};
