import { RFIDInventoryItem } from '../../types';

interface UnassignmentSuccessStateProps {
    item: RFIDInventoryItem;
    onScanNewTag: () => void;
}

export default function UnassignmentSuccessState({
    item,
    onScanNewTag,
}: UnassignmentSuccessStateProps) {
    return (
        <div className="text-center py-8 px-6 bg-gray-50/50 rounded-xl border border-gray-200">
            <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center mx-auto mb-2.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                    />
                </svg>
            </div>

            <h3 className="text-sm font-semibold text-gray-900 font-serif">
                RFID Unassigned
            </h3>

            <p className="text-xs text-gray-500 mt-1">
                The RFID tag has been removed from:
            </p>

            <div className="my-3 bg-white p-3 rounded-lg border border-gray-200 text-left max-w-sm mx-auto shadow-2xs">
                <p className="font-semibold text-gray-900 text-xs">{item.name}</p>
                <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                    Property No: {item.sku || 'N/A'}
                </p>
            </div>

            <p className="text-xs text-gray-500">
                This item is now untagged and ready for a new tag.
            </p>

            <div className="mt-5 max-w-xs mx-auto">
                <button
                    type="button"
                    onClick={onScanNewTag}
                    className="w-full py-2 px-4 bg-red-950 hover:bg-red-900 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-2xs"
                >
                    Scan New RFID Tag
                </button>
            </div>
        </div>
    );
}
