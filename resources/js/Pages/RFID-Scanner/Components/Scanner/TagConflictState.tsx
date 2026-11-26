import { Button } from '@/Components/ui/button';
import { RFIDInventoryItem } from '../../types';
import { AlertTriangle, Radio, RotateCcw, Eye } from 'lucide-react';

interface TagConflictStateProps {
    tag: string;
    conflictItem: RFIDInventoryItem;
    onRescan: () => void;
    onViewExistingItem: (item: RFIDInventoryItem) => void;
}

export default function TagConflictState({
    tag,
    conflictItem,
    onRescan,
    onViewExistingItem,
}: TagConflictStateProps) {
    return (
        <div className="text-center py-7 px-6 bg-gradient-to-b from-amber-50/40 via-white to-slate-50/20 dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 rounded-xl border border-amber-200 dark:border-amber-900/60 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-amber-100/80 dark:bg-amber-950/50 text-amber-700 flex items-center justify-center mx-auto mb-3 border border-amber-200 dark:border-amber-800/60 dark:text-amber-300">
                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-300" />
            </div>

            <h3 className="text-lg font-semibold text-slate-900 font-sans dark:text-slate-100">
                RFID Tag Already In Use
            </h3>

            <div className="my-2.5 inline-flex items-center gap-2 tabular-nums text-base font-semibold text-red-950 bg-white px-4 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800/60 shadow-sm dark:text-red-300 dark:bg-slate-850">
                <Radio className="w-4 h-4 text-amber-600 dark:text-amber-300" />
                <span>{tag}</span>
            </div>

            <p className="leading-relaxed text-sm text-slate-500 mt-1 dark:text-slate-400">
                This transponder is already assigned to another item in the registry:
            </p>

            <div className="mt-3 bg-white p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-left max-w-sm mx-auto shadow-sm dark:bg-slate-850">
                <div className="flex items-center justify-between text-sm text-slate-500 tabular-nums mb-1 dark:text-slate-400">
                    <span>EXISTING ASSIGNMENT</span>
                    <span>SKU: {conflictItem.sku || 'N/A'}</span>
                </div>
                <p className="leading-relaxed font-semibold text-slate-900 text-sm truncate dark:text-slate-100">{conflictItem.name}</p>
                {conflictItem.supplier_name && (
                    <p className="leading-relaxed text-sm text-slate-500 mt-1 truncate dark:text-slate-400">
                        Supplier: {conflictItem.supplier_name}
                    </p>
                )}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 max-w-sm mx-auto">
                <Button variant="primary"
                    type="button"
                    onClick={onRescan}
                    className="flex-1 inline-flex items-center justify-center gap-1.5"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Scan Another Tag</span>
                </Button>
                <Button variant="secondary"
                    type="button"
                    onClick={() => onViewExistingItem(conflictItem)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5"
                >
                    <Eye className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>View Record</span>
                </Button>
            </div>
        </div>
    );
}

