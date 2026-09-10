import { RFIDInventoryItem } from '../../types';

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
        <div className="text-center py-8 px-6 bg-amber-50/40 rounded-xl border border-amber-200">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                </svg>
            </div>

            <h3 className="text-sm font-semibold text-gray-900 font-serif">
                RFID Tag Already Assigned
            </h3>

            <div className="my-2 font-mono text-lg font-bold text-red-950 bg-white px-4 py-1.5 rounded-md border border-amber-200 inline-block">
                {tag}
            </div>

            <p className="text-xs text-gray-500 mt-1">
                This tag is currently assigned to another item:
            </p>

            <div className="mt-2 bg-white p-3 rounded-lg border border-gray-200 text-left max-w-sm mx-auto shadow-2xs">
                <p className="font-semibold text-gray-900 text-xs">{conflictItem.name}</p>
                <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                    Property No: {conflictItem.sku || 'N/A'}
                </p>
                {conflictItem.supplier_name && (
                    <p className="text-[11px] text-gray-400 mt-0.5">
                        Supplier: {conflictItem.supplier_name}
                    </p>
                )}
            </div>

            <div className="mt-5 flex items-center justify-center gap-3 max-w-sm mx-auto">
                <button
                    type="button"
                    onClick={onRescan}
                    className="flex-1 py-2 px-3 bg-red-950 hover:bg-red-900 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-2xs"
                >
                    Scan Another Tag
                </button>
                <button
                    type="button"
                    onClick={() => onViewExistingItem(conflictItem)}
                    className="flex-1 py-2 px-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                    View Existing Item
                </button>
            </div>
        </div>
    );
}
