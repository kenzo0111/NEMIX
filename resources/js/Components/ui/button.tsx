import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'tab' | 'unstyled';
export type ButtonSize = 'default' | 'icon' | 'auth';
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
    variant = 'secondary', size = 'default', loading = false, disabled,
    type = 'button', className, children, ...props
}, ref) {
    return <button {...props} ref={ref} type={type} disabled={disabled || loading}
        aria-busy={loading || props['aria-busy'] || undefined}
        data-variant={variant} data-size={size} className={cn('ui-button', className)}>
        {loading && <Loader2 size={16} className="animate-spin shrink-0 motion-reduce:animate-none" aria-hidden="true" />}
        {children}
    </button>;
});

/** Use these same attributes on links that navigate to an action screen. */
export const actionLinkProps = (variant: ButtonVariant = 'secondary', size: ButtonSize = 'default') => ({
    className: 'ui-button', 'data-variant': variant, 'data-size': size,
});
