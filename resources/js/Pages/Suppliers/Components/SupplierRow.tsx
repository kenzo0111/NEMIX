import { rowSelectionProps } from '@/Hooks/useTableSelection';
import React from 'react';
import { SupplierRowProps } from '../types';
import { SupplierStatusBadge } from './SupplierStatusBadge';
import { CATEGORY_DISPLAY_LABEL } from '../constants';

export const SupplierRow: React.FC<SupplierRowProps> = ({
    supplier,
    selected,
    onSelect,
}) => {
    return (
        <tr
            
            
            {...rowSelectionProps(selected, () => onSelect(supplier))}
            
            className={`cursor-pointer transition-colors border-b border-gray-100 dark:border-slate-800/80 last:border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-800 ${selected ? 'bg-red-50 shadow-[inset_3px_0_0_#7f1d1d] dark:bg-red-950/30' : 'hover:bg-red-50/30 dark:hover:bg-red-950/20'}`}
        >
            {/* Supplier Business Name */}
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                    {supplier.name}
                </div>
            </td>

            {/* TIN & Registration Number */}
            <td className="px-6 py-4 whitespace-nowrap text-sm">
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
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-400 font-medium">
                {CATEGORY_DISPLAY_LABEL}
            </td>

            {/* Status */}
            <td className="px-6 py-4 whitespace-nowrap">
                <SupplierStatusBadge status={supplier.status} />
            </td>

        </tr>
    );
};
