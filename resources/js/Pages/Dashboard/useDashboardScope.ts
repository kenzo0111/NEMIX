import { usePage } from '@inertiajs/react';

export function useDashboardScope() {
    const isCoordinator = usePage().props.inventoryScope === 'coordinator';
    return {
        isCoordinator,
        inventoryHref: route(isCoordinator ? 'coordinator.inventory.index' : 'inventory.index'),
        receivingHref: route(isCoordinator ? 'coordinator.inventory.index' : 'inventory.receiving'),
        issuanceHref: route(isCoordinator ? 'coordinator.inventory.index' : 'inventory.issuance'),
        analyticsHref: route(isCoordinator ? 'coordinator.inventory.index' : 'compliance.analytics'),
    };
}
