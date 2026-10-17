export type NotificationType = 'success' | 'error' | 'warning' | 'info';
export interface NotificationInput { type: NotificationType; message: string; title?: string }
export interface Notification extends NotificationInput { id: number }
let sequence = 0;
let notifications: Notification[] = [];
const listeners = new Set<() => void>();
let visitScope: Set<NotificationType> | null = null;
const emit = () => listeners.forEach((listener) => listener());
export const subscribeNotifications = (listener: () => void) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
};
export const getNotifications = () => notifications;
export function beginNotificationVisit() { visitScope = new Set(); }
export function finishNotificationVisit() {
    const scope = visitScope;
    setTimeout(() => { if (visitScope === scope) visitScope = null; }, 0);
}
/** Flash and local callbacks share one result per severity for each Inertia action. */
export function notify(input: NotificationInput | null) {
    if (!input?.message?.trim()) return;
    if (visitScope?.has(input.type)) return;
    if (input.type === 'success' && (visitScope?.has('error') || visitScope?.has('warning'))) return;
    visitScope?.add(input.type);
    const notification = { ...input, message: input.message.trim(), id: ++sequence };
    notifications = [...notifications, notification];
    emit();
    return notification.id;
}
export function dismissNotification(id: number) {
    notifications = notifications.filter((notification) => notification.id !== id);
    emit();
}
export function notifyFlash(flash?: { success?: string | null; error?: string | null; warning?: string | null; status?: string | null }) {
    if (flash?.error) notify({ type: 'error', message: flash.error });
    else if (flash?.warning) notify({ type: 'warning', message: flash.warning });
    else if (flash?.success) notify({ type: 'success', message: flash.success });
    else if (flash?.status) notify({ type: 'info', message: flash.status });
}
export function notificationError(error: unknown, fallback: string): string {
    const data = (error as { response?: { data?: { errors?: Record<string, unknown>; message?: string } } })?.response?.data;
    const messages = Object.values(data?.errors || {}).flat().filter((value): value is string => typeof value === 'string');
    return messages.join(' ') || data?.message || fallback;
}
