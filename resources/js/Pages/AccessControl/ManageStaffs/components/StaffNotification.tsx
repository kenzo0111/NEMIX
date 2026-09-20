import React from 'react';
import { Check, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { NotificationState } from '../types';

interface StaffNotificationProps {
    notification: NotificationState | null;
    onDismiss: () => void;
}

export default function StaffNotification({ notification, onDismiss }: StaffNotificationProps) {
    if (!notification) return null;

    const config = {
        success: {
            bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200',
            iconBg: 'text-emerald-700 dark:text-emerald-400',
            closeHover: 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-100 hover:bg-emerald-100 dark:hover:bg-emerald-900/50',
            Icon: Check,
        },
        warning: {
            bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200',
            iconBg: 'text-amber-700 dark:text-amber-400',
            closeHover: 'text-amber-600 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/50',
            Icon: AlertTriangle,
        },
        error: {
            bg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/50 text-red-900 dark:text-red-200',
            iconBg: 'text-red-700 dark:text-red-400',
            closeHover: 'text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-100 hover:bg-red-100 dark:hover:bg-red-900/50',
            Icon: AlertCircle,
        },
        info: {
            bg: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100',
            iconBg: 'text-slate-700 dark:text-slate-400',
            closeHover: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700',
            Icon: Info,
        },
    }[notification.type];

    const { Icon, bg, iconBg, closeHover } = config;

    return (
        <div
            className={`border rounded-xl p-4 flex items-start gap-3 shadow-2xs transition-all ${bg}`}
            role="alert"
        >
            <div className={`shrink-0 mt-0.5 ${iconBg}`}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 text-xs">
                {notification.title && (
                    <strong className="font-semibold block text-sm mb-0.5">{notification.title}</strong>
                )}
                <p className="font-medium leading-relaxed">{notification.message}</p>
            </div>
            <button
                type="button"
                onClick={onDismiss}
                className={`p-1 rounded-lg transition-colors shrink-0 cursor-pointer ${closeHover}`}
                aria-label="Dismiss notification"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
