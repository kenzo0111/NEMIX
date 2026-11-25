import { Button } from '@/Components/ui/button';
import { useState } from 'react';
import { RFIDInventoryItem } from '../../types';
import useAuthorization from '@/Hooks/useAuthorization';
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
    const { can } = useAuthorization();

    const handleCopy = () => {
        navigator.clipboard.writeText(tag);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };

    return (
        <div className="text-center py-6 px-4 bg-gradient-to-b from-emerald-50/30 via-white to-gray-50/20 rounded-xl border border-emerald-200/90 shadow-sm">
            {/* Status Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 mb-3 shadow-sm dark:text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>RFID Signal Captured</span>
            </div>

            {/* Prominent Scanned Tag Card */}
            <div className="my-2 max-w-sm mx-auto">
                <div className="bg-white px-5 py-3 rounded-xl border-2 border-emerald-500/80 shadow-sm flex items-center justify-between gap-3 dark:bg-slate-900">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center dark:text-emerald-300">
                            <Radio className="w-4 h-4" />
                        </div>
                        <span className="tabular-nums text-xl font-semibold text-slate-900 tracking-normal dark:text-slate-300">
                            {tag}
                        </span>
                    </div>

                    <Button variant="secondary"
                        type="button"
                        onClick={handleCopy}
                        title={copied ? 'Copied!' : 'Copy Tag ID'}
                        className=""
                    >
                        {copied ? (
                            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
                        ) : (
                            <Copy className="w-4 h-4" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Association Connection Arrow */}
            <div className="my-2 flex items-center justify-center text-emerald-600 dark:text-emerald-300">
                <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 bg-emerald-50/80 px-2.5 py-0.5 rounded-full border border-emerald-100 dark:text-emerald-300">
                    <Link2 className="w-3 h-3" />
                    <span>Associating with target item</span>
                </div>
            </div>

            {/* Target Item Preview Box */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-left max-w-sm mx-auto shadow-sm dark:bg-slate-900">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-sm normal-case tabular-nums text-slate-500 font-semibold dark:text-slate-300">
                        Target Inventory Record
                    </span>
                    <span className="text-sm tabular-nums text-slate-500 dark:text-slate-300">
                        SKU: {item.sku || 'N/A'}
                    </span>
                </div>
                <p className="leading-relaxed font-semibold text-slate-900 text-sm truncate dark:text-slate-300">{item.name}</p>
                {item.supplier_name && (
                    <p className="leading-relaxed text-sm text-slate-500 mt-1 truncate dark:text-slate-300">
                        Supplier: {item.supplier_name}
                    </p>
                )}
            </div>

            {/* Actions Toolbar */}
            <div className="mt-6 flex items-center justify-center gap-3 max-w-sm mx-auto">
                <Button variant="secondary"
                    type="button"
                    onClick={onRescan}
                    disabled={isAssigning}
                    className="flex-1 inline-flex items-center justify-center gap-1.5"
                >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-300" />
                    <span>Rescan</span>
                </Button>
                {can('rfid.assign') && <Button variant="primary"
                    type="button"
                    onClick={onAssign}
                    disabled={isAssigning}
                    className="flex-1 active:translate-y-px flex items-center justify-center gap-2"
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
                </Button>}
            </div>
        </div>
    );
}

