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
        color: '#7f1d1d', // University Maroon
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
            <div className="h-72 flex flex-col items-center justify-center rounded-md border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center">
                <p className="text-xs font-medium text-gray-500">No stock quantity records available.</p>
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
                    dataKey="stock"
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickFormatter={(val) => Number(val).toLocaleString()}
                />
                <ChartTooltip
                    cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                    content={
                        <ChartTooltipContent
                            formatter={(value, name, item) => (
                                <span className="font-semibold text-gray-900">
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
