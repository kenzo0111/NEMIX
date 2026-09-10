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
        <div className="text-center py-8 px-6 bg-red-50/50 rounded-xl border border-red-200">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto mb-2.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                </svg>
            </div>

            <h3 className="text-sm font-semibold text-red-950 font-serif">
                Action Failed
            </h3>

            <p className="text-xs text-red-800 mt-1 max-w-sm mx-auto leading-relaxed">
                {message || 'The operation could not be completed. Please try again.'}
            </p>

            {tag && (
                <div className="mt-3 font-mono text-xs font-bold text-gray-800 bg-white px-3 py-1 rounded border border-red-200 inline-block">
                    Tag: {tag}
                </div>
            )}

            <div className="mt-5 flex items-center justify-center gap-3 max-w-xs mx-auto">
                <button
                    type="button"
                    onClick={onRetry}
                    className="flex-1 py-2 px-3 bg-red-950 hover:bg-red-900 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-2xs"
                >
                    Try Again
                </button>
                <button
                    type="button"
                    onClick={onReset}
                    className="flex-1 py-2 px-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                    Reset Scanner
                </button>
            </div>
        </div>
    );
}
