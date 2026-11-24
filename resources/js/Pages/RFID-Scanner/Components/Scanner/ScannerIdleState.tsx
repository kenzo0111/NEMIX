import { Search, Radio, CheckCircle2, ArrowRight } from 'lucide-react';

export default function ScannerIdleState() {
    return (
        <div className="py-8 px-6 bg-gradient-to-b from-gray-50/50 to-white rounded-xl border border-dashed border-gray-200/90 flex flex-col items-center justify-center">
            {/* Main Badge */}
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-900 border border-red-100 flex items-center justify-center mb-3 shadow-sm dark:text-red-300">
                <Radio className="w-6 h-6 text-red-900 dark:text-red-300" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 font-sans dark:text-slate-300">
                RFID Tagging Station Idle
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm text-center leading-relaxed dark:text-slate-300">
                Select an inventory item from the catalog on the left to initialize the scanner listener.
            </p>

            {/* 3-Step Visual Micro-Flow */}
            <div className="mt-6 pt-5 border-t border-gray-100 w-full max-w-md">
                <div className="text-sm normal-case tabular-nums tracking-normal text-slate-500 font-semibold mb-3 text-center dark:text-slate-300">
                    Workflow Sequence
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-lg bg-gray-50/80 border border-gray-100 flex flex-col items-center dark:bg-slate-900">
                        <span className="w-5 h-5 rounded-full bg-white border border-gray-200 text-sm tabular-nums font-semibold text-gray-700 flex items-center justify-center mb-1.5 shadow-sm dark:text-slate-300 dark:bg-slate-900">
                            1
                        </span>
                        <span className="text-sm font-semibold text-gray-800 dark:text-slate-300">Select Item</span>
                        <span className="text-sm text-slate-500 mt-0.5 dark:text-slate-300">Search catalog</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-gray-50/80 border border-gray-100 flex flex-col items-center dark:bg-slate-900">
                        <span className="w-5 h-5 rounded-full bg-white border border-gray-200 text-sm tabular-nums font-semibold text-gray-700 flex items-center justify-center mb-1.5 shadow-sm dark:text-slate-300 dark:bg-slate-900">
                            2
                        </span>
                        <span className="text-sm font-semibold text-gray-800 dark:text-slate-300">Scan Tag</span>
                        <span className="text-sm text-slate-500 mt-0.5 dark:text-slate-300">Present to reader</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-gray-50/80 border border-gray-100 flex flex-col items-center dark:bg-slate-900">
                        <span className="w-5 h-5 rounded-full bg-white border border-gray-200 text-sm tabular-nums font-semibold text-emerald-700 flex items-center justify-center mb-1.5 shadow-sm dark:text-emerald-300 dark:bg-slate-900">
                            3
                        </span>
                        <span className="text-sm font-semibold text-gray-800 dark:text-slate-300">Linked</span>
                        <span className="text-sm text-slate-500 mt-0.5 dark:text-slate-300">Instant register</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

