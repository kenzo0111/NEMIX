import Breadcrumbs from '@/Components/Breadcrumbs';

interface RFIDHeaderProps {
    totalItems: number;
    taggedCount: number;
}

export default function RFIDHeader({ totalItems, taggedCount }: RFIDHeaderProps) {
    const untaggedCount = Math.max(0, totalItems - taggedCount);
    const progressPercent = totalItems > 0 ? Math.round((taggedCount / totalItems) * 100) : 100;

    return (
        <div className="bg-white border-b border-gray-200 px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="mb-1">
                        <Breadcrumbs items={[{ name: 'RFID Scanner', href: '#' }]} />
                    </div>
                    <div className="flex flex-wrap items-baseline gap-3">
                        <h1 className="text-2xl font-bold text-gray-900 font-serif tracking-tight">
                            RFID Tagging
                        </h1>
                        <span className="hidden sm:inline text-gray-300">|</span>
                        <p className="text-xs text-gray-500 font-medium">
                            Assign RFID tags to inventory items before receiving.
                        </p>
                    </div>
                    {/* Subtle inline workflow hint */}
                    <p className="text-[11px] text-gray-400 font-mono mt-1">
                        <span className="text-gray-500 font-medium">Workflow:</span> Select item → Scan tag → Assign
                    </p>
                </div>

                {/* Right side progress summary */}
                <div className="flex items-center gap-3 self-start sm:self-auto">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                            <span className="text-xs font-bold text-gray-800 font-mono">
                                {taggedCount} of {totalItems} tagged
                            </span>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                                untaggedCount === 0 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : 'bg-amber-100 text-amber-800'
                            }`}>
                                {untaggedCount === 0 ? 'All Tagged' : `${untaggedCount} remaining`}
                            </span>
                        </div>
                        <div className="w-36 sm:w-44 bg-gray-200 rounded-full h-1.5 mt-1.5 overflow-hidden ml-auto">
                            <div
                                className="bg-red-900 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
