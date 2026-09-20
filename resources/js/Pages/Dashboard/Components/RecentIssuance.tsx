import React from 'react';
import { formatRisNumber } from '@/utils/risFormatter';
import { Link } from '@inertiajs/react';
import { RecentIssuance as RecentIssuanceType } from '../types';
import { ArrowUpRight, ArrowRight } from 'lucide-react';

interface RecentIssuanceProps {
    issuances?: RecentIssuanceType[];
    className?: string;
}

export default function RecentIssuance({ issuances = [], className = '' }: RecentIssuanceProps) {
    return (
        <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col justify-between h-full min-w-0 ${className}`}>
            <div>
                {/* Card Header */}
                <div className="flex items-center justify-between gap-2 pb-2.5 mb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 shrink-0">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 truncate">
                            Recent Issuance (RIS)
                        </h3>
                    </div>
                </div>

                {/* Content Rows - strictly capped at 4 */}
                {issuances.length === 0 ? (
                    <div className="py-5 text-center text-slate-400 dark:text-slate-500">
                        <p className="text-xs">No recent issuance transactions.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {issuances.slice(0, 4).map((iss) => {
                            const recipientText = iss.department || iss.recipient ? (
                                [iss.department, iss.recipient].filter(Boolean).join(' • ')
                            ) : 'General Dispersal';

                            return (
                                <div key={iss.id} className="py-2 flex items-center justify-between gap-3 group">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100 group-hover:text-red-900 dark:group-hover:text-red-400 transition-colors">
                                                {formatRisNumber(iss.ris_number)}
                                            </span>
                                        </div>
                                        <p
                                            className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 pr-1"
                                            title={recipientText}
                                        >
                                            {recipientText}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="text-xs font-bold font-mono text-amber-800 dark:text-amber-400 block">
                                            {iss.total_items.toLocaleString()} items
                                        </span>
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block mt-0.5">
                                            {iss.issued_at}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Standardized Secondary Action */}
            <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <Link
                    href={route('inventory.issuance')}
                    className="text-xs font-medium text-red-950 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors inline-flex items-center gap-1"
                >
                    <span>View Ledger</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        </div>
    );
}
