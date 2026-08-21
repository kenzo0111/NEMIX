<?php

namespace App\Http\Controllers\Compliance;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ComplianceAnalyticsController extends Controller
{
    public function index(Request $request): Response
    {
        $items = class_exists(\Modules\Inventory\Models\Item::class)
            ? \Modules\Inventory\Models\Item::query()->latest()->get()->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'sku' => $item->sku ?? 'No SKU',
                    'stock' => (int) $item->stock,
                    'unitCost' => (float) ($item->unit_cost ?? 0),
                    'amount' => (float) ($item->amount ?? 0),
                    'status' => $item->status,
                    'unitOfIssue' => $item->unit_of_issue ?? 'Pcs',
                    'description' => $item->description,
                ];
            })
            : collect();

        $supplierItemValues = [];
        if (class_exists(\Modules\Inventory\Models\Item::class)) {
            \Modules\Inventory\Models\Item::all(['supplier_id', 'stock', 'unit_cost', 'amount'])->each(function ($item) use (&$supplierItemValues) {
                if ($item->supplier_id === null) return;
                $supplierId = (string) $item->supplier_id;
                $itemAmount = $item->amount !== null ? (float) $item->amount : (float) $item->stock * (float) $item->unit_cost;
                $supplierItemValues[$supplierId] = ($supplierItemValues[$supplierId] ?? 0) + $itemAmount;
            });
        }

        $totalSupplierValue = 0;
        if (class_exists(\Modules\Suppliers\Models\Supplier::class)) {
            \Modules\Suppliers\Models\Supplier::all()->each(function ($supplier) use (&$totalSupplierValue, $supplierItemValues) {
                $supplierId = (string) $supplier->id;
                $totalSupplierValue += $supplierItemValues[$supplierId] ?? 0;
            });
        }

        $stats = [
            'totalItems' => $items->count(),
            'totalStock' => (int) $items->sum('stock'),
            'lowStockAlerts' => (int) $items->where('status', 'Low Stock')->count(),
            'outOfStock' => (int) $items->where('status', 'Out of Stock')->count(),
            'totalValue' => '₱' . number_format($totalSupplierValue > 0 ? $totalSupplierValue : (float) $items->sum('amount'), 2),
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

        $lowStockChartItems = $items
            ->where('status', 'Low Stock')
            ->take(6)
            ->values()
            ->map(function ($item) {
                return [
                    'label' => $item['name'],
                    'value' => $item['stock'],
                    'meta' => 'Min threshold 10',
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
