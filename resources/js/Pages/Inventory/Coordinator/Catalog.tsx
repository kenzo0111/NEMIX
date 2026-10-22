import DashboardContent from '@/Layouts/DashboardContent';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { ArrowRight, ChevronRight, ClipboardList, Eye, Loader2, Package, RefreshCw, Search } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { getSidebarModules } from '@/utils/sidebarConfig';
import CoordinatorPortalHeader from './components/CoordinatorPortalHeader';
import { panel, secondaryButton, stockStatus } from './inventory';

interface CatalogItem {
    id: number; name: string; sku: string; description: string | null;
    unit: string | null; on_hand: number; available_quantity: number;
}
interface Props {
    items: { data: CatalogItem[]; from: number | null; to: number | null; total: number; links: { url: string | null; label: string; active: boolean }[] };
    filters: { search: string; availability: string };
    lowStockThreshold: number;
}

export default function CentralSupplyCatalog({ items, filters, lowStockThreshold }: Props) {
    const { auth } = usePage<any>().props;
    const [search, setSearch] = useState(filters.search);
    const [availability, setAvailability] = useState(filters.availability);
    const [loading, setLoading] = useState(false);
    useEffect(() => { setSearch(filters.search); setAvailability(filters.availability); }, [filters.search, filters.availability]);
    const load = (query: string, status: string) => router.get(route('coordinator.catalog.index'), { search: query.trim(), availability: status }, {
        preserveState: true, preserveScroll: true, onStart: () => setLoading(true), onFinish: () => setLoading(false),
    });

    return <>
        <Head title={`Central Supply Catalog | ${auth.capabilities?.requiresSupportingDocument ? 'Authorized Personnel' : 'Supply Coordinator'}`} />

        <DashboardLayout modules={getSidebarModules()} user={auth.user}>
            <CoordinatorPortalHeader />
            <DashboardContent>
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><Link href={route('dashboard')} className="hover:text-red-900 dark:hover:text-red-300">Delivery Unit Dashboard</Link><ChevronRight size={13} /><span className="text-slate-700 dark:text-slate-300">Central Supply Catalog</span></nav>
                <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                    <div><p className="leading-relaxed mb-2 text-sm font-bold normal-case tracking-normal text-red-900 dark:text-red-300">Supply & Property Management Office</p><h2 className="text-2xl sm:text-3xl font-sans font-bold tracking-tight ">Central Supply Catalog</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">Browse consumable supplies in the Supply Office and check what is available for your unit.</p></div>
                    <Link href={route('inventory.requests.index')} className={`${secondaryButton} self-start lg:self-auto`}><ClipboardList size={16} />My Requests<ArrowRight size={14} /></Link>
                </section>
                <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-900/40 dark:bg-blue-950/20"><Eye size={19} className="mt-0.5 shrink-0 text-blue-700 dark:text-blue-300" /><div><p className="leading-relaxed text-sm font-semibold text-blue-900 dark:text-blue-200">Central stock · View only</p><p className="mt-1 text-sm leading-relaxed text-blue-800 dark:text-blue-300">Available quantities exclude stock reserved for approved requests. Supplies enter your unit inventory only after the Supply Office releases them.</p></div></div>
                <section className={`${panel} overflow-hidden`} aria-label="Browse central consumables">
                    <form onSubmit={event => { event.preventDefault(); load(search, availability); }} className="flex flex-col gap-3 p-4 sm:p-5 xl:flex-row xl:items-center">
                        <div className="relative min-w-0 flex-1"><Search size={17} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" /><input type="search" aria-label="Search central supplies by name or stock number" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search item name or stock number…" maxLength={150} className="min-h-11 w-full rounded-lg border-slate-300 pl-10 text-sm placeholder:text-slate-400 focus:border-red-800 focus:ring-red-800 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100" /></div>
                        <div className="flex flex-wrap items-center gap-2.5"><label className="flex w-full min-w-0 items-center gap-2 text-sm text-slate-500 sm:w-auto sm:flex-1 dark:text-slate-400"><span>Availability</span><select value={availability} onChange={event => { setAvailability(event.target.value); load(search, event.target.value); }} className="min-h-11 min-w-0 flex-1 rounded-lg border-slate-300 py-2 pl-3 pr-9 text-sm text-slate-700 focus:border-red-800 focus:ring-red-800 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200"><option value="all">All supplies</option><option value="available">Available to request</option><option value="unavailable">Currently unavailable</option></select></label><button disabled={loading} className={`${secondaryButton} flex-1 disabled:opacity-50 sm:flex-none`}>{loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}Search</button><button type="button" aria-label="Refresh central stock availability" disabled={loading} onClick={() => router.reload({ only: ['items'], onStart: () => setLoading(true), onFinish: () => setLoading(false) })} className={`${secondaryButton} px-3 disabled:opacity-50`}><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button></div>
                    </form>
                    <div role="status" className="border-t border-slate-100 px-5 py-3 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">Showing {items.from ?? 0}–{items.to ?? 0} of {items.total} consumable items{filters.search && <> matching “{filters.search}”</>}</div>
                </section>
                <section aria-label="Central consumable items" aria-busy={loading} className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                    {items.data.map(item => {
                        const status = item.available_quantity <= 0 && item.on_hand > 0
                            ? { label: 'Fully reserved', classes: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' }
                            : stockStatus(item.available_quantity, lowStockThreshold);
                        return <article key={item.id} className={`${panel} flex min-w-0 flex-col overflow-hidden`}>
                            <div className="flex-1 p-5"><div className="mb-4 flex items-center justify-between gap-2"><span className="rounded-xl bg-red-50 p-2.5 text-red-900 dark:bg-red-950/50 dark:text-red-300"><Package size={21} /></span><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium ${status.classes}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{status.label}</span></div><h2 className="text-xl font-semibold">{item.name}</h2><p className="leading-relaxed mt-1 break-all tabular-nums text-sm text-slate-500 dark:text-slate-400">{item.sku}</p>{item.description && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{item.description}</p>}<dl className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3.5 dark:bg-slate-950/50"><div><dt className="text-sm text-slate-500 dark:text-slate-400">In Supply Office</dt><dd className="mt-1.5 font-semibold tabular-nums">{item.on_hand.toLocaleString()} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">{item.unit ?? 'units'}</span></dd></div><div className="border-l border-slate-200 pl-3 dark:border-slate-700"><dt className="text-sm text-slate-500 dark:text-slate-400">Available to request</dt><dd className="mt-1.5 font-bold tabular-nums text-red-900 dark:text-red-300">{item.available_quantity.toLocaleString()} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">{item.unit ?? 'units'}</span></dd></div></dl></div>
                            <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">{item.available_quantity > 0 ? <Link href={route('inventory.requests.index', { create: 1, item_id: item.id })} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-red-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2">Request This Item<ArrowRight size={15} /></Link> : <button disabled className="min-h-10 w-full cursor-not-allowed rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">{item.on_hand > 0 ? 'All stock is reserved' : 'Awaiting replenishment'}</button>}</div>
                        </article>;
                    })}
                </section>
                {items.data.length === 0 && <div className={`${panel} px-5 py-14 text-center`}><Package size={28} className="mx-auto mb-4 text-slate-400" /><h2 className="text-xl font-semibold">No supplies found</h2><p className="leading-relaxed mt-2 text-sm text-slate-500 dark:text-slate-400">Try another item name or change the availability filter.</p><button type="button" onClick={() => load('', 'all')} className="mt-5 text-sm font-semibold text-red-900 dark:text-red-300">Clear search and filters</button></div>}
                <nav aria-label="Central catalog pages" className="flex flex-wrap justify-center gap-1.5">{items.links.map((link, i) => link.url ? <Link key={i} href={link.url} preserveScroll preserveState aria-current={link.active ? 'page' : undefined} className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg px-3 text-sm font-medium ${link.active ? 'bg-red-900 text-white' : 'border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800'}`} dangerouslySetInnerHTML={{ __html: link.label }} /> : <span key={i} className="inline-flex min-h-10 items-center px-3 text-sm text-slate-400" dangerouslySetInnerHTML={{ __html: link.label }} />)}</nav>
                <footer className="flex flex-wrap justify-between gap-2 pb-2 text-sm text-slate-500 dark:text-slate-400"><span>Supply Office catalog · Consumables</span><Link href={route('coordinator.inventory.index')} className="font-medium hover:text-red-900 dark:hover:text-red-300">View my unit inventory →</Link></footer>
            </DashboardContent>
        </DashboardLayout>
    </>;
}
