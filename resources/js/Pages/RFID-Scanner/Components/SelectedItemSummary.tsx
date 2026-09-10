import { useState } from 'react';
import { RFIDInventoryItem } from '../types';
import {
    Box,
    Tag,
    Building2,
    Layers,
    Check,
    Copy,
    Radio,
    ShieldCheck,
    RotateCcw,
    Trash2,
    ArrowRight,
} from 'lucide-react';

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
    const [copiedSku, setCopiedSku] = useState(false);
    const [copiedTag, setCopiedTag] = useState(false);

    const handleCopy = (text: string, type: 'sku' | 'tag') => {
        navigator.clipboard.writeText(text);
        if (type === 'sku') {
            setCopiedSku(true);
            setTimeout(() => setCopiedSku(false), 1800);
        } else {
            setCopiedTag(true);
            setTimeout(() => setCopiedTag(false), 1800);
        }
    };

    if (!item) {
        return (
            <div className="p-7 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200/90 flex flex-col items-center justify-center min-h-[220px]">
                <div className="w-12 h-12 rounded-xl bg-white text-gray-400 flex items-center justify-center mb-3 shadow-2xs border border-gray-200/70">
                    <Box className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-xs font-semibold text-gray-800">
                    No Item Selected
                </p>
                <p className="text-xs text-gray-500 mt-1 max-w-xs leading-relaxed">
                    Search and pick an inventory item from the catalog above to view its details and link an RFID tag.
                </p>
                <div className="mt-4 flex items-center gap-2 text-[11px] text-gray-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                    <span>Awaiting item selection</span>
                </div>
            </div>
        );
    }

    const isTagged = Boolean(item.rfid_tag);

    return (
        <div className="bg-white rounded-xl p-5 border border-gray-200/90 shadow-2xs space-y-4">
            {/* Header: Title, SKU & Tag Status Badge */}
            <div>
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200/70">
                                Item #{item.id}
                            </span>
                            {item.status && (
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
                                    {item.status}
                                </span>
                            )}
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 font-serif leading-snug mt-1.5 truncate">
                            {item.name}
                        </h3>

                        {/* Property Number with One-Click Copy */}
                        <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-500 font-mono">
                            <span className="text-[11px] text-gray-400">Property No:</span>
                            <div className="inline-flex items-center gap-1 bg-gray-50 hover:bg-gray-100/80 px-2 py-0.5 rounded border border-gray-200 transition-colors">
                                <span className="font-semibold text-gray-900 text-xs">
                                    {item.sku || 'N/A'}
                                </span>
                                {item.sku && (
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(item.sku!, 'sku')}
                                        title={copiedSku ? 'Copied!' : 'Copy Property No'}
                                        className="text-gray-400 hover:text-gray-700 p-0.5 cursor-pointer ml-0.5"
                                    >
                                        {copiedSku ? (
                                            <Check className="w-3 h-3 text-emerald-600" />
                                        ) : (
                                            <Copy className="w-3 h-3" />
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Status indicator badge */}
                    <span
                        className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                            isTagged
                                ? 'bg-emerald-50/80 text-emerald-800 border-emerald-200/80'
                                : 'bg-amber-50/80 text-amber-800 border-amber-200/80'
                        }`}
                    >
                        <span
                            className={`w-1.5 h-1.5 rounded-full ${
                                isTagged ? 'bg-emerald-600 animate-pulse' : 'bg-amber-500'
                            }`}
                        />
                        <span>{isTagged ? 'Tagged' : 'Needs Tag'}</span>
                    </span>
                </div>
            </div>

            {/* Metadata micro-cards grid */}
            <div className="grid grid-cols-2 gap-2.5 text-xs pt-3 border-t border-gray-100">
                <div className="bg-gray-50/60 p-2.5 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                        <Building2 className="w-3 h-3" />
                        <span>Supplier</span>
                    </div>
                    <span className="font-medium text-gray-800 truncate block mt-1" title={item.supplier_name || 'N/A'}>
                        {item.supplier_name || 'Not assigned'}
                    </span>
                </div>

                <div className="bg-gray-50/60 p-2.5 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                        <Layers className="w-3 h-3" />
                        <span>Stock Level</span>
                    </div>
                    <span className="font-mono font-semibold text-gray-800 block mt-1">
                        {item.stock} <span className="font-sans font-normal text-gray-500 text-[11px]">{item.unit_of_issue || 'units'}</span>
                    </span>
                </div>
            </div>

            {/* Assigned RFID Tag Card or Untagged Prompt */}
            {isTagged ? (
                <div className="bg-emerald-50/40 rounded-xl p-3.5 border border-emerald-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-emerald-800 text-[11px] font-medium">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Linked RFID Tag</span>
                        </div>
                        <span className="text-[10px] text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full font-medium">
                            Active Transponder
                        </span>
                    </div>

                    <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-emerald-200/60 shadow-2xs">
                        <div className="flex items-center gap-2 font-mono text-sm font-bold text-gray-900 tracking-wider">
                            <Radio className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{item.rfid_tag}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleCopy(item.rfid_tag!, 'tag')}
                            title={copiedTag ? 'Copied!' : 'Copy RFID Tag'}
                            className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors cursor-pointer"
                        >
                            {copiedTag ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                                <Copy className="w-3.5 h-3.5" />
                            )}
                        </button>
                    </div>

                    {/* Tag management actions */}
                    <div className="flex items-center gap-2 pt-0.5">
                        <button
                            type="button"
                            onClick={onStartReplaceTag}
                            className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-lg border transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                                isReplacingTag
                                    ? 'bg-red-950 text-white border-red-950 shadow-2xs'
                                    : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 shadow-2xs hover:border-gray-300'
                            }`}
                        >
                            <RotateCcw className="w-3 h-3" />
                            <span>{isReplacingTag ? 'Ready for New Scan...' : 'Replace Tag'}</span>
                        </button>
                        <button
                            type="button"
                            onClick={onPromptUnassign}
                            className="py-1.5 px-3 text-xs font-medium text-red-800 hover:text-red-950 bg-white hover:bg-red-50/70 border border-red-200/80 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                            <Trash2 className="w-3 h-3 text-red-700" />
                            <span>Unassign</span>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-amber-50/50 rounded-xl p-3.5 border border-amber-200/60 flex items-start gap-2.5">
                    <Radio className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div className="text-xs">
                        <p className="font-semibold text-amber-950">Awaiting RFID Association</p>
                        <p className="text-amber-800/80 text-[11px] mt-0.5 leading-relaxed">
                            Scan a physical tag or enter its tag ID on the right to link it to this item.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

