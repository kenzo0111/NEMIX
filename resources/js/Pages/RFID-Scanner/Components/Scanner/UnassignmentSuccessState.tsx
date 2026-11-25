import { Button } from '@/Components/ui/button';
import { RFIDInventoryItem } from '../../types';
import { Check, Radio, RotateCcw } from 'lucide-react';

interface UnassignmentSuccessStateProps {
    item: RFIDInventoryItem;
    onScanNewTag: () => void;
}

export default function UnassignmentSuccessState({
    item,
    onScanNewTag,
}: UnassignmentSuccessStateProps) {
    return (
        <div className="text-center py-7 px-6 bg-gradient-to-b from-slate-50/50 via-white to-slate-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 flex items-center justify-center mx-auto mb-3 border border-slate-200 dark:border-slate-700 dark:text-slate-300">
                <Check className="w-6 h-6 text-slate-700 dark:text-slate-300" />
            </div>

            <h3 className="text-lg font-semibold text-slate-900 font-sans dark:text-slate-100">
                RFID Tag Removed
            </h3>

            <p className="leading-relaxed text-sm text-slate-500 mt-1 dark:text-slate-300">
                The RFID tag has been dissociated from:
            </p>

            <div className="my-3.5 bg-white p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-left max-w-sm mx-auto shadow-sm dark:bg-slate-850">
                <span className="text-sm normal-case tabular-nums text-slate-500 font-semibold block mb-1 dark:text-slate-300">
                    Inventory Record
                </span>
                <p className="leading-relaxed font-semibold text-slate-900 text-sm truncate dark:text-slate-300">{item.name}</p>
                <p className="leading-relaxed text-sm text-slate-500 tabular-nums mt-1 dark:text-slate-300">
                    Property No: {item.sku || 'N/A'}
                </p>
            </div>

            <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-300">
                This item is now untagged and ready for a new tag association.
            </p>

            <div className="mt-5 max-w-xs mx-auto">
                <Button variant="primary"
                    type="button"
                    onClick={onScanNewTag}
                    className="w-full inline-flex items-center justify-center gap-1.5"
                >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Scan New RFID Tag</span>
                </Button>
            </div>
        </div>
    );
}

