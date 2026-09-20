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
            <div className="p-7 text-center bg-gray-50/50 dark:bg-slate-950/50 rounded-xl border border-dashed border-gray-200/90 dark:border-slate-800 flex flex-col items-center justify-center min-h-[220px]">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 text-gray-400 dark:text-slate-500 flex items-center justify-center mb-3 shadow-2xs border border-gray-200/70 dark:border-slate-700">
                    <Box className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                </div>
                <p className="text-xs font-semibold text-gray-800 dark:text-slate-200">
                    No Item Selected
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
                    Search and pick an inventory item from the catalog above to view its details and link an RFID tag.
                </p>
                <div className="mt-4 flex items-center gap-2 text-[11px] text-gray-400 dark:text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-slate-600" />
                    <span>Awaiting item selection</span>
                </div>
            </div>
        );
    }

    const isTagged = Boolean(item.rfid_tag);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-200/90 dark:border-slate-800 shadow-2xs space-y-4">
            {/* Header: Title, SKU & Tag Status Badge */}
            <div>
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-200/70 dark:border-slate-700">
                                Item #{item.id}
                            </span>
                            {item.status && (
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                                    {item.status}
                                </span>
                            )}
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100 font-serif leading-snug mt-1.5 truncate">
                            {item.name}
                        </h3>

                        {/* Property Number with One-Click Copy */}
                        <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 font-mono">
                            <span className="text-[11px] text-gray-400 dark:text-slate-500">Property No:</span>
                            <div className="inline-flex items-center gap-1 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100/80 dark:hover:bg-slate-700/80 px-2 py-0.5 rounded border border-gray-200 dark:border-slate-700 transition-colors">
                                <span className="font-semibold text-gray-900 dark:text-slate-100 text-xs">
                                    {item.sku || 'N/A'}
                                </span>
                                {item.sku && (
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(item.sku!, 'sku')}
                                        title={copiedSku ? 'Copied!' : 'Copy Property No'}
                                        className="text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 p-0.5 cursor-pointer ml-0.5"
                                    >
                                        {copiedSku ? (
                                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
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
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60'
                                : 'bg-amber-50/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60'
                        }`}
                    >
                        <span
                            className={`w-1.5 h-1.5 rounded-full ${
                                isTagged ? 'bg-emerald-600 dark:bg-emerald-500 animate-pulse' : 'bg-amber-500'
                            }`}
                        />
                        <span>{isTagged ? 'Tagged' : 'Needs Tag'}</span>
                    </span>
                </div>
            </div>

            {/* Metadata micro-cards grid */}
            <div className="grid grid-cols-2 gap-2.5 text-xs pt-3 border-t border-gray-100 dark:border-slate-800">
                <div className="bg-gray-50/60 dark:bg-slate-950/60 p-2.5 rounded-lg border border-gray-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-gray-400 dark:text-slate-500 text-[11px]">
                        <Building2 className="w-3 h-3" />
                        <span>Supplier</span>
                    </div>
                    <span className="font-medium text-gray-800 dark:text-slate-200 truncate block mt-1" title={item.supplier_name || 'N/A'}>
                        {item.supplier_name || 'Not assigned'}
                    </span>
                </div>

                <div className="bg-gray-50/60 dark:bg-slate-950/60 p-2.5 rounded-lg border border-gray-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-gray-400 dark:text-slate-500 text-[11px]">
                        <Layers className="w-3 h-3" />
                        <span>Stock Level</span>
                    </div>
                    <span className="font-mono font-semibold text-gray-800 dark:text-slate-200 block mt-1">
                        {item.stock} <span className="font-sans font-normal text-gray-500 dark:text-slate-400 text-[11px]">{item.unit_of_issue || 'units'}</span>
                    </span>
                </div>
            </div>

            {/* Assigned RFID Tag Card or Untagged Prompt */}
            {isTagged ? (
                <div className="bg-emerald-50/40 dark:bg-emerald-950/20 rounded-xl p-3.5 border border-emerald-200/80 dark:border-emerald-800/60 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 text-[11px] font-medium">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Linked RFID Tag</span>
                        </div>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full font-medium">
                            Active Transponder
                        </span>
                    </div>

                    <div className="flex items-center justify-between bg-white dark:bg-slate-950 px-3 py-2 rounded-lg border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs">
                        <div className="flex items-center gap-2 font-mono text-sm font-bold text-gray-900 dark:text-slate-100 tracking-wider">
                            <Radio className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>{item.rfid_tag}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleCopy(item.rfid_tag!, 'tag')}
                            title={copiedTag ? 'Copied!' : 'Copy RFID Tag'}
                            className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 rounded transition-colors cursor-pointer"
                        >
                            {copiedTag ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
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
                                    : 'bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-750 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 shadow-2xs hover:border-gray-300 dark:hover:border-slate-600'
                            }`}
                        >
                            <RotateCcw className="w-3 h-3" />
                            <span>{isReplacingTag ? 'Ready for New Scan...' : 'Replace Tag'}</span>
                        </button>
                        <button
                            type="button"
                            onClick={onPromptUnassign}
                            className="py-1.5 px-3 text-xs font-medium text-red-800 dark:text-red-400 hover:text-red-950 dark:hover:text-red-300 bg-white dark:bg-slate-800 hover:bg-red-50/70 dark:hover:bg-red-950/40 border border-red-200/80 dark:border-red-900/50 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                            <Trash2 className="w-3 h-3 text-red-700 dark:text-red-400" />
                            <span>Unassign</span>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-xl p-3.5 border border-amber-200/60 dark:border-amber-900/40 flex items-start gap-2.5">
                    <Radio className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs">
                        <p className="font-semibold text-amber-950 dark:text-amber-200">Awaiting RFID Association</p>
                        <p className="text-amber-800/80 dark:text-amber-300/80 text-[11px] mt-0.5 leading-relaxed">
                            Scan a physical tag or enter its tag ID on the right to link it to this item.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

