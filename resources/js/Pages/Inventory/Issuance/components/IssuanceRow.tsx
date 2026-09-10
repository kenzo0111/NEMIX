import React from 'react';
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
        <tr className="hover:bg-red-50/20 transition-colors border-b border-gray-100 last:border-0 group">
            {/* RIS / Issuance Number */}
            <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-900 font-mono tracking-wide">
                {issuance.ris_number}
            </td>

            {/* Recipient / Office (Normal text, no decorative circular avatars) */}
            <td className="px-4 lg:px-6 py-4 text-xs">
                <div className="font-semibold text-gray-900 leading-tight">
                    {issuance.recipient}
                </div>
                {issuance.department && (
                    <div className="text-[11px] text-gray-500 mt-0.5 leading-tight">
                        {issuance.department}
                    </div>
                )}
            </td>

            {/* Items Issued */}
            <td className="px-4 lg:px-6 py-4 text-xs text-gray-800 font-medium max-w-xs truncate" title={issuance.item}>
                {issuance.item || 'N/A'}
            </td>

            {/* Total Quantity */}
            <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs text-gray-900 font-bold font-mono">
                {totalQty} <span className="text-gray-400 text-[11px] font-normal font-sans">pcs</span>
            </td>

            {/* Date Issued */}
            <td className="hidden md:table-cell px-4 lg:px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-mono">
                {displayDate}
            </td>

            {/* Status */}
            <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                <IssuanceStatus status={issuance.status} />
            </td>

            {/* Actions: View & RIS Form (Institutional maroon & neutral outline, no green/blue buttons) */}
            <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right">
                <div className="inline-flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => onViewDetails(issuance)}
                        className="text-gray-700 hover:text-red-950 font-semibold text-xs transition-colors cursor-pointer py-1 px-1.5 rounded hover:bg-gray-100"
                    >
                        View
                    </button>
                    <button
                        type="button"
                        onClick={() => onViewRisForm(issuance)}
                        className="border border-red-900/30 text-red-950 hover:bg-red-50 hover:border-red-900/50 font-semibold text-xs px-2.5 py-1 rounded transition-colors cursor-pointer shadow-2xs"
                    >
                        RIS Form
                    </button>
                </div>
            </td>
        </tr>
    );
};
