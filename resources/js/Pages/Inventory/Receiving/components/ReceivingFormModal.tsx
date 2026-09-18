import React from 'react';
import Modal from '@/Components/Modal';
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
            maxWidth="lg"
            closeable={!processing}
            ariaLabel={mode === 'edit' ? `Edit Receiving Record #${recordId}` : 'Record Receiving'}
        >
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                {/* Institutional Maroon Accent Header */}
                <div className="h-1.5 bg-gradient-to-r from-red-950 via-red-900 to-red-950 w-full shrink-0" />

                {/* Header */}
                <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/70">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-950 flex items-center justify-center border border-red-100/80 shadow-2xs shrink-0">
                            {mode === 'edit' ? (
                                <Edit3 className="w-5 h-5 text-red-900" />
                            ) : (
                                <PackagePlus className="w-5 h-5 text-red-900" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-base font-bold text-gray-900 font-serif tracking-tight truncate">
                                {mode === 'edit' ? `Edit Receiving Record #${recordId}` : 'Record Receiving'}
                            </h3>
                            <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">
                                {mode === 'edit'
                                    ? 'Update incoming inventory delivery specifications.'
                                    : 'Register incoming inventory delivered to the university.'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer shrink-0 ml-2"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
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
                </div>
            </div>
        </Modal>
    );
};
