import { Button } from '@/Components/ui/button';
import React from 'react';
import Select from 'react-select';
import { Search, Upload, Plus } from 'lucide-react';
import { institutionalSelectStyles } from '@/styles/selectStyles';
import { REPORT_TYPE_OPTIONS } from '../constants';
import { ReportType } from '../types';
import useAuthorization from '@/Hooks/useAuthorization';

interface ReportToolbarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    selectedType: ReportType | '';
    onTypeChange: (value: ReportType | '') => void;
    onOpenGenerate: () => void;
    onOpenMigration: () => void;
}

export const ReportToolbar: React.FC<ReportToolbarProps> = ({
    searchTerm,
    onSearchChange,
    selectedType,
    onTypeChange,
    onOpenGenerate,
    onOpenMigration,
}) => {
    const { can, canAny } = useAuthorization();
    const filterOptions = [
        { value: '', label: 'All Report Types' },
        ...REPORT_TYPE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label })),
    ];
    const selectedFilterOption = filterOptions.find((o) => o.value === selectedType) || filterOptions[0];

    return (
        <div className="table-toolbar px-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-slate-200/80 dark:border-slate-800 flex flex-col 2xl:flex-row items-stretch 2xl:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="min-w-0">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 font-sans tracking-tight">
                    Official COA Documents
                </h3>
                <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                    Find and generate official reports.
                </p>
            </div>

            {/* Filter Controls & Action Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 w-full 2xl:w-auto min-w-0">
                {/* Search Input */}
                <div className="relative w-full sm:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 dark:text-slate-400">
                        <Search className="w-4 h-4 shrink-0" />
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search documents..."
                        className="ui-field table-control w-full pl-10 pr-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md text-sm font-medium focus:border-red-900 focus:ring-1 focus:ring-red-900 shadow-sm placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                    />
                </div>

                {/* Report Type Filter */}
                <div className="w-full sm:w-56">
                    <Select
                        value={selectedFilterOption}
                        onChange={(selected: any) => onTypeChange(selected?.value || '')}
                        options={filterOptions}
                        placeholder="Report Type"
                        isSearchable={false}
                        styles={institutionalSelectStyles}
                        classNamePrefix="react-select"
                    />
                </div>

                {/* Migrate Historical Data Button */}
                {canAny(['compliance.migrations.store', 'compliance.migrate.stock_card', 'compliance.migrate.memorandum_receipt']) && <Button variant="secondary"
                    type="button"
                    onClick={onOpenMigration}
                    className="table-control w-full sm:w-auto flex items-center justify-center gap-2 tabular-nums"
                >
                    <Upload className="w-4 h-4 text-red-900 dark:text-red-300 shrink-0" />
                    Migrate Data
                </Button>}

                {/* Generate Report Button (Primary action button matching Record Issuance) */}
                {can('compliance.reports.store') && can('compliance.reports.preview_dataset') && <Button variant="primary"
                    type="button"
                    onClick={onOpenGenerate}
                    className="table-control w-full sm:w-auto flex items-center justify-center gap-2 tabular-nums"
                >
                    <Plus className="w-4 h-4 text-amber-300 shrink-0" />
                    Generate Report
                </Button>}
            </div>
        </div>
    );
};

