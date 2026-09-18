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
        <div className={`bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between h-full min-w-0 ${className}`}>
            <div>
                {/* Card Header */}
                <div className="flex items-center justify-between gap-2 pb-3 mb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1 rounded-md bg-amber-50 text-amber-700 shrink-0">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 truncate">
                            Recent Issuance (RIS)
                        </h3>
                    </div>
                </div>

                {/* Content Rows - strictly capped at 4 */}
                {issuances.length === 0 ? (
                    <div className="py-6 text-center text-slate-400">
                        <p className="text-xs">No recent issuance transactions.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {issuances.slice(0, 4).map((iss) => (
                            <div key={iss.id} className="py-2.5 flex items-center justify-between gap-3 group">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold font-mono text-slate-900 group-hover:text-red-900 transition-colors">
                                            {formatRisNumber(iss.ris_number)}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 truncate mt-0.5 pr-2">
                                        {iss.department || iss.recipient ? (
                                            <>
                                                {iss.department && <span>{iss.department}</span>}
                                                {iss.department && iss.recipient && <span className="mx-1">•</span>}
                                                {iss.recipient && <span>{iss.recipient}</span>}
                                            </>
                                        ) : (
                                            'General Dispersal'
                                        )}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-xs font-bold font-mono text-amber-800 block">
                                        {iss.total_items.toLocaleString()} items
                                    </span>
                                    <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                                        {iss.issued_at}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Standardized Secondary Action */}
            <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex justify-end">
                <Link
                    href={route('inventory.issuance')}
                    className="text-xs font-medium text-red-950 hover:text-red-800 transition-colors inline-flex items-center gap-1"
                >
                    <span>View Ledger</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        </div>
    );
}
