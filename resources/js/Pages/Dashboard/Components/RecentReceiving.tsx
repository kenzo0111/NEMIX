import React from 'react';
import { Link } from '@inertiajs/react';
import { RecentReceiving as RecentReceivingType } from '../types';
import { ArrowDownLeft, ExternalLink } from 'lucide-react';

interface RecentReceivingProps {
    receivings?: RecentReceivingType[];
}

export default function RecentReceiving({ receivings = [] }: RecentReceivingProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-emerald-50 text-emerald-700">
                            <ArrowDownLeft className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                                Recent Receiving
                            </h3>
                            <p className="text-[11px] text-gray-500">Latest deliveries added to inventory</p>
                        </div>
                    </div>
                    <Link
                        href={route('inventory.receiving')}
                        className="text-xs font-semibold text-red-900 hover:text-red-950 hover:underline inline-flex items-center gap-1"
                    >
                        <span>View Ledger</span>
                        <ExternalLink className="w-3 h-3" />
                    </Link>
                </div>

                {receivings.length === 0 ? (
                    <div className="py-8 text-center text-gray-400">
                        <p className="text-xs">No receiving activity recorded recently.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {receivings.slice(0, 5).map((rec) => (
                            <div key={rec.id} className="py-2.5 flex items-start justify-between gap-3 group">
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-xs font-semibold text-gray-900 truncate group-hover:text-red-900 transition-colors">
                                        {rec.item_name}
                                    </h4>
                                    <p className="text-[11px] text-gray-500 truncate mt-0.5">
                                        {rec.supplier}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-xs font-bold font-mono text-emerald-700 block">
                                        +{rec.quantity.toLocaleString()} {rec.unit}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-medium block mt-0.5">
                                        {rec.received_at}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="pt-3 mt-2 border-t border-gray-100 text-right">
                <Link
                    href={route('inventory.receiving')}
                    className="text-xs font-semibold text-gray-600 hover:text-red-900 transition-colors"
                >
                    View Receiving Records →
                </Link>
            </div>
        </div>
    );
}
