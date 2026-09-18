import React from 'react';
import { Link } from '@inertiajs/react';
import { ComplianceSummary } from '../types';
import { FileCheck2, ArrowRight } from 'lucide-react';

interface ComplianceStatusCardProps {
    summary?: ComplianceSummary;
}

export default function ComplianceStatusCard({ summary }: ComplianceStatusCardProps) {
    if (!summary) {
        return null;
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between h-full col-span-1">
            <div>
                <div className="flex flex-wrap items-start sm:items-center justify-between gap-2.5 pb-3 mb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1 rounded bg-red-50 text-red-900 shrink-0">
                            <FileCheck2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 truncate">
                                Compliance & Filings
                            </h3>
                        </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded shrink-0">
                        {summary.reports_this_month ?? 0} MTD
                    </span>
                </div>

                <div className="bg-gray-50/70 border border-gray-100 rounded-lg p-3">
                    {summary.latest_report ? (
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block">
                                    Latest Filing
                                </span>
                                <h4 className="text-xs font-semibold text-gray-900 truncate mt-0.5">
                                    {summary.latest_report.title}
                                </h4>
                                <p className="text-[11px] text-gray-600 mt-0.5">
                                    Ref: <span className="font-mono">{summary.latest_report.reference}</span> • By {summary.latest_report.created_by}
                                </p>
                            </div>
                            <span className="text-[11px] font-medium text-gray-500 shrink-0 mt-1">
                                {summary.latest_report.date}
                            </span>
                        </div>
                    ) : (
                        <p className="text-xs text-gray-600">
                            No formal compliance reports compiled for this cycle yet.
                        </p>
                    )}
                </div>
            </div>

            <div className="pt-3 mt-3 border-t border-gray-100 text-right">
                <Link
                    href={route('compliance.reports')}
                    className="text-xs font-semibold text-gray-700 hover:text-red-900 transition-colors inline-flex items-center gap-1"
                >
                    <span>Manage Official Reports</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        </div>
    );
}
