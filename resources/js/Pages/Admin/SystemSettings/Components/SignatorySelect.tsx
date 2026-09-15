import React, { useMemo } from 'react';
import CreatableSelect from 'react-select/creatable';
import { components, OptionProps } from 'react-select';
import { Trash2 } from 'lucide-react';
import { Signatory } from '../types';
import { getInstitutionalSelectStyles } from '@/styles/selectStyles';

export interface SignatoryOption {
    value: number;
    label: string;
    designation: string;
    signatory: Signatory;
}

interface SignatorySelectProps {
    valueName: string;
    valueId?: number | null;
    onChange: (selected: { name: string; designation: string; id: number | null } | null) => void;
    signatories: Signatory[];
    placeholder?: string;
    isDisabled?: boolean;
    hasError?: boolean;
    onCreateSignatory?: (name: string) => void;
    onDeleteSignatory?: (signatory: Signatory) => void;
    id?: string;
}

export default function SignatorySelect({
    valueName,
    valueId,
    onChange,
    signatories = [],
    placeholder = 'Search or add signatory...',
    isDisabled = false,
    hasError = false,
    onCreateSignatory,
    onDeleteSignatory,
    id,
}: SignatorySelectProps) {
    // Transform directory list into react-select options
    const options: SignatoryOption[] = useMemo(() => {
        return signatories.map((sig) => ({
            value: sig.id,
            label: sig.name,
            designation: sig.designation,
            signatory: sig,
        }));
    }, [signatories]);

    // Find current selected option by ID or name fallback
    const selectedOption: SignatoryOption | null = useMemo(() => {
        const numericId =
            valueId !== undefined && valueId !== null && Number(valueId) > 0
                ? Number(valueId)
                : null;

        if (numericId !== null && !isNaN(numericId) && numericId > 0) {
            const byId = options.find((opt) => Number(opt.value) === numericId);
            if (byId) return byId;
        }

        if (valueName && typeof valueName === 'string' && valueName.trim()) {
            const trimmed = valueName.trim().toLowerCase();
            const byName = options.find(
                (opt) => opt.label.trim().toLowerCase() === trimmed
            );
            if (byName) return byName;

            // If name is not in options yet (e.g. legacy configured name), synthesize an option
            return {
                value: 0,
                label: valueName,
                designation: '',
                signatory: {
                    id: 0,
                    name: valueName,
                    designation: '',
                    is_active: true,
                },
            };
        }

        return null;
    }, [options, valueId, valueName]);

    // Shared institutional select styles
    const baseStyles = getInstitutionalSelectStyles(hasError);
    const customStyles = {
        ...baseStyles,
        menuPortal: (provided: any) => ({
            ...provided,
            zIndex: 9999,
        }),
        menu: (provided: any) => ({
            ...provided,
            borderRadius: '0.75rem',
            boxShadow:
                '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            zIndex: 9999,
        }),
        control: (provided: any, state: any) => ({
            ...provided,
            borderRadius: '0.75rem',
            borderColor: hasError
                ? '#ef4444'
                : state.isFocused
                ? '#7f1d1d'
                : '#e2e8f0',
            borderWidth: '1px',
            backgroundColor: isDisabled ? '#f8fafc' : '#ffffff',
            minHeight: '42px',
            fontSize: '0.875rem',
            fontWeight: 500,
            boxShadow: state.isFocused
                ? hasError
                    ? '0 0 0 2px rgba(239, 68, 68, 0.15)'
                    : '0 0 0 2px rgba(127, 29, 29, 0.12)'
                : 'none',
            '&:hover': {
                borderColor: hasError
                    ? '#dc2626'
                    : state.isFocused
                    ? '#7f1d1d'
                    : '#cbd5e1',
            },
            transition: 'all 0.15s ease-in-out',
        }),
    };

    // Custom Option Component: Displays Name, Designation, and an inline Delete button
    const CustomOption = (props: OptionProps<SignatoryOption, false>) => {
        const { data, isSelected } = props;
        const sig = data?.signatory;

        // If synthetic creatable option (+ Add "..."), render default option component
        if (!sig) {
            return <components.Option {...props} />;
        }

        const handleDelete = (e: React.MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            if (onDeleteSignatory && sig.id > 0) {
                onDeleteSignatory(sig);
            }
        };

        return (
            <components.Option {...props}>
                <div className="flex items-center justify-between gap-2 w-full py-0.5">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <span
                                className={`text-xs font-semibold truncate block ${
                                    isSelected ? 'text-white' : 'text-slate-900'
                                }`}
                            >
                                {sig.name}
                            </span>
                            {!sig.is_active && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-200 text-slate-600">
                                    Inactive
                                </span>
                            )}
                        </div>
                        {sig.designation && (
                            <div
                                className={`text-[11px] truncate mt-0.5 ${
                                    isSelected ? 'text-red-100' : 'text-slate-500'
                                }`}
                            >
                                {sig.designation}
                            </div>
                        )}
                    </div>

                    {/* Allow deleting/removing a signatory from directory */}
                    {onDeleteSignatory && sig.id > 0 && (
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.stopPropagation();
                            }}
                            onPointerDown={(e) => {
                                e.stopPropagation();
                            }}
                            onClick={handleDelete}
                            title={`Remove "${sig.name}" from directory`}
                            className={`p-1 rounded-md transition-colors ${
                                isSelected
                                    ? 'hover:bg-red-800 text-red-200 hover:text-white'
                                    : 'hover:bg-red-50 text-slate-400 hover:text-red-600'
                            }`}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </components.Option>
        );
    };

    return (
        <div className="w-full min-w-0">
            <CreatableSelect<SignatoryOption, false>
                id={id}
                value={selectedOption}
                options={options}
                getOptionValue={(option) => String(option.value)}
                getOptionLabel={(option) => option.label}
                isDisabled={isDisabled}
                isClearable={true}
                placeholder={placeholder}
                styles={customStyles}
                components={{
                    Option: CustomOption,
                }}
                menuPortalTarget={
                    typeof document !== 'undefined' ? document.body : undefined
                }
                menuPosition="fixed"
                filterOption={(candidate, input) => {
                    if (!input || !input.trim()) return true;
                    const search = input.toLowerCase().trim();
                    const labelMatch = (candidate.label || '')
                        .toLowerCase()
                        .includes(search);
                    const sig = candidate.data?.signatory;
                    const nameMatch = sig?.name
                        ? sig.name.toLowerCase().includes(search)
                        : false;
                    const desigMatch = sig?.designation
                        ? sig.designation.toLowerCase().includes(search)
                        : false;
                    return labelMatch || nameMatch || desigMatch;
                }}
                formatCreateLabel={(inputValue) => `+ Add "${inputValue}"`}
                onCreateOption={(inputValue) => {
                    if (onCreateSignatory) {
                        onCreateSignatory(inputValue);
                    }
                }}
                onChange={(option) => {
                    if (!option) {
                        // User cleared selection
                        onChange(null);
                        return;
                    }
                    onChange({
                        id: option.value > 0 ? option.value : null,
                        name: option.signatory.name,
                        designation: option.signatory.designation,
                    });
                }}
                noOptionsMessage={({ inputValue }) =>
                    inputValue
                        ? `No signatory found for "${inputValue}"`
                        : 'No signatories available. Type a name to add.'
                }
            />
        </div>
    );
}
