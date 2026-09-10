import React, { useMemo } from 'react';
import {
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/Components/ui/chart';

interface InventoryStatusChartProps {
    statusCounts: {
        Available: number;
        'Low Stock': number;
        'Out of Stock': number;
    };
}

const chartConfig = {
    available: {
        label: 'Available',
        color: '#10b981', // Emerald green
    },
    lowStock: {
        label: 'Low Stock',
        color: '#f59e0b', // Amber
    },
    outOfStock: {
        label: 'Out of Stock',
        color: '#ef4444', // Red
    },
} satisfies ChartConfig;

const STATUS_META = [
    { key: 'available', label: 'Available', color: '#10b981', dotClass: 'bg-emerald-500' },
    { key: 'lowStock', label: 'Low Stock', color: '#f59e0b', dotClass: 'bg-amber-500' },
    { key: 'outOfStock', label: 'Out of Stock', color: '#ef4444', dotClass: 'bg-red-500' },
];

export default function InventoryStatusChart({ statusCounts }: InventoryStatusChartProps) {
    const data = useMemo(() => {
        return [
            {
                name: 'available',
                label: 'Available',
                value: Number(statusCounts?.Available || 0),
                color: chartConfig.available.color,
            },
            {
                name: 'lowStock',
                label: 'Low Stock',
                value: Number(statusCounts?.['Low Stock'] || 0),
                color: chartConfig.lowStock.color,
            },
            {
                name: 'outOfStock',
                label: 'Out of Stock',
                value: Number(statusCounts?.['Out of Stock'] || 0),
                color: chartConfig.outOfStock.color,
            },
        ];
    }, [statusCounts]);

    const total = useMemo(() => {
        return data.reduce((sum, item) => sum + item.value, 0);
    }, [data]);

    if (total === 0) {
        return (
            <div className="h-64 flex flex-col items-center justify-center rounded-md border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center">
                <p className="text-xs font-medium text-gray-500">No status records available.</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="relative flex justify-center items-center">
                <ChartContainer
                    config={chartConfig}
                    className="h-52 w-52 aspect-square flex items-center justify-center"
                >
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    hideLabel
                                    formatter={(value, name, item) => {
                                        const count = Number(value);
                                        const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
                                        return (
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="h-2.5 w-2.5 rounded-full"
                                                    style={{ backgroundColor: item.payload?.color }}
                                                />
                                                <span className="font-medium text-gray-900">
                                                    {item.payload?.label}:
                                                </span>
                                                <span className="font-semibold text-gray-900">
                                                    {count.toLocaleString()} ({pct}%)
                                                </span>
                                            </div>
                                        );
                                    }}
                                />
                            }
                        />
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="label"
                            innerRadius={54}
                            outerRadius={78}
                            paddingAngle={3}
                            stroke="#ffffff"
                            strokeWidth={2}
                        >
                            {data.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ChartContainer>

                {/* Central total display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-gray-900 font-sans tracking-tight">
                        {total.toLocaleString()}
                    </span>
                    <span className="text-[11px] font-medium text-gray-500">
                        Total Items
                    </span>
                </div>
            </div>

            {/* Compact, clean status breakdown */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
                {data.map((item) => {
                    const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0';
                    const meta = STATUS_META.find((m) => m.label === item.label);
                    return (
                        <div
                            key={item.label}
                            className="flex items-center justify-between text-xs py-1 px-1.5 rounded hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${meta?.dotClass || 'bg-gray-400'}`} />
                                <span className="font-medium text-gray-700">{item.label}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-semibold text-gray-900 font-mono">
                                    {item.value.toLocaleString()}
                                </span>
                                <span className="text-[11px] text-gray-500 font-mono w-10 text-right">
                                    {pct}%
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
