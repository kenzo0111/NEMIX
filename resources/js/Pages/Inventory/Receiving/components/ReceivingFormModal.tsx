import React from 'react';
import Modal from '@/Components/Modal';
import { DialogHeader } from '@/Components/ui/dialog-frame';
import { Button } from '@/Components/ui/button';
import { ReceivingForm } from './ReceivingForm';
import { InventoryItem, Supplier, ReceivingFormData } from '../types';
import { PackagePlus, Edit3, X } from 'lucide-react';

interface ReceivingFormModalProps {
    show: boolean;
    onClose: () => void;
    mode: 'create' | 'edit';
    recordId?: number | null;
    data: ReceivingFormData;
    setData: (key: keyof ReceivingFormData, value: any) => void;
    errors: Partial<Record<keyof ReceivingFormData, string>>;
    processing: boolean;
    items: InventoryItem[];
    suppliers: Supplier[];
    onSubmit: (e: React.FormEvent) => void;
}

export const ReceivingFormModal: React.FC<ReceivingFormModalProps> = ({
    show,
    onClose,
    mode,
    recordId,
    data,
    setData,
    errors,
    processing,
    items,
    suppliers,
    onSubmit,
}) => {
    return (
        <Modal
            show={show}
            onClose={() => !processing && onClose()}
            maxWidth="xl"
            closeable={!processing}
            ariaLabel={mode === 'edit' ? `Edit Receiving Record #${recordId}` : 'Record Receiving'}
        >
            {/* Institutional Maroon Accent Header */}
            <div className="h-1.5 bg-gradient-to-r from-red-950 via-red-900 to-red-950 w-full shrink-0" />

            {/* Header */}
            <DialogHeader className="shrink-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-950 dark:text-red-400 flex items-center justify-center border border-red-100/80 dark:border-red-900/50 shadow-sm shrink-0">
                        {mode === 'edit' ? (
                            <Edit3 className="w-5 h-5 text-red-900 dark:text-red-400" />
                        ) : (
                            <PackagePlus className="w-5 h-5 text-red-900 dark:text-red-400" />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="break-words text-lg font-semibold text-slate-900 dark:text-slate-100 font-sans tracking-tight">
                            {mode === 'edit' ? `Edit Receiving Record #${recordId}` : 'Record Receiving'}
                        </h3>
                        <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5 break-words">
                            {mode === 'edit'
                                ? 'Update incoming inventory delivery specifications.'
                                : 'Register incoming inventory delivered to the university.'}
                        </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={onClose}
                    disabled={processing}
                    className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label="Close modal"
                >
                    <X className="w-5 h-5" />
                </Button>
            </DialogHeader>

            {/* Form Body & Footer */}
            <ReceivingForm
                data={data}
                setData={setData}
                errors={errors}
                processing={processing}
                mode={mode}
                items={items}
                suppliers={suppliers}
                onSubmit={onSubmit}
                onCancel={onClose}
            />
        </Modal>
    );
};
