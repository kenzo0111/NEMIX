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
        <section aria-label="System Operational Alerts" className={`w-full space-y-2 ${className}`}>
            {/* 1. Missing RFID Alert */}
            {untaggedRfidCount > 0 && (
                <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/80 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300 shrink-0">
                            <Radio className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/80 dark:bg-amber-900/80 text-amber-950 dark:text-amber-200 px-1.5 py-0.5 rounded">
                                    RFID Alert
                                </span>
                                <span className="text-xs font-semibold text-amber-950 dark:text-amber-200 truncate">
                                    {untaggedRfidCount} {untaggedRfidCount === 1 ? 'item requires' : 'items require'} RFID hardware tag assignment
                                </span>
                            </div>
                        </div>
                    </div>

                    <Link
                        href={route('rfid-scanner.index')}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-950 dark:text-amber-200 hover:text-amber-900 dark:hover:text-amber-100 bg-amber-100/90 dark:bg-amber-900/60 hover:bg-amber-200/90 dark:hover:bg-amber-800/80 border border-amber-300/80 dark:border-amber-700 px-2.5 py-1 rounded-lg transition-colors shrink-0 self-start sm:self-auto"
                    >
                        <span>Manage RFID Hardware</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            )}

            {/* 2. Pending Supplier Registrations/Renewals */}
            {pendingSupplierCount > 0 && (
                <div className="bg-slate-50/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1 rounded-md bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-300 shrink-0">
                            <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 px-1.5 py-0.5 rounded">
                                    Supplier Notice
                                </span>
                                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                                    {pendingSupplierCount} supplier {pendingSupplierCount === 1 ? 'application requires' : 'applications require'} accreditation review
                                </span>
                            </div>
                        </div>
                    </div>

                    <Link
                        href={route('suppliers.index')}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded-lg transition-colors shrink-0 self-start sm:self-auto"
                    >
                        <span>Review Suppliers</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            )}
        </section>
    );
}
