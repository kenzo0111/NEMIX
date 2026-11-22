import React from 'react';
import { formatRisNumber } from '@/utils/risFormatter';
import { IssuanceRecord } from '../types';
import { IssuanceStatus } from './IssuanceStatus';
import { formatDisplayDate } from '@/utils/dateUtils';

interface IssuanceRowProps {
    issuance: IssuanceRecord;
    onViewDetails: (issuance: IssuanceRecord) => void;
    onViewRisForm: (issuance: IssuanceRecord) => void;
}

export const IssuanceRow: React.FC<IssuanceRowProps> = ({
    issuance,
    onViewDetails,
    onViewRisForm,
}) => {
    const displayDate = formatDisplayDate(issuance.date_issued || issuance.date, 'MM/DD/YYYY') || issuance.date_issued || issuance.date;
    const totalQty = issuance.total_quantity ?? issuance.quantity ?? 0;

    return (
        <tr className="hover:bg-red-50/20 dark:hover:bg-red-950/20 transition-colors border-b border-gray-100 dark:border-slate-800/80 last:border-0 group">
            {/* RIS / Issuance Number */}
            <td className="px-4 lg:px-6 py-3.5 align-middle whitespace-nowrap text-sm font-bold text-gray-900 dark:text-slate-100 tabular-nums tracking-normal">
                {formatRisNumber(issuance.ris_number)}
            </td>

            {/* Recipient / Office (Normal text, no decorative circular avatars) */}
            <td className="px-4 lg:px-6 py-3.5 align-middle text-sm min-w-[11.25rem] max-w-xs break-words">
                <div className="font-semibold text-gray-900 dark:text-slate-100 leading-tight">
                    {issuance.recipient}
                </div>
                {issuance.department && (
                    <div className="text-sm text-gray-500 dark:text-slate-400 mt-0.5 leading-tight">
                        {issuance.department}
                    </div>
                )}
            </td>

            {/* Items Issued */}
            <td className="px-4 lg:px-6 py-3.5 align-middle text-sm text-gray-800 dark:text-slate-200 font-medium min-w-[11.25rem] max-w-sm break-words line-clamp-2" title={issuance.item}>
                {issuance.item || 'N/A'}
            </td>

            {/* Total Quantity */}
            <td className="px-4 lg:px-6 py-3.5 align-middle whitespace-nowrap text-sm text-gray-900 dark:text-slate-100 font-bold tabular-nums">
                {totalQty} <span className="text-gray-400 dark:text-slate-500 text-sm font-normal font-sans">pcs</span>
            </td>

            {/* Date Issued */}
            <td className="hidden md:table-cell px-4 lg:px-6 py-3.5 align-middle whitespace-nowrap text-sm text-gray-600 dark:text-slate-400 tabular-nums">
                {displayDate}
            </td>

            {/* Status */}
            <td className="px-4 lg:px-6 py-3.5 align-middle whitespace-nowrap">
                <IssuanceStatus status={issuance.status} />
            </td>

            {/* Actions: View & RIS Form */}
            <td className="px-4 lg:px-6 py-3.5 align-middle whitespace-nowrap min-w-[10rem] text-right">
                <div className="inline-flex items-center justify-end gap-2 flex-wrap">
                    <button
                        type="button"
                        onClick={() => onViewDetails(issuance)}
                        className="text-gray-700 dark:text-slate-300 hover:text-red-950 dark:hover:text-red-400 font-semibold text-sm transition-colors cursor-pointer min-h-[2.25rem] h-[2.25rem] px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-800 inline-flex items-center justify-center whitespace-nowrap gap-1.5"
                    >
                        View
                    </button>
                    <button
                        type="button"
                        onClick={() => onViewRisForm(issuance)}
                        className="border border-red-900/30 dark:border-red-700/50 text-red-950 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-900/50 dark:hover:border-red-600 font-semibold text-sm min-h-[2.25rem] h-[2.25rem] px-3 py-1.5 rounded transition-colors cursor-pointer shadow-2xs inline-flex items-center justify-center whitespace-nowrap gap-1.5"
                    >
                        RIS Form
                    </button>
                </div>
            </td>
        </tr>
    );
};
