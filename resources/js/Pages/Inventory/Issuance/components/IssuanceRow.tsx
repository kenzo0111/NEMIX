import { rowSelectionProps } from '@/Hooks/useTableSelection';
import React from 'react';
import { formatRisNumber } from '@/utils/risFormatter';
import { IssuanceRecord } from '../types';
import { IssuanceStatus } from './IssuanceStatus';
import { formatDisplayDate } from '@/utils/dateUtils';

interface IssuanceRowProps {
    issuance: IssuanceRecord;
    selected: boolean;
    onSelect: (issuance: IssuanceRecord) => void;
}

export const IssuanceRow: React.FC<IssuanceRowProps> = ({
    issuance,
    selected,
    onSelect,
}) => {
    const displayDate = formatDisplayDate(issuance.date_issued || issuance.date, 'MM/DD/YYYY') || issuance.date_issued || issuance.date;
    const totalQty = issuance.total_quantity ?? issuance.quantity ?? 0;

    return (
        <tr   {...rowSelectionProps(selected, () => onSelect(issuance))}  className={`cursor-pointer transition-colors border-b border-gray-100 dark:border-slate-800/80 last:border-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-800 ${selected ? 'bg-red-50 shadow-[inset_3px_0_0_#7f1d1d] dark:bg-red-950/30' : 'hover:bg-red-50/30 dark:hover:bg-red-950/20'}`}>
            {/* RIS / Issuance Number */}
            <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-slate-100 tabular-nums tracking-normal">
                {formatRisNumber(issuance.ris_number)}
            </td>

            {/* Recipient / Office (Normal text, no decorative circular avatars) */}
            <td className="px-4 lg:px-6 py-4 text-sm">
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
            <td className="px-4 lg:px-6 py-4 text-sm text-gray-800 dark:text-slate-200 font-medium max-w-xs truncate" title={issuance.item}>
                {issuance.item || 'N/A'}
            </td>

            {/* Total Quantity */}
            <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-100 font-bold tabular-nums">
                {totalQty} <span className="text-gray-400 dark:text-slate-500 text-sm font-normal font-sans">pcs</span>
            </td>

            {/* Date Issued */}
            <td className="hidden md:table-cell px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-400 tabular-nums">
                {displayDate}
            </td>

            {/* Status */}
            <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                <IssuanceStatus status={issuance.status} />
            </td>

        </tr>
    );
};
