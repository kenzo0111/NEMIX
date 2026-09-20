import React from 'react';
import { ReceivingRecord } from '../types';
import { formatDisplayDate } from '@/utils/dateUtils';

interface ReceivingRowProps {
    receiving: ReceivingRecord;
    onView: (receiving: ReceivingRecord) => void;
    onUpdate: (receiving: ReceivingRecord) => void;
}

export const ReceivingRow: React.FC<ReceivingRowProps> = ({
    receiving,
    onView,
    onUpdate,
}) => {
    return (
        <tr className="hover:bg-red-50/20 dark:hover:bg-slate-800/50 transition-colors border-b border-gray-100 dark:border-slate-800/80 last:border-0">
            {/* Item Received & SKU */}
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">{receiving.item}</div>
                    {receiving.scanned_rfid_tag && (
                        <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-400 border border-red-200 dark:border-red-900/50 shrink-0"
                            title={`Scanned RFID Tag: ${receiving.scanned_rfid_tag}`}
                        >
                            RFID
                        </span>
                    )}
                </div>
                <div className="text-xs text-gray-500 dark:text-slate-400 font-mono mt-0.5">
                    SKU: {receiving.sku || 'N/A'}
                </div>
            </td>

            {/* Supplier & Supplier Stock No */}
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-800 dark:text-slate-200 font-medium">{receiving.supplier || 'N/A'}</div>
                {receiving.supplier_stock_no ? (
                    <div className="text-[11px] font-mono text-gray-600 dark:text-slate-400 mt-0.5">
                        <span className="bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700">
                            {receiving.supplier_stock_no}
                        </span>
                    </div>
                ) : null}
            </td>

            {/* Quantity Received */}
            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-slate-200 font-mono text-right">
                <span className="text-emerald-700 dark:text-emerald-400 font-bold mr-0.5">+</span>
                {receiving.quantity} <span className="text-gray-500 dark:text-slate-400 text-xs font-normal font-sans">{receiving.unit || 'pcs'}</span>
            </td>

            {/* Quantity Remaining */}
            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-right">
                {receiving.quantity_remaining !== null && receiving.quantity_remaining !== undefined ? (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        receiving.quantity_remaining > 0
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700'
                    }`}>
                        {receiving.quantity_remaining} {receiving.unit || 'pcs'}
                    </span>
                ) : (
                    <span className="text-gray-400 dark:text-slate-500 text-xs">—</span>
                )}
            </td>

            {/* Unit Cost */}
            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-right text-gray-900 dark:text-slate-100">
                {receiving.unit_cost !== null && receiving.unit_cost !== undefined ? (
                    `₱${Number(receiving.unit_cost).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                ) : (
                    <span className="text-gray-400 dark:text-slate-500 text-xs">—</span>
                )}
            </td>

            {/* Batch Amount / Value */}
            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-semibold text-right text-gray-900 dark:text-slate-100">
                {receiving.amount !== null && receiving.amount !== undefined ? (
                    `₱${Number(receiving.amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                ) : receiving.unit_cost ? (
                    `₱${(Number(receiving.unit_cost) * receiving.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                ) : (
                    <span className="text-gray-400 dark:text-slate-500 text-xs">—</span>
                )}
            </td>

            {/* Date Received */}
            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 dark:text-slate-400 font-mono">
                {formatDisplayDate(receiving.date || receiving.date_received, 'MM/DD/YYYY') || receiving.date}
            </td>

            {/* Direct Row Actions: View and Update only (Institutional Maroon Palette) */}
            <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="inline-flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => onView(receiving)}
                        className="text-gray-700 dark:text-slate-300 hover:text-red-950 dark:hover:text-red-400 font-semibold text-xs transition-colors cursor-pointer py-1 px-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-800"
                    >
                        View
                    </button>
                    <button
                        type="button"
                        onClick={() => onUpdate(receiving)}
                        className="border border-red-900/30 dark:border-red-700/50 text-red-950 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-900/50 font-semibold text-xs px-2.5 py-1 rounded transition-colors cursor-pointer shadow-2xs"
                    >
                        Update
                    </button>
                </div>
            </td>
        </tr>
    );
};
