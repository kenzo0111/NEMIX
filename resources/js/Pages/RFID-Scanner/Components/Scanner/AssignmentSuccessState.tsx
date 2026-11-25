import { Button } from '@/Components/ui/button';
import { RFIDInventoryItem } from '../../types';
import { CheckCircle2, ArrowRight, Eye, ShieldCheck, Radio } from 'lucide-react';

interface AssignmentSuccessStateProps {
    item: RFIDInventoryItem;
    tag: string;
    nextItem?: RFIDInventoryItem | null;
    onSelectNextItem: () => void;
    onViewItem: (item: RFIDInventoryItem) => void;
}

export default function AssignmentSuccessState({
    item,
    tag,
    nextItem,
    onSelectNextItem,
    onViewItem,
}: AssignmentSuccessStateProps) {
    return (
        <div className="text-center py-7 px-6 bg-gradient-to-b from-emerald-50/40 via-white to-gray-50/20 rounded-xl border border-emerald-200 shadow-sm">
            {/* Success Icon */}
            <div className="w-12 h-12 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center mx-auto mb-3 border border-emerald-200 shadow-sm dark:text-emerald-300">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-300" />
            </div>

            <h3 className="text-lg font-semibold text-emerald-950 font-sans dark:text-emerald-300">
                RFID Successfully Assigned
            </h3>

            <p className="leading-relaxed text-sm text-slate-600 mt-1 dark:text-slate-300">
                Tag <span className="tabular-nums font-semibold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 dark:text-slate-300">{tag}</span> is now linked.
            </p>

            {/* Linked Item Summary Box */}
            <div className="my-4 bg-white p-3.5 rounded-xl border border-slate-200 text-left max-w-sm mx-auto shadow-sm dark:bg-slate-900">
                <div className="flex items-center justify-between text-sm text-slate-500 tabular-nums mb-1 dark:text-slate-300">
                    <span>RECORD LINKED</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1 font-sans dark:text-emerald-300">
                        <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-300" />
                        Verified
                    </span>
                </div>
                <p className="leading-relaxed font-semibold text-slate-900 text-sm truncate dark:text-slate-300">{item.name}</p>
                <div className="flex items-center gap-2 text-sm text-slate-500 tabular-nums mt-1 dark:text-slate-300">
                    <span>Property No:</span>
                    <span className="text-slate-900 font-semibold dark:text-slate-300">{item.sku || 'N/A'}</span>
                </div>
            </div>

            {/* CTAs */}
            <div className="mt-5 flex items-center justify-center gap-3 max-w-sm mx-auto">
                {nextItem && (
                    <Button variant="primary"
                        type="button"
                        onClick={onSelectNextItem}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 active:translate-y-px"
                    >
                        <span>Next Item: {nextItem.name.slice(0, 14)}...</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                )}
                <Button variant="secondary"
                    type="button"
                    onClick={() => onViewItem(item)}
                    className="inline-flex items-center justify-center gap-1.5"
                >
                    <Eye className="w-3.5 h-3.5 text-slate-500 dark:text-slate-300" />
                    <span>View Item</span>
                </Button>
            </div>
        </div>
    );
}

