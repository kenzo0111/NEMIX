import React, { useCallback, useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { Bell } from 'lucide-react';

type Alert = {
    id: number;
    request_id: number;
    ris_number: string | null;
    requester: string | null;
    status: string;
    created_at: string;
    read_at: string | null;
};

type AlertResponse = {
    unread_count: number;
    pending_count: number;
    alerts: Alert[];
    has_more: boolean;
};

export default function SupplyRequestAlerts({
    collapsed,
    onExpand,
}: {
    collapsed: boolean;
    onExpand?: () => void;
}) {
    const [data, setData] = useState<AlertResponse>({ unread_count: 0, pending_count: 0, alerts: [], has_more: false });
    const [open, setOpen] = useState(false);
    const [newAlert, setNewAlert] = useState<Alert | null>(null);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const previousIds = useRef<Set<number> | null>(null);
    const previousPending = useRef<number | null>(null);

    const refresh = useCallback(async () => {
        try {
            const response = await axios.get<AlertResponse>(route('inventory.request-alerts.index'));
            const next = response.data;
            if (previousIds.current !== null) {
                const newest = next.alerts.find((alert) => !previousIds.current?.has(alert.id) && alert.status === 'Pending');
                if (newest) setNewAlert(newest);
            }
            if (previousPending.current !== null && previousPending.current !== next.pending_count
                && route().current('inventory.issuance')) {
                window.dispatchEvent(new Event('supply-requests-changed'));
            }
            previousIds.current = new Set(next.alerts.map((alert) => alert.id));
            previousPending.current = next.pending_count;
            setData((current) => {
                const seen = new Set(next.alerts.map((alert) => alert.id));
                return {
                    ...next,
                    alerts: [...next.alerts, ...current.alerts.filter((alert) => !seen.has(alert.id))],
                    has_more: current.alerts.length > 10 ? current.has_more : next.has_more,
                };
            });
        } catch {
            // Keep the last known count; the next poll will retry.
        }
    }, []);

    useEffect(() => {
        void refresh();
        const timer = window.setInterval(() => void refresh(), 15000);
        return () => window.clearInterval(timer);
    }, [refresh]);

    useEffect(() => {
        if (!newAlert) return;
        const timer = window.setTimeout(() => setNewAlert(null), 6000);
        return () => window.clearTimeout(timer);
    }, [newAlert]);

    const loadOlder = async () => {
        const oldest = data.alerts[data.alerts.length - 1];
        if (!oldest || loadingOlder) return;
        setLoadingOlder(true);
        try {
            const response = await axios.get<AlertResponse>(route('inventory.request-alerts.index'), {
                params: { before: oldest.id },
            });
            setData((current) => {
                const seen = new Set(current.alerts.map((alert) => alert.id));
                return {
                    ...current,
                    alerts: [...current.alerts, ...response.data.alerts.filter((alert) => !seen.has(alert.id))],
                    has_more: response.data.has_more,
                    unread_count: response.data.unread_count,
                    pending_count: response.data.pending_count,
                };
            });
        } catch {
            // Keep the current list so the user can retry.
        } finally {
            setLoadingOlder(false);
        }
    };

    const openRequest = async (alert: Alert) => {
        try {
            await axios.post(route('inventory.request-alerts.read', alert.id));
            setData((current) => ({
                ...current,
                unread_count: Math.max(0, current.unread_count - (alert.read_at ? 0 : 1)),
                alerts: current.alerts.map((item) => item.id === alert.id ? { ...item, read_at: new Date().toISOString() } : item),
            }));
        } catch {
            // Navigation remains available if marking the alert read fails.
        }
        setNewAlert(null);
        setOpen(false);
        router.visit(`${route('inventory.issuance')}?request=${alert.request_id}`);
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => {
                    if (collapsed) onExpand?.();
                    setOpen((value) => !value);
                    void refresh();
                }}
                aria-label={`Supply request alerts, ${data.unread_count} unread`}
                aria-expanded={open}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-xs text-red-100 hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-amber-400"
            >
                <span className="relative shrink-0"><Bell className="w-5 h-5" />
                    {data.unread_count > 0 && <span className="absolute -top-2 -right-2 rounded-full bg-amber-400 px-1 min-w-4 text-center text-[9px] font-bold text-red-950">{data.unread_count > 99 ? '99+' : data.unread_count}</span>}
                </span>
                {!collapsed && <span className="flex-1 text-left">Request alerts</span>}
                {!collapsed && <span className="text-amber-300 font-semibold">{data.pending_count} pending</span>}
            </button>
            {open && !collapsed && (
                <div className="mt-1 rounded-lg border border-red-800 bg-red-950 p-2 shadow-lg" role="region" aria-label="Supply request alerts">
                    <div className="px-2 py-1 text-[11px] font-semibold text-amber-300">{data.unread_count} unread · {data.pending_count} awaiting approval</div>
                    <div className="max-h-72 overflow-y-auto">
                        {data.alerts.length === 0 && <p className="px-2 py-3 text-xs text-red-200">No request alerts yet.</p>}
                        {data.alerts.map((alert) => (
                            <button key={alert.id} type="button" onClick={() => void openRequest(alert)}
                                className={`w-full rounded-md px-2 py-2 text-left hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-amber-400 ${alert.read_at ? 'text-red-200' : 'bg-white/5 text-white'}`}>
                                <span className="block text-xs font-semibold">{alert.ris_number || `Request #${alert.request_id}`}{!alert.read_at && ' · New'}</span>
                                <span className="block text-[11px]">{alert.requester || 'Supply Coordinator'} · {alert.status}</span>
                            </button>
                        ))}
                        {data.has_more && <button type="button" onClick={() => void loadOlder()} disabled={loadingOlder}
                            className="w-full rounded-md px-2 py-2 text-center text-xs font-semibold text-amber-300 hover:bg-white/10 disabled:opacity-50">
                            {loadingOlder ? 'Loading...' : 'Load older alerts'}
                        </button>}
                    </div>
                </div>
            )}
            {newAlert && !collapsed && (
                <button type="button" onClick={() => void openRequest(newAlert)} role="alert"
                    className="mt-2 w-full rounded-lg border border-amber-400 bg-amber-100 px-3 py-2 text-left text-xs font-semibold text-red-950 shadow-lg">
                    New supply request: {newAlert.ris_number || `#${newAlert.request_id}`} · View request
                </button>
            )}
        </div>
    );
}
