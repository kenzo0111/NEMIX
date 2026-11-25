import { Button } from '@/Components/ui/button';
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
            badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/90 dark:border-emerald-800/60',
            icon: Wifi,
        },
        degraded: {
            label: 'Signal Degraded',
            dotClass: 'bg-amber-500 animate-pulse',
            badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200/90 dark:border-amber-800/60',
            icon: Radio,
        },
        connecting: {
            label: 'Connecting...',
            dotClass: 'bg-amber-400 animate-pulse',
            badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200/90 dark:border-amber-800/60',
            icon: RefreshCw,
        },
        offline: {
            label: 'Reader Disconnected',
            dotClass: 'bg-slate-400',
            badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
            icon: WifiOff,
        },
    }[connectionState];

    const Icon = config.icon;

    return (
        <div className="flex max-w-full flex-wrap items-center gap-2">
            <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm tabular-nums font-medium border shadow-sm ${config.badgeClass}`}
                title={`Scanner hardware status: ${config.label}`}
            >
                <Icon className="w-3 h-3 shrink-0" />
                <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
                <span>{config.label}</span>
            </span>

            {connectionState === 'offline' && (
                <Button variant="secondary"
                    type="button"
                    onClick={onRetry}
                    disabled={isRetrying}
                    className="inline-flex items-center gap-1 tabular-nums underline"
                >
                    <RefreshCw className={`w-3 h-3 ${isRetrying ? "animate-spin" : ""}`} />
                    <span>{isRetrying ? 'Checking...' : 'Reconnect'}</span>
                </Button>
            )}
        </div>
    );
}

