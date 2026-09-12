import React from 'react';
import Modal from '@/Components/Modal';
import { IssuanceRecord } from '../types';
import { getFundClusterDisplay } from '../constants';
import RequisitionIssueSlip from '../../../../../Official Forms/RequisitionIssueSlip';

interface RisPreviewModalProps {
    show: boolean;
    issuance: IssuanceRecord | null;
    onClose: () => void;
    institutionName: string;
    responsibilityCenterCode: string;
    defaultApprovedBy: string;
    defaultApprovedByDesignation: string;
    defaultIssuedBy: string;
    defaultIssuedByDesignation: string;
}

export const RisPreviewModal: React.FC<RisPreviewModalProps> = ({
    show,
    issuance,
    onClose,
    institutionName,
    responsibilityCenterCode,
    defaultApprovedBy,
    defaultApprovedByDesignation,
    defaultIssuedBy,
    defaultIssuedByDesignation,
}) => {
    if (!issuance) return null;

    const items = issuance.items && issuance.items.length > 0 ? issuance.items : issuance.items_list || [];

    const handlePrint = () => {
        document.body.classList.add('printing-ris');
        window.print();
        setTimeout(() => {
            document.body.classList.remove('printing-ris');
        }, 500);
    };

    const risData = {
        entity_name: institutionName || 'University of Camarines Norte',
        fund_cluster: getFundClusterDisplay(issuance.fund_cluster),
        division: issuance.department || '',
        responsibility_center_code: responsibilityCenterCode || '',
        office: issuance.department || '',
        ris_no: issuance.ris_number,
        purpose: issuance.purpose || '',
        items: items.map((line) => ({
            stock_no: line.sku || line.stock_no || '',
            unit: line.unit || 'pcs',
            description: line.item || line.item_name,
            quantity: line.quantity,
            stock_available: true,
            issue_quantity: line.quantity,
            remarks: '',
        })),
        requested_by_name: issuance.recipient,
        requested_by_designation: issuance.recipient_designation,
        requested_by_date: issuance.date_issued || issuance.date,
        approved_by_name: issuance.approved_by || defaultApprovedBy,
        approved_by_designation: issuance.approved_by_designation || defaultApprovedByDesignation,
        approved_by_date: issuance.date_issued || issuance.date,
        issued_by_name: issuance.issued_by_name || issuance.issued_by || defaultIssuedBy,
        issued_by_designation: issuance.issued_by_position || defaultIssuedByDesignation,
        issued_by_date: issuance.date_issued || issuance.date,
        received_by_name: issuance.recipient,
        received_by_designation: issuance.recipient_designation,
        received_by_date: issuance.date_issued || issuance.date,
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="4xl">
            <div className="ris-print-modal bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 flex flex-col max-h-[92vh]">
                {/* Neutral Administrative Header */}
                <div className="ris-print-hide flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/75 flex-shrink-0">
                    <div>
                        <h3 className="text-base font-bold text-gray-900 font-serif tracking-tight">
                            Requisition and Issue Slip
                        </h3>
                        <p className="text-xs text-gray-500 font-mono">
                            RIS Reference: <span className="font-bold text-red-950">{issuance.ris_number}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="px-3.5 py-1.5 bg-red-950 hover:bg-red-900 active:bg-red-950 text-white font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                            <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                />
                            </svg>
                            Print Form
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                            aria-label="Close"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Form Document View Area */}
                <div className="p-6 overflow-y-auto bg-gray-100 flex justify-center">
                    <div className="ris-print-area bg-white border border-gray-300 rounded shadow-sm w-full max-w-[210mm] p-4 overflow-x-auto print-zoom-fit">
                        {/* Preserve exact RequisitionIssueSlip component layout */}
                        <RequisitionIssueSlip data={risData} />
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="ris-print-hide px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2.5 flex-shrink-0">
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="px-4 py-2 bg-red-950 hover:bg-red-900 text-white font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                        <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                            />
                        </svg>
                        Print
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
};
