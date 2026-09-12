import React from 'react';
import Modal from '@/Components/Modal';
import { IssuanceRecord } from '../types';
import { IssuanceStatus } from './IssuanceStatus';
import { getFundClusterDisplay } from '../constants';
import { formatDisplayDate } from '@/utils/dateUtils';

interface IssuanceDetailsModalProps {
    show: boolean;
    issuance: IssuanceRecord | null;
    onClose: () => void;
}

export const IssuanceDetailsModal: React.FC<IssuanceDetailsModalProps> = ({
    show,
    issuance,
    onClose,
}) => {
    if (!issuance) return null;

    const items = issuance.items && issuance.items.length > 0 ? issuance.items : issuance.items_list || [];
    const displayDate = formatDisplayDate(issuance.date_issued || issuance.date, 'MM/DD/YYYY') || issuance.date_issued || issuance.date;
    const totalQty = issuance.total_quantity ?? issuance.quantity ?? 0;
    const totalAmt = issuance.total_amount ?? issuance.amount ?? 0;

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl">
            <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]">
                {/* Administrative Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/75 flex-shrink-0">
                    <div>
                        <h3 className="text-base font-bold text-gray-900 font-serif tracking-tight">
                            Issuance Record Details
                        </h3>
                        <p className="text-xs text-gray-500 font-mono">
                            RIS Reference: <span className="font-bold text-red-950">{issuance.ris_number}</span>
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Details Content */}
                <div className="p-6 overflow-y-auto space-y-6 text-xs text-gray-700">
                    {/* General Information Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50/70 border border-gray-200 rounded-lg">
                        <div>
                            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                                Recipient
                            </span>
                            <span className="font-bold text-gray-900 text-sm">{issuance.recipient}</span>
                            {issuance.recipient_designation && (
                                <span className="text-gray-500 block text-xs mt-0.5">
                                    {issuance.recipient_designation}
                                </span>
                            )}
                        </div>

                        <div>
                            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                                Division / Office
                            </span>
                            <span className="font-semibold text-gray-800">{issuance.department || '—'}</span>
                        </div>

                        <div>
                            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                                Date Issued
                            </span>
                            <span className="font-mono text-gray-800 font-medium">{displayDate}</span>
                        </div>

                        <div>
                            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                                Status
                            </span>
                            <div className="mt-0.5">
                                <IssuanceStatus status={issuance.status} />
                            </div>
                        </div>

                        {issuance.fund_cluster && (
                            <div>
                                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                                    Fund Cluster
                                </span>
                                <span className="text-gray-800">{getFundClusterDisplay(issuance.fund_cluster)}</span>
                            </div>
                        )}

                        {issuance.purpose && (
                            <div className="sm:col-span-2">
                                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                                    Purpose
                                </span>
                                <span className="text-gray-800">{issuance.purpose}</span>
                            </div>
                        )}
                    </div>

                    {/* Issued Items Ledger */}
                    <div>
                        <div className="pb-1.5 mb-2.5 border-b border-gray-200 flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-red-950 font-mono">
                                Issued Inventory Items ({items.length})
                            </h4>
                            <span className="text-xs text-gray-500 font-mono">
                                Total: <strong className="text-gray-900">{totalQty} pcs</strong>
                            </span>
                        </div>

                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 border-b border-gray-200 text-[11px] text-gray-600 uppercase font-mono">
                                    <tr>
                                        <th className="px-3 py-2">Item Description</th>
                                        <th className="px-3 py-2">Stock No.</th>
                                        <th className="px-3 py-2 text-right">Quantity</th>
                                        <th className="px-3 py-2 text-right">Unit Cost</th>
                                        <th className="px-3 py-2 text-right">Total Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {items.map((line, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/50">
                                            <td className="px-3 py-2.5 font-medium text-gray-900">
                                                {line.item || line.item_name}
                                            </td>
                                            <td className="px-3 py-2.5 font-mono text-gray-500">
                                                {line.sku || line.stock_no || '—'}
                                            </td>
                                            <td className="px-3 py-2.5 font-mono font-bold text-gray-800 text-right">
                                                {line.quantity} {line.unit || 'pcs'}
                                            </td>
                                            <td className="px-3 py-2.5 font-mono text-gray-600 text-right">
                                                ₱{Number(line.unit_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-3 py-2.5 font-mono font-semibold text-gray-900 text-right">
                                                ₱{Number(line.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50 border-t border-gray-200 font-mono text-xs">
                                    <tr>
                                        <td colSpan={2} className="px-3 py-2 font-bold text-gray-700 uppercase">
                                            Transaction Total
                                        </td>
                                        <td className="px-3 py-2 text-right font-bold text-gray-900">
                                            {totalQty} pcs
                                        </td>
                                        <td className="px-3 py-2 text-right text-gray-400">—</td>
                                        <td className="px-3 py-2 text-right font-bold text-red-950">
                                            ₱{Number(totalAmt).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Signatories & Custody */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                        <div>
                            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                                Approved By
                            </span>
                            <span className="font-bold text-gray-900 block">{issuance.approved_by}</span>
                            <span className="text-[11px] text-gray-500 block">{issuance.approved_by_designation}</span>
                        </div>
                        <div>
                            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                                Issued By
                            </span>
                            <span className="font-semibold text-gray-900 block">{issuance.issued_by_name || issuance.issued_by}</span>
                            <span className="text-[11px] text-gray-500 block">{issuance.issued_by_position || 'Supply Custodian / Storekeeper'}</span>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end flex-shrink-0">
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
