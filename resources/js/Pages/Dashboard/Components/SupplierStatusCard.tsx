import React from 'react';
import { Link } from '@inertiajs/react';
import { SupplierSummary } from '../types';
import { Building2, ArrowRight } from 'lucide-react';

interface SupplierStatusCardProps {
    summary?: SupplierSummary;
}

export default function SupplierStatusCard({ summary }: SupplierStatusCardProps) {
    if (!summary || summary.total === 0) {
        return null;
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between h-full col-span-1">
            <div>
                <div className="flex flex-wrap items-start sm:items-center justify-between gap-2.5 pb-3 mb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1 rounded bg-gray-100 text-gray-700 shrink-0">
                            <Building2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 truncate">
                                Supplier Registry Status
                            </h3>
                        </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded shrink-0">
                        {summary.total} Registered
                    </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-1 text-center">
                    <div className="bg-emerald-50/60 border border-emerald-100/80 rounded p-2.5">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                            Active
                        </span>
                        <span className="text-base font-bold font-mono text-emerald-900 mt-0.5 block">
                            {summary.active}
                        </span>
                    </div>
                    <div className="bg-amber-50/60 border border-amber-100/80 rounded p-2.5">
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                            Pending
                        </span>
                        <span className="text-base font-bold font-mono text-amber-900 mt-0.5 block">
                            {summary.pending}
                        </span>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded p-2.5">
                        <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block">
                            Blacklisted
                        </span>
                        <span className="text-base font-bold font-mono text-gray-800 mt-0.5 block">
                            {summary.blacklisted}
                        </span>
                    </div>
                </div>
            </div>

            <div className="pt-3 mt-3 border-t border-gray-100 text-right">
                <Link
                    href={route('suppliers.index')}
                    className="text-xs font-semibold text-gray-700 hover:text-red-900 transition-colors inline-flex items-center gap-1"
                >
                    <span>View Supplier Registry</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        </div>
    );
}
