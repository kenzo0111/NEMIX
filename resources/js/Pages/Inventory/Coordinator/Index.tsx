import { Head, Link, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { ArrowRight, Boxes, ChevronRight, ClipboardList, FileText, History, Package, Plus, Search, Wallet, X } from 'lucide-react';
import Sidebar from '@/Components/Sidebar';
import CoordinatorPortalHeader from './components/CoordinatorPortalHeader';
import { useSidebarCollapse } from '@/Hooks/useSidebarCollapse';
import { getSidebarModules } from '@/utils/sidebarConfig';
import IssueDialog from './components/IssueDialog';
import StockCardDialog from './components/StockCardDialog';
import StockList from './components/StockList';
import TransactionHistory, { MovementPage } from './components/TransactionHistory';
import { Stock, money, panel, secondaryButton } from './inventory';

interface Props { stocks: Stock[]; lowStockThreshold: number; movements: MovementPage; }

export default function CoordinatorInventory({ stocks, movements, lowStockThreshold }: Props) {
    const { auth } = usePage<any>().props;
    const [collapsed, toggle] = useSidebarCollapse();
    const [tab, setTab] = useState<'inventory' | 'history'>(() => {
        if (typeof window === 'undefined') return 'inventory';
        const params = new URLSearchParams(window.location.search);
        return params.has('page') || params.get('tab') === 'history' ? 'history' : 'inventory';
    });
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [issueStock, setIssueStock] = useState<Stock | null>(null);
    const [reportStock, setReportStock] = useState<Stock | null>(null);
    const filteredStocks = useMemo(() => stocks.filter(stock => {
        const matchesSearch = `${stock.name} ${stock.sku}`.toLowerCase().includes(search.trim().toLowerCase());
        return matchesSearch && (filter === 'all' || (filter === 'available' && stock.quantity > lowStockThreshold)
            || (filter === 'low' && stock.quantity > 0 && stock.quantity <= lowStockThreshold) || (filter === 'empty' && stock.quantity <= 0));
    }), [stocks, search, filter, lowStockThreshold]);
    const available = stocks.filter(stock => stock.quantity > 0).length;
    const low = stocks.filter(stock => stock.quantity <= lowStockThreshold).length;
    const totalValue = stocks.reduce((total, stock) => total + Number(stock.value), 0);

    return <div className="min-h-screen bg-[#F5F6F8] font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <Head title="Delivery Unit Inventory | Supply Coordinator" />
        <Sidebar modules={getSidebarModules()} user={auth.user} collapsed={collapsed} onToggleCollapse={toggle} />
        <main className={`min-w-0 transition-all duration-300 ${collapsed ? 'md:ml-20' : 'md:ml-72'}`}>
            <CoordinatorPortalHeader />
            <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-7 lg:p-8">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><Link href={route('dashboard')} className="hover:text-red-900 dark:hover:text-red-300">Coordinator Dashboard</Link><ChevronRight size={13} /><span className="text-slate-700 dark:text-slate-300">Unit Inventory</span></nav>
                <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center"><div><p className="leading-relaxed mb-2 text-sm font-bold normal-case tracking-normal text-red-900 dark:text-red-300">Supply & Property Management Office</p><h1 className="text-2xl sm:text-3xl font-sans font-bold tracking-tight ">Delivery Unit Inventory</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">Manage your unit’s supplies, record distributions, and prepare official Stock Cards.</p></div><div className="flex flex-wrap gap-2.5"><Link href={route('inventory.requests.index')} className={secondaryButton}><ClipboardList size={16} />My Requests</Link><Link href={route('inventory.requests.index', { create: 1 })} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2"><Plus size={17} />Request Supplies</Link></div></section>
                <section aria-label="Unit inventory overview" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
                    <div className={`${panel} flex min-w-0 items-start justify-between gap-3 p-4 sm:p-5`}><div className="min-w-0"><p className="leading-relaxed text-sm text-slate-600 dark:text-slate-400">Supplies in stock</p><p className="mt-2 text-xl font-bold tabular-nums sm:text-2xl">{available}<span className="ml-2 text-sm font-normal text-slate-500 sm:text-sm">item types</span></p><p className="leading-relaxed mt-2 text-sm text-slate-500 dark:text-slate-400">Available in your Delivery Unit</p></div><span className="hidden rounded-xl bg-red-50 p-2.5 text-red-900 xl:inline-flex dark:bg-red-950/60 dark:text-red-300"><Boxes size={20} /></span></div>
                    <div className={`${panel} flex min-w-0 items-start justify-between gap-3 p-4 sm:p-5`}><div className="min-w-0"><p className="leading-relaxed text-sm text-slate-600 dark:text-slate-400">Inventory value</p><p className="mt-2 break-words text-lg font-bold tracking-tight tabular-nums sm:text-2xl">{money(totalValue)}</p><p className="leading-relaxed mt-2 text-sm text-slate-500 dark:text-slate-400">Total value of supplies on hand</p></div><span className="hidden rounded-xl bg-slate-100 p-2.5 text-slate-600 xl:inline-flex dark:bg-slate-800 dark:text-slate-300"><Wallet size={20} /></span></div>
                    <div className={`${panel} col-span-2 flex items-start justify-between gap-3 p-4 sm:p-5 xl:col-span-1`}><div><p className="leading-relaxed text-sm text-slate-600 dark:text-slate-400">For replenishment</p><p className="mt-2 text-xl font-bold tabular-nums sm:text-2xl">{low}<span className="ml-2 text-sm font-normal text-slate-500 sm:text-sm">item types</span></p><p className="leading-relaxed mt-2 text-sm text-slate-500 dark:text-slate-400">{low ? 'Low or out of stock · request more supplies' : 'No items currently need replenishment'}</p></div><span className={`rounded-xl p-2.5 ${low ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'}`}><Package size={20} /></span></div>
                </section>
                <div className="flex flex-col gap-3 rounded-xl border border-red-100 bg-red-50/60 px-4 py-3.5 text-sm text-red-950 sm:flex-row sm:items-center sm:justify-between dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-200"><p className="leading-relaxed">Supplies are added here after the Supply Office releases your approved request.</p><div className="flex shrink-0 items-center gap-2 text-sm font-semibold"><span>Request</span><ArrowRight size={13} className="opacity-50" /><span>Staff review</span><ArrowRight size={13} className="opacity-50" /><span>Release to unit</span></div></div>
                <section className={`${panel} overflow-hidden`} aria-label="Delivery Unit inventory workspace">
                    <div role="tablist" aria-label="Inventory workspace" className="flex gap-5 border-b border-slate-200 px-4 sm:px-6 dark:border-slate-800">{[{ id: 'inventory' as const, label: 'Supplies on Hand', icon: Boxes }, { id: 'history' as const, label: 'Transaction History', icon: History }].map(({ id, label, icon: Icon }) => <button key={id} type="button" id={`tab-${id}`} role="tab" aria-selected={tab === id} aria-controls={`panel-${id}`} tabIndex={tab === id ? 0 : -1} onKeyDown={event => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 'inventory' : event.key === 'End' ? 'history' : tab === 'inventory' ? 'history' : 'inventory'; setTab(next); document.getElementById(`tab-${next}`)?.focus(); } }} onClick={() => setTab(id)} className={`inline-flex min-h-14 items-center gap-2 border-b-2 py-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-800 ${tab === id ? 'border-red-900 text-red-900 dark:border-red-400 dark:text-red-300' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}><Icon size={16} /><span>{label}</span>{id === 'inventory' && <span className="hidden rounded-md bg-slate-100 px-1.5 py-0.5 text-sm tabular-nums text-slate-600 sm:inline dark:bg-slate-800 dark:text-slate-300">{stocks.length}</span>}</button>)}</div>
                    <div id="panel-inventory" role="tabpanel" aria-labelledby="tab-inventory" hidden={tab !== 'inventory'}>
                        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5 dark:border-slate-800"><div className="relative w-full sm:max-w-md"><Search size={17} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" /><input type="search" aria-label="Search supplies by item or stock number" placeholder="Search item name or stock number…" value={search} onChange={event => setSearch(event.target.value)} className="min-h-11 w-full rounded-lg border-slate-300 bg-white pl-10 pr-10 text-sm placeholder:text-slate-400 focus:border-red-800 focus:ring-red-800 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100" />{search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="absolute right-1 top-1 rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={16} /></button>}</div><label className="flex shrink-0 items-center gap-2.5 text-sm text-slate-500 dark:text-slate-400"><span className="whitespace-nowrap">Stock status</span><select value={filter} onChange={event => setFilter(event.target.value)} className="min-h-11 w-full rounded-lg border-slate-300 bg-white py-2 pl-3 pr-9 text-sm text-slate-700 focus:border-red-800 focus:ring-red-800 sm:w-44 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200"><option value="all">All items</option><option value="available">Available</option><option value="low">Low stock</option><option value="empty">Out of stock</option></select></label></div>
                        {filteredStocks.length > 0 ? <StockList stocks={filteredStocks} lowStockThreshold={lowStockThreshold} onIssue={setIssueStock} onStockCard={setReportStock} /> : <div className="flex flex-col items-center px-5 py-14 text-center"><div className="mb-4 rounded-full bg-slate-100 p-4 text-slate-400 dark:bg-slate-800"><Package size={25} /></div><h2 className="text-xl font-semibold">{stocks.length ? 'No supplies match your search' : 'Your unit inventory starts here'}</h2><p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">{stocks.length ? 'Try another item name or choose a different stock status.' : 'Request supplies from the Supply Office. Items will appear here once your approved request is released.'}</p>{stocks.length > 0 && <button type="button" onClick={() => { setSearch(''); setFilter('all'); }} className="mt-5 text-sm font-semibold text-red-900 dark:text-red-300">Clear search and filters</button>}</div>}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3.5 text-sm text-slate-500 sm:px-6 dark:border-slate-800 dark:text-slate-400"><span role="status">Showing {filteredStocks.length} of {stocks.length} item types</span><span className="inline-flex items-center gap-1.5"><FileText size={13} />Stock Cards are generated per item</span></div>
                    </div>
                    <div id="panel-history" role="tabpanel" aria-labelledby="tab-history" hidden={tab !== 'history'}><TransactionHistory movements={movements} /></div>
                </section>
                <footer className="flex flex-wrap justify-between gap-2 pb-2 text-sm text-slate-500 dark:text-slate-400"><span>Delivery Unit workspace · {auth.user.name}</span><span>Need more supplies? Submit a request to the Supply Office.</span></footer>
            </div>
        </main>
        <IssueDialog stock={issueStock} onClose={() => setIssueStock(null)} />
        <StockCardDialog stock={reportStock} onClose={() => setReportStock(null)} />
    </div>;
}
