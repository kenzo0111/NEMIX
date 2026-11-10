import AuthBrandHeader from './AuthBrandHeader';

interface AuthHeaderProps {
    title: string;
    description?: string;
    className?: string;
    showBranding?: boolean;
}

export default function AuthHeader({
    title,
    description,
    className = '',
    showBranding = true,
}: AuthHeaderProps) {
    return (
        <div className={`mb-8 ${className}`}>
            {showBranding && <AuthBrandHeader />}
            <h2 className="text-3xl font-bold text-stone-900 dark:text-slate-100 font-sans tracking-tight">
                {title}
            </h2>
            {description && (
                <p className="leading-relaxed text-sm text-stone-500 dark:text-slate-400 mt-1 font-sans">
                    {description}
                </p>
            )}
        </div>
    );
}
