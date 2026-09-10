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
        <div className="text-center py-7 px-6 bg-gradient-to-b from-gray-50/50 via-white to-gray-50/20 rounded-xl border border-gray-200 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-700 flex items-center justify-center mx-auto mb-3 border border-gray-200">
                <Check className="w-6 h-6 text-gray-700" />
            </div>

            <h3 className="text-base font-semibold text-gray-900 font-serif">
                RFID Tag Removed
            </h3>

            <p className="text-xs text-gray-500 mt-1">
                The RFID tag has been dissociated from:
            </p>

            <div className="my-3.5 bg-white p-3.5 rounded-xl border border-gray-200 text-left max-w-sm mx-auto shadow-2xs">
                <span className="text-[10px] uppercase font-mono text-gray-400 font-semibold block mb-1">
                    Inventory Record
                </span>
                <p className="font-semibold text-gray-900 text-xs truncate">{item.name}</p>
                <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                    Property No: {item.sku || 'N/A'}
                </p>
            </div>

            <p className="text-xs text-gray-500">
                This item is now untagged and ready for a new tag association.
            </p>

            <div className="mt-5 max-w-xs mx-auto">
                <button
                    type="button"
                    onClick={onScanNewTag}
                    className="w-full py-2.5 px-4 bg-red-950 hover:bg-red-900 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-2xs inline-flex items-center justify-center gap-1.5"
                >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Scan New RFID Tag</span>
                </button>
            </div>
        </div>
    );
}

