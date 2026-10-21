import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import Sidebar from '@/Components/Sidebar';
import { useSidebarCollapse } from '@/Hooks/useSidebarCollapse';
import { getSidebarModules } from '@/utils/sidebarConfig';
import DashboardHeader from '@/Pages/Dashboard/Components/DashboardHeader';

interface Stock { id: number; name: string; sku: string; unit: string; quantity: number; value: string; }
interface Movement { id: number; type: string; quantity: number; date: string; reference: string; office: string; stock: Stock; }
interface Props {
    stocks: Stock[];
    movements: { data: Movement[]; links: { url: string | null; label: string; active: boolean }[] };
}

export default function CoordinatorInventory({ stocks, movements }: Props) {
    const { auth, flash } = usePage<any>().props;
    const [collapsed, toggle] = useSidebarCollapse();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const form = useForm({ stock_id: '', quantity: '', recipient: '' });
    const [issueStock, setIssueStock] = useState<Stock | null>(null);
    const invalidRange = Boolean(startDate && endDate && endDate < startDate);
    const inputStyle = 'rounded-lg border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white text-sm w-full';
    const cardStyle = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4';

    return <div className="min-h-screen bg-[#F4F6F8] dark:bg-slate-950 text-gray-900 dark:text-slate-100">
        <Head title="Delivery Unit Inventory & Stock Cards" />
        <Sidebar modules={getSidebarModules('Unit Inventory & Stock Cards')} user={auth.user} collapsed={collapsed} onToggleCollapse={toggle} />
        <main className={`transition-all ${collapsed ? 'md:ml-20' : 'md:ml-72'}`}>
            <DashboardHeader />
            <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div><h1 className="text-2xl font-bold">Delivery Unit Inventory & Stock Cards</h1>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{auth.user.name} · Supplies released by the Supply Office appear here automatically.</p></div>
                    <Link className="rounded-lg bg-red-900 px-4 py-2 text-white text-sm font-semibold" href={route('inventory.requests.index')}>Request Supplies</Link>
                </div>
                {flash?.success && <p role="status" className="rounded-lg bg-emerald-50 text-emerald-900 p-4">{flash.success}</p>}
                <section className={cardStyle} aria-label="Unit stock and automated Stock Cards">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="flex-1 min-w-48"><h2 className="text-lg font-semibold">Your Inventory</h2><p className="text-sm text-slate-500 mt-1">Generate a Stock Card from recorded receipts and unit issues.</p></div>
                        <label className="text-sm space-y-1">Stock Card from<input type="date" aria-label="Stock Card start date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputStyle} /></label>
                        <label className="text-sm space-y-1">Through<input type="date" aria-label="Stock Card end date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} className={inputStyle} /></label>
                    </div>
                    {invalidRange && <p role="alert" className="text-sm text-red-700">The end date must be on or after the start date.</p>}
                    <div className="overflow-x-auto"><table className="w-full text-sm text-left">
                        <thead className="border-b border-slate-200 dark:border-slate-700"><tr>{['Item', 'Stock No.', 'On Hand', 'Value', 'Actions'].map(label => <th key={label} className="p-3 font-semibold">{label}</th>)}</tr></thead>
                        <tbody>{stocks.map(stock => <tr key={stock.id} className="border-b border-slate-100 dark:border-slate-800">
                            <td className="p-3 font-medium">{stock.name}</td><td className="p-3">{stock.sku}</td><td className="p-3 whitespace-nowrap">{stock.quantity} {stock.unit}</td>
                            <td className="p-3">₱{Number(stock.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="p-3"><div className="flex gap-4 whitespace-nowrap">
                                <button type="button" disabled={stock.quantity <= 0} className="text-red-900 dark:text-red-300 font-semibold disabled:opacity-40" onClick={() => { setIssueStock(stock); form.setData({ stock_id: String(stock.id), quantity: '', recipient: '' }); form.clearErrors(); }}>Record Issue</button>
                                {!invalidRange && <a className="text-red-900 dark:text-red-300 font-semibold" href={route('coordinator.inventory.stock-card', { stock: stock.id, ...(startDate ? { start_date: startDate } : {}), ...(endDate ? { end_date: endDate } : {}) })}>Download Stock Card</a>}
                            </div></td>
                        </tr>)}</tbody>
                    </table>{stocks.length === 0 && <p className="p-8 text-center text-slate-500">No supplies received yet. Approved requests appear after the Supply Office releases them.</p>}</div>
                </section>
                {issueStock && <form className={cardStyle} onSubmit={e => { e.preventDefault(); form.post(route('coordinator.inventory.issue'), { preserveScroll: true, onSuccess: () => { setIssueStock(null); form.reset(); } }); }}>
                    <h2 className="text-lg font-semibold">Record Issue · {issueStock.name}</h2>
                    <p className="text-sm text-slate-500">This deducts from your Delivery Unit inventory and updates its Stock Card.</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <label className="text-sm space-y-1">Quantity<input required type="number" min="1" max={issueStock.quantity} value={form.data.quantity} onChange={e => form.setData('quantity', e.target.value)} className={inputStyle} /></label>
                        <label className="text-sm space-y-1">Office / End User<input required maxLength={255} value={form.data.recipient} onChange={e => form.setData('recipient', e.target.value)} className={inputStyle} /></label>
                    </div>
                    {Object.entries(form.errors).map(([key, error]) => <p key={key} role="alert" className="text-red-700 text-sm">{error}</p>)}
                    <div className="flex gap-4"><button disabled={form.processing} className="rounded-lg bg-red-900 text-white px-4 py-2 text-sm disabled:opacity-50">Save Issue</button><button type="button" onClick={() => setIssueStock(null)} className="text-sm">Cancel</button></div>
                </form>}
                <section className={cardStyle} aria-label="Unit stock movements"><h2 className="text-lg font-semibold">Stock Movements</h2>
                    <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr>{['Date', 'Item', 'Reference', 'Receipt', 'Issue', 'Office / End User'].map(label => <th key={label} className="p-3 border-b font-semibold">{label}</th>)}</tr></thead>
                        <tbody>{movements.data.map(m => <tr key={m.id} className="border-b border-slate-100 dark:border-slate-800"><td className="p-3 whitespace-nowrap">{m.date.slice(0, 10)}</td><td className="p-3">{m.stock.name}</td><td className="p-3">{m.reference}</td><td className="p-3">{m.type === 'receipt' ? m.quantity : '—'}</td><td className="p-3">{m.type === 'issue' ? m.quantity : '—'}</td><td className="p-3">{m.office}</td></tr>)}</tbody>
                    </table>{movements.data.length === 0 && <p className="p-6 text-center text-slate-500">No stock movements recorded.</p>}</div>
                    <nav aria-label="Stock movement pages" className="flex flex-wrap gap-2">{movements.links.map((link, i) => link.url ? <Link key={i} href={link.url} preserveScroll className={`px-3 py-2 rounded text-sm ${link.active ? 'bg-red-900 text-white' : 'border border-slate-300 dark:border-slate-700'}`} dangerouslySetInnerHTML={{ __html: link.label }} /> : <span key={i} className="px-3 py-2 text-sm opacity-40" dangerouslySetInnerHTML={{ __html: link.label }} />)}</nav>
                </section>
            </div>
        </main>
    </div>;
}
