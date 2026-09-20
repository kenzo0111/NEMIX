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
        <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col justify-between h-full min-w-0 ${className}`}>
            <div>
                {/* Card Header */}
                <div className="flex items-center justify-between gap-2 pb-2.5 mb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 shrink-0">
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                        </div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 truncate">
                            Recent Receiving
                        </h3>
                    </div>
                </div>

                {/* Content Rows - strictly capped at 4 */}
                {receivings.length === 0 ? (
                    <div className="py-5 text-center text-slate-400 dark:text-slate-500">
                        <p className="text-xs">No receiving activity recorded recently.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {receivings.slice(0, 4).map((rec) => (
                            <div key={rec.id} className="py-2 flex items-center justify-between gap-3 group">
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-red-900 dark:group-hover:text-red-400 transition-colors">
                                        {rec.item_name}
                                    </h4>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                        {rec.supplier}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400 block">
                                        +{rec.quantity.toLocaleString()} {rec.unit}
                                    </span>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block mt-0.5">
                                        {rec.received_at}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Standardized Secondary Action */}
            <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <Link
                    href={route('inventory.receiving')}
                    className="text-xs font-medium text-red-950 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors inline-flex items-center gap-1"
                >
                    <span>View Ledger</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        </div>
    );
}
