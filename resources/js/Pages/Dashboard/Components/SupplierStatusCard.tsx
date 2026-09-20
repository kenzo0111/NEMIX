import React from 'react';
import { Link } from '@inertiajs/react';
import { SupplierSummary } from '../types';
import { Building2, ArrowRight } from 'lucide-react';

interface SupplierStatusCardProps {
    summary?: SupplierSummary;
    className?: string;
}

export default function SupplierStatusCard({ summary, className = '' }: SupplierStatusCardProps) {
    const total = summary?.total ?? 0;
    const active = summary?.active ?? 0;
    const pending = summary?.pending ?? 0;
    const blacklisted = summary?.blacklisted ?? 0;

    return (
        <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col justify-between h-full min-w-0 ${className}`}>
            <div>
                {/* Header */}
                <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                            <Building2 className="w-3.5 h-3.5" />
                        </div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 truncate">
                            Supplier Registry Status
                        </h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded shrink-0">
                        {total} Total
                    </span>
                </div>

                {/* Compact Grid Summary */}
                <div className="grid grid-cols-3 gap-2 py-0.5 text-center">
                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg p-2 sm:p-2.5">
                        <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                            Active
                        </span>
                        <span className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5 block truncate">
                            {active}
                        </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg p-2 sm:p-2.5">
                        <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                            Pending
                        </span>
                        <span className="text-base font-bold font-mono text-amber-700 dark:text-amber-400 mt-0.5 block truncate">
                            {pending}
                        </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg p-2 sm:p-2.5">
                        <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                            Blacklist
                        </span>
                        <span className="text-base font-bold font-mono text-slate-700 dark:text-slate-300 mt-0.5 block truncate">
                            {blacklisted}
                        </span>
                    </div>
                </div>

                {/* Subtle description */}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 truncate">
                    {active} verified active vendors on official registry.
                </p>
            </div>

            {/* Standardized Secondary Action */}
            <div className="pt-2 mt-2.5 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <Link
                    href={route('suppliers.index')}
                    className="text-xs font-medium text-red-950 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors inline-flex items-center gap-1"
                >
                    <span>View Registry</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        </div>
    );
}
