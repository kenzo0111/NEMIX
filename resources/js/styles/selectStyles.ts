import { StylesConfig } from 'react-select';

/**
 * Shared Institutional React Select Styling
 * Adheres to University Design Language:
 * - Maroon focus borders & rings (#7f1d1d / red-900)
 * - Slate/gray borders and neutral background
 * - Light maroon hover options (#fef2f2) and solid maroon active selection
 * - Clear error state styling
 */
export const getInstitutionalSelectStyles = (hasError: boolean = false): StylesConfig<any, any> => ({
    control: (provided, state) => ({
        ...provided,
        borderRadius: '0.5rem',
        borderColor: hasError ? '#f87171' : state.isFocused ? '#7f1d1d' : '#d1d5db',
        borderWidth: '1px',
        backgroundColor: '#ffffff',
        minHeight: '40px',
        fontSize: '0.875rem',
        fontWeight: 500,
        boxShadow: state.isFocused
            ? hasError
                ? '0 0 0 2px rgba(239, 68, 68, 0.2)'
                : '0 0 0 2px rgba(127, 29, 29, 0.15)'
            : 'none',
        '&:hover': {
            borderColor: hasError ? '#ef4444' : '#7f1d1d',
        },
        transition: 'all 0.15s ease-in-out',
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected
            ? '#7f1d1d'
            : state.isFocused
            ? '#fef2f2'
            : '#ffffff',
        color: state.isSelected ? '#ffffff' : '#1f2937',
        cursor: 'pointer',
        fontSize: '0.875rem',
        fontWeight: state.isSelected ? 600 : 500,
        padding: '8px 12px',
        '&:active': {
            backgroundColor: '#7f1d1d',
            color: '#ffffff',
        },
    }),
    groupHeading: (provided) => ({
        ...provided,
        fontSize: '0.75rem',
        fontWeight: 700,
        color: '#7f1d1d',
        letterSpacing: '0.025em',
        textTransform: 'uppercase',
        paddingTop: '0.5rem',
        paddingBottom: '0.25rem',
        borderBottom: '1px solid #f3f4f6',
    }),
    menu: (provided) => ({
        ...provided,
        borderRadius: '0.5rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb',
        zIndex: 60,
        overflow: 'hidden',
    }),
    menuList: (provided) => ({
        ...provided,
        maxHeight: '260px',
        paddingTop: 0,
        paddingBottom: 0,
    }),
    placeholder: (provided) => ({
        ...provided,
        color: '#9ca3af',
        fontSize: '0.875rem',
    }),
    singleValue: (provided) => ({
        ...provided,
        color: '#111827',
        fontSize: '0.875rem',
        fontWeight: 500,
    }),
    indicatorSeparator: () => ({
        display: 'none',
    }),
});

export const institutionalSelectStyles = getInstitutionalSelectStyles(false);
