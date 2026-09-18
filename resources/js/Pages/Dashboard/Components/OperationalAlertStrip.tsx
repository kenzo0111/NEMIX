import React from 'react';
import { Link } from '@inertiajs/react';
import { Radio, ArrowRight, FileText, AlertTriangle } from 'lucide-react';

interface OperationalAlertStripProps {
    untaggedRfidCount?: number;
    pendingSupplierCount?: number;
    criticalStockCount?: number;
    className?: string;
}

export default function OperationalAlertStrip({
    untaggedRfidCount = 0,
    pendingSupplierCount = 0,
    criticalStockCount = 0,
    className = '',
}: OperationalAlertStripProps) {
    const hasAlerts = untaggedRfidCount > 0 || pendingSupplierCount > 0;

    if (!hasAlerts) {
        return null;
    }

    return (
        <section aria-label="System Operational Alerts" className={`w-full space-y-2.5 ${className}`}>
            {/* 1. Missing RFID Alert */}
            {untaggedRfidCount > 0 && (
                <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-3 sm:px-4 sm:py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 rounded-lg bg-amber-100 text-amber-900 shrink-0">
                            <Radio className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/70 text-amber-950 px-1.5 py-0.5 rounded">
                                    RFID Alert
                                </span>
                                <span className="text-xs font-semibold text-amber-950">
                                    {untaggedRfidCount} {untaggedRfidCount === 1 ? 'item requires' : 'items require'} RFID hardware tag assignment
                                </span>
                                <span className="hidden md:inline text-xs text-amber-800/80">
                                    — Physical asset tracking remains unlinked until tagged.
                                </span>
                            </div>
                        </div>
                    </div>

                    <Link
                        href={route('rfid-scanner.index')}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-950 hover:text-amber-900 bg-amber-100/80 hover:bg-amber-200/80 border border-amber-300/70 px-3 py-1.5 rounded-lg transition-colors shrink-0 self-start sm:self-auto"
                    >
                        <span>Manage RFID Hardware</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            )}

            {/* 2. Pending Supplier Registrations/Renewals */}
            {pendingSupplierCount > 0 && (
                <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-3 sm:px-4 sm:py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 rounded-lg bg-slate-200/80 text-slate-800 shrink-0">
                            <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded">
                                    Supplier Notice
                                </span>
                                <span className="text-xs font-semibold text-slate-900">
                                    {pendingSupplierCount} supplier {pendingSupplierCount === 1 ? 'application requires' : 'applications require'} accreditation review
                                </span>
                            </div>
                        </div>
                    </div>

                    <Link
                        href={route('suppliers.index')}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 hover:text-slate-950 bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg transition-colors shrink-0 self-start sm:self-auto"
                    >
                        <span>Review Suppliers</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            )}
        </section>
    );
}
