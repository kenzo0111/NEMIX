import React, { cloneElement, isValidElement } from 'react';
import InputError from '@/Components/InputError';

/** A label, hint and error stay associated with native inputs and React Select. */
export default function Field({ id, label, required, hint, error, children, className = '' }: {
    id: string; label: React.ReactNode; required?: boolean; hint?: React.ReactNode;
    error?: string; children: React.ReactNode; className?: string;
}) {
    let control = children;

    if (isValidElement<any>(children)) {
        const childProps = children.props || {};
        const existingDescribedBy = childProps['aria-describedby'];
        const describedBy = Array.from(new Set([existingDescribedBy, hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ').split(' ').filter(Boolean))).join(' ') || undefined;
        control = cloneElement(children, {
            ...(childProps.inputId !== undefined ? { inputId: id } : { id }),
            'aria-invalid': Boolean(error),
            'aria-describedby': describedBy,
        });
    }

    return (
        <div className={`ui-field-group ${className}`}>
            <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                {label}{required && <span className="ml-1 text-red-700 dark:text-red-300" aria-label="required">*</span>}
            </label>
            {control}
            {hint && <p id={`${id}-hint`} className="mt-1 text-sm text-slate-600 dark:text-slate-400">{hint}</p>}
            <InputError id={`${id}-error`} message={error} className="mt-1" />
        </div>
    );
}
