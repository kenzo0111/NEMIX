import RecordDetailsModal from '@/Components/ui/record-details-modal';
import { Button } from '@/Components/ui/button';
import React, { useMemo } from 'react';
import { formatRisNumber } from '@/utils/risFormatter';
import { IssuanceRecord, IssuanceItemDetail } from '../types';
import { useSortableData } from '@/Hooks/useSortableData';
import SortableTableHeader from '@/Components/ui/sortable-table-header';
import { IssuanceStatus } from './IssuanceStatus';
import { getFundClusterDisplay } from '../constants';
import { formatDisplayDate } from '@/utils/dateUtils';
import { ClipboardList, X } from 'lucide-react';

interface IssuanceDetailsModalProps {
    show: boolean;
    issuance: IssuanceRecord | null;
    onClose: () => void;
    onViewRis?: (issuance: IssuanceRecord) => void;
}

export const IssuanceDetailsModal: React.FC<IssuanceDetailsModalProps> = ({
    show,
    issuance,
    onClose,
    onViewRis,
}) => {
    const accessors = useMemo(() => ({
        item: (line: IssuanceItemDetail) => line.item || line.item_name,
        stock_no: (line: IssuanceItemDetail) => line.stock_no,
        quantity: (line: IssuanceItemDetail) => line.quantity,
        cost: (line: IssuanceItemDetail) => line.unit_cost,
        amount: (line: IssuanceItemDetail) => line.amount,
    }), []);
    const { sortedRows: items, sort, requestSort } = useSortableData(issuance?.items?.length ? issuance.items : issuance?.items_list || [], accessors, { key: 'item', direction: 'asc' });
    if (!issuance) return null;
    const displayDate = formatDisplayDate(issuance.date_issued || issuance.date, 'MM/DD/YYYY') || issuance.date_issued || issuance.date;
    const totalQty = issuance.total_quantity ?? issuance.quantity ?? 0;
    const totalAmt = issuance.total_amount ?? issuance.amount ?? 0;

    return (
        <RecordDetailsModal
            show={show}
            onClose={onClose}
            maxWidth="2xl"
            title="Issuance Record Details"
            description={
                <span className="tabular-nums">
                    RIS Reference: <strong className="font-semibold text-red-950 dark:text-red-400">{formatRisNumber(issuance.ris_number)}</strong>
                </span>
            }
            actions={
                onViewRis ? (
                    <Button
                        variant="primary"
                        type="button"
                        onClick={() => {
                            onClose();
                            onViewRis(issuance);
                        }}
                    >
                        View RIS Form
                    </Button>
                ) : undefined
            }
        >
            <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300">
                    {/* General Information Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg">
                        <div>
                            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 normal-case tracking-normal block">
                                Recipient
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{issuance.recipient}</span>
                            {issuance.recipient_designation && (
                                <span className="text-slate-500 dark:text-slate-400 block text-sm mt-0.5">
                                    {issuance.recipient_designation}
                                </span>
                            )}
                        </div>

                        <div>
                            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 normal-case tracking-normal block">
                                Division / Office
                            </span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{issuance.department || '—'}</span>
                        </div>

                        <div>
                            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 normal-case tracking-normal block">
                                Date Issued
                            </span>
                            <span className="tabular-nums text-slate-800 dark:text-slate-200 font-medium">{displayDate}</span>
                        </div>

                        <div>
                            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 normal-case tracking-normal block">
                                Status
                            </span>
                            <div className="mt-0.5">
                                <IssuanceStatus status={issuance.status} />
                            </div>
                        </div>

                        {issuance.fund_cluster && (
                            <div>
                                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 normal-case tracking-normal block">
                                    Fund Cluster
                                </span>
                                <span className="text-slate-800 dark:text-slate-200">{getFundClusterDisplay(issuance.fund_cluster)}</span>
                            </div>
                        )}

                        {issuance.purpose && (
                            <div className="sm:col-span-2">
                                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 normal-case tracking-normal block">
                                    Purpose
                                </span>
                                <span className="text-slate-800 dark:text-slate-200">{issuance.purpose}</span>
                            </div>
                        )}
                    </div>

                    {/* Issued Items Ledger */}
                    <div>
                        <div className="pb-1.5 mb-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <h4 className="text-base font-semibold normal-case tracking-normal text-red-950 dark:text-red-400 tabular-nums">
                                Issued Inventory Items ({items.length})
                            </h4>
                            <span className="text-sm text-slate-500 dark:text-slate-400 tabular-nums">
                                Total: <strong className="text-slate-900 dark:text-slate-100">{totalQty} pcs</strong>
                            </span>
                        </div>

                        <div className="w-full min-w-0 border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
                            <table className="ui-data-table w-full min-w-[37.5rem] text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400 normal-case tabular-nums">
                                    <tr>
                                        <SortableTableHeader column="item" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} className="px-3 py-3 align-middle">Item Description</SortableTableHeader>
                                        <SortableTableHeader column="stock_no" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} className="px-3 py-3 align-middle">Stock No.</SortableTableHeader>
                                        <SortableTableHeader column="quantity" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} align="right" className="px-3 py-3 align-middle">Quantity</SortableTableHeader>
                                        <SortableTableHeader column="cost" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} align="right" className="px-3 py-3 align-middle">Unit Cost</SortableTableHeader>
                                        <SortableTableHeader column="amount" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} align="right" className="px-3 py-3 align-middle">Total Amount</SortableTableHeader>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                                    {items.map((line) => (
                                        <tr key={line.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                            <td className="px-3 py-3 font-medium text-slate-900 dark:text-slate-100 align-middle">
                                                {line.item || line.item_name}
                                            </td>
                                            <td className="px-3 py-3 tabular-nums text-slate-500 dark:text-slate-400 align-middle">
                                                {line.stock_no || '—'}
                                            </td>
                                            <td className="px-3 py-3 tabular-nums font-semibold text-slate-800 dark:text-slate-200 text-right align-middle">
                                                {line.quantity} {line.unit || 'pcs'}
                                            </td>
                                            <td className="px-3 py-3 tabular-nums text-slate-600 dark:text-slate-400 text-right align-middle">
                                                ₱{Number(line.unit_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-3 py-3 tabular-nums font-semibold text-slate-900 dark:text-slate-100 text-right align-middle">
                                                ₱{Number(line.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 tabular-nums text-sm">
                                    <tr>
                                        <td colSpan={2} className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-300 normal-case align-middle">
                                            Transaction Total
                                        </td>
                                        <td className="px-3 py-3 text-right font-semibold text-slate-900 dark:text-slate-100 align-middle">
                                            {totalQty} pcs
                                        </td>
                                        <td className="px-3 py-3 text-right text-slate-500 dark:text-slate-400 align-middle">—</td>
                                        <td className="px-3 py-3 text-right font-semibold text-red-950 dark:text-red-400 align-middle">
                                            ₱{Number(totalAmt).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Signatories & Custody */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                        <div>
                            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 normal-case tracking-normal block">
                                Approved By
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100 block">{issuance.approved_by}</span>
                            <span className="text-sm text-slate-500 dark:text-slate-400 block">{issuance.approved_by_designation}</span>
                            <span className="text-sm text-slate-500 dark:text-slate-400 tabular-nums mt-1 block">
                                Date: {issuance.date_issued || issuance.date || '—'}
                            </span>
                        </div>
                        <div>
                            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 normal-case tracking-normal block">
                                Issued By
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100 block">{issuance.issued_by_name || issuance.issued_by}</span>
                            <span className="text-sm text-slate-500 dark:text-slate-400 block">{issuance.issued_by_position || 'Supply Custodian / Storekeeper'}</span>
                            <span className="text-sm text-slate-500 dark:text-slate-400 tabular-nums mt-1 block">
                                Date: {issuance.date_issued || issuance.date || '—'}
                            </span>
                        </div>
                    </div>
                            </div>
        </RecordDetailsModal>
    );
};
