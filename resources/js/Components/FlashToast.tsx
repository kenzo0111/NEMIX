import React, { useState, useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { PageProps, FlashMessages } from '@/types';

export type FlashToastType = 'success' | 'error' | 'warning' | 'info';

export interface FlashToastItem {
    type: FlashToastType;
    message: string;
    title?: string;
}

interface FlashToastProps {
    flash?: FlashMessages;
    autoDismissDuration?: number;
}

/**
 * Institutional-grade, accessible, responsive flash message toast.
 * Automatically synchronizes with Inertia's shared flash session props.
 */
export default function FlashToast({ flash: customFlash, autoDismissDuration }: FlashToastProps) {
    const page = usePage<PageProps>();
    const flash = customFlash ?? page.props.flash;

    const [alert, setAlert] = useState<FlashToastItem | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const isPaused = isHovered || isFocused;

    // Dismiss alert and reset pause states
    const handleDismiss = () => {
        setAlert(null);
        setIsHovered(false);
        setIsFocused(false);
    };

    // Watch for changes in flash props
    useEffect(() => {
        if (!flash) return;

        if (flash.success) {
            setAlert({ type: 'success', message: flash.success, title: 'Success' });
        } else if (flash.error) {
            setAlert({ type: 'error', message: flash.error, title: 'Attention' });
        } else if (flash.warning) {
            setAlert({ type: 'warning', message: flash.warning, title: 'Advisory' });
        } else if (flash.status) {
            setAlert({ type: 'info', message: flash.status, title: 'Notice' });
        }
        setIsHovered(false);
        setIsFocused(false);
    }, [flash?.success, flash?.error, flash?.warning, flash?.status]);

    // Handle auto-dismiss with pause on hover or keyboard focus
    useEffect(() => {
        if (!alert || isPaused) {
            if (timerRef.current) clearTimeout(timerRef.current);
            return;
        }

        const duration =
            autoDismissDuration ??
            (alert.type === 'error' || alert.type === 'warning' ? 8000 : 5000);

        timerRef.current = setTimeout(() => {
            handleDismiss();
        }, duration);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [alert, isPaused, autoDismissDuration]);

    if (!alert) return null;

    const config = {
        success: {
            bg: 'bg-emerald-50/95 border-emerald-300 text-emerald-950',
            badgeBg: 'bg-emerald-100 text-emerald-800',
            iconColor: 'text-emerald-700',
            Icon: CheckCircle2,
            closeHover: 'hover:bg-emerald-100/80 text-emerald-800',
        },
        error: {
            bg: 'bg-rose-50/95 border-rose-300 text-rose-950',
            badgeBg: 'bg-rose-100 text-rose-800',
            iconColor: 'text-rose-700',
            Icon: AlertCircle,
            closeHover: 'hover:bg-rose-100/80 text-rose-800',
        },
        warning: {
            bg: 'bg-amber-50/95 border-amber-300 text-amber-950',
            badgeBg: 'bg-amber-100 text-amber-800',
            iconColor: 'text-amber-700',
            Icon: AlertTriangle,
            closeHover: 'hover:bg-amber-100/80 text-amber-800',
        },
        info: {
            bg: 'bg-sky-50/95 border-sky-300 text-sky-950',
            badgeBg: 'bg-sky-100 text-sky-800',
            iconColor: 'text-sky-700',
            Icon: Info,
            closeHover: 'hover:bg-sky-100/80 text-sky-800',
        },
    }[alert.type];

    const { Icon, bg, badgeBg, iconColor, closeHover } = config;

    return (
        <aside
            aria-label="System Notifications"
            className="fixed top-4 inset-x-4 sm:top-5 sm:right-5 sm:left-auto sm:max-w-md z-50 pointer-events-none transition-all duration-300"
        >
            <div
                role="alert"
                aria-live="polite"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onFocus={() => setIsFocused(true)}
                onBlur={(e) => {
                    // Check if new focus destination is outside toast
                    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                        setIsFocused(false);
                    }
                }}
                className={`pointer-events-auto rounded-xl p-4 shadow-lg border backdrop-blur-md flex items-start gap-3 transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${bg}`}
            >
                <div className={`shrink-0 mt-0.5 ${iconColor}`}>
                    <Icon className="w-5 h-5" aria-hidden="true" />
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                    {alert.title && (
                        <div className="flex items-center gap-2 mb-1">
                            <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${badgeBg}`}
                            >
                                {alert.title}
                            </span>
                        </div>
                    )}
                    <p className="text-xs sm:text-sm font-medium leading-snug break-words">
                        {alert.message}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleDismiss}
                    className={`shrink-0 p-1.5 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-900/30 ${closeHover}`}
                    aria-label="Dismiss notification"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </aside>
    );
}
