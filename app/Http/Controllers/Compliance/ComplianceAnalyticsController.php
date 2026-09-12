<?php

namespace App\Http\Controllers\Compliance;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Inventory\Models\InventoryBatch;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Services\InventoryValuationService;

class ComplianceAnalyticsController extends Controller
{
    public function index(Request $request): Response
    {
        // Batch-level remaining valuations per item (if batches exist)
        $batchItemValuations = [];
        if (class_exists(InventoryBatch::class) && InventoryBatch::whereNull('deleted_at')->exists()) {
            $batchItemValuations = InventoryBatch::whereNull('deleted_at')
                ->where('quantity_remaining', '>', 0)
                ->groupBy('item_id')
                ->select('item_id', DB::raw('SUM(quantity_remaining * COALESCE(unit_cost, 0)) as total_val'))
                ->pluck('total_val', 'item_id')
                ->all();
        }

        $items = class_exists(Item::class)
            ? Item::query()->latest()->get()->map(function ($item) use ($batchItemValuations) {
                $itemAmount = isset($batchItemValuations[$item->id])
                    ? (float) $batchItemValuations[$item->id]
                    : ($item->amount !== null && (float) $item->amount > 0 ? (float) $item->amount : (float) $item->stock * (float) ($item->unit_cost ?? 0));

                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'sku' => $item->sku ?? 'No SKU',
                    'stock' => (int) $item->stock,
                    'unitCost' => (float) ($item->unit_cost ?? 0),
                    'amount' => round($itemAmount, 2),
                    'status' => $item->status,
                    'unitOfIssue' => $item->unit_of_issue ?? 'Pcs',
                    'description' => $item->description,
                ];
            })
            : collect();

        // Authoritative inventory valuation synchronized with Dashboard & InventoryValuationService
        $totalInventoryValuation = class_exists(InventoryValuationService::class)
            ? app(InventoryValuationService::class)->getCurrentInventoryValue()
            : (float) $items->sum('amount');

        $stats = [
            'totalItems' => $items->count(),
            'totalStock' => (int) $items->sum('stock'),
            'lowStockAlerts' => (int) $items->where('status', 'Low Stock')->count(),
            'outOfStock' => (int) $items->where('status', 'Out of Stock')->count(),
            'totalValue' => '₱' . number_format($totalInventoryValuation, 2),
            'highestConsumable' => data_get($items->sortByDesc('stock')->first(), 'name', 'N/A'),
            'lowestConsumable' => data_get($items->sortBy('stock')->first(), 'name', 'N/A'),
        ];

        $lowStockItems = $items
            ->where('status', 'Low Stock')
            ->take(6)
            ->values()
            ->map(function ($item) {
                return [
                    'id' => $item['id'],
                    'name' => $item['name'],
                    'sku' => $item['sku'],
                    'stock' => $item['stock'],
                    'unitOfIssue' => $item['unitOfIssue'],
                    'amount' => $item['amount'],
                ];
            });

        $statusCounts = [
            'Available' => (int) $items->where('status', 'Available')->count(),
            'Low Stock' => (int) $items->where('status', 'Low Stock')->count(),
            'Out of Stock' => (int) $items->where('status', 'Out of Stock')->count(),
        ];

        $highestConsumables = $items
            ->sortByDesc('stock')
            ->take(5)
            ->values()
            ->map(function ($item) {
                return [
                    'id' => $item['id'],
                    'name' => $item['name'],
                    'sku' => $item['sku'],
                    'stock' => $item['stock'],
                    'unitOfIssue' => $item['unitOfIssue'],
                    'status' => $item['status'],
                ];
            });

        $lowestConsumables = $items
            ->sortBy('stock')
            ->take(5)
            ->values()
            ->map(function ($item) {
                return [
                    'id' => $item['id'],
                    'name' => $item['name'],
                    'sku' => $item['sku'],
                    'stock' => $item['stock'],
                    'unitOfIssue' => $item['unitOfIssue'],
                    'status' => $item['status'],
                ];
            });

        $stockChartItems = $items
            ->sortByDesc('stock')
            ->take(8)
            ->values()
            ->map(function ($item) {
                return [
                    'label' => $item['name'],
                    'value' => $item['stock'],
                    'meta' => $item['unitOfIssue'] . ' • ' . $item['sku'],
                    'color' => $item['status'] === 'Out of Stock' ? '#dc2626' : ($item['status'] === 'Low Stock' ? '#f59e0b' : '#b91c1c'),
                ];
            });

        $valueChartItems = $items
            ->sortByDesc('amount')
            ->take(8)
            ->values()
            ->map(function ($item) {
                return [
                    'label' => $item['name'],
                    'value' => (float) $item['amount'],
                    'meta' => $item['sku'],
                    'color' => '#0f766e',
                ];
            });

        $lowStockThreshold = class_exists(\App\Models\SystemSetting::class)
            ? (int) \App\Models\SystemSetting::get('inventory.low_stock_threshold', 10)
            : 10;

        $lowStockChartItems = $items
            ->where('status', 'Low Stock')
            ->take(6)
            ->values()
            ->map(function ($item) use ($lowStockThreshold) {
                return [
                    'label' => $item['name'],
                    'value' => $item['stock'],
                    'meta' => 'Min threshold ' . $lowStockThreshold,
                    'color' => '#f59e0b',
                ];
            });

        return Inertia::render('Compliance/ManageAnalytics', [
            'analytics' => [
                'stats' => $stats,
                'items' => $items->values(),
                'lowStockItems' => $lowStockItems,
                'consumables' => [
                    'highest' => $highestConsumables,
                    'lowest' => $lowestConsumables,
                ],
                'statusCounts' => $statusCounts,
                'chartData' => [
                    'stockItems' => $stockChartItems,
                    'valueItems' => $valueChartItems,
                    'lowStockItems' => $lowStockChartItems,
                    'statusSeries' => [
                        ['label' => 'Available', 'value' => $statusCounts['Available'], 'color' => '#059669'],
                        ['label' => 'Low Stock', 'value' => $statusCounts['Low Stock'], 'color' => '#f59e0b'],
                        ['label' => 'Out of Stock', 'value' => $statusCounts['Out of Stock'], 'color' => '#dc2626'],
                    ],
                ],
            ],
        ]);
    }
}
