import React, { useState, useMemo } from 'react';
import Select from 'react-select';
import { Search, Plus, UploadCloud, Eye, Printer, FileDown, Archive, Filter, RefreshCw } from 'lucide-react';
import { ComplianceReportItem } from './types';
import StatusBadge from '@/Components/Common/StatusBadge';
import TablePagination from '@/Components/Common/TablePagination';
import EmptyState from '@/Components/Common/EmptyState';

interface ReportRegistryProps {
    reports: ComplianceReportItem[];
    onView: (report: ComplianceReportItem) => void;
    onPrint: (report: ComplianceReportItem) => void;
    onExportPDF: (report: ComplianceReportItem) => void;
    onArchive: (report: ComplianceReportItem) => void;
    onGenerateNew: () => void;
    onMigrate: () => void;
}

const selectStyles = {
    control: (provided: any, state: any) => ({
        ...provided,
        borderRadius: '0.375rem',
        borderColor: state.isFocused ? '#7f1d1d' : '#d1d5db',
        borderWidth: '1px',
        padding: '1px 2px',
        minWidth: '140px',
        boxShadow: state.isFocused ? '0 0 0 1px #7f1d1d' : 'none',
        fontSize: '0.8125rem',
        fontWeight: '600',
        backgroundColor: '#ffffff',
        '&:hover': { borderColor: '#7f1d1d' },
    }),
    option: (provided: any, state: any) => ({
        ...provided,
        backgroundColor: state.isSelected ? '#7f1d1d' : state.isFocused ? '#fef2f2' : '#ffffff',
        color: state.isSelected ? '#ffffff' : '#111827',
        padding: '7px 12px',
        fontSize: '0.8125rem',
        fontWeight: '600',
        cursor: 'pointer',
    }),
    singleValue: (provided: any) => ({ ...provided, color: '#111827' }),
    menu: (provided: any) => ({
        ...provided,
        borderRadius: '0.375rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e5e7eb',
        zIndex: 50,
    }),
    indicatorSeparator: () => ({ display: 'none' }),
};

