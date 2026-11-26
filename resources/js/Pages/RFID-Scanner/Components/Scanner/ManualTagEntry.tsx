import { Button } from '@/Components/ui/button';
import { useState } from 'react';
import { Keyboard, X, Radio, ArrowRight } from 'lucide-react';

interface ManualTagEntryProps {
    onSubmit: (tag: string) => void;
    onCancel: () => void;
}

export default function ManualTagEntry({ onSubmit, onCancel }: ManualTagEntryProps) {
    const [tagInput, setTagInput] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = tagInput.trim();
        if (trimmed) {
            onSubmit(trimmed);
        }
    };

    return (
        <div className="p-6 bg-gradient-to-b from-slate-50/70 via-white to-slate-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 max-w-md mx-auto w-full shadow-sm">
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-red-50 dark:bg-red-950/40 text-red-900 flex items-center justify-center dark:text-red-300">
                        <Keyboard className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-lg font-semibold normal-case tracking-normal text-slate-800 tabular-nums dark:text-slate-100">
                        Manual Tag Entry
                    </h3>
                </div>
                <Button variant="ghost" size="icon"
                    type="button"
                    onClick={onCancel}
                    aria-label="Cancel manual tag entry"
                    className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>

            <p className="text-sm text-slate-500 mb-4 leading-relaxed dark:text-slate-300">
                Type or paste the RFID hex/EPC identifier encoded on the physical label.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="manual-rfid-input" className="block text-sm tabular-nums font-medium text-slate-600 mb-1.5 dark:text-slate-300">
                        RFID Identifier Code
                    </label>
                    <div className="relative">
                        <input
                            id="manual-rfid-input"
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            placeholder="e.g. 04A7E82B9123 or E2801160..."
                            autoFocus
                            className="ui-field w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm tabular-nums placeholder-slate-400 focus:border-red-950 focus:ring-1 focus:ring-red-950 shadow-sm transition-colors dark:bg-slate-900"
                        />
                        <Radio className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none shrink-0 dark:text-slate-300" />
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                    <Button variant="secondary"
                        type="button"
                        onClick={onCancel}
                        className=""
                    >
                        Cancel
                    </Button>
                    <Button variant="primary"
                        type="submit"
                        disabled={!tagInput.trim()}
                        className="inline-flex items-center gap-1.5"
                    >
                        <span>Simulate Scan</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </form>
        </div>
    );
}

