import React, { useEffect, useRef } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import { AlertCircle, Package, PackagePlus, Trash2, X } from 'lucide-react';
import Modal from '@/Components/Modal';
import { DialogBody, DialogFooter, DialogHeader } from '@/Components/ui/dialog-frame';
import { Button } from '@/Components/ui/button';
import Field from '@/Components/ui/field';
import useValidationFocus from '@/Hooks/useValidationFocus';
import { CatalogItem } from '../catalog';

declare function route(name: string, params?: any): string;

interface PreOrderModalProps {
    item: CatalogItem | null;
    onClose: () => void;
}

export default function PreOrderModal({ item, onClose }: PreOrderModalProps) {
    const { auth } = usePage<any>().props;
    const isAuthorizedPersonnel = Boolean(auth.capabilities?.requiresSupportingDocument);
    const supplyOwner = isAuthorizedPersonnel ? 'Office' : 'Delivery Unit';
    const unitName =
        auth.user?.department || (isAuthorizedPersonnel ? 'Authorized Office' : 'Delivery Unit');

    const form = useForm({
        item_id: item?.id ?? 0,
        quantity_requested: item?.user_pre_order ? String(item.user_pre_order.quantity) : '',
        urgency: (item?.user_pre_order?.urgency ?? 'normal') as 'normal' | 'urgent',
        purpose: item?.user_pre_order?.purpose ?? '',
    });

    const quantityRef = useRef<HTMLInputElement>(null);
    useValidationFocus(form.errors);

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
        if (
            !confirm(
                'Are you sure you want to cancel this pre-request? The Supply Office will no longer track this unit demand.'
            )
        )
            return;

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
            <div className="h-1.5 w-full bg-gradient-to-r from-red-950 via-red-900 to-red-950 shrink-0" />

            <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
                <DialogHeader className="shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-950 dark:text-red-400 flex items-center justify-center border border-red-100/80 dark:border-red-900/50 shadow-sm shrink-0">
                            <PackagePlus className="w-5 h-5 text-red-900 dark:text-red-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold tracking-normal normal-case text-red-900 dark:text-red-300">
                                Central Stock Replenishment Demand
                            </p>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
                                {isExisting ? 'Manage Item Pre-Request' : 'Pre-Request Out-of-Stock Item'}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium truncate">
                                Notify Central Supply that your {supplyOwner.toLowerCase()} requires this item.
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        aria-label="Close dialog"
                        disabled={form.processing}
                        onClick={onClose}
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </DialogHeader>

                <DialogBody className="space-y-5">
                    {/* Item Summary Card */}
                    <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                        <Package className="w-5 h-5 mt-0.5 shrink-0 text-red-900 dark:text-red-300" />
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{item?.name}</p>
                            <p className="mt-0.5 text-sm tabular-nums text-slate-500 dark:text-slate-400">
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
                        <span className="text-xs font-semibold tracking-normal text-slate-500 dark:text-slate-400 uppercase">
                            Requesting {supplyOwner}
                        </span>
                        <p className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200">
                            {unitName}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Submitted by {auth.user?.name}{' '}
                            {auth.user?.designation ? `(${auth.user.designation})` : ''}
                        </p>
                    </div>

                    {/* Quantity Needed */}
                    <Field
                        id="preorder-quantity"
                        label={`Estimated Quantity Needed (${item?.unit || 'units'})`}
                        required
                        error={form.errors.quantity_requested}
                        hint={`Enter the number of units your ${supplyOwner.toLowerCase()} anticipates requesting once replenished.`}
                    >
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
                            className="ui-field w-full px-3 py-2 tabular-nums"
                            disabled={form.processing}
                        />
                    </Field>

                    {/* Urgency Level */}
                    <div>
                        <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            Replenishment Priority <span className="text-red-600 dark:text-red-400">*</span>
                        </label>
                        <div className="mt-2 grid grid-cols-2 gap-3">
                            <label
                                className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-sm transition ${
                                    form.data.urgency === 'normal'
                                        ? 'border-red-900 bg-red-50/50 dark:border-red-700 dark:bg-red-950/30'
                                        : 'border-slate-200 dark:border-slate-700'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="urgency"
                                    value="normal"
                                    checked={form.data.urgency === 'normal'}
                                    onChange={() => form.setData('urgency', 'normal')}
                                    className="mt-0.5 text-red-900 focus:ring-red-800 dark:text-red-300"
                                    disabled={form.processing}
                                />
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">Normal</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Standard operational need</p>
                                </div>
                            </label>
                            <label
                                className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-sm transition ${
                                    form.data.urgency === 'urgent'
                                        ? 'border-amber-600 bg-amber-50/50 dark:border-amber-600 dark:bg-amber-950/30'
                                        : 'border-slate-200 dark:border-slate-700'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="urgency"
                                    value="urgent"
                                    checked={form.data.urgency === 'urgent'}
                                    onChange={() => form.setData('urgency', 'urgent')}
                                    className="mt-0.5 text-amber-600 focus:ring-amber-500 dark:text-amber-300"
                                    disabled={form.processing}
                                />
                                <div>
                                    <p className="font-semibold text-amber-900 dark:text-amber-200">Urgent</p>
                                    <p className="text-xs text-amber-800/80 dark:text-amber-300/80">Critical / immediate need</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Operational Purpose */}
                    <Field
                        id="preorder-purpose"
                        label="Purpose / Remarks"
                        hint="Explain why this item is needed (e.g. for upcoming semester exams, lab activities)..."
                    >
                        <textarea
                            id="preorder-purpose"
                            rows={3}
                            maxLength={500}
                            placeholder="Explain why this item is needed..."
                            value={form.data.purpose}
                            onChange={(e) => form.setData('purpose', e.target.value)}
                            className="ui-field w-full px-3 py-2"
                            disabled={form.processing}
                        />
                    </Field>

                    <div className="flex items-start gap-2.5 rounded-lg bg-blue-50/70 p-3 text-sm leading-relaxed text-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-blue-700 dark:text-blue-400" />
                        <p>
                            Pre-requesting signals demand directly to Central Supply. Once stock is received, you will receive an alert to submit your official Requisition and Issue Slip (RIS).
                        </p>
                    </div>
                </DialogBody>

                <DialogFooter className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        {isExisting && (
                            <Button
                                variant="secondary"
                                type="button"
                                disabled={form.processing}
                                onClick={handleCancelPreOrder}
                                className="inline-flex items-center gap-1.5 text-rose-700 hover:text-rose-800 dark:text-rose-400"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>Cancel Pre-Request</span>
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            type="button"
                            disabled={form.processing}
                            onClick={onClose}
                        >
                            Close
                        </Button>
                        <Button
                            variant="primary"
                            type="submit"
                            disabled={form.processing || !validQuantity}
                            loading={form.processing}
                            className="inline-flex items-center gap-2"
                        >
                            <PackagePlus className="w-4 h-4" />
                            <span>
                                {isExisting ? 'Update Pre-Request' : 'Submit Pre-Request'}
                            </span>
                        </Button>
                    </div>
                </DialogFooter>
            </form>
        </Modal>
    );
}
