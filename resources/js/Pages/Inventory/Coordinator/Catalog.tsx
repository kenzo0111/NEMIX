import PageHeader from '@/Components/PageHeader';
import { Button } from '@/Components/ui/button';
import TablePagination from '@/Components/ui/table-pagination';
import DashboardContent from '@/Layouts/DashboardContent';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { ArrowRight, ChevronRight, ClipboardList, Eye, Loader2, Package, RefreshCw, Search } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { getSidebarModules } from '@/utils/sidebarConfig';
import { panel, secondaryButton } from './inventory';
import CatalogTable from './components/CatalogTable';
import type { CatalogItem, CatalogSortKey } from './catalog';
import type { SortDirection } from '@/Hooks/useSortableData';
import useAuthorization from '@/Hooks/useAuthorization';
import useStockRefresh from '@/Hooks/useStockRefresh';
import Select from 'react-select';
import { institutionalSelectStyles } from '@/styles/selectStyles';

const availabilityOptions = [
    { value: 'all', label: 'All supplies' },
    { value: 'available', label: 'Available to request' },
    { value: 'unavailable', label: 'Currently unavailable' },
];

interface Props {
    items: { data: CatalogItem[]; from: number | null; to: number | null; total: number; links: { url: string | null; label: string; active: boolean }[] };
    filters: { search: string; availability: string; sort?: CatalogSortKey; direction?: SortDirection };
    lowStockThreshold: number;
}

