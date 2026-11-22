import React from 'react';
import { SupplierRowProps } from '../types';
import { SupplierStatusBadge } from './SupplierStatusBadge';
import { CATEGORY_DISPLAY_LABEL } from '../constants';
import useAuthorization from '@/Hooks/useAuthorization';

export const SupplierRow: React.FC<SupplierRowProps> = ({
    supplier,
    onView,
    onEdit,
}) => {
    const { can } = useAuthorization();
    return (
        <tr className="hover:bg-red-50/20 dark:hover:bg-red-950/20 transition-colors border-b border-gray-100 dark:border-slate-800/80 last:border-0">
            {/* Supplier Business Name */}
            <td className="px-6 py-3.5 align-middle min-w-[12.5rem] max-w-sm break-words">
                <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                    {supplier.name}
                </div>
            </td>

            {/* TIN & Registration Number */}
            <td className="px-6 py-3.5 align-middle whitespace-nowrap text-sm">
                <div className="text-gray-700 dark:text-slate-300">
                    <span className="text-gray-400 dark:text-slate-500 font-sans mr-1">TIN:</span>
                    <span className="tabular-nums font-medium">{supplier.tin || '—'}</span>
                </div>
                <div className="text-gray-700 dark:text-slate-300 mt-0.5">
                    <span className="text-gray-400 dark:text-slate-500 font-sans mr-1">Reg:</span>
                    <span className="tabular-nums font-medium">{supplier.reg_number || '—'}</span>
                </div>
            </td>

            {/* Classification */}
            <td className="px-6 py-3.5 align-middle whitespace-nowrap text-sm text-gray-600 dark:text-slate-400 font-medium">
                {CATEGORY_DISPLAY_LABEL}
            </td>

            {/* Status */}
            <td className="px-6 py-3.5 align-middle whitespace-nowrap">
                <SupplierStatusBadge status={supplier.status} />
            </td>

            {/* Actions: View & Update */}
            <td className="px-6 py-3.5 align-middle whitespace-nowrap min-w-[10rem] text-right">
                <div className="inline-flex items-center justify-end gap-2 flex-wrap">
                    <button
                        type="button"
                        onClick={() => onView(supplier)}
                        className="text-gray-700 dark:text-slate-300 hover:text-red-950 dark:hover:text-red-400 font-semibold text-sm transition-colors cursor-pointer min-h-[2.25rem] h-[2.25rem] px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-800 inline-flex items-center justify-center whitespace-nowrap gap-1.5"
                    >
                        View
                    </button>
                    {can('suppliers.update') && (
                        <button
                            type="button"
                            onClick={() => onEdit(supplier)}
                            className="border border-red-900/30 dark:border-red-700/50 text-red-950 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-900/50 dark:hover:border-red-600 font-semibold text-sm min-h-[2.25rem] h-[2.25rem] px-3 py-1.5 rounded transition-colors cursor-pointer shadow-2xs inline-flex items-center justify-center whitespace-nowrap gap-1.5"
                        >
                            Update
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
};
