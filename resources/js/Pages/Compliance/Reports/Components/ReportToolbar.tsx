import React from 'react';
import Select from 'react-select';
import { institutionalSelectStyles } from '@/styles/selectStyles';
import { REPORT_TYPE_OPTIONS } from '../constants';
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
    const selectedFilterOption = filterOptions.find((o) => o.value === selectedType) || filterOptions[0];

    return (
        <div className="px-6 lg:px-8 py-5 border-b border-gray-200/80 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50">
            <div>
                <h3 className="text-base font-bold text-gray-900 font-serif tracking-tight">
                    Official COA Documents
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                    Historical registry of generated compliance certificates and inventory audit forms.
                </p>
            </div>

            {/* Filter Controls & Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
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
                        placeholder="Search documents..."
                        className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-md text-xs font-medium focus:border-red-900 focus:ring-1 focus:ring-red-900 shadow-xs placeholder-gray-400 transition-colors"
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
                <button
                    type="button"
                    onClick={onOpenMigration}
                    className="w-full sm:w-auto border border-red-900/30 text-red-950 hover:bg-red-50 hover:border-red-900/50 font-bold py-2 px-3.5 rounded-md transition-colors text-xs flex items-center justify-center gap-2 whitespace-nowrap uppercase font-mono tracking-wider cursor-pointer shadow-2xs"
                >
                    <svg className="w-4 h-4 text-red-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                    Migrate Data
                </button>

                {/* Generate Report Button (Primary action button matching Record Issuance) */}
                <button
                    type="button"
                    onClick={onOpenGenerate}
                    className="w-full sm:w-auto bg-red-950 hover:bg-red-900 active:bg-red-950 text-white font-bold py-2 px-4 rounded-md shadow-xs transition-colors text-xs flex items-center justify-center gap-2 whitespace-nowrap uppercase font-mono tracking-wider cursor-pointer"
                >
                    <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Generate Report
                </button>
            </div>
        </div>
    );
};

