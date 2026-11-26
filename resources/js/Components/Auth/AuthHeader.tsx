import AuthBrandHeader from './AuthBrandHeader';

interface AuthHeaderProps {
    title: string;
    description?: string;
    className?: string;
    showBranding?: boolean;
    alignment?: 'left' | 'center';
    showSystemBranding?: boolean;
}

export default function AuthHeader({
    title,
    description,
    className = '',
    showBranding = true,
    alignment = 'left',
    showSystemBranding = true,
}: AuthHeaderProps) {
    return (
        <div className={`mb-8 ${alignment === 'center' ? "text-center" : ""} ${className}`}>
            {showBranding && (
                <AuthBrandHeader
                    alignment={alignment}
                    showSystemBranding={showSystemBranding}
                />
            )}
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-100 font-sans tracking-tight">
                {title}
            </h1>
            {description && (
                <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
                    {description}
                </p>
            )}
        </div>
    );
}
