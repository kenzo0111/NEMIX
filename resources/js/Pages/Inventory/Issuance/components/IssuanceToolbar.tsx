import { Button } from '@/Components/ui/button';
import React from 'react';
import Select from 'react-select';
import { institutionalSelectStyles } from '@/styles/selectStyles';
import { Search, Plus } from 'lucide-react';

interface IssuanceToolbarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    recipientFilter: string;
    onRecipientFilterChange: (value: string) => void;
    recipientOptions: Array<{ value: string; label: string }>;
    onRecordIssuance: () => void;
    canCreateIssuance: boolean;
}

export const IssuanceToolbar: React.FC<IssuanceToolbarProps> = ({
    searchTerm,
    onSearchChange,
    recipientFilter,
    onRecipientFilterChange,
    recipientOptions,
    onRecordIssuance,
    canCreateIssuance,
}) => {
    const selectedRecipientOption = recipientOptions.find((o) => o.value === recipientFilter) || null;

    return (
        <div className="table-toolbar p-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-slate-200/80 dark:border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
            <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 font-sans tracking-tight">
                    Issuance records
                </h2>
                <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                    Supply distributions and issue slips (RIS).
                </p>
            </div>

            {/* Filter Controls & Action Button */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 w-full xl:w-auto">
                {/* Search Input */}
                <div className="relative w-full sm:w-64">
                    <label htmlFor="issuance-search-input" className="sr-only">
                        Search issuance records
                    </label>
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 dark:text-slate-400">
                        <Search className="w-4 h-4 shrink-0" aria-hidden="true" />
                    </div>
                    <input
                        id="issuance-search-input"
                        type="search"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search issuance..."
                        aria-label="Search issuance records"
                        className="ui-field table-control w-full pl-10 pr-3.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md text-sm font-medium focus:border-red-900 dark:focus:border-red-600 focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 shadow-sm placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                    />
                </div>

                {/* Recipient Filter */}
                <div className="w-full sm:w-48">
                    <Select
                        value={selectedRecipientOption}
                        onChange={(selected) => onRecipientFilterChange(selected?.value || '')}
                        options={recipientOptions}
                        placeholder="Recipient"
                        isClearable
                        styles={institutionalSelectStyles}
                        classNamePrefix="react-select"
                        aria-label="Filter by recipient"
                    />
                </div>

                {/* Direct Stock Issuance Button */}
                {canCreateIssuance && <Button variant="primary"
                    type="button"
                    onClick={onRecordIssuance}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 tabular-nums"
                >
                    <Plus className="w-4 h-4 text-amber-300 shrink-0" aria-hidden="true" />
                    Direct Stock Issuance
                </Button>}
            </div>
        </div>
    );
};
