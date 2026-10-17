import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../../', import.meta.url));
const handlers = new Map();
const cleanups = [];
const result = await build({
    stdin: {
        contents: `
            export * from './resources/js/utils/notifications';
            export { default as mount } from './resources/js/Components/GlobalNotifications';
        `,
        resolveDir: root, loader: 'tsx',
    },
    bundle: true, write: false, platform: 'node', format: 'cjs',
    alias: { '@': path.join(root, 'resources/js') },
    plugins: [{
        name: 'notification-lifecycle-adapters',
        setup(build) {
            build.onResolve({ filter: /^(react|react\/jsx-runtime|@inertiajs\/react|\.\/NotificationToasts)$/ },
                ({ path }) => ({ path, namespace: 'adapter' }));
            build.onLoad({ filter: /.*/, namespace: 'adapter' }, ({ path }) => ({ contents:
                path === 'react/jsx-runtime'
                    ? `export const jsx = () => null; export const jsxs = jsx;`
                    : path === 'react'
                    ? `export const useEffect = (effect) => globalThis.cleanups.push(effect()); export default {createElement: () => null};`
                    : path === '@inertiajs/react'
                        ? `export const router = {on: (name, handler) => { globalThis.handlers.set(name, handler); return () => globalThis.handlers.delete(name); }};`
                        : `export default () => null;`,
            }));
        },
    }],
});
const module = { exports: {} };
vm.runInNewContext(result.outputFiles[0].text, {
    module, exports: module.exports, require: createRequire(import.meta.url),
    handlers, cleanups, setTimeout, clearTimeout, console, process,
});
const api = module.exports;
const fire = (name, detail) => handlers.get(name)({ detail });
const visit = (method = 'post', async = false) => ({ visit: { method, async } });
const tick = () => new Promise((resolve) => setTimeout(resolve, 5));
const clear = () => api.getNotifications().forEach(({ id }) => api.dismissNotification(id));

api.mount({});
assert.equal(handlers.size, 6);

// Real bridge sequence: server success event precedes the form's onSuccess callback.
fire('start', visit());
fire('success', { page: { props: { flash: { success: 'Item saved.' } } } });
api.notify({ type: 'success', message: 'Inventory item created successfully.' });
assert.equal(api.getNotifications().length, 1, 'flash and local callback must produce one result');
assert.equal(api.getNotifications()[0].message, 'Item saved.');
fire('finish', visit());
await tick();
clear();

fire('start', visit());
fire('success', { page: { props: { flash: { success: 'Item saved.' } } } });
assert.equal(api.getNotifications().length, 1, 'a separate identical action must notify again');
fire('finish', visit());
await tick();
clear();

// Background GET polling must not consume or reset an in-flight mutation's result.
const baseline = { success: 'Old result' };
fire('start', visit('get', true));
fire('success', { page: { props: { flash: baseline } } });
fire('finish', visit('get', true));
assert.equal(api.getNotifications().length, 0);
fire('start', visit());
fire('start', visit('get', true));
fire('success', { page: { props: { flash: baseline } } });
fire('finish', visit('get', true));
assert.equal(api.getNotifications().length, 0, 'retained flash from poll is not a new action');
fire('success', { page: { props: { flash: { success: 'Scanner updated.' } } } });
assert.equal(api.getNotifications()[0].message, 'Scanner updated.');
fire('finish', visit());
await tick();
clear();

fire('start', visit());
fire('error', { errors: { quantity: 'Insufficient stock.' } });
api.notify({ type: 'error', message: 'Could not save.' });
api.notify({ type: 'success', message: 'Saved.' });
assert.equal(api.getNotifications().length, 1);
assert.equal(api.getNotifications()[0].type, 'error');
fire('finish', visit());
await tick();
clear();

fire('start', visit());
fire('success', { page: { props: { flash: { warning: 'Email could not be sent.', success: 'Staff created.' } } } });
api.notify({ type: 'success', message: 'Staff created.' });
assert.equal(api.getNotifications().length, 1, 'warning must not be replaced by a generic success');
assert.equal(api.getNotifications()[0].type, 'warning');
fire('finish', visit());
await tick();
clear();

api.notify({ type: 'info', message: 'Configuration queued.' });
api.notify({ type: 'error', message: 'PDF generation failed. Try again.' });
assert.equal(api.getNotifications().length, 2, 'independent AJAX outcomes remain available');
api.dismissNotification(api.getNotifications()[0].id);
assert.equal(api.getNotifications().length, 1);
assert.equal(api.notificationError({ response: { data: { errors: { quantity: ['Use a positive quantity.'] } } } }, 'Fallback'), 'Use a positive quantity.');
assert.equal(api.notificationError(new Error('offline'), 'Check your connection.'), 'Check your connection.');
clear();

fire('exception', {});
assert.equal(api.getNotifications()[0].type, 'error');
assert.match(api.getNotifications()[0].message, /verify the record before retrying/);
fire('finish', visit());
await tick();
clear();
assert.equal(fire('invalid', { response: { status: 419 } }), false);
assert.match(api.getNotifications()[0].message, /session has expired/);
fire('finish', visit());
await tick();
clear();
cleanups.forEach((cleanup) => cleanup?.());
assert.equal(handlers.size, 0, 'bridge subscriptions clean up on unmount');
console.log('Notification lifecycle checks passed: flash, repeats, duplicates, polling, errors, warnings, AJAX, dismissal, cleanup.');
