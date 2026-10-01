import React, { useState } from 'react';
import { router } from '@inertiajs/react';

export type QueueRequest = {
    id: number;
    status: 'Pending' | 'Approved';
    department: string;
    purpose: string;
    ris_number: string | null;
    created_at: string;
    reviewed_at: string | null;
    review_remarks: string | null;
    requester: { name: string };
    reviewer: { name: string } | null;
    items: { id: number; item_id: number; quantity: number; approved_quantity: number | null; item: { name: string; sku: string; unit_of_issue?: string; stock: number } }[];
};

export function SupplyRequestQueue({ requests, onPreview }: { requests: QueueRequest[]; onPreview: (request: QueueRequest) => void }) {
    const [quantities, setQuantities] = useState<Record<number, Record<number, number>>>({});
    const [busy, setBusy] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [signed, setSigned] = useState<Record<number, boolean>>({});
    const pending = requests.filter(request => request.status === 'Pending');
    const approved = requests.filter(request => request.status === 'Approved');

    const send = (name: string, request: QueueRequest, data: any) => {
        setBusy(request.id);
        setError('');
        router.post(route(name, request.id), data, {
            preserveScroll: true,
            onError: errors => setError(Object.values(errors).join(' ')),
            onFinish: () => setBusy(null),
        });
    };

    return <section className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-5 space-y-5">
        <div><h2 className="text-base font-bold font-serif">Supply requests</h2><p className="text-xs text-gray-500 dark:text-slate-400">Review requests here. Approved requests await signed RIS presentation and physical release.</p></div>
        {error && <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <div className="grid xl:grid-cols-2 gap-5">
            <div className="space-y-3"><h3 className="text-sm font-bold">Awaiting approval ({pending.length})</h3>
                {pending.length === 0 && <p className="text-sm text-gray-500">No requests awaiting approval.</p>}
                {pending.map(request => <article key={request.id} className="rounded border border-gray-200 dark:border-slate-700 p-4 text-sm space-y-2">
                    <div className="font-semibold">#{request.id} · {request.requester?.name} · {request.department}</div>
                    <p>{request.purpose}</p>
                    {request.items.map(line => <label key={line.id} className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="flex-1 min-w-44">{line.item?.name} — requested {line.quantity}, on hand {line.item?.stock}</span>
                        <span>Approve</span>
                        <input type="number" min="0" max={line.quantity} value={quantities[request.id]?.[line.id] ?? line.quantity} onChange={e => setQuantities(current => ({ ...current, [request.id]: { ...(current[request.id] || {}), [line.id]: Number(e.target.value) } }))} className="w-20 rounded border-gray-300 dark:bg-slate-950 dark:border-slate-700" />
                    </label>)}
                    <div className="flex gap-3 pt-1">
                        <button disabled={busy === request.id} onClick={() => send('inventory.requests.approve', request, { approved_quantities: Object.fromEntries(request.items.map(line => [line.id, quantities[request.id]?.[line.id] ?? line.quantity])) })} className="rounded bg-red-950 text-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50">Approve</button>
                        <button disabled={busy === request.id} onClick={() => { const remarks = window.prompt('Reason for rejection'); if (remarks?.trim()) send('inventory.requests.reject', request, { remarks }); }} className="text-red-900 dark:text-red-300 text-xs font-semibold underline disabled:opacity-50">Reject</button>
                    </div>
                </article>)}
            </div>
            <div className="space-y-3"><h3 className="text-sm font-bold">Approved — Awaiting Release ({approved.length})</h3>
                {approved.length === 0 && <p className="text-sm text-gray-500">No approved requests awaiting pickup.</p>}
                {approved.map(request => <article key={request.id} className="rounded border border-amber-200 dark:border-amber-900 p-4 text-sm space-y-2">
                    <div className="font-semibold">{request.ris_number} · {request.requester?.name}</div>
                    <div>{request.department} · Approved by {request.reviewer?.name}</div>
                    <div className="space-y-1">{request.items.map(line => <label key={line.id} className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="flex-1 min-w-44">{line.item?.name} — requested {line.quantity}, on hand {line.item?.stock}</span>
                        <span>Approved</span>
                        <input type="number" min="0" max={line.quantity} value={quantities[request.id]?.[line.id] ?? line.approved_quantity ?? 0} onChange={e => setQuantities(current => ({ ...current, [request.id]: { ...(current[request.id] || {}), [line.id]: Number(e.target.value) } }))} className="w-20 rounded border-gray-300 dark:bg-slate-950 dark:border-slate-700" />
                    </label>)}</div>
                    <button type="button" disabled={busy === request.id} onClick={() => send('inventory.requests.approve', request, { approved_quantities: Object.fromEntries(request.items.map(line => [line.id, quantities[request.id]?.[line.id] ?? line.approved_quantity ?? 0])), remarks: 'Approved quantities revised before release' })} className="text-red-900 dark:text-red-300 underline text-xs font-semibold disabled:opacity-50">Save revised quantities</button>
                    <button type="button" onClick={() => onPreview(request)} className="text-red-900 dark:text-red-300 underline text-xs font-semibold">Preview / print RIS</button>
                    <label className="flex gap-2 items-start text-xs"><input type="checkbox" checked={!!signed[request.id]} onChange={e => setSigned(current => ({ ...current, [request.id]: e.target.checked }))} /> I checked the signed RIS and physically handed over all approved items.</label>
                    <button type="button" disabled={!signed[request.id] || busy === request.id} onClick={() => send('inventory.requests.release', request, { signed_ris_presented: true })} className="rounded bg-red-950 text-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50">Confirm release</button>
                </article>)}
            </div>
        </div>
    </section>;
}
