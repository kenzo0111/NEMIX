import { Link } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, ChevronRight, ClipboardList, Clock3, Eye, FileText, PackageCheck, Pencil, Plus, Search, X } from 'lucide-react';
import useAuthorization from '@/Hooks/useAuthorization';
import { formatDisplayDate } from '@/utils/dateUtils';
import CoordinatorPortalHeader from '../../Coordinator/components/CoordinatorPortalHeader';
import { panel, secondaryButton } from '../../Coordinator/inventory';
import { SupplyRequest } from '../types';
import { RequestStatusBadge } from './RequestStatusBadge';

interface Props {
    userName: string;
    counts: { total: number; pending: number; approved: number; issued: number };
    requests: SupplyRequest[];
    search: string;
    status: string;
    statusOptions: { value: string; label: string }[];
    filteredCount: number;
    page: number;
    lastPage: number;
    from: number;
    to: number;
    busy: number | null;
    onSearch: (value: string) => void;
    onStatus: (value: string) => void;
    onPage: (page: number) => void;
    onCreate: () => void;
    onDetails: (request: SupplyRequest) => void;
    onEdit: (request: SupplyRequest) => void;
    onRis: (request: SupplyRequest) => void;
    onCancel: (request: SupplyRequest) => void;
}

const reference = (request: SupplyRequest) => request.ris_number || `Request #${request.id}`;
const adjusted = (request: SupplyRequest) => ['Approved', 'Issued'].includes(request.status)
    && request.items.some(line => line.approved_quantity != null && line.approved_quantity !== line.quantity);

function RequestedSupplies({ request }: { request: SupplyRequest }) {
    return <div className="space-y-1.5">
        {request.items.slice(0, 2).map(line => <div key={line.id} className="flex items-start justify-between gap-3 text-sm"><span className="min-w-0 text-slate-800 dark:text-slate-200">{line.item?.name || 'Archived item'}</span><span className="shrink-0 text-xs tabular-nums text-slate-500 dark:text-slate-400">{line.quantity} {line.item?.unit_of_issue || 'units'}</span></div>)}
        {request.items.length > 2 && <p className="text-xs font-medium text-slate-500 dark:text-slate-400">+{request.items.length - 2} more item types</p>}
        <p className="line-clamp-2 pt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{request.purpose}</p>
    </div>;
}

