import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = path => readFile(`${root}${path}`, 'utf8');
const tour = await read('resources/js/Pages/Dashboard/Components/CoordinatorWalkthroughGuide.tsx');
const anchoredPages = await Promise.all([
    read('resources/js/Pages/Dashboard/Components/CoordinatorDashboardWorkspace.tsx'),
    read('resources/js/Pages/Inventory/Coordinator/Catalog.tsx'),
    read('resources/js/Pages/Inventory/Requests/components/CoordinatorRequestsWorkspace.tsx'),
    read('resources/js/Pages/Inventory/Coordinator/Index.tsx'),
]);
const pageSource = anchoredPages.join('\n');
const anchors = [...tour.matchAll(/selector: '\[data-tour="([^"]+)"\]'/g)].map(match => match[1]);

assert.equal(anchors.length, 9, 'The coordinator tour should cover nine live workspace areas.');
for (const anchor of anchors) {
    assert.match(pageSource, new RegExp(`data-tour=["']${anchor}["']`), `Missing live tour target: ${anchor}`);
}
assert.match(tour, /sessionStorage\.setItem\(TOUR_STORAGE_KEY/);
assert.match(tour, /router\.visit\(currentStep\.href\)/);
assert.match(tour, /scrollIntoView/);
assert.match(tour, /event\.key === 'Escape'/);
assert.match(tour, /event\.key === 'ArrowRight'/);
assert.match(tour, /This tour never changes records/);

console.log('Coordinator walkthrough: live anchors, cross-page navigation, progress persistence, safety copy, and keyboard controls passed.');
