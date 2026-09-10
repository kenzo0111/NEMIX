import { RFIDConnectionState } from '../../types';

interface ScannerConnectionStatusProps {
    connectionState: RFIDConnectionState;
    onRetry: () => void;
    isRetrying?: boolean;
}

export default function ScannerConnectionStatus({
    connectionState,
    onRetry,
    isRetrying = false,
}: ScannerConnectionStatusProps) {
    const config = {
        connected: {
            label: 'Connected',
            dotClass: 'bg-emerald-500',
            badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        },
        degraded: {
            label: 'Degraded',
            dotClass: 'bg-amber-500 animate-pulse',
            badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        },
        connecting: {
            label: 'Connecting...',
            dotClass: 'bg-amber-400 animate-pulse',
            badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        },
        offline: {
            label: 'Offline',
            dotClass: 'bg-gray-400',
            badgeClass: 'bg-gray-100 text-gray-600 border-gray-200',
        },
    }[connectionState];

    return (
        <div className="flex items-center gap-2">
            <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border ${config.badgeClass}`}
                title={`Scanner status: ${config.label}`}
            >
                <span className={`w-2 h-2 rounded-full ${config.dotClass}`} />
                <span>{config.label}</span>
            </span>

            {connectionState === 'offline' && (
                <button
                    type="button"
                    onClick={onRetry}
                    disabled={isRetrying}
                    className="text-xs font-mono text-red-900 hover:text-red-950 font-semibold underline cursor-pointer disabled:opacity-50"
                >
                    {isRetrying ? 'Checking...' : 'Retry'}
                </button>
            )}
        </div>
    );
}
