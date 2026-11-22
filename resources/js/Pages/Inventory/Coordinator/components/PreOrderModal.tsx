import React, { useEffect, useRef } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import { AlertCircle, Clock, Loader2, Package, PackagePlus, Trash2, X } from 'lucide-react';
import Modal from '@/Components/Modal';
import { CatalogItem } from '../catalog';
import { secondaryButton } from '../inventory';

declare function route(name: string, params?: any): string;

interface Props {
    item: CatalogItem | null;
    onClose: () => void;
}

export default function PreOrderModal({ item, onClose }: Props) {
    const { auth } = usePage<any>().props;
    const isAuthorizedPersonnel = Boolean(auth.capabilities?.requiresSupportingDocument);
    const supplyOwner = isAuthorizedPersonnel ? 'Office' : 'Delivery Unit';
    const unitName = auth.user?.department || (isAuthorizedPersonnel ? 'Authorized Office' : 'Delivery Unit');

    const form = useForm({
        item_id: item?.id ?? 0,
        quantity_requested: item?.user_pre_order ? String(item.user_pre_order.quantity) : '',
        urgency: (item?.user_pre_order?.urgency ?? 'normal') as 'normal' | 'urgent',
        purpose: item?.user_pre_order?.purpose ?? '',
    });

    const quantityRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (item) {
            form.setData({
                item_id: item.id,
                quantity_requested: item.user_pre_order ? String(item.user_pre_order.quantity) : '',
                urgency: item.user_pre_order?.urgency ?? 'normal',
                purpose: item.user_pre_order?.purpose ?? '',
            });
            form.clearErrors();
        }
    }, [item]);

    const quantity = Number(form.data.quantity_requested);
    const validQuantity = Number.isInteger(quantity) && quantity > 0 && quantity <= 10000;
    const inputStyle = 'mt-2 min-h-11 w-full rounded-lg border-slate-300 text-sm focus:border-red-800 focus:ring-red-800 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100';

    const isExisting = Boolean(item?.user_pre_order);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        form.post(route('inventory.pre-orders.store'), {
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    };

    const handleCancelPreOrder = () => {
        if (!item?.user_pre_order?.id) return;
        if (!confirm('Are you sure you want to cancel this pre-request? The Supply Office will no longer track this unit demand.')) return;

        router.delete(route('inventory.pre-orders.destroy', item.user_pre_order.id), {
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    };

    return (
        <Modal
            show={Boolean(item)}
            onClose={onClose}
            closeable={!form.processing}
            maxWidth="lg"
            initialFocus={quantityRef}
            ariaLabel={`Pre-Request ${item?.name ?? 'item'}`}
        >
            <form onSubmit={handleSubmit}>
                <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-6 dark:border-slate-800">
                    <div>
                        <p className="leading-relaxed mb-1.5 text-xs font-bold tracking-wide uppercase text-red-900 dark:text-red-300">
                            Central Stock Replenishment Demand
                        </p>
                        <h2 className="text-xl font-semibold">
                            {isExisting ? 'Manage Item Pre-Request' : 'Pre-Request Out-of-Stock Item'}
                        </h2>
                        <p className="leading-relaxed mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Notify the Supply Office that your {supplyOwner.toLowerCase()} requires this item so they can expedite replenishment.
                        </p>
                    </div>
                    <button
                        type="button"
                        aria-label="Close dialog"
                        disabled={form.processing}
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <X size={19} />
                    </button>
                </div>

                <div className="space-y-5 p-6">
                    {/* Item Summary Card */}
                    <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                        <Package size={22} className="mt-0.5 shrink-0 text-red-900 dark:text-red-300" />
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{item?.name}</p>
                            <p className="leading-relaxed mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                Stock No: <span className="font-mono">{item?.sku}</span> · Unit: {item?.unit || 'unit'}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="inline-flex items-center rounded-md bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-950/60 dark:text-red-300">
                                    0 in Supply Office (Out of Stock)
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Requesting Unit Info */}
                    <div className="rounded-lg border border-slate-200 bg-white p-3.5 text-sm dark:border-slate-700 dark:bg-slate-900">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Requesting {supplyOwner}
                        </span>
                        <p className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200">
                            {unitName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Submitted by {auth.user?.name} {auth.user?.designation ? `(${auth.user.designation})` : ''}
                        </p>
                    </div>

                    {/* Quantity Needed */}
                    <div>
                        <label htmlFor="preorder-quantity" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            Estimated Quantity Needed ({item?.unit || 'units'}) <span className="text-red-700 dark:text-red-300">*</span>
                        </label>
                        <input
                            id="preorder-quantity"
                            ref={quantityRef}
                            required
                            type="number"
                            step="1"
                            min="1"
                            max="10000"
                            placeholder="e.g. 20"
                            value={form.data.quantity_requested}
                            onChange={(e) => form.setData('quantity_requested', e.target.value)}
                            aria-invalid={Boolean(form.errors.quantity_requested)}
                            aria-describedby="quantity-help"
                            className={inputStyle}
                        />
                        {form.errors.quantity_requested ? (
                            <p id="quantity-help" className="mt-1.5 text-xs text-red-700 dark:text-red-300">
                                {form.errors.quantity_requested}
                            </p>
                        ) : (
                            <p id="quantity-help" className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                                Enter the number of units your {supplyOwner.toLowerCase()} anticipates requesting once replenished.
                            </p>
                        )}
                    </div>

                    {/* Urgency Level */}
                    <div>
                        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            Replenishment Priority <span className="text-red-700 dark:text-red-300">*</span>
                        </label>
                        <div className="mt-2 grid grid-cols-2 gap-3">
                            <label className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-sm transition ${form.data.urgency === 'normal' ? 'border-red-900 bg-red-50/50 dark:border-red-700 dark:bg-red-950/30' : 'border-slate-200 dark:border-slate-700'}`}>
                                <input
                                    type="radio"
                                    name="urgency"
                                    value="normal"
                                    checked={form.data.urgency === 'normal'}
                                    onChange={() => form.setData('urgency', 'normal')}
                                    className="mt-0.5 text-red-900 focus:ring-red-800"
                                />
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">Normal</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Standard operational replenishment</p>
                                </div>
                            </label>
                            <label className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-sm transition ${form.data.urgency === 'urgent' ? 'border-amber-600 bg-amber-50/50 dark:border-amber-600 dark:bg-amber-950/30' : 'border-slate-200 dark:border-slate-700'}`}>
                                <input
                                    type="radio"
                                    name="urgency"
                                    value="urgent"
                                    checked={form.data.urgency === 'urgent'}
                                    onChange={() => form.setData('urgency', 'urgent')}
                                    className="mt-0.5 text-amber-600 focus:ring-amber-500"
                                />
                                <div>
                                    <p className="font-semibold text-amber-900 dark:text-amber-200">Urgent</p>
                                    <p className="text-xs text-amber-800/80 dark:text-amber-300/80">Critical / immediate need</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Operational Purpose / Remarks */}
                    <div>
                        <label htmlFor="preorder-purpose" className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            Purpose / Remarks <span className="text-xs font-normal text-slate-500">(Optional)</span>
                        </label>
                        <textarea
                            id="preorder-purpose"
                            rows={3}
                            maxLength={500}
                            placeholder="Explain why this item is needed (e.g. for upcoming semester exams, lab activities)..."
                            value={form.data.purpose}
                            onChange={(e) => form.setData('purpose', e.target.value)}
                            className="mt-2 w-full rounded-lg border-slate-300 text-sm focus:border-red-800 focus:ring-red-800 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                        />
                    </div>

                    <div className="flex items-start gap-2.5 rounded-lg bg-blue-50/70 p-3 text-xs leading-relaxed text-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
                        <AlertCircle size={15} className="mt-0.5 shrink-0 text-blue-700 dark:text-blue-400" />
                        <p>
                            Pre-requesting signals your demand directly to the Supply Office. Once stock is received in the central warehouse, you will receive an alert to submit your official Requisition and Issue Slip (RIS).
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/40">
                    <div>
                        {isExisting && (
                            <button
                                type="button"
                                disabled={form.processing}
                                onClick={handleCancelPreOrder}
                                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 hover:text-red-900 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors"
                            >
                                <Trash2 size={14} />
                                Cancel Pre-Request
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={form.processing}
                            onClick={onClose}
                            className={secondaryButton}
                        >
                            Close
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing || !validQuantity}
                            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-red-900 px-4 py-2 text-xs font-semibold text-white hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-50 shadow-2xs transition-colors"
                        >
                            {form.processing ? (
                                <Loader2 size={15} className="animate-spin" />
                            ) : (
                                <PackagePlus size={15} />
                            )}
                            {form.processing
                                ? 'Submitting…'
                                : isExisting
                                ? 'Update Pre-Request'
                                : 'Submit Pre-Request'}
                        </button>
                    </div>
                </div>
            </form>
        </Modal>
    );
}
