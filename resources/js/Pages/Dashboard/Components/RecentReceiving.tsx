import React from 'react';
import { Link } from '@inertiajs/react';
import { RecentReceiving as RecentReceivingType } from '../types';
import { ArrowDownLeft, ArrowRight } from 'lucide-react';

interface RecentReceivingProps {
    receivings?: RecentReceivingType[];
    className?: string;
}

export default function RecentReceiving({ receivings = [], className = '' }: RecentReceivingProps) {
    return (
        <div className={`bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between h-full min-w-0 ${className}`}>
            <div>
                {/* Card Header */}
                <div className="flex items-center justify-between gap-2 pb-3 mb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1 rounded-md bg-emerald-50 text-emerald-700 shrink-0">
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                        </div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 truncate">
                            Recent Receiving
                        </h3>
                    </div>
                </div>

                {/* Content Rows - strictly capped at 4 */}
                {receivings.length === 0 ? (
                    <div className="py-6 text-center text-slate-400">
                        <p className="text-xs">No receiving activity recorded recently.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {receivings.slice(0, 4).map((rec) => (
                            <div key={rec.id} className="py-2.5 flex items-center justify-between gap-3 group">
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-xs font-semibold text-slate-900 truncate group-hover:text-red-900 transition-colors">
                                        {rec.item_name}
                                    </h4>
                                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                        {rec.supplier}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-xs font-bold font-mono text-emerald-700 block">
                                        +{rec.quantity.toLocaleString()} {rec.unit}
                                    </span>
                                    <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                                        {rec.received_at}
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
                    href={route('inventory.receiving')}
                    className="text-xs font-medium text-red-950 hover:text-red-800 transition-colors inline-flex items-center gap-1"
                >
                    <span>View Ledger</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        </div>
    );
}
