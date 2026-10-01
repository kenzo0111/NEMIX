import React, { useEffect, useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import Select from 'react-select';
import Sidebar from '@/Components/Sidebar';
import PageHeader from '@/Components/PageHeader';
import { getSidebarModules } from '@/utils/sidebarConfig';
import { useSidebarCollapse } from '@/Hooks/useSidebarCollapse';
import { institutionalSelectStyles } from '@/styles/selectStyles';
import { formatDisplayDate } from '@/utils/dateUtils';
import { RisPreviewModal } from '../Issuance/components/RisPreviewModal';
import { IssuanceRecord } from '../Issuance/types';
import { RequestDetailsModal, RequestStatus } from './components/RequestDetailsModal';
import { RequestFormModal } from './components/RequestFormModal';
import { RequestItem, SupplyRequest } from './types';

const PAGE_SIZE = 10;
const statusOptions = ['Pending', 'Approved', 'Issued', 'Rejected', 'Cancelled'].map(value => ({ value, label: value === 'Approved' ? 'Awaiting Release' : value }));

export default function MyRequests({ auth, requests, items }: {
    auth: { user: { id: number; name: string; email: string } };
    requests: SupplyRequest[];
    items: RequestItem[];
}) {
    const [collapsed, toggle] = useSidebarCollapse();
    const pageProps = usePage().props as any;
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [formOpen, setFormOpen] = useState(false);
    const [editingRequest, setEditingRequest] = useState<SupplyRequest | null>(null);
    const [detailsRequest, setDetailsRequest] = useState<SupplyRequest | null>(null);
    const [preview, setPreview] = useState<IssuanceRecord | null>(null);
    const [previewRequestId, setPreviewRequestId] = useState<number | null>(null);
    const [busy, setBusy] = useState<number | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        const flash = pageProps.flash || {};
        if (flash.error) setNotification({ type: 'error', message: flash.error });
        else if (flash.success) setNotification({ type: 'success', message: flash.success });
    }, [pageProps.flash?.success, pageProps.flash?.error]);
    useEffect(() => {
        if (!notification) return;
        const timer = window.setTimeout(() => setNotification(null), 5000);
        return () => window.clearTimeout(timer);
    }, [notification]);

    const filtered = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        return requests.filter(request => {
            if (statusFilter && request.status !== statusFilter) return false;
            if (!query) return true;
            return [String(request.id), request.ris_number || '', request.department, request.purpose,
                ...request.items.map(line => line.item?.name || '')].some(value => value.toLowerCase().includes(query));
        });
    }, [requests, searchTerm, statusFilter]);
    const lastPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(currentPage, lastPage);
    const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    const from = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
    const to = Math.min(safePage * PAGE_SIZE, filtered.length);

    const openCreate = () => { setEditingRequest(null); setFormOpen(true); };
    const openEdit = (request: SupplyRequest) => { setEditingRequest(request); setFormOpen(true); };
    const closeForm = () => { setFormOpen(false); setEditingRequest(null); };
    const cancel = (request: SupplyRequest) => {
        if (!window.confirm(`Cancel request #${request.id}?`)) return;
        setBusy(request.id);
        router.post(route('inventory.requests.cancel', request.id), {}, {
            preserveScroll: true,
            onSuccess: () => setNotification({ type: 'success', message: 'Request cancelled.' }),
            onError: errors => setNotification({ type: 'error', message: Object.values(errors).join(' ') }),
            onFinish: () => setBusy(null),
        });
    };
    const openRis = (request: SupplyRequest) => {
        const issued = request.status === 'Issued';
        const lines = request.items.filter(line => (line.approved_quantity || 0) > 0).map(line => ({
            id: line.id, item_id: line.item_id, item: line.item?.name || '', sku: line.item?.sku || '',
            quantity: line.approved_quantity || 0, unit: line.item?.unit_of_issue || 'pcs', stock_no: '-',
            unit_cost: 0, amount: 0, allocations: [],
        }));
        setPreview({
            id: request.id, ris_number: request.ris_number || '', recipient: auth.user.name,
            department: request.department, purpose: request.purpose, status: issued ? 'Issued' : 'Approved',
            requested_at: request.created_at?.slice(0, 10), reviewed_at: request.reviewed_at?.slice(0, 10),
            date_issued: issued ? request.issuance?.date_issued || '' : '', date: '', approved_by: request.reviewer?.name || '', approved_by_designation: 'Property Custodian',
            issued_by: '', issued_by_name: issued ? request.issuance?.issued_by_name || '' : '', issued_by_position: issued ? request.issuance?.issued_by_position || '' : '', total_quantity: lines.reduce((sum, line) => sum + line.quantity, 0),
            total_amount: 0, items: lines,
        });
        setPreviewRequestId(request.id);
    };

    return <div className="min-h-screen bg-[#F4F6F8] dark:bg-slate-950 flex font-sans text-gray-900 dark:text-slate-100 overflow-x-hidden selection:bg-red-900 selection:text-white">
        <Head title="Inventory - My Requests" />
        <Sidebar modules={getSidebarModules('Inventory', 'My Requests')} user={auth.user} collapsed={collapsed} onToggleCollapse={toggle} />
        <main className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${collapsed ? 'md:ml-20' : 'md:ml-72'}`}>
            <PageHeader title="Inventory Management" description="Supply requests and requisition tracking" breadcrumbs={[{ name: 'Inventory' }, { name: 'My Requests' }]} />
            <div className="p-4 sm:p-5 lg:p-6 xl:p-8 max-w-[1600px] mx-auto w-full overflow-x-hidden pb-16 min-w-0">
                {notification && <div role="status" className={`mb-4 px-4 py-3 rounded-lg border text-xs font-semibold flex items-center justify-between ${notification.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200' : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'}`}><span>{notification.message}</span><button type="button" onClick={() => setNotification(null)} aria-label="Dismiss notification" className="ml-3 text-lg leading-none">×</button></div>}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xs border border-gray-200/80 dark:border-slate-800 overflow-hidden">
                    <div className="p-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-gray-200/80 dark:border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-gray-50/50 dark:bg-slate-900/50">
                        <div><h2 className="text-base font-bold text-gray-900 dark:text-slate-100 font-serif tracking-tight">My Supply Requests</h2><p className="text-xs text-gray-500 dark:text-slate-400 font-medium mt-0.5">Submitted requisitions, approval status, and RIS forms.</p></div>
                        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 w-full xl:w-auto">
                            <div className="relative w-full sm:w-64"><label htmlFor="request-search-input" className="sr-only">Search my requests</label><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-slate-500"><svg className="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div><input id="request-search-input" type="search" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} placeholder="Search requests..." className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-100 rounded-md text-xs font-medium focus:border-red-900 dark:focus:border-red-600 focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 shadow-xs placeholder-gray-400 dark:placeholder-slate-500" /></div>
                            <div className="w-full sm:w-48"><Select value={statusOptions.find(option => option.value === statusFilter) || null} onChange={option => { setStatusFilter(option?.value || ''); setCurrentPage(1); }} options={statusOptions} placeholder="Status" isClearable styles={institutionalSelectStyles} classNamePrefix="react-select" aria-label="Filter requests by status" /></div>
                            <button type="button" onClick={openCreate} className="w-full sm:w-auto bg-red-950 hover:bg-red-900 active:bg-red-950 text-white font-bold py-2 px-4 rounded-md shadow-xs text-xs flex items-center justify-center gap-2 whitespace-nowrap uppercase font-mono tracking-wider cursor-pointer min-h-[38px]"><svg className="w-4 h-4 text-amber-300" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>New Request</button>
                        </div>
                    </div>
                    <div className="overflow-x-auto min-w-0"><table className="w-full text-left border-collapse min-w-[800px]"><thead className="bg-gray-50/80 dark:bg-slate-900/80 border-b border-gray-200 dark:border-slate-800"><tr>{['Request / RIS No.', 'Office / Department', 'Items Requested', 'Total Quantity', 'Date Requested', 'Status', 'Actions'].map(label => <th key={label} className={`px-4 lg:px-6 py-3.5 text-[11px] font-bold tracking-wider text-gray-700 dark:text-slate-300 uppercase font-mono ${label === 'Actions' ? 'text-right' : ''}`}>{label}</th>)}</tr></thead>
                        <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800">{visible.length === 0 ? <tr><td colSpan={7} className="px-6 py-12 text-center"><div className="flex flex-col items-center"><svg className="w-10 h-10 text-gray-300 dark:text-slate-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg><p className="font-semibold text-sm text-gray-800 dark:text-slate-200">No requests found</p><p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{searchTerm || statusFilter ? 'Try a different search or status.' : 'Submit a request to start tracking supplies.'}</p></div></td></tr> : visible.map(request => {
                            const totalQuantity = request.items.reduce((sum, line) => sum + line.quantity, 0);
                            const itemSummary = request.items.length > 1 ? `${request.items.length} items (${request.items[0]?.item?.name || 'Item'}, ...)` : request.items[0]?.item?.name || 'N/A';
                            return <tr key={request.id} className="hover:bg-red-50/20 dark:hover:bg-red-950/20 transition-colors border-b border-gray-100 dark:border-slate-800/80 last:border-0 group">
                                <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-900 dark:text-slate-100 font-mono tracking-wide">{request.ris_number || `REQ-${String(request.id).padStart(4, '0')}`}</td>
                                <td className="px-4 lg:px-6 py-4 text-xs"><div className="font-semibold text-gray-900 dark:text-slate-100 leading-tight">{request.department}</div><div className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5 leading-tight max-w-44 truncate" title={request.purpose}>{request.purpose}</div></td>
                                <td className="px-4 lg:px-6 py-4 text-xs text-gray-800 dark:text-slate-200 font-medium max-w-xs truncate" title={itemSummary}>{itemSummary}</td>
                                <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs text-gray-900 dark:text-slate-100 font-bold font-mono">{totalQuantity} <span className="text-gray-400 dark:text-slate-500 text-[11px] font-normal font-sans">units</span></td>
                                <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs text-gray-600 dark:text-slate-400 font-mono">{formatDisplayDate(request.created_at, 'MM/DD/YYYY') || request.created_at}</td>
                                <td className="px-4 lg:px-6 py-4 whitespace-nowrap"><RequestStatus status={request.status} /></td>
                                <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right"><div className="inline-flex items-center gap-2.5">
                                    <button type="button" onClick={() => setDetailsRequest(request)} className="text-gray-700 dark:text-slate-300 hover:text-red-950 dark:hover:text-red-400 font-semibold text-xs py-1 px-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-800">View</button>
                                    {request.status === 'Pending' && <button type="button" onClick={() => openEdit(request)} className="text-red-950 dark:text-red-400 font-semibold text-xs py-1 px-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/40">Edit</button>}
                                    {['Approved', 'Issued'].includes(request.status) && <button type="button" onClick={() => openRis(request)} className="border border-red-900/30 dark:border-red-700/50 text-red-950 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-semibold text-xs px-2.5 py-1 rounded shadow-2xs">View RIS</button>}
                                    {['Pending', 'Approved'].includes(request.status) && <button type="button" disabled={busy === request.id} onClick={() => cancel(request)} className="text-gray-500 dark:text-slate-400 hover:text-red-800 dark:hover:text-red-400 font-semibold text-xs disabled:opacity-50">Cancel</button>}
                                </div></td>
                            </tr>;
                        })}</tbody></table></div>
                    {filtered.length > 0 && <div className="px-4 sm:px-6 lg:px-8 py-3.5 border-t border-gray-200/80 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"><span className="text-gray-600 dark:text-slate-400 font-medium">Showing <strong>{from}</strong>–<strong>{to}</strong> of <strong>{filtered.length}</strong> records</span><div className="flex items-center gap-2"><button type="button" onClick={() => setCurrentPage(Math.max(1, safePage - 1))} disabled={safePage <= 1} aria-label="Go to previous page" className="min-h-[38px] px-3.5 py-2 border border-gray-300 dark:border-slate-700 rounded text-xs font-semibold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-950 disabled:opacity-40">Previous</button><span className="px-1 text-gray-600 dark:text-slate-400">Page <strong>{safePage}</strong> of <strong>{lastPage}</strong></span><button type="button" onClick={() => setCurrentPage(Math.min(lastPage, safePage + 1))} disabled={safePage >= lastPage} aria-label="Go to next page" className="min-h-[38px] px-3.5 py-2 border border-gray-300 dark:border-slate-700 rounded text-xs font-semibold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-950 disabled:opacity-40">Next</button></div></div>}
                </div>
            </div>
        </main>
        <RequestFormModal show={formOpen} request={editingRequest} items={items} onClose={closeForm} onSaved={message => setNotification({ type: 'success', message })} />
        <RequestDetailsModal show={!!detailsRequest} request={detailsRequest} onClose={() => setDetailsRequest(null)} />
        <RisPreviewModal show={!!preview} issuance={preview} onClose={() => { setPreview(null); setPreviewRequestId(null); }} downloadUrl={previewRequestId ? route('inventory.requests.ris-pdf', previewRequestId) : undefined} institutionName={pageProps.systemSettings?.entity_name || 'University of Camarines Norte'} responsibilityCenterCode={pageProps.system?.settings?.institution_responsibility_center_code || ''} defaultApprovedBy="" defaultApprovedByDesignation="" defaultIssuedBy="" defaultIssuedByDesignation="" />
    </div>;
}
