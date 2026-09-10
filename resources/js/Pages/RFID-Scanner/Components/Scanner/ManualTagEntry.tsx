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
        <div className="p-6 bg-gradient-to-b from-gray-50/70 via-white to-gray-50/30 rounded-xl border border-gray-200/90 max-w-md mx-auto w-full shadow-2xs">
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-red-50 text-red-900 flex items-center justify-center">
                        <Keyboard className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 font-mono">
                        Manual Tag Entry
                    </h3>
                </div>
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-md transition-colors cursor-pointer"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Type or paste the RFID hex/EPC identifier encoded on the physical label.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="manual-rfid-input" className="block text-[11px] font-mono font-medium text-gray-600 mb-1.5">
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
                            className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-mono placeholder-gray-400 focus:border-red-950 focus:ring-1 focus:ring-red-950 shadow-2xs transition-colors"
                        />
                        <Radio className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-2xs"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!tagInput.trim()}
                        className="px-4 py-2 bg-red-950 hover:bg-red-900 text-white text-xs font-medium rounded-lg transition-all disabled:opacity-50 cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                    >
                        <span>Simulate Scan</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </form>
        </div>
    );
}