export default function ReportRegistry({
    reports = [],
    onView,
    onPrint,
    onExportPDF,
    onArchive,
    onGenerateNew,
    onMigrate,
}: ReportRegistryProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState<{ value: string; label: string } | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<{ value: string; label: string } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const typeOptions = [
        { value: '', label: 'All Report Types' },
        { value: 'RSMI', label: 'RSMI (Appendix 64)' },
        { value: 'RPCI', label: 'RPCI (Appendix 66)' },
        { value: 'STOCK_CARD', label: 'Stock Card (Appendix 58)' },
        { value: 'MR', label: 'MR (Appendix 63)' },
    ];

    const statusOptions = [
        { value: '', label: 'All Statuses' },
        { value: 'generated', label: 'Generated' },
        { value: 'historical_migration', label: 'Historical Migration' },
    ];

    const filteredReports = useMemo(() => {
        return reports.filter((r) => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch =
                !searchTerm ||
                String(r.reference || '').toLowerCase().includes(searchLower) ||
                String(r.type || '').toLowerCase().includes(searchLower) ||
                String(r.itemName || r.item_name || '').toLowerCase().includes(searchLower) ||
                String(r.recipient || '').toLowerCase().includes(searchLower) ||
                String(r.department || '').toLowerCase().includes(searchLower);

            const matchesType = !selectedType?.value || String(r.type) === selectedType.value;
            const matchesStatus =
                !selectedStatus?.value ||
                String(r.status).toLowerCase() === selectedStatus.value.toLowerCase() ||
                (selectedStatus.value === 'historical_migration' &&
                    (String(r.status).toLowerCase() === 'historical migration' ||
                        String(r.status).toLowerCase() === 'historical_migration')) ||
                (selectedStatus.value === 'generated' &&
                    (String(r.status).toLowerCase() === 'generated' ||
                        String(r.status).toLowerCase() === 'submitted' ||
                        String(r.status).toLowerCase() === 'approved'));

            return matchesSearch && matchesType && matchesStatus;
        });
    }, [reports, searchTerm, selectedType, selectedStatus]);

    const totalPages = Math.ceil(filteredReports.length / itemsPerPage) || 1;
    const paginatedReports = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredReports.slice(start, start + itemsPerPage);
    }, [filteredReports, currentPage, itemsPerPage]);

    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedType(null);
        setSelectedStatus(null);
        setCurrentPage(1);
    };

    return (
        <div className="space-y-4">
            {/* Top Toolbar: Institutional Actions & Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-xs">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 font-serif uppercase tracking-wider">
                            COA Official Reports Archive
                        </h3>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                            Official registry of generated compliance reports and historical migrated ledgers
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={onMigrate}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-xs font-bold uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
                        >
                            <UploadCloud className="w-4 h-4 text-gray-600" />
                            <span>Migrate Historical Data</span>
                        </button>

                        <button
                            type="button"
                            onClick={onGenerateNew}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-red-900 hover:bg-red-950 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-xs border border-red-900 cursor-pointer"
                        >
                            <Plus className="w-4 h-4 text-amber-300" />
                            <span>Generate Report</span>
                        </button>
                    </div>
                </div>

                {/* Filter Controls Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
                    <div className="relative flex-1 max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <Search className="w-4 h-4" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder="Search by reference, item, recipient..."
                            className="w-full pl-9 pr-4 py-2 text-xs font-medium border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-900 focus:border-red-900"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <Select
                            styles={selectStyles}
                            options={typeOptions}
                            value={selectedType}
                            onChange={(val) => {
                                setSelectedType(val);
                                setCurrentPage(1);
                            }}
                            placeholder="All Types"
                            isClearable
                        />

                        <Select
                            styles={selectStyles}
                            options={statusOptions}
                            value={selectedStatus}
                            onChange={(val) => {
                                setSelectedStatus(val);
                                setCurrentPage(1);
                            }}
                            placeholder="All Statuses"
                            isClearable
                        />

                        {(searchTerm || selectedType || selectedStatus) && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="p-2 text-gray-500 hover:text-red-900 rounded border border-gray-200 hover:bg-gray-50 text-xs font-semibold cursor-pointer"
                                title="Reset filters"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Reports Registry Table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-left">
                        <thead className="bg-gray-50/80">
                            <tr>
                                <th className="px-6 py-3 text-[11px] font-bold text-gray-700 uppercase tracking-wider font-mono">
                                    Reference No. & Form
                                </th>
                                <th className="px-6 py-3 text-[11px] font-bold text-gray-700 uppercase tracking-wider font-mono">
                                    Item Description
                                </th>
                                <th className="px-6 py-3 text-[11px] font-bold text-gray-700 uppercase tracking-wider font-mono">
                                    Accountable / Recipient
                                </th>
                                <th className="px-6 py-3 text-[11px] font-bold text-gray-700 uppercase tracking-wider font-mono">
                                    Report Date
                                </th>
                                <th className="px-6 py-3 text-[11px] font-bold text-gray-700 uppercase tracking-wider font-mono text-center">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-[11px] font-bold text-gray-700 uppercase tracking-wider font-mono text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {paginatedReports.length > 0 ? (
                                paginatedReports.map((report) => (
                                    <tr key={report.id} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="px-6 py-3.5 whitespace-nowrap">
                                            <div className="text-xs font-bold text-gray-900 font-mono">
                                                {report.reference || `REF-${report.id}`}
                                            </div>
                                            <div className="text-[10px] font-bold text-red-950/80 font-mono tracking-wide">
                                                {report.type === 'RSMI'
                                                    ? 'RSMI (Appendix 64)'
                                                    : report.type === 'RPCI'
                                                    ? 'RPCI (Appendix 66)'
                                                    : report.type === 'STOCK_CARD'
                                                    ? 'Stock Card (Appendix 58)'
                                                    : report.type === 'MR'
                                                    ? 'MR (Appendix 63)'
                                                    : String(report.type)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3.5 max-w-xs">
                                            <div className="text-xs font-medium text-gray-900 truncate">
                                                {report.itemName || report.item_name || report.title || 'General Consumables'}
                                            </div>
                                            {report.quantity && (
                                                <div className="text-[11px] text-gray-500 font-mono">
                                                    Qty: {report.quantity}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-3.5 whitespace-nowrap">
                                            <div className="text-xs font-medium text-gray-800">
                                                {report.recipient || report.department || 'SPMO Central'}
                                            </div>
                                            {report.department && report.recipient !== report.department && (
                                                <div className="text-[10px] text-gray-500 font-mono truncate max-w-[180px]">
                                                    {report.department}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-3.5 whitespace-nowrap text-xs text-gray-600 font-mono">
                                            {report.date || '—'}
                                        </td>
                                        <td className="px-6 py-3.5 whitespace-nowrap text-center">
                                            <StatusBadge
                                                status={
                                                    String(report.status || '').toLowerCase().includes('historical')
                                                        ? 'Historical Migration'
                                                        : 'Generated'
                                                }
                                            />
                                        </td>
                                        <td className="px-6 py-3.5 whitespace-nowrap text-right text-xs">
                                            <div className="inline-flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => onView(report)}
                                                    className="p-1.5 text-gray-500 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                                                    title="View Form Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onPrint(report)}
                                                    className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                                                    title="Print Official Form"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onExportPDF(report)}
                                                    className="p-1.5 text-gray-500 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                                                    title="Export PDF Document"
                                                >
                                                    <FileDown className="w-4 h-4" />
                                                </button>
                                                {report.status !== 'archived' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onArchive(report)}
                                                        className="p-1.5 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                                        title="Archive Report"
                                                    >
                                                        <Archive className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-8">
                                        <EmptyState
                                            isSearch={Boolean(searchTerm || selectedType || selectedStatus)}
                                            title={
                                                searchTerm || selectedType || selectedStatus
                                                    ? 'No reports match your filters'
                                                    : 'No official reports recorded'
                                            }
                                            description={
                                                searchTerm || selectedType || selectedStatus
                                                    ? 'Try clearing or modifying your filter criteria.'
                                                    : 'Generate a new official COA compliance report or migrate historical records to begin.'
                                            }
                                            action={
                                                searchTerm || selectedType || selectedStatus ? (
                                                    <button
                                                        type="button"
                                                        onClick={handleResetFilters}
                                                        className="px-3 py-1.5 text-xs font-semibold text-red-900 border border-red-200 rounded hover:bg-red-50"
                                                    >
                                                        Reset Filters
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={onGenerateNew}
                                                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-red-900 rounded hover:bg-red-950"
                                                    >
                                                        Generate First Report
                                                    </button>
                                                )
                                            }
                                        />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <TablePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredReports.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    itemLabel="official reports"
                />
            </div>
        </div>
    );
}
