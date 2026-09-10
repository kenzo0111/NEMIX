import React from 'react';
import { SupplierRowProps } from '../types';
import { SupplierStatusBadge } from './SupplierStatusBadge';
import { CATEGORY_DISPLAY_LABEL } from '../constants';

export const SupplierRow: React.FC<SupplierRowProps> = ({
    supplier,
    onView,
    onEdit,
}) => {
    return (
        <tr className="hover:bg-red-50/20 transition-colors border-b border-gray-100 last:border-0">
            {/* Supplier Business Name */}
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-semibold text-gray-900">
                    {supplier.name}
                </div>
            </td>

            {/* TIN & Registration Number */}
            <td className="px-6 py-4 whitespace-nowrap text-xs">
                <div className="text-gray-700">
                    <span className="text-gray-400 font-sans mr-1">TIN:</span>
                    <span className="font-mono font-medium">{supplier.tin || '—'}</span>
                </div>
                <div className="text-gray-700 mt-0.5">
                    <span className="text-gray-400 font-sans mr-1">Reg:</span>
                    <span className="font-mono font-medium">{supplier.reg_number || '—'}</span>
                </div>
            </td>

            {/* Classification */}
            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-medium">
                {CATEGORY_DISPLAY_LABEL}
            </td>

            {/* Status */}
            <td className="px-6 py-4 whitespace-nowrap">
                <SupplierStatusBadge status={supplier.status} />
            </td>

            {/* Actions: View & Update (Matching Issuance institutional styling) */}
            <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="inline-flex items-center justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={() => onView(supplier)}
                        className="text-gray-700 hover:text-red-950 font-semibold text-xs transition-colors cursor-pointer py-1 px-1.5 rounded hover:bg-gray-100"
                    >
                        View
                    </button>
                    <button
                        type="button"
                        onClick={() => onEdit(supplier)}
                        className="border border-red-900/30 text-red-950 hover:bg-red-50 hover:border-red-900/50 font-semibold text-xs px-2.5 py-1 rounded transition-colors cursor-pointer shadow-2xs"
                    >
                        Update
                    </button>
                </div>
            </td>
        </tr>
    );
};
