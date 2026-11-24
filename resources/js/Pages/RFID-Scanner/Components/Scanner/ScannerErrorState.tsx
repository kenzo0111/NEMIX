import { Button } from '@/Components/ui/button';
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
        <div className="text-center py-7 px-6 bg-gradient-to-b from-red-50/40 via-white to-gray-50/20 rounded-xl border border-red-200 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-red-100/80 text-red-700 flex items-center justify-center mx-auto mb-3 border border-red-200 dark:text-red-300">
                <AlertCircle className="w-6 h-6 text-red-700 dark:text-red-300" />
            </div>

            <h3 className="text-lg font-semibold text-red-950 font-sans dark:text-red-300">
                Action Could Not Be Completed
            </h3>

            <p className="text-sm text-red-800/90 mt-1 max-w-sm mx-auto leading-relaxed dark:text-red-300">
                {message || 'The operation could not be completed. Please verify the connection and try again.'}
            </p>

            {tag && (
                <div className="mt-3 tabular-nums text-sm font-semibold text-gray-800 bg-white px-3 py-1.5 rounded-lg border border-red-200 inline-block shadow-sm dark:text-slate-300 dark:bg-slate-900">
                    Captured Tag: {tag}
                </div>
            )}

            <div className="mt-5 flex items-center justify-center gap-3 max-w-xs mx-auto">
                <Button variant="primary"
                    type="button"
                    onClick={onRetry}
                    className="flex-1 inline-flex items-center justify-center gap-1.5"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Try Again</span>
                </Button>
                <Button variant="secondary"
                    type="button"
                    onClick={onReset}
                    className="flex-1 inline-flex items-center justify-center gap-1.5"
                >
                    <RotateCcw className="w-3.5 h-3.5 text-gray-500 dark:text-slate-300" />
                    <span>Reset</span>
                </Button>
            </div>
        </div>
    );
}

