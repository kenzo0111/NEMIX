import { RFIDInventoryItem } from '../../types';

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
        <div className="text-center py-8 px-6 bg-gray-50/50 rounded-xl border border-emerald-200">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M5 13l4 4L19 7"
                    />
                </svg>
            </div>

            <h3 className="text-sm font-semibold text-emerald-950 font-serif">
                RFID Assigned
            </h3>

            <p className="text-xs text-gray-600 mt-1">
                <span className="font-mono font-bold text-gray-900">{tag}</span> has been assigned to:
            </p>

            <div className="my-3 bg-white p-3 rounded-lg border border-gray-200 text-left max-w-sm mx-auto shadow-2xs">
                <p className="font-semibold text-gray-900 text-xs">{item.name}</p>
                <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                    Property No: {item.sku || 'N/A'}
                </p>
                {item.supplier_name && (
                    <p className="text-[11px] text-gray-400 mt-0.5">
                        Supplier: {item.supplier_name}
                    </p>
                )}
            </div>

            <div className="mt-5 flex items-center justify-center gap-3 max-w-sm mx-auto">
                {nextItem && (
                    <button
                        type="button"
                        onClick={onSelectNextItem}
                        className="flex-1 py-2 px-3 bg-red-950 hover:bg-red-900 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-2xs inline-flex items-center justify-center gap-1.5"
                    >
                        <span>Next Untagged Item</span>
                        <span>→</span>
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => onViewItem(item)}
                    className="flex-1 py-2 px-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                    View Item
                </button>
            </div>
        </div>
    );
}
