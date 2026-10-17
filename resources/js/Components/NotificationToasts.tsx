import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { dismissNotification, getNotifications, subscribeNotifications, Notification } from '@/utils/notifications';

const appearances = {
    success: { Icon: CheckCircle2, title: 'Success', color: 'bg-emerald-50 border-emerald-300 text-emerald-950 dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-100' },
    error: { Icon: AlertCircle, title: 'Action failed', color: 'bg-rose-50 border-rose-300 text-rose-950 dark:bg-rose-950 dark:border-rose-700 dark:text-rose-100' },
    warning: { Icon: AlertTriangle, title: 'Attention', color: 'bg-amber-50 border-amber-300 text-amber-950 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-100' },
    info: { Icon: Info, title: 'Information', color: 'bg-sky-50 border-sky-300 text-sky-950 dark:bg-sky-950 dark:border-sky-700 dark:text-sky-100' },
};

function Toast({ notification }: { notification: Notification }) {
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);
    const paused = hovered || focused;
    const { Icon, title, color } = appearances[notification.type];
    useEffect(() => {
        if (paused || notification.type === 'error' || notification.type === 'warning') return;
        const timer = window.setTimeout(() => dismissNotification(notification.id), 5000);
        return () => window.clearTimeout(timer);
    }, [notification.id, notification.type, paused]);
    return (
        <div className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg ${color}`}
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            onFocus={() => setFocused(true)} onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
            }}>
            <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
                <p className="text-xs font-bold">{notification.title || title}</p>
                <p className="mt-1 whitespace-pre-line break-words text-sm">{notification.message}</p>
            </div>
            <button type="button" onClick={() => dismissNotification(notification.id)}
                className="shrink-0 rounded p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                aria-label={`Dismiss ${notification.title || title} notification`}><X className="h-4 w-4" /></button>
        </div>
    );
}

export default function NotificationToasts() {
    const notifications = useSyncExternalStore(subscribeNotifications, getNotifications, getNotifications);
    const [target, setTarget] = useState<HTMLElement | null>(null);
    useEffect(() => {
        const update = () => {
            // Remain inside the active modal's focus and accessibility boundary.
            const dialogs = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]'));
            setTarget(dialogs[dialogs.length - 1] || document.body);
        };
        update();
        const observer = new MutationObserver(update);
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-modal'] });
        return () => observer.disconnect();
    }, []);
    if (!target) return null;
    return createPortal(
        <aside aria-label="System notifications" className="pointer-events-none fixed inset-x-4 top-4 z-[100] max-h-[calc(100dvh-2rem)] space-y-3 overflow-y-auto sm:left-auto sm:right-5 sm:w-96 print:hidden">
            <div role="status" aria-live="polite" aria-atomic="false" className="space-y-3">
                {notifications.filter((item) => item.type !== 'error').map((item) => <Toast key={item.id} notification={item} />)}
            </div>
            <div role="alert" aria-live="assertive" aria-atomic="false" className="space-y-3">
                {notifications.filter((item) => item.type === 'error').map((item) => <Toast key={item.id} notification={item} />)}
            </div>
        </aside>, target,
    );
}
