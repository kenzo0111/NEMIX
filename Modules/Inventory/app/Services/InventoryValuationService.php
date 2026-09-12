<?php

namespace Modules\Inventory\Services;

use Illuminate\Support\Facades\DB;
use Modules\Inventory\Models\InventoryBatch;
use Modules\Inventory\Models\Item;
use Modules\Suppliers\Models\Supplier;

class InventoryValuationService
{
    /**
     * Authoritatively calculates the total on-hand inventory valuation across all active batches.
     * Uses quantity_remaining * unit_cost.
     */
    public function getCurrentInventoryValue(): float
    {
        if (class_exists(InventoryBatch::class) && InventoryBatch::whereNull('deleted_at')->exists()) {
            return round((float) InventoryBatch::whereNull('deleted_at')
                ->where('quantity_remaining', '>', 0)
                ->sum(DB::raw('quantity_remaining * COALESCE(unit_cost, 0)')), 2);
        }

        if (class_exists(Item::class)) {
            return round((float) Item::query()->sum(DB::raw('stock * COALESCE(unit_cost, 0)')), 2);
        }

        return 0.00;
    }

    /**
     * Retrieves aggregated metrics for an array of supplier IDs.
     * Guaranteed to return normalized entries for every requested supplier ID.
     *
     * @param array<int|string> $supplierIds
     * @return array<int|string, array{
     *     total_received_value: float,
     *     current_inventory_value: float,
     *     total_received_quantity: int,
     *     current_quantity: int,
     *     batch_count: int
     * }>
     */
    public function getSupplierMetricsMap(array $supplierIds): array
    {
        $cleanIds = array_values(array_filter(array_unique($supplierIds)));
        $result = [];

        // Initialize default zero records
        foreach ($cleanIds as $id) {
            $result[(string) $id] = [
                'total_received_value' => 0.00,
                'current_inventory_value' => 0.00,
                'total_received_quantity' => 0,
                'current_quantity' => 0,
                'batch_count' => 0,
            ];
        }

        if (empty($cleanIds) || !class_exists(InventoryBatch::class)) {
            return $result;
        }

        $aggregates = InventoryBatch::whereIn('supplier_id', $cleanIds)
            ->whereNull('deleted_at')
            ->groupBy('supplier_id')
            ->select(
                'supplier_id',
                DB::raw('SUM(quantity_received * COALESCE(unit_cost, 0)) as total_received_val'),
                DB::raw('SUM(CASE WHEN quantity_remaining > 0 THEN quantity_remaining * COALESCE(unit_cost, 0) ELSE 0 END) as current_inv_val'),
                DB::raw('SUM(quantity_received) as total_rec_qty'),
                DB::raw('SUM(CASE WHEN quantity_remaining > 0 THEN quantity_remaining ELSE 0 END) as cur_qty'),
                DB::raw('COUNT(id) as total_batches')
            )
            ->get();

        foreach ($aggregates as $row) {
            $key = (string) $row->supplier_id;
            $result[$key] = [
                'total_received_value' => round((float) $row->total_received_val, 2),
                'current_inventory_value' => round((float) $row->current_inv_val, 2),
                'total_received_quantity' => (int) $row->total_rec_qty,
                'current_quantity' => (int) $row->cur_qty,
                'batch_count' => (int) $row->total_batches,
            ];
        }

        return $result;
    }

    /**
     * Retrieves aggregated metrics for a single supplier.
     */
    public function getSupplierMetrics(int $supplierId): array
    {
        $map = $this->getSupplierMetricsMap([$supplierId]);
        return $map[(string) $supplierId] ?? [
            'total_received_value' => 0.00,
            'current_inventory_value' => 0.00,
            'total_received_quantity' => 0,
            'current_quantity' => 0,
            'batch_count' => 0,
        ];
    }

    /**
     * Returns the current on-hand inventory valuation for a specific supplier.
     */
    public function getSupplierCurrentInventoryValue(int $supplierId): float
    {
        return $this->getSupplierMetrics($supplierId)['current_inventory_value'];
    }

    /**
     * Returns the lifetime total received valuation for a specific supplier.
     */
    public function getSupplierTotalReceivedValue(int $supplierId): float
    {
        return $this->getSupplierMetrics($supplierId)['total_received_value'];
    }

    /**
     * Returns the current valuation of an item across all its active batches.
     */
    public function getItemCurrentInventoryValue(int $itemId): float
    {
        if (!class_exists(InventoryBatch::class)) {
            $item = Item::find($itemId);
            return $item ? round((float) $item->stock * (float) ($item->unit_cost ?? 0), 2) : 0.00;
        }

        return round((float) InventoryBatch::where('item_id', $itemId)
            ->whereNull('deleted_at')
            ->where('quantity_remaining', '>', 0)
            ->sum(DB::raw('quantity_remaining * COALESCE(unit_cost, 0)')), 2);
    }

    /**
     * Reconciles all supplier valuations with total dashboard inventory valuation.
     */
    public function reconcileSupplierValuationWithDashboard(): array
    {
        $dashboardValue = $this->getCurrentInventoryValue();

        $supplierIds = Supplier::pluck('id')->all();
        $metricsMap = $this->getSupplierMetricsMap($supplierIds);

        $sumSuppliersCurrent = round(array_sum(array_column($metricsMap, 'current_inventory_value')), 2);
        $sumSuppliersReceived = round(array_sum(array_column($metricsMap, 'total_received_value')), 2);

        // Check for any batches without assigned supplier
        $unassignedCurrent = 0.00;
        $unassignedReceived = 0.00;
        if (class_exists(InventoryBatch::class)) {
            $unassignedCurrent = round((float) InventoryBatch::whereNull('supplier_id')
                ->whereNull('deleted_at')
                ->where('quantity_remaining', '>', 0)
                ->sum(DB::raw('quantity_remaining * COALESCE(unit_cost, 0)')), 2);

            $unassignedReceived = round((float) InventoryBatch::whereNull('supplier_id')
                ->whereNull('deleted_at')
                ->sum(DB::raw('quantity_received * COALESCE(unit_cost, 0)')), 2);
        }

        $accountedTotal = round($sumSuppliersCurrent + $unassignedCurrent, 2);
        $diff = round($dashboardValue - $accountedTotal, 2);

        return [
            'dashboard_inventory_value' => $dashboardValue,
            'sum_suppliers_current_value' => $sumSuppliersCurrent,
            'unassigned_current_value' => $unassignedCurrent,
            'accounted_total_value' => $accountedTotal,
            'difference' => $diff,
            'is_reconciled' => abs($diff) < 0.01,
            'sum_suppliers_received_value' => $sumSuppliersReceived,
            'unassigned_received_value' => $unassignedReceived,
        ];
    }
}
