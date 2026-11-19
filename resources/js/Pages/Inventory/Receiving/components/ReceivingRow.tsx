import { rowSelectionProps } from '@/Hooks/useTableSelection';
import React from 'react';
import { ReceivingRecord } from '../types';
import { formatDisplayDate } from '@/utils/dateUtils';

interface ReceivingRowProps {
    receiving: ReceivingRecord;
    selected: boolean;
    onSelect: (receiving: ReceivingRecord) => void;
}

export const ReceivingRow: React.FC<ReceivingRowProps> = ({
    receiving,
    selected,
    onSelect,
}) => {
    return (
        <tr   {...rowSelectionProps(selected, () => onSelect(receiving))}  className={`cursor-pointer transition-colors border-b border-gray-100 dark:border-slate-800/80 last:border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-800 ${selected ? 'bg-red-50 shadow-[inset_3px_0_0_#7f1d1d] dark:bg-red-950/30' : 'hover:bg-red-50/30 dark:hover:bg-red-950/20'}`}>
            {/* Item Received & SKU */}
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">{receiving.item}</div>
                    {receiving.scanned_rfid_tag && (
                        <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-sm font-semibold bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-400 border border-red-200 dark:border-red-900/50 shrink-0"
                            title={`Scanned RFID Tag: ${receiving.scanned_rfid_tag}`}
                        >
                            RFID
                        </span>
                    )}
                </div>
                <div className="text-sm text-gray-500 dark:text-slate-400 tabular-nums mt-0.5">
                    SKU: {receiving.sku || 'N/A'}
                </div>
            </td>

            {/* Supplier & Supplier Stock No */}
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-800 dark:text-slate-200 font-medium">{receiving.supplier || 'N/A'}</div>
                {receiving.supplier_stock_no ? (
                    <div className="text-sm tabular-nums text-gray-600 dark:text-slate-400 mt-0.5">
                        <span className="bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700">
                            {receiving.supplier_stock_no}
                        </span>
                    </div>
                ) : null}
            </td>

            {/* Quantity Received */}
            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-slate-200 tabular-nums text-right">
                <span className="text-emerald-700 dark:text-emerald-400 font-bold mr-0.5">+</span>
                {receiving.quantity} <span className="text-gray-500 dark:text-slate-400 text-sm font-normal font-sans">{receiving.unit || 'pcs'}</span>
            </td>

            {/* Quantity Remaining */}
            <td className="px-6 py-4 whitespace-nowrap text-sm tabular-nums text-right">
                {receiving.quantity_remaining !== null && receiving.quantity_remaining !== undefined ? (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-semibold ${
                        receiving.quantity_remaining > 0
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700'
                    }`}>
                        {receiving.quantity_remaining} {receiving.unit || 'pcs'}
                    </span>
                ) : (
                    <span className="text-gray-400 dark:text-slate-500 text-sm">—</span>
                )}
            </td>

            {/* Unit Cost */}
            <td className="px-6 py-4 whitespace-nowrap text-sm tabular-nums text-right text-gray-900 dark:text-slate-100">
                {receiving.unit_cost !== null && receiving.unit_cost !== undefined ? (
                    `₱${Number(receiving.unit_cost).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                ) : (
                    <span className="text-gray-400 dark:text-slate-500 text-sm">—</span>
                )}
            </td>

            {/* Batch Amount / Value */}
            <td className="px-6 py-4 whitespace-nowrap text-sm tabular-nums font-semibold text-right text-gray-900 dark:text-slate-100">
                {receiving.amount !== null && receiving.amount !== undefined ? (
                    `₱${Number(receiving.amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                ) : receiving.unit_cost ? (
                    `₱${(Number(receiving.unit_cost) * receiving.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                ) : (
                    <span className="text-gray-400 dark:text-slate-500 text-sm">—</span>
                )}
            </td>

            {/* Date Received */}
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-400 tabular-nums">
                {formatDisplayDate(receiving.date || receiving.date_received, 'MM/DD/YYYY') || receiving.date}
            </td>

        </tr>
    );
};
