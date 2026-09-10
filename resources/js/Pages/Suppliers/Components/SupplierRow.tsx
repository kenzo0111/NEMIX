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

            {/* Actions */}
            <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                <button
                    type="button"
                    onClick={() => onView(supplier)}
                    className="text-red-900 hover:text-red-950 hover:underline mr-4 font-semibold transition-colors"
                >
                    View
                </button>
                <button
                    type="button"
                    onClick={() => onEdit(supplier)}
                    className="text-gray-600 hover:text-gray-900 hover:underline font-semibold transition-colors"
                >
                    Update
                </button>
            </td>
        </tr>
    );
};
