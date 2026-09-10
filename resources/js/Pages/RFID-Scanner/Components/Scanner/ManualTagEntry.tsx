import { useState } from 'react';

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
        <div className="p-6 bg-gray-50/70 rounded-xl border border-gray-200 max-w-md mx-auto w-full">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 font-mono">
                    Manual RFID Entry
                </h3>
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-xs text-gray-400 hover:text-gray-600 font-medium"
                >
                    Cancel
                </button>
            </div>

            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Type the RFID identifier found on the physical tag label or card.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="manual-rfid-input" className="block text-[11px] font-mono text-gray-600 mb-1">
                        RFID Tag Identifier
                    </label>
                    <input
                        id="manual-rfid-input"
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="e.g. 04A7E82B9123"
                        autoFocus
                        className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-mono placeholder-gray-400 focus:border-red-950 focus:ring-1 focus:ring-red-950 shadow-2xs"
                    />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!tagInput.trim()}
                        className="px-4 py-2 bg-red-950 hover:bg-red-900 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                    >
                        Detect Tag
                    </button>
                </div>
            </form>
        </div>
    );
}
