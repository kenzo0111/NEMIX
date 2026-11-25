import RecordDetailsModal from '@/Components/ui/record-details-modal';
import { Button } from '@/Components/ui/button';
import React from 'react';
import { ReceivingRecord } from '../types';
import { formatScreenDate } from '@/utils/displayFormat';
import { Edit3 } from 'lucide-react';

interface ReceivingDetailsModalProps {
    show: boolean;
    onClose: () => void;
    receiving: ReceivingRecord | null;
    onEdit: (receiving: ReceivingRecord) => void;
}

export const ReceivingDetailsModal: React.FC<ReceivingDetailsModalProps> = ({
    show,
    onClose,
    receiving,
    onEdit,
}) => {
    if (!receiving) return null;

    const formattedDate =
        formatScreenDate(receiving.date || receiving.date_received) ||
        receiving.date;

    return (
        <RecordDetailsModal show={show} title="Receiving Record Details" description={`Transaction reference #${receiving.id}`} maxWidth="md" onClose={onClose} actions={<Button variant="secondary"
                        type="button"
                        onClick={() => {
                            onClose();
                            onEdit(receiving);
                        }}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-center"
                    >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Update Record</span>
                    </Button>}>
                    <dl className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                        <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="font-semibold text-slate-500 dark:text-slate-400 normal-case tracking-normal">Item</dt>
                            <dd className="mt-1 font-semibold text-slate-900 dark:text-slate-100 sm:col-span-2 sm:mt-0 text-sm">
                                {receiving.item}
                            </dd>
                        </div>
                        <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="font-semibold text-slate-500 dark:text-slate-400 normal-case tracking-normal">SKU / Code</dt>
                            <dd className="mt-1 tabular-nums text-slate-700 dark:text-slate-300 sm:col-span-2 sm:mt-0">
                                {receiving.sku || 'N/A'}
                            </dd>
                        </div>
                        {receiving.scanned_rfid_tag && <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4"><dt className="font-semibold text-slate-500 dark:text-slate-400 normal-case tracking-normal">Scanned item-type tag</dt><dd className="mt-1 tabular-nums text-slate-700 dark:text-slate-300 sm:col-span-2 sm:mt-0">{receiving.scanned_rfid_tag}</dd></div>}
                        <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="font-semibold text-slate-500 dark:text-slate-400 normal-case tracking-normal">Supplier</dt>
                            <dd className="mt-1 font-medium text-slate-800 dark:text-slate-200 sm:col-span-2 sm:mt-0">
                                {receiving.supplier || 'N/A'}
                            </dd>
                        </div>
                        <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="font-semibold text-slate-500 dark:text-slate-400 normal-case tracking-normal">Supplier Stock No.</dt>
                            <dd className="mt-1 tabular-nums text-slate-800 dark:text-slate-200 sm:col-span-2 sm:mt-0">
                                {receiving.supplier_stock_no ? (
                                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                                        {receiving.supplier_stock_no}
                                    </span>
                                ) : (
                                    <span className="text-slate-500 dark:text-slate-400 italic">Not recorded</span>
                                )}
                            </dd>
                        </div>
                        <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="font-semibold text-slate-500 dark:text-slate-400 normal-case tracking-normal">Quantity Received</dt>
                            <dd className="mt-1 font-semibold text-slate-900 dark:text-slate-100 sm:col-span-2 sm:mt-0 tabular-nums">
                                <span className="text-emerald-700 dark:text-emerald-400 mr-1">+</span>
                                {receiving.quantity} {receiving.unit || 'pcs'}
                            </dd>
                        </div>
                        <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="font-semibold text-slate-500 dark:text-slate-400 normal-case tracking-normal">Batch Remaining</dt>
                            <dd className="mt-1 font-semibold sm:col-span-2 sm:mt-0 tabular-nums">
                                {receiving.quantity_remaining !== null && receiving.quantity_remaining !== undefined ? (
                                    <span className={receiving.quantity_remaining > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}>
                                        {receiving.quantity_remaining} {receiving.unit || 'pcs'}
                                    </span>
                                ) : (
                                    <span className="text-slate-500 dark:text-slate-400 italic">N/A</span>
                                )}
                            </dd>
                        </div>
                        <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="font-semibold text-slate-500 dark:text-slate-400 normal-case tracking-normal">Unit Cost</dt>
                            <dd className="mt-1 tabular-nums text-slate-900 dark:text-slate-100 sm:col-span-2 sm:mt-0">
                                {receiving.unit_cost !== null && receiving.unit_cost !== undefined
                                    ? `₱${Number(receiving.unit_cost).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : 'N/A'}
                            </dd>
                        </div>
                        <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="font-semibold text-slate-500 dark:text-slate-400 normal-case tracking-normal">Batch Value</dt>
                            <dd className="mt-1 tabular-nums font-semibold text-slate-900 dark:text-slate-100 sm:col-span-2 sm:mt-0">
                                {receiving.amount !== null && receiving.amount !== undefined
                                    ? `₱${Number(receiving.amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : receiving.unit_cost
                                    ? `₱${(Number(receiving.unit_cost) * receiving.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : 'N/A'}
                            </dd>
                        </div>
                        <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                            <dt className="font-semibold text-slate-500 dark:text-slate-400 normal-case tracking-normal">Date Recorded</dt>
                            <dd className="mt-1 text-slate-700 dark:text-slate-300 sm:col-span-2 sm:mt-0">
                                {formattedDate}
                            </dd>
                        </div>
                    </dl>
                </RecordDetailsModal>
    );
};
