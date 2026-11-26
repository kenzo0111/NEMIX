import React, { Children, cloneElement, isValidElement } from 'react';
import InputError from '@/Components/InputError';

const CONTROL_TAGS = new Set(['input', 'select', 'textarea']);

function injectControlA11y(
    node: React.ReactNode,
    id: string,
    hint: React.ReactNode,
    error?: string
): { node: React.ReactNode; matched: boolean } {
    if (!isValidElement<any>(node)) return { node, matched: false };

    const props = node.props || {};
    const isDirectControl =
        (typeof node.type === 'string' && CONTROL_TAGS.has(node.type)) ||
        props.inputId !== undefined ||
        typeof node.type !== 'string';

    // If this is a wrapper div/span (e.g. <div className="relative">), descend into its children
    if (typeof node.type === 'string' && !CONTROL_TAGS.has(node.type)) {
        if (!props.children) return { node, matched: false };
        let matched = false;
        const nextChildren = Children.map(props.children, (child) => {
            if (matched) return child;
            const result = injectControlA11y(child, id, hint, error);
            if (result.matched) matched = true;
            return result.node;
        });
        return matched ? { node: cloneElement(node, undefined, nextChildren), matched: true } : { node, matched: false };
    }

    if (!isDirectControl) return { node, matched: false };

    const existingDescribedBy = props['aria-describedby'];
    const describedBy =
        Array.from(
            new Set(
                [existingDescribedBy, hint && `${id}-hint`, error && `${id}-error`]
                    .filter(Boolean)
                    .join(' ')
                    .split(' ')
                    .filter(Boolean)
            )
        ).join(' ') || undefined;

    return {
        matched: true,
        node: cloneElement(node, {
            ...(props.inputId !== undefined ? { inputId: id } : { id }),
            'aria-invalid': Boolean(error),
            'aria-describedby': describedBy,
        }),
    };
}

/** A label, hint and error stay associated with native inputs and React Select. */
export default function Field({
    id,
    label,
    required,
    hint,
    error,
    children,
    className = '',
}: {
    id: string;
    label: React.ReactNode;
    required?: boolean;
    hint?: React.ReactNode;
    error?: string;
    children: React.ReactNode;
    className?: string;
}) {
    const { node: control } = injectControlA11y(children, id, hint, error);

    return (
        <div className={`ui-field-group ${className}`}>
            <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                {label}
                {required && (
                    <span className="ml-1 text-red-700 dark:text-red-300" aria-label="required">
                        *
                    </span>
                )}
            </label>
            {control}
            {hint && (
                <p id={`${id}-hint`} className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {hint}
                </p>
            )}
            <InputError id={`${id}-error`} message={error} className="mt-1" />
        </div>
    );
}
