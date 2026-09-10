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
        <div className="text-center py-7 px-6 bg-gradient-to-b from-emerald-50/40 via-white to-gray-50/20 rounded-xl border border-emerald-200 shadow-2xs">
            {/* Success Icon */}
            <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center mx-auto mb-3 border border-emerald-200 shadow-2xs">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>

            <h3 className="text-base font-semibold text-emerald-950 font-serif">
                RFID Successfully Assigned
            </h3>

            <p className="text-xs text-gray-600 mt-1">
                Tag <span className="font-mono font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">{tag}</span> is now linked.
            </p>

            {/* Linked Item Summary Box */}
            <div className="my-4 bg-white p-3.5 rounded-xl border border-gray-200 text-left max-w-sm mx-auto shadow-2xs">
                <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono mb-1">
                    <span>RECORD LINKED</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1 font-sans">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Verified
                    </span>
                </div>
                <p className="font-semibold text-gray-900 text-xs truncate">{item.name}</p>
                <div className="flex items-center gap-2 text-[11px] text-gray-500 font-mono mt-1">
                    <span>Property No:</span>
                    <span className="text-gray-900 font-semibold">{item.sku || 'N/A'}</span>
                </div>
            </div>

            {/* CTAs */}
            <div className="mt-5 flex items-center justify-center gap-3 max-w-sm mx-auto">
                {nextItem && (
                    <button
                        type="button"
                        onClick={onSelectNextItem}
                        className="flex-1 py-2.5 px-3.5 bg-red-950 hover:bg-red-900 text-white text-xs font-medium rounded-lg transition-all cursor-pointer shadow-2xs inline-flex items-center justify-center gap-1.5 active:translate-y-px"
                    >
                        <span>Next Item: {nextItem.name.slice(0, 14)}...</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => onViewItem(item)}
                    className="py-2.5 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-2xs"
                >
                    <Eye className="w-3.5 h-3.5 text-gray-500" />
                    <span>View Item</span>
                </button>
            </div>
        </div>
    );
}

