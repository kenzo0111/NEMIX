import React from 'react';
import { Link } from '@inertiajs/react';
import { RecentIssuance as RecentIssuanceType } from '../types';
import { ArrowUpRight, ExternalLink } from 'lucide-react';

interface RecentIssuanceProps {
    issuances?: RecentIssuanceType[];
}

export default function RecentIssuance({ issuances = [] }: RecentIssuanceProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-amber-50 text-amber-700">
                            <ArrowUpRight className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                                Recent Issuance (RIS)
                            </h3>
                            <p className="text-[11px] text-gray-500">Stock disbursements to university departments</p>
                        </div>
                    </div>
                    <Link
                        href={route('inventory.issuance')}
                        className="text-xs font-semibold text-red-900 hover:text-red-950 hover:underline inline-flex items-center gap-1"
                    >
                        <span>View Ledger</span>
                        <ExternalLink className="w-3 h-3" />
                    </Link>
                </div>

                {issuances.length === 0 ? (
                    <div className="py-8 text-center text-gray-400">
                        <p className="text-xs">No recent issuance transactions.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {issuances.slice(0, 5).map((iss) => (
                            <div key={iss.id} className="py-2.5 flex items-start justify-between gap-3 group">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold font-mono text-gray-900 group-hover:text-red-900 transition-colors">
                                            {iss.ris_number}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-gray-600 truncate mt-0.5">
                                        {iss.department} • <span className="text-gray-500">{iss.recipient}</span>
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-xs font-bold font-mono text-amber-800 block">
                                        {iss.total_items.toLocaleString()} items
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-medium block mt-0.5">
                                        {iss.issued_at}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="pt-3 mt-2 border-t border-gray-100 text-right">
                <Link
                    href={route('inventory.issuance')}
                    className="text-xs font-semibold text-gray-600 hover:text-red-900 transition-colors"
                >
                    View Issuance Records →
                </Link>
            </div>
        </div>
    );
}
