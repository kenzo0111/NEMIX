import React from 'react';
import Select from 'react-select';
import { institutionalSelectStyles } from '@/styles/selectStyles';

interface IssuanceToolbarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    recipientFilter: string;
    onRecipientFilterChange: (value: string) => void;
    recipientOptions: Array<{ value: string; label: string }>;
    onRecordIssuance: () => void;
}

export const IssuanceToolbar: React.FC<IssuanceToolbarProps> = ({
    searchTerm,
    onSearchChange,
    recipientFilter,
    onRecipientFilterChange,
    recipientOptions,
    onRecordIssuance,
}) => {
    const selectedRecipientOption = recipientOptions.find((o) => o.value === recipientFilter) || null;

    return (
        <div className="px-6 lg:px-8 py-5 border-b border-gray-200/80 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50">
            <div>
                <h3 className="text-base font-bold text-gray-900 font-serif tracking-tight">
                    Inventory Issuance Records
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                    Official supply distributions and Requisition and Issue Slips (RIS).
                </p>
            </div>

            {/* Filter Controls & Action Button */}
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
                        placeholder="Search issuance..."
                        className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-md text-xs font-medium focus:border-red-900 focus:ring-1 focus:ring-red-900 shadow-xs placeholder-gray-400 transition-colors"
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
                    />
                </div>

                {/* Record Issuance Button */}
                <button
                    type="button"
                    onClick={onRecordIssuance}
                    className="w-full sm:w-auto bg-red-950 hover:bg-red-900 active:bg-red-950 text-white font-bold py-2 px-4 rounded-md shadow-xs transition-colors text-xs flex items-center justify-center gap-2 whitespace-nowrap uppercase font-mono tracking-wider cursor-pointer"
                >
                    <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Record Issuance
                </button>
            </div>
        </div>
    );
};
