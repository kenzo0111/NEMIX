import React, { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { dismissNotification, getNotifications, subscribeNotifications, Notification } from '@/utils/notifications';

const appearances = {
    success: { Icon: CheckCircle2, title: 'Success', color: 'bg-emerald-50 border-emerald-300 text-emerald-950 dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-100' },
    error: { Icon: AlertCircle, title: 'Action failed', color: 'bg-rose-50 border-rose-300 text-rose-950 dark:bg-rose-950 dark:border-rose-700 dark:text-rose-100' },
    warning: { Icon: AlertTriangle, title: 'Attention', color: 'bg-amber-50 border-amber-300 text-amber-950 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-100' },
    info: { Icon: Info, title: 'Information', color: 'bg-sky-50 border-sky-300 text-sky-950 dark:bg-sky-950 dark:border-sky-700 dark:text-sky-100' },
};

type PresentedNotification = { notification: Notification; present: boolean };

function Toast({ notification, present, onExited }: PresentedNotification & { onExited: (id: number) => void }) {
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);
    const paused = hovered || focused;
    const remainingTime = useRef(5000);
    const persistent = notification.type === 'error' || notification.type === 'warning';
    const { Icon, title, color } = appearances[notification.type];
    useEffect(() => {
        if (paused || persistent || !present) return;
        const startedAt = performance.now();
        const timer = window.setTimeout(() => dismissNotification(notification.id), remainingTime.current);
        return () => {
            window.clearTimeout(timer);
            remainingTime.current = Math.max(0, remainingTime.current - (performance.now() - startedAt));
        };
    }, [notification.id, persistent, paused, present]);
    useEffect(() => {
        if (present) return;
        const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 260;
        const timer = window.setTimeout(() => onExited(notification.id), duration);
        return () => window.clearTimeout(timer);
    }, [notification.id, present, onExited]);
    return (
        <div className="notification-toast-row" data-state={present ? 'open' : 'closed'} aria-hidden={!present || undefined}>
        <div className="notification-toast-content"><div className="px-1 pb-3 pt-1">
        <div className={`notification-toast-card pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-xl border p-4 shadow-md ${color}`}
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            onFocus={() => setFocused(true)} onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
            }}>
            <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
                <p className="text-xs font-bold">{notification.title || title}</p>
                <p className="mt-1 whitespace-pre-line break-words text-sm">{notification.message}</p>
            </div>
            <button type="button" onClick={() => dismissNotification(notification.id)} disabled={!present}
                className="shrink-0 rounded-md p-1 opacity-60 transition-opacity duration-150 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none"
                aria-label={`Dismiss ${notification.title || title} notification`}><X className="h-4 w-4" /></button>
            {!persistent && <span aria-hidden="true" className="notification-toast-lifetime"
                style={{ animationPlayState: paused || !present ? 'paused' : 'running' }} />}
        </div>
        </div></div></div>
    );
}

export default function NotificationToasts() {
    const notifications = useSyncExternalStore(subscribeNotifications, getNotifications, getNotifications);
    const [presented, setPresented] = useState<PresentedNotification[]>(() => notifications.map((notification) => ({ notification, present: true })));
    const [target, setTarget] = useState<HTMLElement | null>(null);
    useLayoutEffect(() => {
        setPresented((current) => {
            const activeIds = new Set(notifications.map((notification) => notification.id));
            const existingIds = new Set(current.map(({ notification }) => notification.id));
            return [
                ...current.map((item) => ({ ...item, present: activeIds.has(item.notification.id) })),
                ...notifications.filter((notification) => !existingIds.has(notification.id)).map((notification) => ({ notification, present: true })),
            ];
        });
    }, [notifications]);
    const handleExited = React.useCallback((id: number) => {
        setPresented((current) => current.filter((item) => item.notification.id !== id));
    }, []);
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
        <aside aria-label="System notifications" className="pointer-events-none fixed inset-x-3 top-3 z-[100] max-h-[calc(100dvh-1.5rem)] overflow-y-auto overscroll-contain sm:left-auto sm:right-4 sm:w-96 print:hidden">
            <div role="status" aria-live="polite" aria-atomic="false">
                {presented.filter(({ notification }) => notification.type !== 'error').map((item) => <Toast key={item.notification.id} {...item} onExited={handleExited} />)}
            </div>
            <div role="alert" aria-live="assertive" aria-atomic="false">
                {presented.filter(({ notification }) => notification.type === 'error').map((item) => <Toast key={item.notification.id} {...item} onExited={handleExited} />)}
            </div>
        </aside>, target,
    );
}
