import { StylesConfig } from 'react-select';

export const institutionalSelectStyles: StylesConfig<any, false> = {
    control: (provided, state) => ({
        ...provided,
        borderRadius: '0.5rem',
        borderColor: state.isFocused ? '#7f1d1d' : '#d1d5db',
        borderWidth: '1px',
        padding: '2px 4px',
        boxShadow: state.isFocused ? '0 0 0 1px #7f1d1d' : 'none',
        fontSize: '0.8125rem',
        backgroundColor: '#ffffff',
        cursor: 'pointer',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        '&:hover': {
            borderColor: '#7f1d1d',
        },
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected ? '#fef2f2' : state.isFocused ? '#f9fafb' : '#ffffff',
        color: '#111827',
        padding: '8px 12px',
        cursor: 'pointer',
        borderBottom: '1px solid #f3f4f6',
        '&:active': {
            backgroundColor: '#fee2e2',
        },
    }),
    singleValue: (provided) => ({
        ...provided,
        color: '#111827',
        fontWeight: '600',
    }),
    menu: (provided) => ({
        ...provided,
        borderRadius: '0.5rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb',
        zIndex: 50,
        overflow: 'hidden',
    }),
    menuList: (provided) => ({
        ...provided,
        padding: 0,
        maxHeight: '260px',
    }),
    placeholder: (provided) => ({
        ...provided,
        color: '#9ca3af',
        fontSize: '0.8125rem',
    }),
};
