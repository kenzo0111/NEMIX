<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Modules\Inventory\Models\InventoryBatch;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\Receiving;
use Modules\Inventory\Services\InventoryValuationService;
use Modules\Suppliers\Models\Supplier;

class AuditSupplierValuationCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'inventory:audit-supplier-valuation';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Audit inventory batches, supplier valuation metrics, and dashboard reconciliation';

    /**
     * Execute the console command.
     */
    public function handle(InventoryValuationService $valuationService): int
    {
        $this->info('=====================================================');
        $this->info('  NEMIX SUPPLIER VALUATION & INVENTORY AUDIT REPORT  ');
        $this->info('=====================================================');
        $this->newLine();

        // 1. Database Anomaly Checks
        $itemsWithSupplierId = class_exists(Item::class)
            ? Item::whereNotNull('supplier_id')->count()
            : 0;

        $batchesWithNullSupplier = class_exists(InventoryBatch::class)
            ? InventoryBatch::whereNull('supplier_id')->whereNull('deleted_at')->count()
            : 0;

        $batchesWithNullCost = class_exists(InventoryBatch::class)
            ? InventoryBatch::whereNull('unit_cost')->whereNull('deleted_at')->count()
            : 0;

        $batchesWithNegativeRemaining = class_exists(InventoryBatch::class)
            ? InventoryBatch::where('quantity_remaining', '<', 0)->whereNull('deleted_at')->count()
            : 0;

        $batchesRemainingExceedsReceived = class_exists(InventoryBatch::class)
            ? InventoryBatch::whereRaw('quantity_remaining > quantity_received')->whereNull('deleted_at')->count()
            : 0;

        $this->table(
            ['Integrity Metric', 'Count / Status'],
            [
                ['Item Masters still carrying legacy supplier_id', $itemsWithSupplierId],
                ['Inventory Batches with NULL supplier_id (unassigned)', $batchesWithNullSupplier],
                ['Inventory Batches with NULL unit_cost', $batchesWithNullCost],
                ['Inventory Batches with negative remaining quantity', $batchesWithNegativeRemaining],
                ['Inventory Batches with remaining > received', $batchesRemainingExceedsReceived],
            ]
        );

        $this->newLine();

        // 2. Per-Supplier Valuation Table
        $suppliers = Supplier::orderBy('id')->get();
        $supplierIds = $suppliers->pluck('id')->all();
        $metricsMap = $valuationService->getSupplierMetricsMap($supplierIds);

        $tableData = [];
        foreach ($suppliers as $s) {
            $m = $metricsMap[(string) $s->id] ?? [
                'batch_count' => 0,
                'total_received_quantity' => 0,
                'current_quantity' => 0,
                'total_received_value' => 0.00,
                'current_inventory_value' => 0.00,
            ];

            $receivingsCount = class_exists(Receiving::class)
                ? Receiving::where('supplier_id', $s->id)->whereNull('deleted_at')->count()
                : 0;

            $tableData[] = [
                $s->id,
                $s->name,
                $m['batch_count'],
                $receivingsCount,
                number_format($m['total_received_quantity']),
                number_format($m['current_quantity']),
                '₱' . number_format($m['total_received_value'], 2),
                '₱' . number_format($m['current_inventory_value'], 2),
            ];
        }

        $this->info('Supplier Breakdown:');
        $this->table(
            ['ID', 'Supplier Name', 'Batches', 'Receivings', 'Rec Qty', 'Rem Qty', 'Total Received Value', 'Current Inventory Value'],
            $tableData
        );

        $this->newLine();

        // 3. Global Reconciliation Summary
        $reconciliation = $valuationService->reconcileSupplierValuationWithDashboard();

        $this->info('Valuation Reconciliation:');
        $this->table(
            ['Component', 'Amount'],
            [
                ['Dashboard Inventory Value', '₱' . number_format($reconciliation['dashboard_inventory_value'], 2)],
                ['Sum of All Supplier Current Stock Values', '₱' . number_format($reconciliation['sum_suppliers_current_value'], 2)],
                ['Unassigned Stock Value (Null Supplier)', '₱' . number_format($reconciliation['unassigned_current_value'], 2)],
                ['Total Accounted Value', '₱' . number_format($reconciliation['accounted_total_value'], 2)],
                ['Difference', '₱' . number_format($reconciliation['difference'], 2)],
                ['Status', $reconciliation['is_reconciled'] ? '<fg=green>RECONCILED</>' : '<fg=red>MISMATCH</>'],
            ]
        );

        return $reconciliation['is_reconciled'] ? self::SUCCESS : self::FAILURE;
    }
}
