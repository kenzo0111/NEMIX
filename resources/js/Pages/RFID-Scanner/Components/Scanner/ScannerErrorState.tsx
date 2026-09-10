import { AlertCircle, RotateCcw, RefreshCw } from 'lucide-react';

interface ScannerErrorStateProps {
    message: string;
    tag?: string;
    onRetry: () => void;
    onReset: () => void;
}

export default function ScannerErrorState({
    message,
    tag,
    onRetry,
    onReset,
}: ScannerErrorStateProps) {
    return (
        <div className="text-center py-7 px-6 bg-gradient-to-b from-red-50/40 via-white to-gray-50/20 rounded-xl border border-red-200 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-red-100/80 text-red-700 flex items-center justify-center mx-auto mb-3 border border-red-200">
                <AlertCircle className="w-6 h-6 text-red-700" />
            </div>

            <h3 className="text-base font-semibold text-red-950 font-serif">
                Action Could Not Be Completed
            </h3>

            <p className="text-xs text-red-800/90 mt-1 max-w-sm mx-auto leading-relaxed">
                {message || 'The operation could not be completed. Please verify the connection and try again.'}
            </p>

            {tag && (
                <div className="mt-3 font-mono text-xs font-bold text-gray-800 bg-white px-3 py-1.5 rounded-lg border border-red-200 inline-block shadow-2xs">
                    Captured Tag: {tag}
                </div>
            )}

            <div className="mt-5 flex items-center justify-center gap-3 max-w-xs mx-auto">
                <button
                    type="button"
                    onClick={onRetry}
                    className="flex-1 py-2.5 px-3.5 bg-red-950 hover:bg-red-900 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-2xs inline-flex items-center justify-center gap-1.5"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                </button>
                <button
                    type="button"
                    onClick={onReset}
                    className="flex-1 py-2.5 px-3.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-2xs"
                >
                    <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                    <span>Reset</span>
                </button>
            </div>
        </div>
    );
}

