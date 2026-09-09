import { Item } from './ItemSelector';

interface SelectedItemCardProps {
    item: Item | null;
    isReplacingTag?: boolean;
    processing: boolean;
    onStartReplaceTag: () => void;
    onPromptUnassign: () => void;
    onSelectNextUntagged?: () => void;
    hasUntaggedItems?: boolean;
}

export default function SelectedItemCard({
    item,
    isReplacingTag = false,
    processing,
    onStartReplaceTag,
    onPromptUnassign,
    onSelectNextUntagged,
    hasUntaggedItems = false,
}: SelectedItemCardProps) {
    // STATE A: Initial / No item selected
    if (!item) {
        return (
            <div className="p-8 text-center bg-gray-50/80 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center min-h-[180px]">
                <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mb-2.5">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                </div>
                <p className="text-xs font-bold text-gray-700 font-serif">
                    No Item Selected
                </p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs font-medium">
                    Select an inventory item from the search box above to begin tagging.
                </p>
            </div>
        );
    }

    const isTagged = Boolean(item.rfid_tag);

    return (
        <div className="bg-gray-50/70 rounded-xl p-5 border border-gray-200 space-y-4">
            {/* Header: Title & Property Number */}
            <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono block mb-1">
                    {isTagged ? 'Item Already Tagged' : 'Item To Tag'}
                </span>
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h3 className="text-base font-bold text-gray-900 font-serif leading-snug">
                            {item.name}
                        </h3>
                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-600 font-mono">
                            <span className="text-gray-400">Property No:</span>
                            <span className="font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200 text-[11px]">
                                {item.sku || 'N/A'}
                            </span>
                        </div>
                    </div>

                    {/* RFID Status Indicator */}
                    <span
                        className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold font-mono ${
                            isTagged
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                    >
                        <span
                            className={`w-2 h-2 rounded-full ${isTagged ? 'bg-emerald-600' : 'bg-amber-500'}`}
                        />
                        {isTagged ? 'Tagged' : 'Not Tagged'}
                    </span>
                </div>
            </div>

            {/* Supporting details - minimal, un-nested row */}
            <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-4 gap-y-1 pt-3 border-t border-gray-200/80">
                {item.supplier_name && (
                    <div className="flex items-center gap-1">
                        <span className="text-gray-400">Supplier:</span>
                        <span className="font-medium text-gray-700">{item.supplier_name}</span>
                    </div>
                )}
                {item.stock !== undefined && (
                    <div className="flex items-center gap-1">
                        <span className="text-gray-400">Stock:</span>
                        <span className="font-mono font-medium text-gray-700">
                            {item.stock} {item.unit_of_issue || 'units'}
                        </span>
                    </div>
                )}
            </div>

            {/* STATE J: Item Already Tagged details & actions */}
            {isTagged && (
                <div className="pt-3 border-t border-gray-200/80 space-y-3">
                    <div className="flex items-center justify-between bg-white border border-emerald-200/90 rounded-lg p-3 shadow-2xs">
                        <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 font-mono block">
                                Assigned RFID Tag ID
                            </span>
                            <span className="font-mono text-sm font-bold text-red-950">
                                {item.rfid_tag}
                            </span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-100">
                            Active
                        </span>
                    </div>

                    {/* Tag Management Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onStartReplaceTag}
                            disabled={processing}
                            className={`flex-1 py-1.5 px-3 text-xs font-mono font-bold rounded border transition-colors cursor-pointer ${
                                isReplacingTag
                                    ? 'bg-red-950 text-white border-red-950 shadow-2xs'
                                    : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
                            }`}
                        >
                            {isReplacingTag ? '● Scanning Replacement Tag...' : 'Replace RFID'}
                        </button>
                        <button
                            type="button"
                            onClick={onPromptUnassign}
                            disabled={processing}
                            className="py-1.5 px-3 text-xs font-mono font-bold text-red-700 hover:text-red-900 bg-white hover:bg-red-50 border border-red-200 rounded transition-colors cursor-pointer"
                        >
                            Unassign RFID
                        </button>
                    </div>

                    {/* Quick navigation to next untagged item */}
                    {hasUntaggedItems && onSelectNextUntagged && (
                        <button
                            type="button"
                            onClick={onSelectNextUntagged}
                            className="w-full py-1.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 rounded-md text-xs font-mono font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <span>Select Next Untagged Item</span>
                            <span>→</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
