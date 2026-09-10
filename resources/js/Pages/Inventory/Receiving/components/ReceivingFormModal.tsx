import React from 'react';
import Modal from '@/Components/Modal';
import { ReceivingForm } from './ReceivingForm';
import { InventoryItem, Supplier, ReceivingFormData } from '../types';

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
        <Modal show={show} onClose={() => !processing && onClose()} maxWidth="md" closeable={!processing}>
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                {/* Thin Maroon Accent Header */}
                <div className="h-1 bg-red-900 w-full" />

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <h3 className="text-base font-bold text-gray-900 font-serif tracking-tight">
                            {mode === 'edit' ? `Edit Receiving Record #${recordId}` : 'Record Receiving'}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                            {mode === 'edit'
                                ? 'Update incoming inventory delivery specifications.'
                                : 'Register incoming inventory delivered to the university.'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
                        aria-label="Close modal"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form Body */}
                <div className="p-6">
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
