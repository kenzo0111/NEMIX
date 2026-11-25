import PageHeader from '@/Components/PageHeader';
import { formatScreenDate } from '@/utils/displayFormat';
import { Button } from '@/Components/ui/button';
import React, { useMemo } from 'react';
import DashboardContent from '@/Layouts/DashboardContent';
import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, ChevronRight, ClipboardList, Clock3, Eye, FileText, PackageCheck, Pencil, Plus, Search, X } from 'lucide-react';
import useAuthorization from '@/Hooks/useAuthorization';
import SortableTableHeader from '@/Components/ui/sortable-table-header';
import { formatDisplayDate } from '@/utils/dateUtils';
import CoordinatorPortalHeader from '../../Coordinator/components/CoordinatorPortalHeader';
import { panel, secondaryButton } from '../../Coordinator/inventory';
import { SupplyRequest } from '../types';
import { RequestStatusBadge } from './RequestStatusBadge';
import StatusBadge from '@/Components/ui/status-badge';
import Select from 'react-select';
import { institutionalSelectStyles } from '@/styles/selectStyles';

export type RequestSortKey = 'reference' | 'purpose' | 'recipient' | 'status' | 'date' | 'items';

interface Props {
    userName: string;
    counts: { total: number; pending: number; correction: number; approved: number; issued: number; pre_requested?: number; stock_restocked?: number };
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
    sort: RequestSortKey;
    direction: 'asc' | 'desc';
    onSearch: (value: string) => void;
    onStatus: (value: string) => void;
    onSort: (sort: RequestSortKey) => void;
    onPage: (page: number) => void;
    onCreate: () => void;
    onDetails: (request: SupplyRequest) => void;
    onEdit: (request: SupplyRequest) => void;
    onRis: (request: SupplyRequest) => void;
    onCancel: (request: SupplyRequest) => void;
}

const reference = (request: SupplyRequest) => request.ris_number || `Request #${request.id}`;
const adjusted = (request: SupplyRequest) => ['Approved', 'Issued', 'Ready for Pickup', 'Released'].includes(request.status)
    && request.items.some(line => line.approved_quantity != null && line.approved_quantity !== line.quantity);
const isUrgent = (request: SupplyRequest) => Boolean(request.purpose && /\[URGENT\]/i.test(request.purpose));

