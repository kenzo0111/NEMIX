import { RFIDInventoryItem } from '../types';

interface SelectedItemSummaryProps {
    item: RFIDInventoryItem | null;
    isReplacingTag?: boolean;
    onStartReplaceTag: () => void;
    onPromptUnassign: () => void;
}

export default function SelectedItemSummary({
    item,
    isReplacingTag = false,
    onStartReplaceTag,
    onPromptUnassign,
}: SelectedItemSummaryProps) {
    if (!item) {
        return (
            <div className="p-8 text-center bg-gray-50/70 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center min-h-[190px]">
                <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mb-2.5">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.75"
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                    </svg>
                </div>
                <p className="text-xs font-semibold text-gray-700">
                    No Item Selected
                </p>
                <p className="text-xs text-gray-500 mt-1 max-w-xs leading-relaxed">
                    Search and pick an inventory item from the box above to view details and assign tags.
                </p>
            </div>
        );
    }

    const isTagged = Boolean(item.rfid_tag);

    return (
        <div className="bg-gray-50/60 rounded-xl p-5 border border-gray-200 space-y-4">
            {/* Header: Title & Property Number */}
            <div>
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 font-serif leading-snug">
                            {item.name}
                        </h3>
                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 font-mono">
                            <span>Property No:</span>
                            <span className="font-semibold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                                {item.sku || 'N/A'}
                            </span>
                        </div>
                    </div>

                    {/* Status indicator: simple dot */}
                    <span
                        className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            isTagged
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}
                    >
                        <span
                            className={`w-2 h-2 rounded-full ${
                                isTagged ? 'bg-emerald-600' : 'bg-gray-400'
                            }`}
                        />
                        <span>{isTagged ? 'Tagged' : 'Untagged'}</span>
                    </span>
                </div>
            </div>

            {/* Item details metadata */}
            <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-gray-200/80">
                <div>
                    <span className="text-gray-400 block">Supplier</span>
                    <span className="font-medium text-gray-800 truncate block mt-0.5">
                        {item.supplier_name || 'N/A'}
                    </span>
                </div>

                <div>
                    <span className="text-gray-400 block">Current Stock</span>
                    <span className="font-mono font-medium text-gray-800 block mt-0.5">
                        {item.stock} {item.unit_of_issue || 'units'}
                    </span>
                </div>

                {isTagged && (
                    <div className="col-span-2 pt-2 border-t border-gray-100">
                        <span className="text-gray-400 block text-[11px]">Assigned RFID Tag</span>
                        <div className="font-mono text-sm font-bold text-gray-900 mt-0.5 flex items-center gap-2">
                            <span className="bg-white px-2.5 py-1 rounded border border-gray-200 tracking-wider">
                                {item.rfid_tag}
                            </span>
                            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-sans font-medium">
                                Active
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Tag management actions if item is tagged */}
            {isTagged && (
                <div className="pt-3 border-t border-gray-200/80 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onStartReplaceTag}
                        className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                            isReplacingTag
                                ? 'bg-red-950 text-white border-red-950 shadow-2xs'
                                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
                        }`}
                    >
                        {isReplacingTag ? 'Ready for New Scan...' : 'Replace RFID'}
                    </button>
                    <button
                        type="button"
                        onClick={onPromptUnassign}
                        className="py-1.5 px-3 text-xs font-medium text-red-800 hover:text-red-950 bg-white hover:bg-red-50 border border-red-200 rounded-md transition-colors cursor-pointer"
                    >
                        Unassign RFID
                    </button>
                </div>
            )}
        </div>
    );
}
