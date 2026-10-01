import React, { useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import Sidebar from '@/Components/Sidebar';
import PageHeader from '@/Components/PageHeader';
import { getSidebarModules } from '@/utils/sidebarConfig';
import { useSidebarCollapse } from '@/Hooks/useSidebarCollapse';
import { RisPreviewModal } from '../Issuance/components/RisPreviewModal';
import { IssuanceRecord } from '../Issuance/types';

type Item = { id: number; name: string; sku: string; stock: number; unit_of_issue?: string };
type RequestLine = { id: number; quantity: number; approved_quantity: number | null; item: Item };
type SupplyRequest = { id: number; status: string; department: string; purpose: string; ris_number: string | null; review_remarks: string | null; created_at: string; reviewed_at?: string | null; items: RequestLine[]; reviewer?: { name: string } | null; issuance_id?: number | null };

export default function MyRequests({ auth, requests, items }: { auth: { user: { id: number; name: string; email: string } }; requests: SupplyRequest[]; items: Item[] }) {
    const [collapsed, toggle] = useSidebarCollapse();
    const form = useForm<{ department: string; purpose: string; items: { item_id: string; quantity: string }[] }>({
        department: '', purpose: '', items: [{ item_id: '', quantity: '' }],
    });
    const pageProps = usePage().props as any;
    const flash = pageProps.flash || {};
    const [busy, setBusy] = useState<number | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [preview, setPreview] = useState<IssuanceRecord | null>(null);

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        const options = { onSuccess: () => { form.reset(); setEditingId(null); } };
        if (editingId) form.put(route('inventory.requests.update', editingId), options);
        else form.post(route('inventory.requests.store'), options);
    };
    const edit = (request: SupplyRequest) => {
        setEditingId(request.id);
        form.setData({ department: request.department, purpose: request.purpose, items: request.items.map(line => ({ item_id: String(line.item.id), quantity: String(line.quantity) })) });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const openRis = (request: SupplyRequest) => {
        const lines = request.items.filter(line => (line.approved_quantity || 0) > 0).map(line => ({
            id: line.id, item_id: line.item.id, item: line.item.name, sku: line.item.sku,
            quantity: line.approved_quantity || 0, unit: line.item.unit_of_issue || 'pcs', stock_no: '-',
            unit_cost: 0, amount: 0, allocations: [],
        }));
        setPreview({ id: request.id, ris_number: request.ris_number || '', recipient: auth.user.name,
            department: request.department, purpose: request.purpose, status: request.status === 'Approved' ? 'Approved' : 'Issued',
            requested_at: request.created_at?.slice(0, 10), reviewed_at: request.reviewed_at?.slice(0, 10),
            date_issued: '', date: '', approved_by: request.reviewer?.name || '', approved_by_designation: 'Property Custodian',
            issued_by: '', issued_by_name: '', issued_by_position: '', total_quantity: lines.reduce((sum, line) => sum + line.quantity, 0),
            total_amount: 0, items: lines,
        });
    };
    const cancel = (id: number) => {
        if (!window.confirm('Cancel this request?')) return;
        setBusy(id);
        router.post(route('inventory.requests.cancel', id), {}, { onFinish: () => setBusy(null) });
    };

    return <div className="min-h-screen bg-[#F4F6F8] dark:bg-slate-950 flex text-gray-900 dark:text-slate-100">
        <Head title="My Supply Requests" />
        <Sidebar modules={getSidebarModules('Inventory', 'My Requests')} user={auth.user} collapsed={collapsed} onToggleCollapse={toggle} />
        <main className={`flex-1 min-w-0 ${collapsed ? 'md:ml-20' : 'md:ml-72'}`}>
            <PageHeader title="My Supply Requests" description="Submit and track requests for office supplies" breadcrumbs={[{ name: 'Inventory' }, { name: 'My Requests' }]} />
            <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
                {flash.success && <div role="status" className="rounded border border-green-300 bg-green-50 p-3 text-sm text-green-800">{flash.success}</div>}
                {Object.keys(form.errors).length > 0 && <div role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">Please correct the request details. {Object.values(form.errors).join(' ')}</div>}
                <form onSubmit={submit} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-5 space-y-4">
                    <h2 className="text-lg font-semibold">{editingId ? `Edit request #${editingId}` : 'New request'}</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <label className="text-sm font-medium">Office / Department
                            <input required maxLength={255} value={form.data.department} onChange={e => form.setData('department', e.target.value)} className="block mt-1 w-full rounded border-gray-300 dark:bg-slate-950 dark:border-slate-700" />
                        </label>
                        <label className="text-sm font-medium">Purpose
                            <input required maxLength={2000} value={form.data.purpose} onChange={e => form.setData('purpose', e.target.value)} className="block mt-1 w-full rounded border-gray-300 dark:bg-slate-950 dark:border-slate-700" />
                        </label>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold">Items requested</h3>
                        {form.data.items.map((line, index) => <div key={index} className="flex flex-wrap gap-2">
                            <select required aria-label={`Item ${index + 1}`} value={line.item_id} onChange={e => form.setData('items', form.data.items.map((row, i) => i === index ? { ...row, item_id: e.target.value } : row))} className="flex-1 min-w-56 rounded border-gray-300 dark:bg-slate-950 dark:border-slate-700">
                                <option value="">Select item</option>
                                {items.map(item => <option key={item.id} value={item.id}>{item.name} ({item.sku}) — {item.stock} on hand</option>)}
                            </select>
                            <input required type="number" min="1" max="1000000" aria-label={`Quantity ${index + 1}`} value={line.quantity} onChange={e => form.setData('items', form.data.items.map((row, i) => i === index ? { ...row, quantity: e.target.value } : row))} className="w-28 rounded border-gray-300 dark:bg-slate-950 dark:border-slate-700" />
                            {form.data.items.length > 1 && <button type="button" onClick={() => form.setData('items', form.data.items.filter((_, i) => i !== index))} className="text-red-800 dark:text-red-300 px-2">Remove</button>}
                        </div>)}
                        <button type="button" onClick={() => form.setData('items', [...form.data.items, { item_id: '', quantity: '' }])} className="text-sm font-semibold text-red-900 dark:text-red-300">+ Add item</button>
                    </div>
                    <button disabled={form.processing} className="rounded bg-red-950 text-white px-5 py-2 text-sm font-semibold disabled:opacity-50">{editingId ? 'Save changes' : 'Submit request'}</button>
                    {editingId && <button type="button" onClick={() => { form.reset(); setEditingId(null); }} className="ml-3 text-sm underline">Stop editing</button>}
                </form>

                <section className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-5">
                    <h2 className="text-lg font-semibold mb-4">Request history</h2>
                    {requests.length === 0 && <p className="text-sm text-gray-500">No requests yet.</p>}
                    <div className="space-y-3">{requests.map(request => <article key={request.id} className="rounded-lg border border-gray-200 dark:border-slate-700 p-4 text-sm">
                        <div className="flex flex-wrap justify-between gap-2"><strong>Request #{request.id} · {request.department}</strong><span className="font-semibold">{request.status === 'Approved' ? 'Approved — Awaiting Release' : request.status}</span></div>
                        <p className="mt-1">{request.purpose}</p>
                        <ul className="mt-2 text-gray-600 dark:text-slate-300">{request.items.map(line => <li key={line.id}>{line.item?.name}: requested {line.quantity}{line.approved_quantity !== null ? `, approved ${line.approved_quantity}` : ''}</li>)}</ul>
                        {request.ris_number && <p className="mt-2 font-mono">RIS: {request.ris_number}</p>}
                        {request.review_remarks && <p className="mt-2">Custodian remarks: {request.review_remarks}</p>}
                        {request.status === 'Approved' && <p className="mt-2 text-amber-800 dark:text-amber-300">Bring the signed RIS to the property office for release.</p>}
                        {request.status === 'Pending' && <button type="button" onClick={() => edit(request)} className="mt-3 mr-4 text-red-900 dark:text-red-300 underline">Edit</button>}
                        {request.status === 'Approved' && <button type="button" onClick={() => openRis(request)} className="mt-3 mr-4 text-red-900 dark:text-red-300 underline">Preview / print RIS</button>}
                        {['Pending', 'Approved'].includes(request.status) && <button type="button" disabled={busy === request.id} onClick={() => cancel(request.id)} className="mt-3 text-red-900 dark:text-red-300 underline disabled:opacity-50">Cancel request</button>}
                    </article>)}</div>
                </section>
            </div>
        </main>
        <RisPreviewModal show={!!preview} issuance={preview} onClose={() => setPreview(null)} institutionName={pageProps.systemSettings?.entity_name || 'University of Camarines Norte'} responsibilityCenterCode={pageProps.system?.settings?.institution_responsibility_center_code || ''} defaultApprovedBy="" defaultApprovedByDesignation="" defaultIssuedBy="" defaultIssuedByDesignation="" />
    </div>;
}
