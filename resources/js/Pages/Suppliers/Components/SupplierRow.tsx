import { Button } from '@/Components/ui/button';
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
        <tr className="hover:bg-red-50/20 dark:hover:bg-red-950/20 transition-colors border-b border-slate-100 dark:border-slate-800/80 last:border-0">
            {/* Supplier Business Name */}
            <td className="px-6 py-3.5 align-middle min-w-[12.5rem] max-w-sm break-words">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {supplier.name}
                </div>
            </td>

            {/* TIN & Registration Number */}
            <td className="px-6 py-3.5 align-middle whitespace-nowrap text-sm">
                <div className="text-slate-700 dark:text-slate-300">
                    <span className="text-slate-500 dark:text-slate-400 font-sans mr-1">TIN:</span>
                    <span className="tabular-nums font-medium">{supplier.tin || '—'}</span>
                </div>
                <div className="text-slate-700 dark:text-slate-300 mt-0.5">
                    <span className="text-slate-500 dark:text-slate-400 font-sans mr-1">Reg:</span>
                    <span className="tabular-nums font-medium">{supplier.reg_number || '—'}</span>
                </div>
            </td>

            {/* Classification */}
            <td className="px-6 py-3.5 align-middle whitespace-nowrap text-sm text-slate-600 dark:text-slate-400 font-medium">
                {CATEGORY_DISPLAY_LABEL}
            </td>

            {/* Status */}
            <td className="px-6 py-3.5 align-middle whitespace-nowrap">
                <SupplierStatusBadge status={supplier.status} />
            </td>

            {/* Actions: View & Update */}
            <td className="px-6 py-3.5 align-middle whitespace-nowrap min-w-[10rem] text-right">
                <div className="inline-flex items-center justify-end gap-2 shrink-0">
                    <Button variant="secondary"
                        type="button"
                        onClick={() => onView(supplier)}
                        className="min-h-[2.25rem] h-[2.25rem] inline-flex items-center justify-center gap-1.5"
                    >
                        View
                    </Button>
                    {can('suppliers.update') && (
                        <Button variant="secondary"
                            type="button"
                            onClick={() => onEdit(supplier)}
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
