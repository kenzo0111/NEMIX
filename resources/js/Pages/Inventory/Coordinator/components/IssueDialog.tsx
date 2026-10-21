import { useForm } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { ArrowUpRight, Loader2, Package, X } from 'lucide-react';
import Modal from '@/Components/Modal';
import { Stock, secondaryButton } from '../inventory';

export default function IssueDialog({ stock, onClose }: { stock: Stock | null; onClose: () => void }) {
    const form = useForm({ stock_id: '', quantity: '', recipient: '' });
    const quantityRef = useRef<HTMLInputElement>(null);
    useEffect(() => { form.setData({ stock_id: String(stock?.id ?? ''), quantity: '', recipient: '' }); form.clearErrors(); }, [stock?.id]);
    const quantity = Number(form.data.quantity);
    const validQuantity = Number.isInteger(quantity) && quantity > 0 && quantity <= (stock?.quantity ?? 0);
    const inputStyle = 'mt-2 min-h-11 w-full rounded-lg border-slate-300 text-sm focus:border-red-800 focus:ring-red-800 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100';

    return <Modal show={Boolean(stock)} onClose={onClose} closeable={!form.processing} maxWidth="lg" initialFocus={quantityRef} ariaLabel="Record a unit issue">
        <form onSubmit={event => { event.preventDefault(); form.post(route('coordinator.inventory.issue'), { preserveScroll: true, onSuccess: onClose }); }}>
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-6 dark:border-slate-800"><div><p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-red-900 dark:text-red-300">Unit Distribution</p><h2 className="text-xl font-semibold">Record an Issue</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Distribute supplies to an office or end user.</p></div><button type="button" aria-label="Close issue dialog" disabled={form.processing} onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={19} /></button></div>
            <div className="space-y-5 p-6"><div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60"><Package size={21} className="mt-0.5 shrink-0 text-red-900 dark:text-red-300" /><div><p className="font-semibold">{stock?.name}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{stock?.sku}</p><p className="mt-2 text-sm"><strong>{stock?.quantity.toLocaleString()}</strong> {stock?.unit} available</p></div></div>
                <div><label htmlFor="unit-issue-quantity" className="text-sm font-semibold">Quantity to issue <span className="text-red-700 dark:text-red-300">*</span></label><input id="unit-issue-quantity" ref={quantityRef} required type="number" step="1" min="1" max={stock?.quantity} placeholder="Enter quantity" value={form.data.quantity} onChange={event => form.setData('quantity', event.target.value)} aria-invalid={Boolean(form.errors.quantity)} aria-describedby="quantity-help" className={inputStyle} /><p id="quantity-help" className={`mt-2 text-xs ${form.errors.quantity ? 'text-red-700 dark:text-red-300' : 'text-slate-500 dark:text-slate-400'}`}>{form.errors.quantity ?? (validQuantity ? `${(stock?.quantity ?? 0) - quantity} ${stock?.unit} will remain in your unit.` : `Maximum available: ${stock?.quantity ?? 0} ${stock?.unit ?? ''}.`)}</p></div>
                <div><label htmlFor="unit-issue-recipient" className="text-sm font-semibold">Receiving office / end user <span className="text-red-700 dark:text-red-300">*</span></label><input id="unit-issue-recipient" required maxLength={255} placeholder="e.g. Faculty Room — Juan Dela Cruz" value={form.data.recipient} onChange={event => form.setData('recipient', event.target.value)} aria-invalid={Boolean(form.errors.recipient)} aria-describedby="recipient-help" className={inputStyle} /><p id="recipient-help" className={`mt-2 text-xs ${form.errors.recipient ? 'text-red-700 dark:text-red-300' : 'text-slate-500 dark:text-slate-400'}`}>{form.errors.recipient ?? 'This name will appear in your transaction history and Stock Card.'}</p></div>
                {Object.entries(form.errors).filter(([key]) => !['quantity', 'recipient'].includes(key)).map(([key, error]) => <p key={key} role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>)}
                <p className="rounded-lg bg-blue-50 px-3 py-2.5 text-xs leading-relaxed text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">Saving deducts the issued quantity from your unit inventory and updates its Stock Card.</p>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/40"><button type="button" disabled={form.processing} onClick={onClose} className={secondaryButton}>Cancel</button><button disabled={form.processing || !validQuantity || !form.data.recipient.trim()} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-red-900 px-4 text-sm font-semibold text-white hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-50">{form.processing ? <Loader2 size={16} className="animate-spin" /> : <ArrowUpRight size={16} />}{form.processing ? 'Saving…' : 'Save Issue'}</button></div>
        </form>
    </Modal>;
}
