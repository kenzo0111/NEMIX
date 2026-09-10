import React from 'react';
import Select from 'react-select';
import { customSelectStyles, REPORT_TYPE_OPTIONS } from '../constants';
import { ReportType } from '../types';

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
    const filterOptions = [
        { value: '', label: 'All Report Types' },
        ...REPORT_TYPE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label })),
    ];

    return (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white border border-gray-200/80 rounded-xl p-4 shadow-xs">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-1">
                <div className="relative flex-1 min-w-[240px] max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search by title or reference..."
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50/50 border border-gray-300 rounded-md focus:bg-white focus:border-red-900 focus:ring-1 focus:ring-red-900 transition-colors"
                    />
                </div>

                <div className="w-60">
                    <Select
                        options={filterOptions}
                        value={filterOptions.find((opt) => opt.value === selectedType) || filterOptions[0]}
                        onChange={(opt: any) => onTypeChange(opt ? opt.value : '')}
                        styles={customSelectStyles}
                        isSearchable={false}
                    />
                </div>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
                <button
                    type="button"
                    onClick={onOpenMigration}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-2xs"
                >
                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                    <span>Migrate Historical Data</span>
                </button>

                <button
                    type="button"
                    onClick={onOpenGenerate}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-900 border border-transparent rounded-lg hover:bg-red-950 active:bg-red-950 transition-colors shadow-xs"
                >
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Generate Report</span>
                </button>
            </div>
        </div>
    );
};
