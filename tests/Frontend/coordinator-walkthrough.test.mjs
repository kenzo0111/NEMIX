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
    read('resources/js/Pages/Inventory/Requests/components/RequestFormModal.tsx'),
    read('resources/js/Pages/Inventory/Coordinator/Index.tsx'),
]);
const pageSource = anchoredPages.join('\n');
const anchors = [...tour.matchAll(/selector: '\[data-tour="([^"]+)"\]'/g)].map(match => match[1]);

assert.equal(anchors.length, 10, 'The role-aware requester tour should define nine shared areas and one Authorized Personnel document area.');
for (const anchor of anchors) {
    assert.match(pageSource, new RegExp(`data-tour=["']${anchor}["']`), `Missing live tour target: ${anchor}`);
}
assert.match(tour, /nemix:coordinator-tour-step/);
assert.match(tour, /nemix:authorized-personnel-tour-step/);
assert.match(tour, /sessionStorage\.setItem\(tourStorageKey/);
assert.match(tour, /router\.visit\(currentStep\.href\)/);
assert.match(tour, /currentStep\.exactUrl/);
assert.match(tour, /scrollIntoView/);
assert.match(tour, /event\.key === 'Escape'/);
assert.match(tour, /event\.key === 'ArrowRight'/);
assert.match(tour, /This tour never changes records/);
assert.match(tour, /Walkthrough complete/);
assert.match(tour, /You can always return to this walkthrough/);
assert.match(tour, /You can now use this system for your day-to-day supply operations with the Supply and Property Management Office/);
assert.match(tour, /This is your Authorized Personnel workspace/);
assert.match(tour, /Attach an approved supporting document/);
assert.match(tour, /Pending Verification is awaiting document review/);
assert.match(tour, /day-to-day supply requests, document submissions, and unit inventory work/);
assert.match(tour, /stepIndex === steps\.length - 1 \? complete\(\)/);

console.log('Requester walkthroughs: Supply Coordinator and Authorized Personnel anchors, navigation, role-specific progress, completion guidance, safety copy, and keyboard controls passed.');