export default function CentralSupplyCatalog({ items, filters, lowStockThreshold }: Props) {
    const { auth } = usePage<any>().props;
    const { can } = useAuthorization();
    const isAuthorizedPersonnel = Boolean(auth.capabilities?.requiresSupportingDocument);
    const supplyOwner = isAuthorizedPersonnel ? 'office' : 'unit';
    const [search, setSearch] = useState(filters.search);
    const [availability, setAvailability] = useState(filters.availability);
    const [loading, setLoading] = useState(false);
    const [sortKey, setSortKey] = useState<CatalogSortKey>(filters.sort || 'name');
    const [direction, setDirection] = useState<SortDirection>(filters.direction || 'asc');
    useStockRefresh(['items', 'lowStockThreshold']);
    useEffect(() => { setSearch(filters.search); setAvailability(filters.availability); setSortKey(filters.sort || 'name'); setDirection(filters.direction || 'asc'); }, [filters.search, filters.availability, filters.sort, filters.direction]);
    const load = (query: string, status: string, nextSort = sortKey, nextDirection = direction) => router.get(route('coordinator.catalog.index'), { search: query.trim(), availability: status, sort: nextSort, direction: nextDirection, page: 1 }, {
        preserveState: true, preserveScroll: true, onStart: () => setLoading(true), onFinish: () => setLoading(false),
    });
    const handleSort = (key: CatalogSortKey) => {
        const nextDirection = sortKey === key && direction === 'asc' ? 'desc' : 'asc';
        setSortKey(key); setDirection(nextDirection);
        load(search, availability, key, nextDirection);
    };

    return <>
        <Head title={`Central Supply Catalog | ${auth.capabilities?.requiresSupportingDocument ? 'Authorized Personnel' : 'Supply Coordinator'}`} />

        <DashboardLayout modules={getSidebarModules()} user={auth.user}>
            <DashboardContent>
                <PageHeader
                    embedded
                    title="Central Supply Catalog"
                    description={`Browse consumable supplies in the Supply Office and check what is available for your ${supplyOwner}.`}
                    breadcrumbs={[
                        { name: isAuthorizedPersonnel ? 'Office Dashboard' : 'Delivery Unit Dashboard', href: route('dashboard') },
                        { name: 'Central Supply Catalog' },
                    ]}
                    actions={
                        can('inventory.requests.index') ? (
                            <Link data-variant="secondary" data-size="default" href={route('inventory.requests.index')} className="ui-button self-start lg:self-auto">
                                <ClipboardList size={16} aria-hidden="true" />My Requests<ArrowRight size={14} aria-hidden="true" />
                            </Link>
                        ) : undefined
                    }
                />
                <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-900/40 dark:bg-blue-950/20"><Eye size={19} className="mt-0.5 shrink-0 text-blue-700 dark:text-blue-300" /><div><p className="leading-relaxed text-sm font-semibold text-blue-900 dark:text-blue-200">Central stock · View only</p><p className="mt-1 text-sm leading-relaxed text-blue-800 dark:text-blue-300">Available quantities reflect stock on hand excluding reservations for approved requests. Items meeting or below {lowStockThreshold} units display a low-stock notice. Supplies enter your {supplyOwner} inventory only after the Supply Office releases them.</p></div></div>
                <section data-tour="coordinator-catalog-search" className={`${panel} overflow-hidden`} aria-label="Browse central consumables">
                    <form onSubmit={event => { event.preventDefault(); load(search, availability); }} className="table-toolbar flex flex-col gap-3 p-4 sm:p-5 xl:flex-row xl:items-center">
                        <div className="relative min-w-0 flex-1"><Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300" /><input type="search" aria-label="Search central supplies by name or stock number" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search item name or stock number…" maxLength={150} className="ui-field table-control w-full rounded-lg border-slate-300 pl-10 text-sm placeholder:text-slate-400 focus:border-red-800 focus:ring-red-800 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100" /></div>
                        <div className="flex flex-wrap items-center gap-2.5"><div className="w-full sm:w-52 min-w-0"><Select value={availabilityOptions.find(opt => opt.value === availability) || availabilityOptions[0]} onChange={opt => { const nextVal = opt?.value || 'all'; setAvailability(nextVal); load(search, nextVal); }} options={availabilityOptions} styles={institutionalSelectStyles} classNamePrefix="react-select" isSearchable={false} aria-label="Filter central supplies availability" /></div><Button variant="secondary" type="submit" disabled={loading} className={`${secondaryButton} flex-1 sm:flex-none`}>{loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}Search</Button><Button variant="secondary" size="icon" type="button" aria-label="Refresh central stock availability" disabled={loading} onClick={() => router.reload({ only: ['items', 'lowStockThreshold'], onStart: () => setLoading(true), onFinish: () => setLoading(false) })} className={`${secondaryButton} `}><RefreshCw size={16} className={loading ? "animate-spin" : ""} /></Button></div>
                    </form>
                    <div role="status" className="border-t border-slate-100 px-5 py-3 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">Showing {items.from ?? 0}–{items.to ?? 0} of {items.total} consumable items{filters.search && <> matching “{filters.search}”</>}</div>
                </section>
                <CatalogTable items={items.data} sort={{ key: sortKey, direction }} onSort={handleSort} />
                {items.data.length === 0 && <div className={`${panel} px-5 py-14 text-center`}><Package size={28} className="mx-auto mb-4 text-slate-500 dark:text-slate-300" /><h2 className="text-xl font-semibold">No supplies found</h2><p className="leading-relaxed mt-2 text-sm text-slate-500 dark:text-slate-400">Try another item name or change the availability filter.</p><Button variant="secondary" type="button" onClick={() => load('', 'all')} className="mt-5">Clear search and filters</Button></div>}
                {(() => {
                    const numericLinks = items.links.filter((l) => /^\d+$/.test(l.label.trim()));
                    const activeLink = numericLinks.find((l) => l.active);
                    const currentPage = activeLink ? Number(activeLink.label) : 1;
                    const totalPages = numericLinks.length > 0 ? Number(numericLinks[numericLinks.length - 1].label) : 1;
                    const prevUrl = items.links[0]?.url;
                    const nextUrl = items.links[items.links.length - 1]?.url;
                    return (
                        <TablePagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalRecords={items.total}
                            from={items.from ?? 0}
                            to={items.to ?? 0}
                            onPageChange={(nextPage) => {
                                const url = nextPage < currentPage ? prevUrl : nextUrl;
                                if (url) router.get(url, {}, { preserveScroll: true, preserveState: true });
                            }}
                            recordLabel="consumable items"
                            className="rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
                        />
                    );
                })()}
                <footer className="flex flex-wrap justify-between gap-2 pb-2 text-sm text-slate-500 dark:text-slate-400"><span>Supply Office catalog · Consumables</span>{can('coordinator.inventory.index') && <Link href={route('coordinator.inventory.index')} className="font-medium hover:text-red-900 dark:hover:text-red-300">View my {supplyOwner} inventory →</Link>}</footer>
            </DashboardContent>
        </DashboardLayout>
    </>;
}
