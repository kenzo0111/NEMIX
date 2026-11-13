import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = path => readFile(`${root}${path}`, 'utf8');
const notice = await read('resources/js/Components/DemoAccountNotice.tsx');
const layout = await read('resources/js/Layouts/DashboardLayout.tsx');
const middleware = await read('app/Http/Middleware/HandleInertiaRequests.php');
const login = await read('app/Http/Controllers/Auth/AuthenticatedSessionController.php');

assert.match(layout, /<DemoAccountNotice \/>/);
assert.match(notice, /You are signed in to a demo account/);
assert.match(notice, /demonstration and system testing only/);
assert.match(notice, /Send your official institutional email address/);
assert.match(notice, /office or department unit/);
assert.match(notice, /Head Office/);
assert.match(notice, /I Understand/);
assert.match(notice, /demoAccountNotice && auth\.user\?\.is_demo_account/);
assert.match(middleware, /'is_demo_account' => \(bool\) \$user->is_demo_account/);
assert.match(login, /show_demo_account_notice/);
assert.match(login, /Supply Coordinator/);
assert.match(login, /Authorized Personnel/);

console.log('Demo account notice: login-only flash, demo-account gating, dedicated-account instructions, and both requester roles passed.');
