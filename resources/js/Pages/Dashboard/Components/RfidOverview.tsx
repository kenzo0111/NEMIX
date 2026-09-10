import React from 'react';
import { Link } from '@inertiajs/react';
import { RfidSummary } from '../types';
import { Radio, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

interface RfidOverviewProps {
    rfidSummary?: RfidSummary;
}

export default function RfidOverview({ rfidSummary }: RfidOverviewProps) {
    const total = rfidSummary?.total ?? 0;
    const tagged = rfidSummary?.tagged ?? 0;
    const untagged = rfidSummary?.untagged ?? 0;
    const percentage = rfidSummary?.percentage ?? (total > 0 ? Math.round((tagged / total) * 100) : 0);

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-red-50 text-red-900">
                            <Radio className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                                RFID Tagging Status
                            </h3>
                            <p className="text-[11px] text-gray-500">Physical asset tracking coverage</p>
                        </div>
                    </div>

                    <span className="text-xs font-bold font-mono text-gray-900">
                        {percentage}% Coverage
                    </span>
                </div>

                {/* Progress bar */}
                <div className="mt-2 mb-4">
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-red-900 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                        ></div>
                    </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-2 gap-3 mb-2">
                    <div className="bg-gray-50/70 border border-gray-100 rounded-md p-3">
                        <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold mb-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Tagged Items</span>
                        </div>
                        <div className="text-lg font-bold font-mono text-gray-900">
                            {tagged.toLocaleString()}
                            <span className="text-xs font-normal text-gray-400 ml-1">/ {total.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="bg-gray-50/70 border border-gray-100 rounded-md p-3">
                        <div className="flex items-center gap-1.5 text-amber-700 text-xs font-semibold mb-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pending Assignment</span>
                        </div>
                        <div className="text-lg font-bold font-mono text-gray-900">
                            {untagged.toLocaleString()}
                            <span className="text-xs font-normal text-gray-400 ml-1">items</span>
                        </div>
                    </div>
                </div>

                <p className="text-[11px] text-gray-500 mt-2">
                    {untagged > 0
                        ? `${untagged} active items are currently awaiting RFID hardware assignment.`
                        : 'All tracked inventory items currently have active RFID tag associations.'}
                </p>
            </div>

            <div className="pt-3 mt-3 border-t border-gray-100 text-right">
                <Link
                    href={route('rfid-scanner.index')}
                    className="text-xs font-semibold text-gray-600 hover:text-red-900 transition-colors inline-flex items-center gap-1"
                >
                    <span>Manage RFID Hardware & Tags</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        </div>
    );
}
