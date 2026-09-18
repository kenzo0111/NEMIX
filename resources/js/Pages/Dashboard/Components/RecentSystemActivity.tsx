import React from 'react';
import { Link } from '@inertiajs/react';
import { RecentActivity } from '../types';
import { normalizeActivity } from '../utils/normalizeActivity';
import { History, ArrowRight } from 'lucide-react';

interface RecentSystemActivityProps {
    activities?: RecentActivity[];
    className?: string;
}

export default function RecentSystemActivity({ activities = [], className = '' }: RecentSystemActivityProps) {
    // Show concise operational overview: 4–5 latest business events
    const normalizedActivities = (activities || [])
        .map(normalizeActivity)
        .slice(0, 5);

    return (
        <div className={`bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs w-full min-w-0 flex flex-col justify-between ${className}`}>
            <div>
                {/* Section Header */}
                <div className="flex items-center justify-between gap-2 pb-3 mb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1 rounded-md bg-slate-100 text-slate-600 shrink-0">
                            <History className="w-3.5 h-3.5" />
                        </div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 truncate">
                            Recent System Activity
                        </h3>
                    </div>
                </div>

                {/* Empty State */}
                {normalizedActivities.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 space-y-1">
                        <p className="text-xs font-medium text-slate-600">No recent system activity.</p>
                        <p className="text-[11px] text-slate-400">
                            New inventory, compliance, and administrative actions will appear here.
                        </p>
                    </div>
                ) : (
                    /* Activity Stream with Compact Text Hierarchy */
                    <div className="divide-y divide-slate-100 w-full min-w-0">
                        {normalizedActivities.map((act, idx) => {
                            const statusLower = (act.status || '').toLowerCase();
                            const isDestructiveOrFailed =
                                statusLower.includes('fail') ||
                                statusLower.includes('error') ||
                                statusLower.includes('reject');

                            // Resolve clean secondary reference string
                            const entityName = typeof act.context?.entity === 'string' ? act.context.entity : null;
                            const stockNo = typeof act.context?.stock_no === 'string' ? act.context.stock_no : null;

                            let displayReference: string | null = act.reference || null;
                            if (entityName && stockNo) {
                                displayReference = `${entityName} · ${stockNo}`;
                            } else if (entityName && act.reference && entityName !== act.reference) {
                                displayReference = `${entityName} · ${act.reference}`;
                            }

                            return (
                                <div
                                    key={act.id ?? idx}
                                    className="py-2.5 flex flex-col justify-between gap-0.5 group min-w-0 w-full"
                                >
                                    {/* LINE 1: Main Activity Title + Optional Business Reference */}
                                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0">
                                        <span
                                            className={`text-xs font-semibold tracking-tight ${
                                                isDestructiveOrFailed
                                                    ? 'text-red-700'
                                                    : 'text-slate-900 group-hover:text-red-900 transition-colors'
                                            }`}
                                        >
                                            {act.title}
                                        </span>

                                        {displayReference && (
                                            <span className="text-[11px] text-slate-500 font-mono font-medium">
                                                · {displayReference}
                                            </span>
                                        )}
                                    </div>

                                    {/* LINE 2: Human-Readable Natural Summary */}
                                    {act.summary && (
                                        <p className="text-[11px] text-slate-600 leading-normal line-clamp-1">
                                            {act.summary}
                                        </p>
                                    )}

                                    {/* LINE 3: Metadata Line (Module • Time • Actor) */}
                                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 pt-0.5 min-w-0">
                                        <span className="font-medium text-slate-500">{act.module}</span>
                                        <span className="text-slate-300">•</span>
                                        <span>{act.time || act.timestamp || 'Recently'}</span>
                                        {act.actor?.name && (
                                            <>
                                                <span className="text-slate-300">•</span>
                                                <span className="text-slate-500">{act.actor.name}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Standardized Secondary Action */}
            <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex justify-end">
                <Link
                    href={route('audit-logs.transaction-trails')}
                    className="text-xs font-medium text-red-950 hover:text-red-800 transition-colors inline-flex items-center gap-1 shrink-0"
                >
                    <span>View All Activity</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        </div>
    );
}
