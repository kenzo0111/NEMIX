import { useState } from 'react';
import { RFIDInventoryItem } from '../../types';
import { Radio, ArrowDown, Check, Copy, RotateCcw, Link2, Sparkles, Loader2 } from 'lucide-react';

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
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(tag);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };

    return (
        <div className="text-center py-6 px-4 bg-gradient-to-b from-emerald-50/30 via-white to-gray-50/20 rounded-xl border border-emerald-200/90 shadow-2xs">
            {/* Status Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 mb-3 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>RFID Signal Captured</span>
            </div>

            {/* Prominent Scanned Tag Card */}
            <div className="my-2 max-w-sm mx-auto">
                <div className="bg-white px-5 py-3 rounded-xl border-2 border-emerald-500/80 shadow-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                            <Radio className="w-4 h-4" />
                        </div>
                        <span className="font-mono text-xl font-bold text-gray-900 tracking-wider">
                            {tag}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleCopy}
                        title={copied ? 'Copied!' : 'Copy Tag ID'}
                        className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                        {copied ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                            <Copy className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </div>

            {/* Association Connection Arrow */}
            <div className="my-2 flex items-center justify-center text-emerald-600">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50/80 px-2.5 py-0.5 rounded-full border border-emerald-100">
                    <Link2 className="w-3 h-3" />
                    <span>Associating with target item</span>
                </div>
            </div>

            {/* Target Item Preview Box */}
            <div className="bg-white p-3.5 rounded-xl border border-gray-200 text-left max-w-sm mx-auto shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-mono text-gray-400 font-semibold">
                        Target Inventory Record
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">
                        SKU: {item.sku || 'N/A'}
                    </span>
                </div>
                <p className="font-semibold text-gray-900 text-xs truncate">{item.name}</p>
                {item.supplier_name && (
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                        Supplier: {item.supplier_name}
                    </p>
                )}
            </div>

            {/* Actions Toolbar */}
            <div className="mt-6 flex items-center justify-center gap-3 max-w-sm mx-auto">
                <button
                    type="button"
                    onClick={onRescan}
                    disabled={isAssigning}
                    className="flex-1 py-2.5 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-1.5 shadow-2xs"
                >
                    <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                    <span>Rescan</span>
                </button>
                <button
                    type="button"
                    onClick={onAssign}
                    disabled={isAssigning}
                    className="flex-1 py-2.5 px-4 bg-red-950 hover:bg-red-900 text-white rounded-lg font-medium text-xs transition-all shadow-2xs active:translate-y-px cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                >
                    {isAssigning ? (
                        <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Linking RFID...</span>
                        </>
                    ) : (
                        <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Assign RFID Tag</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

