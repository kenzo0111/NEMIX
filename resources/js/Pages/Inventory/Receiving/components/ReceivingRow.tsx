import { formatScreenDate } from '@/utils/displayFormat';
import { Button } from '@/Components/ui/button';
import React from 'react';
import { ReceivingRecord } from '../types';
import { formatDisplayDate } from '@/utils/dateUtils';
import useAuthorization from '@/Hooks/useAuthorization';

interface ReceivingRowProps {
    receiving: ReceivingRecord;
    onView: (receiving: ReceivingRecord) => void;
    onUpdate?: (receiving: ReceivingRecord) => void;
}

export const ReceivingRow: React.FC<ReceivingRowProps> = ({
    receiving,
    onView,
    onUpdate,
}) => {
    const { can } = useAuthorization();
    return (
        <tr className="hover:bg-red-50/20 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800/80 last:border-0">
            {/* Item Received & SKU */}
            <td className="px-6 py-3.5 align-middle min-w-[12.5rem] max-w-xs break-words">
                <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{receiving.item}</div>
                    {receiving.scanned_rfid_tag && (
                        <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-sm font-semibold bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-400 border border-red-200 dark:border-red-900/50 shrink-0"
                            title={`Scanned RFID Tag: ${receiving.scanned_rfid_tag}`}
                        >
                            RFID
                        </span>
                    )}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 tabular-nums mt-0.5">
                    SKU: {receiving.sku || 'N/A'}
                </div>
            </td>

            {/* Supplier & Supplier Stock No */}
            <td className="px-6 py-3.5 align-middle min-w-[11.25rem] max-w-xs break-words">
                <div className="text-sm text-slate-800 dark:text-slate-200 font-medium">{receiving.supplier || 'N/A'}</div>
                {receiving.supplier_stock_no ? (
                    <div className="text-sm tabular-nums text-slate-600 dark:text-slate-400 mt-0.5">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            {receiving.supplier_stock_no}
                        </span>
                    </div>
                ) : null}
            </td>

            {/* Quantity Received */}
            <td className="px-6 py-3.5 align-middle whitespace-nowrap text-sm font-semibold text-slate-800 dark:text-slate-200 tabular-nums text-right">
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold mr-0.5">+</span>
                {receiving.quantity} <span className="text-slate-500 dark:text-slate-400 text-sm font-normal font-sans">{receiving.unit || 'pcs'}</span>
            </td>

            {/* Quantity Remaining */}
            <td className="px-6 py-3.5 align-middle whitespace-nowrap text-sm tabular-nums text-right">
                {receiving.quantity_remaining !== null && receiving.quantity_remaining !== undefined ? (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-semibold ${receiving.quantity_remaining > 0
    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"}`}>
                        {receiving.quantity_remaining} {receiving.unit || 'pcs'}
                    </span>
                ) : (
                    <span className="text-slate-500 dark:text-slate-400 text-sm">—</span>
                )}
            </td>

            {/* Unit Cost */}
            <td className="px-6 py-3.5 align-middle whitespace-nowrap text-sm tabular-nums text-right text-slate-900 dark:text-slate-100">
                {receiving.unit_cost !== null && receiving.unit_cost !== undefined ? (
                    `₱${Number(receiving.unit_cost).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                ) : (
                    <span className="text-slate-500 dark:text-slate-400 text-sm">—</span>
                )}
            </td>

            {/* Batch Amount / Value */}
            <td className="px-6 py-3.5 align-middle whitespace-nowrap text-sm tabular-nums font-semibold text-right text-slate-900 dark:text-slate-100">
                {receiving.amount !== null && receiving.amount !== undefined ? (
                    `₱${Number(receiving.amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                ) : receiving.unit_cost ? (
                    `₱${(Number(receiving.unit_cost) * receiving.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                ) : (
                    <span className="text-slate-500 dark:text-slate-400 text-sm">—</span>
                )}
            </td>

            {/* Date Received */}
            <td className="px-6 py-3.5 align-middle whitespace-nowrap text-sm text-slate-600 dark:text-slate-400 tabular-nums">
                {formatScreenDate(receiving.date || receiving.date_received) || receiving.date}
            </td>

            {/* Direct Row Actions: View and Update */}
            <td className="px-6 py-3.5 align-middle whitespace-nowrap min-w-[10rem] text-right">
                <div className="inline-flex items-center justify-end gap-2 shrink-0">
                    <Button variant="secondary"
                        type="button"
                        onClick={() => onView(receiving)}
                        className="min-h-[2.25rem] h-[2.25rem] inline-flex items-center justify-center gap-1.5"
                    >
                        View
                    </Button>
                    {onUpdate && can('inventory.receiving.update') && (
                        <Button variant="secondary"
                            type="button"
                            onClick={() => onUpdate(receiving)}
                            className="min-h-[2.25rem] h-[2.25rem] inline-flex items-center justify-center gap-1.5"
                        >
                            Update
                        </Button>
                    )}
                </div>
            </td>
        </tr>
    );
};
