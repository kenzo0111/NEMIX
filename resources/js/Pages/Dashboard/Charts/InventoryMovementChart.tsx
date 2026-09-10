import React, { useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    type ChartData,
    type ChartOptions,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { MovementPoint } from '../types';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Tooltip,
    Legend
);

interface InventoryMovementChartProps {
    data: MovementPoint[];
}

export default function InventoryMovementChart({ data }: InventoryMovementChartProps) {
    const chartData = useMemo<ChartData<'bar' | 'line'>>(() => {
        const labels = data.map((d) => d.label);
        const receivedData = data.map((d) => d.stockIn);
        const issuedData = data.map((d) => d.risIssued);
        
        // Calculate dynamic balance trend line
        const balanceData = data.map((d) => {
            return Math.max(0, d.starting + d.stockIn - d.risIssued);
        });

        return {
            labels,
            datasets: [
                {
                    type: 'line' as const,
                    label: 'Stock Balance',
                    data: balanceData,
                    borderColor: '#7f1d1d', // University Maroon
                    backgroundColor: 'rgba(127, 29, 29, 0.08)',
                    borderWidth: 2.2,
                    pointBackgroundColor: '#7f1d1d',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 1.5,
                    pointRadius: 3.5,
                    pointHoverRadius: 5,
                    tension: 0.25,
                    order: 1,
                },
                {
                    type: 'bar' as const,
                    label: 'Stock Received',
                    data: receivedData,
                    backgroundColor: '#10b981', // Clean Emerald Green
                    borderRadius: 4,
                    maxBarThickness: 28,
                    order: 2,
                },
                {
                    type: 'bar' as const,
                    label: 'Items Issued (RIS)',
                    data: issuedData,
                    backgroundColor: '#f59e0b', // Clean Amber
                    borderRadius: 4,
                    maxBarThickness: 28,
                    order: 3,
                },
            ],
        };
    }, [data]);

    const options = useMemo<ChartOptions<'bar' | 'line'>>(() => ({
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                display: false, // Clean custom header legend instead
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#f8fafc',
                bodyColor: '#f1f5f9',
                padding: 10,
                cornerRadius: 6,
                boxPadding: 4,
                titleFont: { size: 12, weight: 700, family: 'Inter, system-ui, sans-serif' },
                bodyFont: { size: 11, weight: 500, family: 'Inter, system-ui, sans-serif' },
                callbacks: {
                    label: (context) => {
                        const label = context.dataset.label || '';
                        const val = Number(context.raw) || 0;
                        return ` ${label}: ${val.toLocaleString()} units`;
                    },
                },
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: {
                    color: '#64748b',
                    font: { size: 11, weight: 600, family: 'Inter, system-ui, sans-serif' },
                },
                border: { display: false },
            },
            y: {
                beginAtZero: true,
                suggestedMax: 20,
                grid: {
                    color: 'rgba(226, 232, 240, 0.7)',
                    borderDash: [3, 3],
                    drawBorder: false,
                },
                ticks: {
                    color: '#94a3b8',
                    font: { size: 11, weight: 500, family: 'Inter, system-ui, sans-serif' },
                    callback: (value) => Number(value).toLocaleString(),
                },
                border: { display: false },
            },
        },
    }), []);

    if (data.length === 0) {
        return (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-200 rounded-lg">
                <p className="text-xs font-medium">No inventory movement recorded for this period.</p>
            </div>
        );
    }

    return (
        <div className="h-64 w-full">
            <Chart type="bar" data={chartData} options={options} />
        </div>
    );
}
