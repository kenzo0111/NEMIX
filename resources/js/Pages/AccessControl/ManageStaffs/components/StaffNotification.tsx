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
            bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
            iconBg: 'text-emerald-700',
            closeHover: 'text-emerald-600 hover:text-emerald-900 hover:bg-emerald-100',
            Icon: Check,
        },
        warning: {
            bg: 'bg-amber-50 border-amber-200 text-amber-900',
            iconBg: 'text-amber-700',
            closeHover: 'text-amber-600 hover:text-amber-900 hover:bg-amber-100',
            Icon: AlertTriangle,
        },
        error: {
            bg: 'bg-red-50 border-red-200 text-red-900',
            iconBg: 'text-red-700',
            closeHover: 'text-red-600 hover:text-red-900 hover:bg-red-100',
            Icon: AlertCircle,
        },
        info: {
            bg: 'bg-slate-50 border-slate-200 text-slate-900',
            iconBg: 'text-slate-700',
            closeHover: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
            Icon: Info,
        },
    }[notification.type];

    const { Icon, bg, iconBg, closeHover } = config;

    return (
        <div
            className={`border rounded-lg p-3.5 flex items-start gap-3 shadow-xs transition-all ${bg}`}
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
                className={`p-1 rounded transition-colors shrink-0 cursor-pointer ${closeHover}`}
                aria-label="Dismiss notification"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
