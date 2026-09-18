import React from 'react';
import { formatRisNumber } from '@/utils/risFormatter';
import { Link } from '@inertiajs/react';
import { RecentIssuance as RecentIssuanceType } from '../types';
import { ArrowUpRight, ArrowRight } from 'lucide-react';

interface RecentIssuanceProps {
    issuances?: RecentIssuanceType[];
}

export default function RecentIssuance({ issuances = [] }: RecentIssuanceProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
            <div>
                <div className="flex flex-wrap items-start sm:items-center justify-between gap-2.5 pb-3 mb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1 rounded bg-amber-50 text-amber-700 shrink-0">
                            <ArrowUpRight className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 truncate">
                                Recent Issuance (RIS)
                            </h3>
                            <p className="text-xs text-gray-600">Stock disbursements to university departments</p>
                        </div>
                    </div>
                    <Link
                        href={route('inventory.issuance')}
                        className="text-xs font-semibold text-red-900 hover:text-red-950 hover:underline inline-flex items-center gap-1 shrink-0"
                    >
                        <span>View Ledger</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                {issuances.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">
                        <p className="text-xs">No recent issuance transactions.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {issuances.slice(0, 5).map((iss) => (
                            <div key={iss.id} className="py-2.5 flex items-start justify-between gap-3 group">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold font-mono text-gray-900 group-hover:text-red-900 transition-colors">
                                            {formatRisNumber(iss.ris_number)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 truncate mt-0.5">
                                        {iss.department} • <span className="text-gray-500">{iss.recipient}</span>
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-xs font-bold font-mono text-amber-800 block">
                                        {iss.total_items.toLocaleString()} items
                                    </span>
                                    <span className="text-xs text-gray-500 font-medium block mt-0.5">
                                        {iss.issued_at}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
