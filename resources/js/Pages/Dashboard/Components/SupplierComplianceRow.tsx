import React from 'react';
import { Link } from '@inertiajs/react';
import { SupplierSummary, ComplianceSummary } from '../types';
import { Building2, FileCheck2, ArrowRight } from 'lucide-react';

interface SupplierComplianceRowProps {
    supplierSummary?: SupplierSummary;
    complianceSummary?: ComplianceSummary;
}

export default function SupplierComplianceRow({
    supplierSummary,
    complianceSummary,
}: SupplierComplianceRowProps) {
    const hasSuppliers = (supplierSummary?.total ?? 0) > 0;
    const hasCompliance = complianceSummary !== undefined;

    if (!hasSuppliers && !hasCompliance) {
        return null;
    }

    return (
        <section aria-label="Governance & Compliance Overview">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Governance & Vendor Status
                </h2>
                <span className="text-[11px] text-gray-500 font-medium">
                    Institutional Standards
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Supplier Status Card */}
                {hasSuppliers && (
                    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
                        <div>
                            <div className="flex flex-wrap items-start sm:items-center justify-between gap-2.5 pb-3 mb-3 border-b border-gray-100">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="p-1 rounded bg-gray-100 text-gray-700 shrink-0">
                                        <Building2 className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 truncate">
                                            Supplier Registry Status
                                        </h3>
                                        <p className="text-xs text-gray-600">Accredited vendor compliance</p>
                                    </div>
                                </div>
                                <span className="text-xs font-mono font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded shrink-0">
                                    {supplierSummary?.total ?? 0} Registered
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 py-1 text-center">
                                <div className="bg-emerald-50/60 border border-emerald-100/80 rounded p-2.5">
                                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                                        Active
                                    </span>
                                    <span className="text-base font-bold font-mono text-emerald-900 mt-0.5 block">
                                        {supplierSummary?.active ?? 0}
                                    </span>
                                </div>
                                <div className="bg-amber-50/60 border border-amber-100/80 rounded p-2.5">
                                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                                        Pending
                                    </span>
                                    <span className="text-base font-bold font-mono text-amber-900 mt-0.5 block">
                                        {supplierSummary?.pending ?? 0}
                                    </span>
                                </div>
                                <div className="bg-gray-50 border border-gray-200 rounded p-2.5">
                                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                        Blacklisted
                                    </span>
                                    <span className="text-base font-bold font-mono text-gray-800 mt-0.5 block">
                                        {supplierSummary?.blacklisted ?? 0}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-3 mt-3 border-t border-gray-100 text-right">
                            <Link
                                href={route('suppliers.index')}
                                className="text-xs font-semibold text-gray-700 hover:text-red-900 transition-colors inline-flex items-center gap-1"
                            >
                                <span>View Supplier Registry</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>
                )}

                {/* Compliance & Reports Card */}
                {hasCompliance && (
                    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
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
                                        <p className="text-xs text-gray-600">Official RSMI & RPCI generation</p>
                                    </div>
                                </div>
                                <span className="text-xs font-mono font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded shrink-0">
                                    {complianceSummary?.reports_this_month ?? 0} MTD
                                </span>
                            </div>

                            <div className="bg-gray-50/70 border border-gray-100 rounded-md p-3">
                                {complianceSummary?.latest_report ? (
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <span className="text-xs font-bold uppercase tracking-wider text-gray-600 block">
                                                Latest Filing
                                            </span>
                                            <h4 className="text-xs font-semibold text-gray-900 truncate mt-0.5">
                                                {complianceSummary.latest_report.title}
                                            </h4>
                                            <p className="text-xs text-gray-600 mt-0.5">
                                                Ref: <span className="font-mono">{complianceSummary.latest_report.reference}</span> • By {complianceSummary.latest_report.created_by}
                                            </p>
                                        </div>
                                        <span className="text-xs font-medium text-gray-500 shrink-0">
                                            {complianceSummary.latest_report.date}
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
                )}
            </div>
        </section>
    );
}
