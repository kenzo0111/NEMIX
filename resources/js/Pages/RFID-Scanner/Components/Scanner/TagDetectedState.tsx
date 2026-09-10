import { RFIDInventoryItem } from '../../types';

interface TagDetectedStateProps {
    item: RFIDInventoryItem;
    tag: string;
    isAssigning: boolean;
    onAssign: () => void;
    onRescan: () => void;
}

export default function TagDetectedState({
    item,
    tag,
    isAssigning,
    onAssign,
    onRescan,
}: TagDetectedStateProps) {
    return (
        <div className="text-center py-6 px-4 bg-gray-50/40 rounded-xl border border-gray-200">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>RFID Detected</span>
            </span>

            <div className="my-2">
                <div className="font-mono text-2xl font-bold text-gray-900 bg-white px-5 py-2.5 rounded-lg border border-gray-300 shadow-2xs inline-block tracking-wider">
                    {tag}
                </div>
            </div>

            <p className="text-xs text-gray-500 mt-2">
                Assign this RFID tag to:
            </p>

            <div className="mt-2 bg-white p-3 rounded-lg border border-gray-200 text-left max-w-sm mx-auto shadow-2xs">
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

            <div className="mt-6 flex items-center justify-center gap-3 max-w-sm mx-auto">
                <button
                    type="button"
                    onClick={onRescan}
                    disabled={isAssigning}
                    className="flex-1 py-2.5 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                    Rescan
                </button>
                <button
                    type="button"
                    onClick={onAssign}
                    disabled={isAssigning}
                    className="flex-1 py-2.5 px-4 bg-red-950 hover:bg-red-900 text-white rounded-lg font-medium text-xs transition-all shadow-2xs active:translate-y-px cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                >
                    {isAssigning ? (
                        <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Assigning...</span>
                        </>
                    ) : (
                        <span>Assign RFID</span>
                    )}
                </button>
            </div>
        </div>
    );
}
