import React from 'react';
import { Link } from '@inertiajs/react';
import { AlertTriangle, ArrowRight, Radio, ShieldAlert, FileText } from 'lucide-react';

interface OperationalAlertStripProps {
    criticalStockCount?: number;
    unserviceableCount?: number;
    untaggedRfidCount?: number;
    pendingSupplierCount?: number;
}

export default function OperationalAlertStrip({
    criticalStockCount = 0,
    unserviceableCount = 0,
    untaggedRfidCount = 0,
    pendingSupplierCount = 0,
}: OperationalAlertStripProps) {
    return (
        <>
            {criticalStockCount > 0 && (
                <div className="bg-red-50/90 border border-red-200/80 rounded-xl p-5 flex flex-col justify-between shadow-sm col-span-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-red-200/60 text-red-800 shrink-0">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-red-950 uppercase tracking-wide">
                                Critical Stock
                            </div>
                            <div className="text-xs text-red-900 mt-0.5">
                                {criticalStockCount} {criticalStockCount === 1 ? 'item' : 'items'} require attention
                            </div>
                        </div>
                    </div>
                    <div className="text-right mt-3 pt-3 border-t border-red-200/50">
                        <Link
                            href={route('inventory.index')}
                            className="inline-flex items-center gap-1 text-xs font-bold text-red-950 hover:text-red-800 transition-colors"
                        >
                            <span>Review Stock</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            )}

            {unserviceableCount > 0 && (
                <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl p-5 flex flex-col justify-between shadow-sm col-span-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-200/60 text-amber-800 shrink-0">
                            <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-amber-950 uppercase tracking-wide">
                                Unserviceable
                            </div>
                            <div className="text-xs text-amber-900 mt-0.5">
                                {unserviceableCount} {unserviceableCount === 1 ? 'item' : 'items'} awaiting review
                            </div>
                        </div>
                    </div>
                    <div className="text-right mt-3 pt-3 border-t border-amber-200/50">
                        <Link
                            href={route('inventory.index')}
                            className="inline-flex items-center gap-1 text-xs font-bold text-amber-950 hover:text-amber-800 transition-colors"
                        >
                            <span>Manage Assets</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            )}

            {untaggedRfidCount > 0 && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 flex flex-col justify-between shadow-sm col-span-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-200/60 text-slate-800 shrink-0">
                            <Radio className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                                Missing RFIDs
                            </div>
                            <div className="text-xs text-slate-600 mt-0.5">
                                {untaggedRfidCount} {untaggedRfidCount === 1 ? 'tag' : 'tags'} pending assignment
                            </div>
                        </div>
                    </div>
                    <div className="text-right mt-3 pt-3 border-t border-slate-200/50">
                        <Link
                            href={route('rfid-scanner.index')}
                            className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 hover:text-red-900 transition-colors"
                        >
                            <span>Manage RFID</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            )}

            {pendingSupplierCount > 0 && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 flex flex-col justify-between shadow-sm col-span-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-200/60 text-slate-800 shrink-0">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                                Pending Renewals
                            </div>
                            <div className="text-xs text-slate-600 mt-0.5">
                                {pendingSupplierCount} supplier {pendingSupplierCount === 1 ? 'renewal' : 'renewals'} pending
                            </div>
                        </div>
                    </div>
                    <div className="text-right mt-3 pt-3 border-t border-slate-200/50">
                        <Link
                            href={route('suppliers.index')}
                            className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 hover:text-red-900 transition-colors"
                        >
                            <span>Review Suppliers</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            )}
        </>
    );
}
