import React, { useEffect, useRef } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { ArrowUpRight, Package, X } from 'lucide-react';
import Modal from '@/Components/Modal';
import { DialogBody, DialogFooter, DialogHeader } from '@/Components/ui/dialog-frame';
import { Button } from '@/Components/ui/button';
import Field from '@/Components/ui/field';
import useValidationFocus from '@/Hooks/useValidationFocus';
import { Stock } from '../inventory';

declare function route(name: string, params?: any): string;

interface IssueDialogProps {
    stock: Stock | null;
    onClose: () => void;
}

export default function IssueDialog({ stock, onClose }: IssueDialogProps) {
    const { auth } = usePage<any>().props;
    const isAuthorizedPersonnel = Boolean(auth.capabilities?.requiresSupportingDocument);
    const supplyOwner = isAuthorizedPersonnel ? 'office' : 'unit';

    const form = useForm({
        stock_id: '',
        quantity: '',
        recipient: '',
    });

    const quantityRef = useRef<HTMLInputElement>(null);
    useValidationFocus(form.errors);

    useEffect(() => {
        if (stock) {
            form.setData({
                stock_id: String(stock.id),
                quantity: '',
                recipient: '',
            });
            form.clearErrors();
        }
    }, [stock?.id]);

    const quantity = Number(form.data.quantity);
    const validQuantity =
        Number.isInteger(quantity) &&
        quantity > 0 &&
        quantity <= (stock?.quantity ?? 0);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        form.post(route('coordinator.inventory.issue'), {
            preserveScroll: true,
            onSuccess: onClose,
        });
    };

    return (
        <Modal
            show={Boolean(stock)}
            onClose={onClose}
            closeable={!form.processing}
            maxWidth="lg"
            initialFocus={quantityRef}
            ariaLabel={isAuthorizedPersonnel ? 'Record an office issue' : 'Record a unit issue'}
        >
            <div className="h-1.5 w-full bg-gradient-to-r from-red-950 via-red-900 to-red-950 shrink-0" />

            <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
                <DialogHeader className="shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-950 dark:text-red-400 flex items-center justify-center border border-red-100/80 dark:border-red-900/50 shadow-sm shrink-0">
                            <Package className="w-5 h-5 text-red-900 dark:text-red-400" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold tracking-normal normal-case text-red-900 dark:text-red-300">
                                {isAuthorizedPersonnel ? 'Office Distribution' : 'Unit Distribution'}
                            </p>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
                                Record an Issue
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium truncate">
                                Distribute supplies to an office or end user.
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        aria-label="Close issue dialog"
                        disabled={form.processing}
                        onClick={onClose}
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </DialogHeader>

                <DialogBody className="space-y-5">
                    {/* Item Balance Card */}
                    <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                        <Package className="w-5 h-5 mt-0.5 shrink-0 text-red-900 dark:text-red-300" />
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{stock?.name}</p>
                            <p className="mt-0.5 text-sm tabular-nums text-slate-500 dark:text-slate-400">
                                Stock No: <span className="font-mono">{stock?.sku}</span>
                            </p>
                            <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                                <strong className="text-red-900 dark:text-red-300">
                                    {stock?.quantity.toLocaleString('en-PH')}
                                </strong>{' '}
                                {stock?.unit} available in current balance
                            </p>
                        </div>
                    </div>

                    {/* Quantity to Issue */}
                    <Field
                        id="unit-issue-quantity"
                        label={`Quantity to issue (${stock?.unit || 'units'})`}
                        required
                        error={form.errors.quantity}
                        hint={
                            validQuantity
                                ? `${(stock?.quantity ?? 0) - quantity} ${stock?.unit} will remain in your ${supplyOwner}.`
                                : `Maximum available: ${stock?.quantity ?? 0} ${stock?.unit ?? ''}.`
                        }
                    >
                        <input
                            id="unit-issue-quantity"
                            ref={quantityRef}
                            required
                            type="number"
                            step="1"
                            min="1"
                            max={stock?.quantity}
                            placeholder="Enter quantity"
                            value={form.data.quantity}
                            onChange={(event) => form.setData('quantity', event.target.value)}
                            className="ui-field w-full px-3 py-2 tabular-nums"
                            disabled={form.processing}
                        />
                    </Field>

                    {/* Recipient */}
                    <Field
                        id="unit-issue-recipient"
                        label="Receiving office / end user"
                        required
                        error={form.errors.recipient}
                        hint="This name will appear in your transaction history and Stock Card."
                    >
                        <input
                            id="unit-issue-recipient"
                            required
                            maxLength={255}
                            placeholder="e.g. Faculty Room — Juan Dela Cruz"
                            value={form.data.recipient}
                            onChange={(event) => form.setData('recipient', event.target.value)}
                            className="ui-field w-full px-3 py-2"
                            disabled={form.processing}
                        />
                    </Field>

                    {Object.entries(form.errors)
                        .filter(([key]) => !['quantity', 'recipient'].includes(key))
                        .map(([key, error]) => (
                            <p key={key} role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
                                {error}
                            </p>
                        ))}

                    <p className="rounded-lg bg-blue-50 p-3 text-sm leading-relaxed text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
                        Saving deducts the issued quantity from your {supplyOwner} inventory and updates its official Stock Card ledger.
                    </p>
                </DialogBody>

                <DialogFooter>
                    <Button
                        variant="secondary"
                        type="button"
                        disabled={form.processing}
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={form.processing || !validQuantity || !form.data.recipient.trim()}
                        loading={form.processing}
                        className="inline-flex items-center gap-1.5"
                    >
                        <ArrowUpRight className="w-4 h-4" />
                        <span>Save Issue</span>
                    </Button>
                </DialogFooter>
            </form>
        </Modal>
    );
}
