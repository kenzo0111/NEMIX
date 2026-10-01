import React, { useEffect, useMemo } from 'react';
import { useForm } from '@inertiajs/react';
import Select from 'react-select';
import { FileSpreadsheet, X } from 'lucide-react';
import Modal from '@/Components/Modal';
import { getInstitutionalSelectStyles } from '@/styles/selectStyles';
import { RequestItem, SupplyRequest } from '../types';

type FormLine = { item_id: string; quantity: string };

export function RequestFormModal({ show, request, items, onClose, onSaved }: {
    show: boolean;
    request: SupplyRequest | null;
    items: RequestItem[];
    onClose: () => void;
    onSaved: (message: string) => void;
}) {
    const form = useForm<{ department: string; purpose: string; items: FormLine[] }>({
        department: '', purpose: '', items: [{ item_id: '', quantity: '' }],
    });

    useEffect(() => {
        if (!show) return;
        form.setData(request ? {
            department: request.department,
            purpose: request.purpose,
            items: request.items.map(line => ({ item_id: String(line.item_id), quantity: String(line.quantity) })),
        } : { department: '', purpose: '', items: [{ item_id: '', quantity: '' }] });
        form.clearErrors();
    }, [show, request?.id]);

    const selectedIds = useMemo(() => form.data.items.map(line => Number(line.item_id)).filter(Boolean), [form.data.items]);
    const updateLine = (index: number, update: Partial<FormLine>) => {
        form.setData('items', form.data.items.map((line, position) => position === index ? { ...line, ...update } : line));
    };
    const close = () => {
        if (form.processing) return;
        form.clearErrors();
        onClose();
    };
    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => { onClose(); onSaved(request ? 'Request updated successfully.' : 'Request submitted to the Property Custodian.'); },
        };
        if (request) form.put(route('inventory.requests.update', request.id), options);
        else form.post(route('inventory.requests.store'), options);
    };

    return <Modal show={show} onClose={close} maxWidth="3xl" closeable={!form.processing} ariaLabel={request ? 'Edit Supply Request' : 'New Supply Request'}>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="h-1.5 w-full bg-gradient-to-r from-red-950 via-red-900 to-red-950 shrink-0" />
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50/75 dark:bg-slate-900/75 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-950 dark:text-red-400 flex items-center justify-center border border-red-100/80 dark:border-red-900/50 shadow-2xs shrink-0">
                        <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-base font-bold text-gray-900 dark:text-slate-100 font-serif tracking-tight truncate">{request ? `Edit Supply Request #${request.id}` : 'New Supply Request'}</h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400 font-medium truncate">Requisition for Property Custodian review</p>
                    </div>
                </div>
                <button type="button" onClick={close} disabled={form.processing} aria-label="Close" className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer shrink-0 ml-2"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={submit} className="p-4 sm:p-6 overflow-y-auto max-h-[75vh] space-y-6 text-xs">
                {form.errors.items && <div role="alert" className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded text-xs text-red-700 dark:text-red-300 font-medium">{form.errors.items}</div>}
                <section>
                    <div className="pb-2 mb-3 border-b border-gray-200 dark:border-slate-800"><h4 className="text-xs font-bold uppercase tracking-wider text-red-950 dark:text-red-400 font-mono">1. Request Information</h4></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="request-department" className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Office / Department <span className="text-red-600">*</span></label>
                            <input id="request-department" required maxLength={255} value={form.data.department} onChange={e => form.setData('department', e.target.value)} aria-invalid={Boolean(form.errors.department)} className="w-full h-10 px-3 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-md text-xs text-gray-900 dark:text-slate-100 focus:border-red-900 focus:ring-1 focus:ring-red-900" />
                            {form.errors.department && <p role="alert" className="mt-1 text-red-600 dark:text-red-400">{form.errors.department}</p>}
                        </div>
                        <div>
                            <label htmlFor="request-purpose" className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Purpose <span className="text-red-600">*</span></label>
                            <input id="request-purpose" required maxLength={2000} value={form.data.purpose} onChange={e => form.setData('purpose', e.target.value)} aria-invalid={Boolean(form.errors.purpose)} className="w-full h-10 px-3 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-md text-xs text-gray-900 dark:text-slate-100 focus:border-red-900 focus:ring-1 focus:ring-red-900" />
                            {form.errors.purpose && <p role="alert" className="mt-1 text-red-600 dark:text-red-400">{form.errors.purpose}</p>}
                        </div>
                    </div>
                </section>
                <section>
                    <div className="pb-2 mb-3 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between gap-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-red-950 dark:text-red-400 font-mono">2. Items Requested</h4>
                        <button type="button" onClick={() => form.setData('items', [...form.data.items, { item_id: '', quantity: '' }])} className="text-xs font-bold text-red-950 dark:text-red-400 hover:underline">+ Add another item</button>
                    </div>
                    <div className="space-y-3">{form.data.items.map((line, index) => {
                        const selectedItem = items.find(item => item.id === Number(line.item_id));
                        const options = items.filter(item => item.id === selectedItem?.id || !selectedIds.includes(item.id)).map(item => ({ value: String(item.id), label: `${item.name} (${item.sku}) — Stock: ${item.stock} ${item.unit_of_issue || 'pcs'}` }));
                        return <div key={index} className="p-3.5 bg-gray-50/70 dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800 rounded-lg">
                            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
                                <div className="flex-1 w-full">
                                    <label htmlFor={`request-item-${index}`} className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Item #{index + 1}</label>
                                    <Select inputId={`request-item-${index}`} value={options.find(option => option.value === line.item_id) || null} onChange={option => updateLine(index, { item_id: option?.value || '' })} options={options} placeholder="Select inventory item..." styles={getInstitutionalSelectStyles(Boolean(form.errors[`items.${index}.item_id` as keyof typeof form.errors]))} classNamePrefix="react-select" isClearable />
                                    {form.errors[`items.${index}.item_id` as keyof typeof form.errors] && <p role="alert" className="mt-1 text-red-600 dark:text-red-400">{form.errors[`items.${index}.item_id` as keyof typeof form.errors]}</p>}
                                </div>
                                <div className="w-full sm:w-36 shrink-0"><span className="block text-[11px] font-semibold text-gray-500 dark:text-slate-400 mb-1">On-hand Stock</span><div className="h-10 px-3 flex items-center bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-md text-xs font-mono font-bold text-gray-800 dark:text-slate-200">{selectedItem ? `${selectedItem.stock} ${selectedItem.unit_of_issue || 'pcs'}` : '—'}</div></div>
                                <div className="w-full sm:w-28 shrink-0">
                                    <label htmlFor={`request-quantity-${index}`} className="block text-[11px] font-semibold text-gray-700 dark:text-slate-300 mb-1">Quantity</label>
                                    <input id={`request-quantity-${index}`} type="number" required min="1" max="1000000" value={line.quantity} onChange={e => updateLine(index, { quantity: e.target.value })} className="w-full h-10 px-3 bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-md text-xs font-mono font-bold text-gray-900 dark:text-slate-100 focus:border-red-900 focus:ring-1 focus:ring-red-900" />
                                    {form.errors[`items.${index}.quantity` as keyof typeof form.errors] && <p role="alert" className="mt-1 text-red-600 dark:text-red-400">{form.errors[`items.${index}.quantity` as keyof typeof form.errors]}</p>}
                                </div>
                                {form.data.items.length > 1 && <button type="button" onClick={() => form.setData('items', form.data.items.filter((_, position) => position !== index))} aria-label={`Remove item ${index + 1}`} className="h-10 px-2.5 text-gray-500 hover:text-red-700 dark:hover:text-red-400 rounded-md border border-gray-200 dark:border-slate-700">Remove</button>}
                            </div>
                        </div>;
                    })}</div>
                </section>
                <div className="pt-4 border-t border-gray-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
                    <button type="button" onClick={close} disabled={form.processing} className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-md text-xs font-semibold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40">Cancel</button>
                    <button type="submit" disabled={form.processing} className="w-full sm:w-auto px-5 py-2 bg-red-950 hover:bg-red-900 text-white text-xs font-bold rounded-md shadow-xs disabled:opacity-50 uppercase font-mono tracking-wider">{form.processing ? 'Saving...' : request ? 'Save Changes' : 'Submit Request'}</button>
                </div>
            </form>
        </div>
    </Modal>;
}
