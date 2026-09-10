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
        <tr className="hover:bg-red-50/20 transition-colors border-b border-gray-100 last:border-0">
            {/* Item Received & SKU */}
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-semibold text-gray-900">{receiving.item}</div>
                <div className="text-xs text-gray-500 font-mono mt-0.5">
                    SKU: {receiving.sku || 'N/A'}
                </div>
            </td>

            {/* Quantity Received */}
            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 font-mono">
                <span className="text-emerald-700 font-bold mr-0.5">+</span>
                {receiving.quantity} <span className="text-gray-500 text-xs font-normal font-sans">pcs</span>
            </td>

            {/* Supplier (Normal Administrative Text, No Circular Avatar) */}
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                {receiving.supplier || 'N/A'}
            </td>

            {/* Date Received */}
            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-mono">
                {formatDisplayDate(receiving.date || receiving.date_received, 'MM/DD/YYYY') || receiving.date}
            </td>

            {/* Direct Row Actions: View and Update only (Institutional Maroon Palette) */}
            <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="inline-flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => onView(receiving)}
                        className="text-gray-700 hover:text-red-950 font-semibold text-xs transition-colors cursor-pointer py-1 px-1.5 rounded hover:bg-gray-100"
                    >
                        View
                    </button>
                    <button
                        type="button"
                        onClick={() => onUpdate(receiving)}
                        className="border border-red-900/30 text-red-950 hover:bg-red-50 hover:border-red-900/50 font-semibold text-xs px-2.5 py-1 rounded transition-colors cursor-pointer shadow-2xs"
                    >
                        Update
                    </button>
                </div>
            </td>
        </tr>
    );
};
