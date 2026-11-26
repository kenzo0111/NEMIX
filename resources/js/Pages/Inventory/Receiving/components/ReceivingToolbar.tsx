import { Button } from '@/Components/ui/button';
import React from 'react';
import Select from 'react-select';
import { institutionalSelectStyles } from '@/styles/selectStyles';
import { Supplier } from '../types';
import useAuthorization from '@/Hooks/useAuthorization';
import { Search, QrCode, Plus } from 'lucide-react';

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
    const { can } = useAuthorization();
    const supplierOptions = React.useMemo(() => {
        return suppliers.map((s) => ({ value: s.id, label: s.name }));
    }, [suppliers]);

    const selectedSupplierOption =
        supplierOptions.find((o) => o.value === Number(supplierFilter)) || null;

    return (
        <div className="table-toolbar p-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-slate-200/80 dark:border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
            <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 font-sans tracking-tight">
                    Receiving records
                </h2>
                <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                    Stock received from suppliers.
                </p>
            </div>

            {/* Filters Container & Actions */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 w-full xl:w-auto">
                {/* Search Input */}
                <div className="relative w-full sm:w-64">
                    <label htmlFor="receiving-search-input" className="sr-only">
                        Search receiving records
                    </label>
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 dark:text-slate-400">
                        <Search className="w-4 h-4 shrink-0" aria-hidden="true" />
                    </div>
                    <input
                        id="receiving-search-input"
                        type="search"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search item or SKU..."
                        aria-label="Search receiving records by item or SKU"
                        className="ui-field table-control w-full pl-10 pr-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md text-sm font-medium focus:border-red-900 focus:ring-1 focus:ring-red-900 shadow-sm placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
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
                        aria-label="Filter by Supplier"
                    />
                </div>

                {/* Scan RFID Button (Secondary Outlined Maroon) */}
                {can('inventory.receiving.store') && <Button variant="secondary"
                    type="button"
                    onClick={onScanRfid}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2"
                >
                    <QrCode className="w-4 h-4 text-red-950 dark:text-red-400 shrink-0" aria-hidden="true" />
                    <span>Scan RFID (Optional)</span>
                </Button>}

                {/* Record Receiving Button (Primary Institutional Maroon) */}
                {can('inventory.receiving.store') && <Button variant="primary"
                    type="button"
                    onClick={onRecordReceiving}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 tabular-nums"
                >
                    <Plus className="w-4 h-4 text-amber-300 shrink-0" aria-hidden="true" />
                    <span>Record Receiving</span>
                </Button>}
            </div>
        </div>
    );
};