function RequestedSupplies({ request, includePurpose = true }: { request: SupplyRequest; includePurpose?: boolean }) {
    return (
        <div className="space-y-1.5">
            {request.items.slice(0, 2).map(line => (
                <div key={line.id} className="flex items-start justify-between gap-3 text-sm">
                    <span className="min-w-0 text-slate-800 dark:text-slate-200">{line.item?.name || 'Archived item'}</span>
                    <span className="shrink-0 tabular-nums text-slate-500 dark:text-slate-400">{line.quantity} {line.item?.unit_of_issue || 'units'}</span>
                </div>
            ))}
            {request.items.length > 2 && <p className="text-sm font-medium text-slate-500 dark:text-slate-400">+{request.items.length - 2} more item types</p>}
            {includePurpose && <p className="line-clamp-2 pt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{request.purpose}</p>}
        </div>
    );
}

export default function CoordinatorRequestsWorkspace(props: Props) {
    const { can } = useAuthorization();
    const { auth } = usePage<any>().props;

    const displayRequests = useMemo(() => {
        return [...props.requests].sort((a, b) => {
            const aUrgent = isUrgent(a) ? 1 : 0;
            const bUrgent = isUrgent(b) ? 1 : 0;
            return bUrgent - aUrgent;
        });
    }, [props.requests]);

    const isAuthorizedPersonnel = Boolean(auth.capabilities?.requiresSupportingDocument);
    const supplyOwner = isAuthorizedPersonnel ? 'office' : 'unit';
    const stats = [
        { label: 'All requests', count: props.counts.total, status: '', icon: ClipboardList, color: 'bg-red-50 text-red-900 dark:bg-red-950/50 dark:text-red-300', hint: 'Your supply requisitions' },
        { label: 'Pending review', count: props.counts.pending, status: 'Pending', icon: Clock3, color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300', hint: 'With the Supply Office' },
        { label: 'Needs correction', count: props.counts.correction, status: 'For Correction', icon: Pencil, color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300', hint: 'Action required from you' },
        { label: 'Awaiting release', count: props.counts.approved, status: 'Approved', icon: PackageCheck, color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300', hint: 'Approved quantities confirmed' },
        { label: 'Released', count: props.counts.issued, status: 'Issued', icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300', hint: `Added to your ${supplyOwner} inventory` },
        { label: 'Pre-Requested', count: props.counts.pre_requested ?? 0, status: 'Pre-Requested', icon: Clock3, color: 'bg-amber-100/70 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300', hint: 'Awaiting central replenishment' },
        { label: 'Stock Restocked', count: props.counts.stock_restocked ?? 0, status: 'Stock Restocked', icon: CheckCircle2, color: 'bg-emerald-100/70 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300', hint: 'Restocked at SPMO' },
    ];
    const status = (request: SupplyRequest) => (
        <div className="space-y-2">
            <RequestStatusBadge status={request.status} />
            {adjusted(request) && <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Quantities adjusted · see details</p>}
            {request.document_verification_remarks && <p className="text-sm text-rose-700 dark:text-rose-300">{request.document_verification_remarks}</p>}
            {request.review_remarks && <p className="line-clamp-2 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">{request.review_remarks}</p>}
        </div>
    );
    const empty = (
        <div className="flex flex-col items-center px-5 py-14 text-center">
            <div className="mb-4 rounded-full bg-slate-100 p-4 text-slate-500 dark:bg-slate-800 dark:text-slate-300"><ClipboardList size={26} /></div>
            <h2 className="text-xl font-semibold">{props.counts.total ? 'No requests match your filters' : 'Your supply requests start here'}</h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">{props.counts.total ? 'Try another RIS number, item name, or request status.' : 'Browse the central catalog or create a request. You can follow its review and release here.'}</p>
            {props.counts.total > 0 && <Button variant="secondary" type="button" onClick={() => { props.onSearch(''); props.onStatus(''); }} className="mt-5">Clear search and filters</Button>}
        </div>
    );

    const actions = (request: SupplyRequest) => (
        <div className="inline-flex items-center justify-end gap-2 flex-wrap">
            <Button variant="secondary" type="button" aria-label={`View details for ${reference(request)}`} onClick={() => props.onDetails(request)} className={`${secondaryButton} min-h-[2.25rem] h-[2.25rem] gap-1.5 inline-flex items-center justify-center `}>
                <Eye size={14} />Details
            </Button>
            {request.status === 'Stock Restocked' && can('inventory.requests.update') && (
                <Button variant="secondary"
                    type="button"
                    aria-label={`Proceed with requisition for ${reference(request)}`}
                    onClick={() => props.onEdit(request)}
                    className="inline-flex min-h-[2.25rem] h-[2.25rem] items-center justify-center gap-1.5"
                >
                    <CheckCircle2 size={14} />Proceed to Requisition
                </Button>
            )}
            {['Pending', 'Pending Verification', 'For Correction', 'Pre-Requested'].includes(request.status) && can('inventory.requests.update') && (
                <Button variant="secondary" type="button" aria-label={`Edit ${reference(request)}`} onClick={() => props.onEdit(request)} className="inline-flex min-h-[2.25rem] h-[2.25rem] items-center justify-center gap-1.5">
                    <Pencil size={14} />Edit
                </Button>
            )}
            {['Approved', 'Issued', 'Ready for Pickup', 'Released'].includes(request.status) && (
                <Button variant="secondary" type="button" aria-label={`View RIS for ${reference(request)}`} onClick={() => props.onRis(request)} className={`${secondaryButton} min-h-[2.25rem] h-[2.25rem] gap-1.5 inline-flex items-center justify-center `}>
                    <FileText size={14} />RIS Form
                </Button>
            )}
            {['Pending', 'Pending Verification', 'For Correction', 'Pre-Requested', 'Stock Restocked'].includes(request.status) && can('inventory.requests.delete') && (
                <Button variant="secondary" type="button" aria-label={`Cancel request ${reference(request)}`} disabled={props.busy === request.id} onClick={() => props.onCancel(request)} className="inline-flex min-h-[2.25rem] h-[2.25rem] items-center justify-center gap-1.5">
                    <X size={14} />Cancel
                </Button>
            )}
        </div>
    );

    return (
        <>
            <CoordinatorPortalHeader />
            <DashboardContent>
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Link href={route('dashboard')} className="hover:text-red-900 dark:hover:text-red-300 dark:text-red-300">{isAuthorizedPersonnel ? 'Office Dashboard' : 'Delivery Unit Dashboard'}</Link>
                    <ChevronRight size={13} />
                    <span className="text-slate-700 dark:text-slate-300">My Requests</span>
                </nav>
                <PageHeader embedded title="My Supply Requests" description={`Request supplies for your ${isAuthorizedPersonnel ? "office" : "Delivery Unit"} and follow each requisition from review to release.`} actions={<><div className="flex flex-wrap gap-2.5">
                        {can('coordinator.catalog.index') && (
                            <Link data-variant="secondary" data-size="default" href={route('coordinator.catalog.index')} className={"ui-button " + (secondaryButton)}>
                                Browse Central Stock<ArrowRight size={15} />
                            </Link>
                        )}
                        {can('inventory.requests.store') && (
                            <Button variant="primary" type="button" onClick={props.onCreate} className="inline-flex min-h-11 items-center justify-center gap-2">
                                <Plus size={17} />New Request
                            </Button>
                        )}
                    </div></>} />
                <section data-tour="coordinator-request-summary" aria-label="My request overview" className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {stats.map(stat => (
                        <Button variant="unstyled" key={stat.label} type="button" onClick={() => props.onStatus(stat.status)} aria-label={`Show ${stat.label.toLowerCase()}`} aria-pressed={props.status === stat.status} className={`${panel} flex min-w-0 items-start justify-between gap-3 p-4 text-left transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 sm:p-5 ${props.status === stat.status ? "border-red-300 bg-red-50/70 ring-1 ring-red-900/20 dark:border-red-800 dark:bg-red-950/20" : ""}`}>
                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">{stat.label}</span>
                                <span className="mt-2 block text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">{stat.count}</span>
                                <span className="mt-1.5 block text-sm leading-relaxed text-slate-500 sm:text-sm dark:text-slate-400">{stat.hint}</span>
                            </span>
                            <span className={`hidden shrink-0 rounded-xl p-2.5 sm:inline-flex ${stat.color}`}>
                                <stat.icon size={20} />
                            </span>
                        </Button>
                    ))}
                </section>
                <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-red-50/60 px-4 py-3.5 text-sm text-red-950 sm:flex-row sm:items-center sm:justify-between dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-200">
                    <p className="leading-relaxed">Approved supplies enter your {supplyOwner} inventory when the Supply Office releases them.</p>
                    <div className="flex shrink-0 items-center gap-2 text-sm font-semibold">
                        <span>Submit request</span><ArrowRight size={13} className="opacity-50" /><span>Staff review</span><ArrowRight size={13} className="opacity-50" /><span>Release</span>
                    </div>
                </div>
                <section data-tour="coordinator-request-workspace" className={`${panel} overflow-hidden`} aria-label="My supply requisitions">
                    <div className="table-toolbar flex flex-col justify-between gap-3 border-b border-slate-100 p-4 sm:px-6 sm:py-5 xl:flex-row xl:items-center dark:border-slate-800">
                        <div className="relative min-w-0 flex-1 xl:max-w-md">
                            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300" />
                            <input type="search" aria-label="Search my supply requests" placeholder="Search RIS number, item, recipient, or purpose…" value={props.search} onChange={event => props.onSearch(event.target.value)} className="ui-field h-11 w-full rounded-lg border-slate-300 bg-white pl-10 pr-10 text-sm placeholder:text-slate-400 focus:border-red-800 focus:ring-red-800 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100" />
                            {props.search && (
                                <Button variant="secondary" size="icon" type="button" aria-label="Clear request search" onClick={() => props.onSearch('')} className="absolute right-1 top-1">
                                    <X size={16} />
                                </Button>
                            )}
                        </div>
                        <div className="w-full sm:w-64 min-w-0">
                            <Select
                                value={props.statusOptions.find(opt => opt.value === props.status) || props.statusOptions[0]}
                                onChange={opt => props.onStatus(opt?.value || '')}
                                options={props.statusOptions}
                                styles={institutionalSelectStyles}
                                classNamePrefix="react-select"
                                isSearchable={false}
                                aria-label="Filter requests by status"
                            />
                        </div>
                    </div>

                    {props.requests.length ? (
                        <>
                            <div className="hidden overflow-x-auto lg:block w-full min-w-0">
                                <table className="ui-data-table w-full text-left text-sm min-w-[60rem] border-collapse">
                                    <thead className="border-b border-slate-200 dark:border-slate-800">
                                        <tr>
                                            <SortableTableHeader column="reference" activeColumn={props.sort} direction={props.direction} onSort={props.onSort} className="whitespace-nowrap px-5 py-3.5 font-semibold min-w-[7.5rem]">
                                                Request
                                            </SortableTableHeader>
                                            <SortableTableHeader column="date" activeColumn={props.sort} direction={props.direction} onSort={props.onSort} className="whitespace-nowrap px-5 py-3.5 font-semibold min-w-[7rem]">
                                                Date
                                            </SortableTableHeader>
                                            <SortableTableHeader column="items" activeColumn={props.sort} direction={props.direction} onSort={props.onSort} className="whitespace-nowrap px-5 py-3.5 font-semibold min-w-[11.25rem]">
                                                Supplies
                                            </SortableTableHeader>
                                            <SortableTableHeader column="purpose" activeColumn={props.sort} direction={props.direction} onSort={props.onSort} className="whitespace-nowrap px-5 py-3.5 font-semibold min-w-[11.25rem]">
                                                Purpose
                                            </SortableTableHeader>
                                            <SortableTableHeader column="recipient" activeColumn={props.sort} direction={props.direction} onSort={props.onSort} className="whitespace-nowrap px-5 py-3.5 font-semibold min-w-[11.25rem]">
                                                Recipient / Office
                                            </SortableTableHeader>
                                            <SortableTableHeader column="status" activeColumn={props.sort} direction={props.direction} onSort={props.onSort} className="whitespace-nowrap px-5 py-3.5 font-semibold min-w-[7.5rem]">
                                                Status
                                            </SortableTableHeader>
                                            <th scope="col" className="whitespace-nowrap px-5 py-3.5 font-semibold text-right min-w-[12.5rem]">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {displayRequests.map(request => {
                                            const urgent = isUrgent(request);
                                            return (
                                                <tr key={request.id} className={`transition ${urgent ? "bg-red-50/50 hover:bg-red-50/80 dark:bg-red-950/20 dark:hover:bg-red-950/30 border-l-4 border-red-600" : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"}`}>
                                                    <th scope="row" className="min-w-36 px-5 py-3.5 align-middle font-semibold text-slate-900 dark:text-slate-100">
                                                        <div className="flex flex-col gap-1 items-start">
                                                            <span>{reference(request)}</span>
                                                            {urgent && (
                                                                <StatusBadge tone="danger">
                                                                    ⚡ Urgent
                                                                </StatusBadge>
                                                            )}
                                                        </div>
                                                    </th>
                                                    <td className="whitespace-nowrap px-5 py-3.5 align-middle text-slate-500 dark:text-slate-400">
                                                        {formatScreenDate(request.date_requested || request.created_at)}
                                                    </td>
                                                    <td className="min-w-52 px-5 py-3.5 align-middle">
                                                        <RequestedSupplies request={request} includePurpose={false} />
                                                    </td>
                                                    <td className="min-w-52 max-w-xs px-5 py-3.5 align-middle text-slate-500 dark:text-slate-400">
                                                        {request.purpose.replace(/^\[URGENT\]\s*/i, '')}
                                                    </td>
                                                    <td className="min-w-44 max-w-56 px-5 py-3.5 align-middle">
                                                        <p className="text-sm font-medium">{request.recipient || request.requester?.name || props.userName}</p>
                                                        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{request.department}</p>
                                                    </td>
                                                    <td className="px-5 py-3.5 align-middle">
                                                        {status(request)}
                                                    </td>
                                                    <td className="min-w-[12.5rem] whitespace-nowrap px-5 py-3.5 align-middle text-right">
                                                        {actions(request)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="divide-y divide-slate-100 lg:hidden dark:divide-slate-800">
                                {displayRequests.map(request => {
                                    const urgent = isUrgent(request);
                                    return (
                                        <article key={request.id} className={`space-y-4 p-4 sm:p-5 ${urgent ? "bg-red-50/50 dark:bg-red-950/20 border-l-4 border-red-600" : ""}`}>
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h2 className="text-xl font-semibold">{reference(request)}</h2>
                                                        {urgent && (
                                                            <StatusBadge tone="danger">
                                                                ⚡ Urgent
                                                            </StatusBadge>
                                                        )}
                                                    </div>
                                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formatScreenDate(request.date_requested || request.created_at)}</p>
                                                </div>
                                                {status(request)}
                                            </div>
                                            <RequestedSupplies request={request} />
                                            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">{request.recipient || request.requester?.name || props.userName} · {request.department}</p>
                                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                                {actions(request)}
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </>
                    ) : empty}
                    <div className="ui-pagination flex flex-col justify-between gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:px-6 dark:border-slate-800">
                        <p role="status" className="text-sm text-slate-500 dark:text-slate-400">
                            Showing {props.from}–{props.to} of {props.filteredCount} requests
                        </p>
                        <nav aria-label="Request pages" className="flex items-center gap-2">
                            <Button variant="secondary" type="button" disabled={props.page <= 1} onClick={() => props.onPage(props.page - 1)} className={`${secondaryButton} min-h-9 `}>
                                Previous
                            </Button>
                            <span className="px-1 text-sm tabular-nums text-slate-500 dark:text-slate-400">{props.page} / {props.lastPage}</span>
                            <Button variant="secondary" type="button" disabled={props.page >= props.lastPage} onClick={() => props.onPage(props.page + 1)} className={`${secondaryButton} min-h-9 `}>
                                Next
                            </Button>
                        </nav>
                    </div>
                </section>
                <footer className="flex flex-wrap justify-between gap-2 pb-2 text-sm text-slate-500 dark:text-slate-400">
                    <span>My requests only · {props.userName}</span>
                    {can('coordinator.inventory.index') && (
                        <Link href={route('coordinator.inventory.index')} className="font-medium hover:text-red-900 dark:hover:text-red-300 dark:text-red-300">
                            View my {supplyOwner} inventory →
                        </Link>
                    )}
                </footer>
            </DashboardContent>
        </>
    );
}
