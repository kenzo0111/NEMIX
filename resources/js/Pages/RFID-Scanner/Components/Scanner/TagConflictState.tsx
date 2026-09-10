import { RFIDInventoryItem } from '../../types';
import { AlertTriangle, Radio, RotateCcw, Eye } from 'lucide-react';

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
        <div className="text-center py-7 px-6 bg-gradient-to-b from-amber-50/40 via-white to-gray-50/20 rounded-xl border border-amber-200 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-amber-100/80 text-amber-700 flex items-center justify-center mx-auto mb-3 border border-amber-200">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>

            <h3 className="text-base font-semibold text-gray-900 font-serif">
                RFID Tag Already In Use
            </h3>

            <div className="my-2.5 inline-flex items-center gap-2 font-mono text-base font-bold text-red-950 bg-white px-4 py-1.5 rounded-lg border border-amber-300 shadow-2xs">
                <Radio className="w-4 h-4 text-amber-600" />
                <span>{tag}</span>
            </div>

            <p className="text-xs text-gray-500 mt-1">
                This transponder is already assigned to another item in the registry:
            </p>

            <div className="mt-3 bg-white p-3.5 rounded-xl border border-gray-200 text-left max-w-sm mx-auto shadow-2xs">
                <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono mb-1">
                    <span>EXISTING ASSIGNMENT</span>
                    <span>SKU: {conflictItem.sku || 'N/A'}</span>
                </div>
                <p className="font-semibold text-gray-900 text-xs truncate">{conflictItem.name}</p>
                {conflictItem.supplier_name && (
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                        Supplier: {conflictItem.supplier_name}
                    </p>
                )}
            </div>

            <div className="mt-5 flex items-center justify-center gap-3 max-w-sm mx-auto">
                <button
                    type="button"
                    onClick={onRescan}
                    className="flex-1 py-2.5 px-3.5 bg-red-950 hover:bg-red-900 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-2xs inline-flex items-center justify-center gap-1.5"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Scan Another Tag</span>
                </button>
                <button
                    type="button"
                    onClick={() => onViewExistingItem(conflictItem)}
                    className="flex-1 py-2.5 px-3.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-2xs"
                >
                    <Eye className="w-3.5 h-3.5 text-gray-500" />
                    <span>View Record</span>
                </button>
            </div>
        </div>
    );
}

