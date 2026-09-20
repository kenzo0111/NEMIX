import React from 'react';
import { Link } from '@inertiajs/react';
import { RfidSummary } from '../types';
import { Radio, ArrowRight } from 'lucide-react';

interface RfidOverviewProps {
    rfidSummary?: RfidSummary;
    className?: string;
}

export default function RfidOverview({ rfidSummary, className = '' }: RfidOverviewProps) {
    const total = rfidSummary?.total ?? 0;
    const tagged = rfidSummary?.tagged ?? 0;
    const untagged = rfidSummary?.untagged ?? 0;
    const percentage = rfidSummary?.percentage ?? (total > 0 ? Math.round((tagged / total) * 100) : 0);

    return (
        <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col justify-between h-full min-w-0 ${className}`}>
            <div>
                {/* Header */}
                <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                            <Radio className="w-3.5 h-3.5" />
                        </div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 truncate">
                            RFID Tagging Status
                        </h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded shrink-0">
                        {percentage}%
                    </span>
                </div>

                {/* Compact Stats Row */}
                <div className="grid grid-cols-2 gap-2.5 py-0.5">
                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg p-2 sm:p-2.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                            Tagged
                        </span>
                        <span className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5 block truncate">
                            {tagged.toLocaleString()}
                            <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500 ml-1">/ {total.toLocaleString()}</span>
                        </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg p-2 sm:p-2.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                            Pending
                        </span>
                        <span className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5 block truncate">
                            {untagged.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Compact Progress Bar */}
                <div className="mt-2.5">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                            className="bg-red-900 dark:bg-red-700 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                        ></div>
                    </div>
                </div>

                {/* Subtle description */}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 truncate">
                    {tagged} of {total} hardware assets verified in field.
                </p>
            </div>

            {/* Standardized Secondary Action */}
            <div className="pt-2 mt-2.5 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <Link
                    href={route('rfid-scanner.index')}
                    className="text-xs font-medium text-red-950 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors inline-flex items-center gap-1"
                >
                    <span>Manage RFID</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        </div>
    );
}
