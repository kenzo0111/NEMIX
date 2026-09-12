import React from 'react';
import Select from 'react-select';
import { institutionalSelectStyles } from '@/styles/selectStyles';
import { Supplier } from '../types';

interface ReceivingToolbarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    supplierFilter: number | string;
    onSupplierFilterChange: (value: number | string) => void;
    suppliers: Supplier[];
    onScanRfid: () => void;
    onRecordReceiving: () => void;
}

export const ReceivingToolbar: React.FC<ReceivingToolbarProps> = ({
    searchTerm,
    onSearchChange,
    supplierFilter,
    onSupplierFilterChange,
    suppliers,
    onScanRfid,
    onRecordReceiving,
}) => {
    const supplierOptions = React.useMemo(() => {
        return suppliers.map((s) => ({ value: s.id, label: s.name }));
    }, [suppliers]);

    const selectedSupplierOption =
        supplierOptions.find((o) => o.value === Number(supplierFilter)) || null;

    return (
        <div className="p-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-gray-200/80 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-gray-50/50">
            <div>
                <h3 className="text-base font-bold text-gray-900 font-serif tracking-tight">
                    Inventory Receiving Records
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                    Incoming stock, supplier deliveries, and official acquisitions.
                </p>
            </div>

            {/* Filters Container & Actions */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 w-full xl:w-auto">
                {/* Search Input */}
                <div className="relative w-full sm:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search item or SKU..."
                        className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-md text-xs font-medium focus:border-red-900 focus:ring-1 focus:ring-red-900 shadow-xs placeholder-gray-400 transition-colors"
                    />
                </div>

                {/* Supplier Filter */}
                <div className="w-full sm:w-56">
                    <Select
                        value={selectedSupplierOption}
                        onChange={(selected) => onSupplierFilterChange(selected ? selected.value : '')}
                        options={supplierOptions}
                        placeholder="Filter by Supplier"
                        isClearable
                        styles={institutionalSelectStyles}
                        classNamePrefix="react-select"
                    />
                </div>

                {/* Scan RFID Button (Secondary Outlined Maroon) */}
                <button
                    type="button"
                    onClick={onScanRfid}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 border border-red-900/30 text-red-950 hover:bg-red-50 hover:border-red-900/50 rounded-md font-semibold text-xs transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                >
                    <svg className="w-4 h-4 text-red-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                        />
                    </svg>
                    Scan RFID
                </button>

                {/* Record Receiving Button (Primary Institutional Maroon) */}
                <button
                    type="button"
                    onClick={onRecordReceiving}
                    className="w-full sm:w-auto bg-red-950 hover:bg-red-900 active:bg-red-950 text-white font-bold py-2 px-4 rounded-md shadow-xs transition-colors text-xs flex items-center justify-center gap-2 whitespace-nowrap uppercase font-mono tracking-wider cursor-pointer"
                >
                    <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Record Receiving
                </button>
            </div>
        </div>
    );
};
