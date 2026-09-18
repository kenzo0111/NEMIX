import React from 'react';
import { Link } from '@inertiajs/react';
import { ComplianceSummary } from '../types';
import { FileCheck2, ArrowRight } from 'lucide-react';

interface ComplianceStatusCardProps {
    summary?: ComplianceSummary;
    className?: string;
}

export default function ComplianceStatusCard({ summary, className = '' }: ComplianceStatusCardProps) {
    const reportsCount = summary?.reports_this_month ?? 0;
    const latestReport = summary?.latest_report;

    return (
        <div className={`bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between h-full min-w-0 ${className}`}>
            <div>
                {/* Header */}
                <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1 rounded-md bg-slate-100 text-slate-700 shrink-0">
                            <FileCheck2 className="w-3.5 h-3.5" />
                        </div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 truncate">
                            Compliance & Filings
                        </h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                        {reportsCount} MTD
                    </span>
                </div>

                {/* Compact Filing Summary */}
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 sm:p-2.5">
                    {latestReport ? (
                        <div>
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                    Latest Filing
                                </span>
                                <span className="text-[10px] font-medium text-slate-400">
                                    {latestReport.date}
                                </span>
                            </div>
                            <h4 className="text-xs font-semibold text-slate-900 truncate mt-1">
                                {latestReport.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                Ref: <span className="font-mono text-slate-700">{latestReport.reference}</span>
                                {latestReport.created_by && ` • ${latestReport.created_by}`}
                            </p>
                        </div>
                    ) : (
                        <div className="py-2 text-center text-slate-400">
                            <p className="text-xs">No formal compliance reports compiled this cycle.</p>
                        </div>
                    )}
                </div>

                {/* Subtle description */}
                <p className="text-[11px] text-slate-500 mt-2 truncate">
                    {reportsCount > 0 ? `${reportsCount} periodic inspection filings submitted.` : 'Awaiting scheduled monthly audit report.'}
                </p>
            </div>

            {/* Standardized Secondary Action */}
            <div className="pt-2 mt-2.5 border-t border-slate-100 flex justify-end">
                <Link
                    href={route('compliance.reports')}
                    className="text-xs font-medium text-red-950 hover:text-red-800 transition-colors inline-flex items-center gap-1"
                >
                    <span>Manage Official Reports</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        </div>
    );
}
