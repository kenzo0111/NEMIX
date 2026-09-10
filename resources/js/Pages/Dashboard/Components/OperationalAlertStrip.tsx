import React from 'react';
import { Link } from '@inertiajs/react';
import { AlertTriangle, ArrowRight } from 'lucide-react';

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
    const alerts: string[] = [];

    if (criticalStockCount > 0) {
        alerts.push(`${criticalStockCount} critical stock ${criticalStockCount === 1 ? 'item' : 'items'}`);
    }
    if (unserviceableCount > 0) {
        alerts.push(`${unserviceableCount} unserviceable ${unserviceableCount === 1 ? 'item' : 'items'}`);
    }
    if (untaggedRfidCount > 0) {
        alerts.push(`${untaggedRfidCount} RFID ${untaggedRfidCount === 1 ? 'tag' : 'tags'} pending`);
    }
    if (pendingSupplierCount > 0) {
        alerts.push(`${pendingSupplierCount} supplier ${pendingSupplierCount === 1 ? 'renewal' : 'renewals'} pending`);
    }

    if (alerts.length === 0) {
        return null;
    }

    return (
        <div className="bg-amber-50/90 border border-amber-200/80 rounded-lg px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-xs">
            <div className="flex items-center gap-2.5">
                <div className="p-1 rounded-full bg-amber-200/60 text-amber-800 shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold leading-tight">
                    <span className="font-bold text-amber-950 mr-1.5 uppercase tracking-wide">
                        Attention Required:
                    </span>
                    <span className="text-amber-900">
                        {alerts.join(' • ')}
                    </span>
                </div>
            </div>

            <Link
                href={criticalStockCount > 0 ? route('inventory.index') : (untaggedRfidCount > 0 ? route('rfid-scanner.index') : route('inventory.index'))}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-red-950 hover:text-red-800 hover:underline transition-colors shrink-0"
            >
                <span>Review Issues</span>
                <ArrowRight className="w-3.5 h-3.5" />
            </Link>
        </div>
    );
}
