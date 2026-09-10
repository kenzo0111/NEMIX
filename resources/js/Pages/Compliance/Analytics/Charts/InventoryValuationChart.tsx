import React, { useMemo } from 'react';
import {
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
} from 'recharts';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/Components/ui/chart';
import { ChartRankingItem } from '../types';

interface InventoryValuationChartProps {
    items: ChartRankingItem[];
}

const chartConfig = {
    amount: {
        label: 'Inventory Value',
        color: '#0f766e', // Institutional Deep Teal
    },
} satisfies ChartConfig;

function formatCurrency(val: number): string {
    return `₱${val.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatCompactCurrency(val: number): string {
    if (val >= 1_000_000) {
        return `₱${(val / 1_000_000).toFixed(1)}M`;
    }
    if (val >= 1_000) {
        return `₱${(val / 1_000).toFixed(0)}K`;
    }
    return `₱${val}`;
}

export default function InventoryValuationChart({ items }: InventoryValuationChartProps) {
    const data = useMemo(() => {
        return items.map((item) => ({
            item: item.label,
            amount: Number(item.value || 0),
            sku: item.meta || '',
        }));
    }, [items]);

    if (!items || items.length === 0) {
        return (
            <div className="h-72 flex flex-col items-center justify-center rounded-md border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center">
                <p className="text-xs font-medium text-gray-500">No valuation records available.</p>
            </div>
        );
    }

    const chartHeight = Math.max(260, data.length * 36);

    return (
        <ChartContainer config={chartConfig} className="w-full aspect-auto" style={{ height: chartHeight }}>
            <BarChart
                accessibilityLayer
                data={data}
                layout="vertical"
                margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
            >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                <YAxis
                    dataKey="item"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={150}
                    tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
                    tickFormatter={(val) => {
                        const str = String(val);
                        return str.length > 20 ? `${str.slice(0, 19)}…` : str;
                    }}
                />
                <XAxis
                    dataKey="amount"
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickFormatter={(val) => formatCompactCurrency(Number(val))}
                />
                <ChartTooltip
                    cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                    content={
                        <ChartTooltipContent
                            formatter={(value, name, item) => (
                                <div className="space-y-0.5">
                                    <span className="font-semibold text-gray-900 font-mono">
                                        {formatCurrency(Number(value))}
                                    </span>
                                    {item.payload?.sku && (
                                        <p className="text-[10px] text-gray-500">SKU: {item.payload.sku}</p>
                                    )}
                                </div>
                            )}
                        />
                    }
                />
                <Bar
                    dataKey="amount"
                    fill="var(--color-amount)"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={22}
                />
            </BarChart>
        </ChartContainer>
    );
}
