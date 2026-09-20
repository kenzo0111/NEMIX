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

interface StockQuantityChartProps {
    items: ChartRankingItem[];
}

const chartConfig = {
    stock: {
        label: 'Available Stock',
        theme: {
            light: '#7f1d1d',
            dark: '#f87171',
        },
    },
} satisfies ChartConfig;

export default function StockQuantityChart({ items }: StockQuantityChartProps) {
    const data = useMemo(() => {
        return items.map((item) => ({
            item: item.label,
            stock: item.value,
            meta: item.meta || 'Units',
        }));
    }, [items]);

    if (!items || items.length === 0) {
        return (
            <div className="h-72 flex flex-col items-center justify-center rounded-md border border-dashed border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 p-6 text-center">
                <p className="text-xs font-medium text-gray-500 dark:text-slate-400">No stock quantity records available.</p>
            </div>
        );
    }

    // Dynamic height based on number of items to prevent bar cramping
    const chartHeight = Math.max(260, data.length * 36);

    return (
        <ChartContainer config={chartConfig} className="w-full aspect-auto" style={{ height: chartHeight }}>
            <BarChart
                accessibilityLayer
                data={data}
                layout="vertical"
                margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
            >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <YAxis
                    dataKey="item"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={150}
                    tick={{ fill: 'var(--chart-tick)', fontSize: 11, fontWeight: 500 }}
                    tickFormatter={(val) => {
                        const str = String(val);
                        return str.length > 20 ? `${str.slice(0, 19)}…` : str;
                    }}
                />
                <XAxis
                    dataKey="stock"
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'var(--chart-tick-muted)', fontSize: 11 }}
                    tickFormatter={(val) => Number(val).toLocaleString()}
                />
                <ChartTooltip
                    cursor={{ fill: 'var(--chart-cursor)' }}
                    content={
                        <ChartTooltipContent
                            formatter={(value, name, item) => (
                                <span className="font-semibold text-gray-900 dark:text-slate-100">
                                    {Number(value).toLocaleString()} {item.payload?.meta ? `(${item.payload.meta})` : 'units'}
                                </span>
                            )}
                        />
                    }
                />
                <Bar
                    dataKey="stock"
                    fill="var(--color-stock)"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={22}
                />
            </BarChart>
        </ChartContainer>
    );
}
