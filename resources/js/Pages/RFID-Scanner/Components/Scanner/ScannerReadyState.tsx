import { RFIDInventoryItem } from '../../types';
import { Radio, Keyboard, Zap, Sparkles } from 'lucide-react';

interface ScannerReadyStateProps {
    item: RFIDInventoryItem;
    onOpenManualEntry: () => void;
}

export default function ScannerReadyState({ item, onOpenManualEntry }: ScannerReadyStateProps) {
    return (
        <div className="text-center py-8 px-5 bg-gradient-to-b from-gray-50/40 via-white to-gray-50/20 rounded-xl border border-gray-200/90 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Target Item Ribbon */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-900 border border-red-100 text-xs font-medium mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-800 animate-pulse" />
                <span>Target:</span>
                <strong className="font-semibold truncate max-w-[200px]">{item.name}</strong>
            </div>

            {/* Pulsing RFID Sensor Radar Target */}
            <div className="relative my-2 flex items-center justify-center">
                {/* Gentle animated rings */}
                <div className="absolute w-28 h-28 rounded-full bg-red-900/5 animate-ping pointer-events-none" style={{ animationDuration: '3s' }} />
                <div className="absolute w-24 h-24 rounded-full bg-red-900/10 pointer-events-none" />
                <div className="relative w-16 h-16 bg-white rounded-2xl border border-red-200 shadow-sm flex items-center justify-center text-red-900 z-10">
                    <Radio className="w-8 h-8 text-red-900 animate-pulse" />
                </div>
            </div>

            {/* Title & Status */}
            <div className="mt-4">
                <h3 className="text-base font-semibold text-gray-900 font-serif">
                    Scanner Active & Listening
                </h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 leading-relaxed">
                    Present the physical RFID card or tag to the handheld reader trigger.
                </p>
            </div>

            {/* Live listening status badge */}
            <div className="mt-4 flex items-center gap-2 bg-emerald-50/80 px-3 py-1 rounded-full border border-emerald-200/70 text-[11px] font-mono text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>USB HID Reader Synchronized</span>
            </div>

            <div className="w-32 border-t border-gray-100 my-4" />

            {/* Manual entry fallback option */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
                <span>Scanner unavailable?</span>
                <button
                    type="button"
                    onClick={onOpenManualEntry}
                    className="inline-flex items-center gap-1 text-red-900 hover:text-red-950 font-medium underline cursor-pointer"
                >
                    <Keyboard className="w-3 h-3" />
                    <span>Enter tag manually</span>
                </button>
            </div>
        </div>
    );
}

