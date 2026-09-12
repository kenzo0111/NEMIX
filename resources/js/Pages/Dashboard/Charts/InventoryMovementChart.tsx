import React, { useMemo } from 'react';
import {
    Bar,
    Line,
    ComposedChart,
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
import { MovementPoint } from '../types';

interface InventoryMovementChartProps {
    data: MovementPoint[];
}

const chartConfig: ChartConfig = {
    stockIn: {
        label: 'Stock Received',
        color: '#10b981', // Emerald Green
    },
    risIssued: {
        label: 'Items Issued (RIS)',
        color: '#f59e0b', // Amber
    },
    balance: {
        label: 'Stock Balance',
        color: '#7f1d1d', // University Maroon
    },
};

export default function InventoryMovementChart({ data }: InventoryMovementChartProps) {
    const chartData = useMemo(() => {
        return data.map((d) => ({
            label: d.label,
            stockIn: d.stockIn,
            risIssued: d.risIssued,
            balance: Math.max(0, d.starting + d.stockIn - d.risIssued),
        }));
    }, [data]);

    if (data.length === 0) {
        return (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-200 rounded-lg">
                <p className="text-xs font-medium">No inventory movement recorded for this period.</p>
            </div>
        );
    }

    return (
        <ChartContainer config={chartConfig} className="h-64 sm:h-72 lg:h-80 w-full aspect-auto">
            <ComposedChart data={chartData} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                />
                <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                    tickFormatter={(val) => Number(val).toLocaleString()}
                />
                <ChartTooltip
                    content={
                        <ChartTooltipContent
                            indicator="dot"
                            labelFormatter={(label) => `Period: ${label}`}
                        />
                    }
                />
                <Bar
                    dataKey="stockIn"
                    fill="var(--color-stockIn)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                />
                <Bar
                    dataKey="risIssued"
                    fill="var(--color-risIssued)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                />
                <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="var(--color-balance)"
                    strokeWidth={2.2}
                    dot={{ fill: 'var(--color-balance)', r: 3.5, strokeWidth: 1.5, stroke: '#ffffff' }}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: '#ffffff' }}
                />
            </ComposedChart>
        </ChartContainer>
    );
}
