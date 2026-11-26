import { StylesConfig } from 'react-select';

/**
 * Shared Institutional React Select Styling
 * Adheres to University Design Language:
 * - Maroon focus borders & rings (#7f1d1d / red-900)
 * - Slate/gray borders and neutral background
 * - Light maroon hover options (#fef2f2) and solid maroon active selection
 * - Clear error state styling
 */
export const getInstitutionalSelectStyles = <Option = any, IsMulti extends boolean = false>(hasError: boolean = false): StylesConfig<Option, IsMulti> => ({
    control: (provided, state) => ({
        ...provided,
        borderRadius: 'var(--radius-control, 0.5rem)',
        borderColor: (hasError || state.selectProps?.['aria-invalid']) ? 'var(--danger-text)' : state.isFocused ? 'var(--focus-color)' : 'var(--control-border)',
        borderWidth: '1px',
        backgroundColor: state.isDisabled ? 'var(--surface-muted)' : 'var(--surface-card, #ffffff)',
        minHeight: 'var(--control-height)',
        height: state.isMulti ? 'auto' : 'var(--control-height)',
        boxSizing: 'border-box',
        fontSize: '1rem',
        fontWeight: 500,
        boxShadow: state.isFocused && !state.isDisabled ? `0 0 0 2px ${(hasError || state.selectProps?.['aria-invalid']) ? 'var(--danger-text)' : 'var(--focus-color)'}` : 'none',
        opacity: state.isDisabled ? .6 : 1,
        cursor: state.isDisabled ? 'not-allowed' : 'default',
        '&:hover': {
            borderColor: state.isDisabled ? 'var(--control-border)' : (hasError || state.selectProps?.['aria-invalid']) ? 'var(--danger-text)' : 'var(--focus-color)',
        },
        transition: 'all 0.15s ease-in-out',
    }),
    valueContainer: (provided, state) => ({
        ...provided,
        minHeight: 'calc(var(--control-height) - 2px)',
        paddingTop: 0,
        paddingBottom: 0,
        overflow: 'hidden',
        minWidth: 0,
        flexWrap: state?.isMulti ? 'wrap' : 'nowrap',
    }),
    indicatorsContainer: (provided) => ({
        ...provided,
        height: 'calc(var(--control-height) - 2px)',
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected
            ? '#7f1d1d'
            : state.isFocused
            ? 'rgba(153, 27, 27, 0.2)'
            : 'var(--surface-card, #ffffff)',
        color: state.isSelected ? '#ffffff' : 'var(--text-primary, #1f2937)',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: state.isSelected ? 600 : 500,
        padding: '8px 12px',
        '&:active': {
            backgroundColor: '#7f1d1d',
            color: '#ffffff',
        },
    }),
    groupHeading: (provided) => ({
        ...provided,
        fontSize: '1rem',
        fontWeight: 700,
        color: 'var(--brand-text)',
        letterSpacing: 'normal',
        textTransform: 'none',
        paddingTop: '0.5rem',
        paddingBottom: '0.25rem',
        borderBottom: '1px solid var(--border-color, #f3f4f6)',
    }),
    menu: (provided) => ({
        ...provided,
        borderRadius: '0.5rem',
        backgroundColor: 'var(--surface-card, #ffffff)',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.15)',
        border: '1px solid var(--border-color, #e5e7eb)',
        zIndex: 60,
        overflow: 'hidden',
    }),
    menuList: (provided) => ({
        ...provided,
        backgroundColor: 'var(--surface-card, #ffffff)',
        maxHeight: '260px',
        paddingTop: 0,
        paddingBottom: 0,
    }),
    input: (provided) => ({
        ...provided,
        color: 'var(--text-primary, #111827)',
        margin: 0,
        padding: 0,
        input: { minHeight: 0 },
    }),
    placeholder: (provided) => ({
        ...provided,
        color: 'var(--text-secondary, #9ca3af)',
        fontSize: '1rem',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '100%',
    }),
    singleValue: (provided) => ({
        ...provided,
        color: 'var(--text-primary, #111827)',
        fontSize: '1rem',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '100%',
    }),
    indicatorSeparator: () => ({
        display: 'none',
    }),
    menuPortal: provided => ({ ...provided, zIndex: 60 }),
});

export const institutionalSelectStyles = getInstitutionalSelectStyles(false);