export default function CoordinatorRequestsWorkspace(props: Props) {
    const { can } = useAuthorization();
    const stats = [
        { label: 'All requests', count: props.counts.total, status: '', icon: ClipboardList, color: 'bg-red-50 text-red-900 dark:bg-red-950/50 dark:text-red-300', hint: 'Your supply requisitions' },
        { label: 'Pending review', count: props.counts.pending, status: 'Pending', icon: Clock3, color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300', hint: 'With the Supply Office' },
        { label: 'Awaiting release', count: props.counts.approved, status: 'Approved', icon: PackageCheck, color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300', hint: 'Approved quantities confirmed' },
        { label: 'Released', count: props.counts.issued, status: 'Issued', icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300', hint: 'Added to your unit inventory' },
    ];
    const actions = (request: SupplyRequest) => <div className="flex flex-wrap items-center gap-2">
        <button type="button" aria-label={`View details for ${reference(request)}`} onClick={() => props.onDetails(request)} className={`${secondaryButton} min-h-9 px-3 text-xs`}><Eye size={14} />Details</button>
        {request.status === 'Pending' && can('inventory.requests.update') && <button type="button" aria-label={`Edit ${reference(request)}`} onClick={() => props.onEdit(request)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-red-900 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40"><Pencil size={13} />Edit</button>}
        {['Approved', 'Issued'].includes(request.status) && <button type="button" aria-label={`View RIS for ${reference(request)}`} onClick={() => props.onRis(request)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-red-900 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40"><FileText size={14} />View RIS</button>}
        {['Pending', 'Approved'].includes(request.status) && can('inventory.requests.cancel') && <button type="button" aria-label={`Cancel ${reference(request)}`} disabled={props.busy === request.id} onClick={() => props.onCancel(request)} className="min-h-9 rounded-lg px-2 text-xs font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-300">{props.busy === request.id ? 'Cancelling…' : 'Cancel'}</button>}
    </div>;
    const status = (request: SupplyRequest) => <div className="space-y-2"><RequestStatusBadge status={request.status} />{adjusted(request) && <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Quantities adjusted · see details</p>}{request.review_remarks && <p className="line-clamp-2 max-w-xs text-xs leading-relaxed text-slate-500 dark:text-slate-400">{request.review_remarks}</p>}</div>;
    const empty = <div className="flex flex-col items-center px-5 py-14 text-center"><div className="mb-4 rounded-full bg-slate-100 p-4 text-slate-400 dark:bg-slate-800"><ClipboardList size={26} /></div><h2 className="font-semibold">{props.counts.total ? 'No requests match your filters' : 'Your supply requests start here'}</h2><p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">{props.counts.total ? 'Try another RIS number, item name, or request status.' : 'Browse the central catalog or create a request. You can follow its review and release here.'}</p>{props.counts.total > 0 && <button type="button" onClick={() => { props.onSearch(''); props.onStatus(''); }} className="mt-5 text-sm font-semibold text-red-900 dark:text-red-300">Clear search and filters</button>}</div>;

    return <>
        <CoordinatorPortalHeader />
        <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-7 lg:p-8">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"><Link href={route('dashboard')} className="hover:text-red-900 dark:hover:text-red-300">Coordinator Dashboard</Link><ChevronRight size={13} /><span className="text-slate-700 dark:text-slate-300">My Requests</span></nav>
            <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center"><div><p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-red-900 dark:text-red-300">Supply & Property Management Office</p><h1 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl">My Supply Requests</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">Request supplies for your Delivery Unit and follow each requisition from review to release.</p></div><div className="flex flex-wrap gap-2.5"><Link href={route('coordinator.catalog.index')} className={secondaryButton}>Browse Central Stock<ArrowRight size={15} /></Link>{can('inventory.requests.store') && <button type="button" onClick={props.onCreate} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2"><Plus size={17} />New Request</button>}</div></section>
            <section aria-label="My request overview" className="grid grid-cols-2 gap-3 sm:gap-4 2xl:grid-cols-4">{stats.map(stat => <button key={stat.label} type="button" onClick={() => props.onStatus(stat.status)} aria-label={`Show ${stat.label.toLowerCase()}`} aria-pressed={props.status === stat.status} className={`${panel} flex min-w-0 items-start justify-between gap-3 p-4 text-left transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 sm:p-5 ${props.status === stat.status ? 'ring-1 ring-red-900/20 dark:ring-red-400/40' : ''}`}><span className="min-w-0"><span className="block text-sm text-slate-600 dark:text-slate-400">{stat.label}</span><span className="mt-2 block text-2xl font-bold tabular-nums">{stat.count}</span><span className="mt-2 block text-xs text-slate-500 dark:text-slate-400">{stat.hint}</span></span><span className={`hidden rounded-xl p-2.5 sm:inline-flex ${stat.color}`}><stat.icon size={20} /></span></button>)}</section>
            <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-red-50/60 px-4 py-3.5 text-sm text-red-950 sm:flex-row sm:items-center sm:justify-between dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-200"><p className="leading-relaxed">Approved supplies enter your unit inventory when the Supply Office releases them.</p><div className="flex shrink-0 items-center gap-2 text-xs font-semibold"><span>Submit request</span><ArrowRight size={13} className="opacity-50" /><span>Staff review</span><ArrowRight size={13} className="opacity-50" /><span>Release</span></div></div>
            <section className={`${panel} overflow-hidden`} aria-label="My supply requisitions">
                <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-4 sm:px-6 sm:py-5 xl:flex-row xl:items-center dark:border-slate-800"><div className="relative min-w-0 flex-1 xl:max-w-md"><Search size={17} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" /><input type="search" aria-label="Search my supply requests" placeholder="Search RIS number, item, recipient, or purpose…" value={props.search} onChange={event => props.onSearch(event.target.value)} className="min-h-11 w-full rounded-lg border-slate-300 bg-white pl-10 pr-10 text-sm placeholder:text-slate-400 focus:border-red-800 focus:ring-red-800 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100" />{props.search && <button type="button" aria-label="Clear request search" onClick={() => props.onSearch('')} className="absolute right-1 top-1 rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={16} /></button>}</div><label className="flex min-w-0 items-center gap-2.5 text-sm text-slate-500 dark:text-slate-400"><span className="shrink-0">Status</span><select value={props.status} onChange={event => props.onStatus(event.target.value)} className="min-h-11 min-w-0 flex-1 rounded-lg border-slate-300 bg-white py-2 pl-3 pr-9 text-sm text-slate-700 focus:border-red-800 focus:ring-red-800 sm:w-64 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200">{props.statusOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label></div>
                {props.requests.length ? <>
                    <div className="hidden overflow-x-auto lg:block"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 dark:bg-slate-950/50 dark:text-slate-400"><tr>{['Request / Date', 'Supplies / Purpose', 'Recipient / Office', 'Status', 'Actions'].map(label => <th key={label} scope="col" className="whitespace-nowrap px-5 py-3.5 font-semibold">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{props.requests.map(request => <tr key={request.id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"><th scope="row" className="min-w-40 px-5 py-5 align-top font-normal"><p className="font-semibold text-slate-900 dark:text-slate-100">{reference(request)}</p><p className="mt-1.5 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">{formatDisplayDate(request.date_requested || request.created_at, 'short')}</p></th><td className="min-w-60 max-w-xs px-5 py-5 align-top"><RequestedSupplies request={request} /></td><td className="min-w-44 max-w-56 px-5 py-5 align-top"><p className="text-sm font-medium">{request.recipient || request.requester?.name || props.userName}</p><p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{request.department}</p></td><td className="px-5 py-5 align-top">{status(request)}</td><td className="min-w-52 px-5 py-5 align-top">{actions(request)}</td></tr>)}</tbody></table></div>
                    <div className="divide-y divide-slate-100 lg:hidden dark:divide-slate-800">{props.requests.map(request => <article key={request.id} className="space-y-4 p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-sm font-semibold">{reference(request)}</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDisplayDate(request.date_requested || request.created_at, 'short')}</p></div>{status(request)}</div><RequestedSupplies request={request} /><p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{request.recipient || request.requester?.name || props.userName} · {request.department}</p>{actions(request)}</article>)}</div>
                </> : empty}
                <div className="flex flex-col justify-between gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:px-6 dark:border-slate-800"><p role="status" className="text-xs text-slate-500 dark:text-slate-400">Showing {props.from}–{props.to} of {props.filteredCount} requests</p><nav aria-label="Request pages" className="flex items-center gap-2"><button type="button" disabled={props.page <= 1} onClick={() => props.onPage(props.page - 1)} className={`${secondaryButton} min-h-9 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-40`}>Previous</button><span className="px-1 text-xs tabular-nums text-slate-500 dark:text-slate-400">{props.page} / {props.lastPage}</span><button type="button" disabled={props.page >= props.lastPage} onClick={() => props.onPage(props.page + 1)} className={`${secondaryButton} min-h-9 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-40`}>Next</button></nav></div>
            </section>
            <footer className="flex flex-wrap justify-between gap-2 pb-2 text-xs text-slate-500 dark:text-slate-400"><span>My requests only · {props.userName}</span><Link href={route('coordinator.inventory.index')} className="font-medium hover:text-red-900 dark:hover:text-red-300">View my unit inventory →</Link></footer>
        </div>
    </>;
}
