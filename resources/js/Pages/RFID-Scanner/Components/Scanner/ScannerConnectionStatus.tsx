import { RFIDConnectionState } from '../../types';
import { Wifi, WifiOff, RefreshCw, Radio } from 'lucide-react';

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
            label: 'Hardware Online',
            dotClass: 'bg-emerald-500',
            badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/90',
            icon: Wifi,
        },
        degraded: {
            label: 'Signal Degraded',
            dotClass: 'bg-amber-500 animate-pulse',
            badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/90',
            icon: Radio,
        },
        connecting: {
            label: 'Connecting...',
            dotClass: 'bg-amber-400 animate-pulse',
            badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/90',
            icon: RefreshCw,
        },
        offline: {
            label: 'Reader Disconnected',
            dotClass: 'bg-gray-400',
            badgeClass: 'bg-gray-100 text-gray-600 border-gray-200',
            icon: WifiOff,
        },
    }[connectionState];

    const Icon = config.icon;

    return (
        <div className="flex items-center gap-2">
            <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border shadow-2xs ${config.badgeClass}`}
                title={`Scanner hardware status: ${config.label}`}
            >
                <Icon className="w-3 h-3 shrink-0" />
                <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
                <span>{config.label}</span>
            </span>

            {connectionState === 'offline' && (
                <button
                    type="button"
                    onClick={onRetry}
                    disabled={isRetrying}
                    className="inline-flex items-center gap-1 text-xs font-mono text-red-900 hover:text-red-950 font-semibold underline cursor-pointer disabled:opacity-50"
                >
                    <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
                    <span>{isRetrying ? 'Checking...' : 'Reconnect'}</span>
                </button>
            )}
        </div>
    );
}

