import ApplicationLogo from '@/Components/ApplicationLogo';
import { usePage } from '@inertiajs/react';
import { PageProps } from '@/types';

interface AuthHeaderProps {
    title: string;
    description?: string;
    className?: string;
}

export default function AuthHeader({
    title,
    description,
    className = '',
}: AuthHeaderProps) {
    const { branding } = usePage<PageProps>().props;
    const institutionName = branding?.institutionName || 'University of Camarines Norte';
    const officeName = branding?.officeName || 'Supply and Property Management Office';

    return (
        <div className={`mb-6 text-center space-y-3 ${className}`}>
            <div className="inline-flex justify-center">
                <div className="bg-white p-2 rounded-xl shadow-xs border border-stone-200/80 shrink-0 flex items-center justify-center">
                    <ApplicationLogo alt={`${institutionName} Seal`} className="h-14 w-14 object-contain" />
                </div>
            </div>

            <div className="space-y-0.5">
                <p className="font-serif text-red-900 uppercase tracking-[0.16em] text-[10px] font-bold">
                    Republic of the Philippines
                </p>
                <h2 className="font-serif text-xl font-bold text-stone-900 tracking-tight">
                    {institutionName}
                </h2>
                <p className="text-xs text-stone-500 font-medium">
                    {officeName}
                </p>
            </div>

            <div className="pt-3 border-t border-stone-100">
                <h3 className="text-lg font-bold text-stone-900 font-serif tracking-tight">
                    {title}
                </h3>
                {description && (
                    <p className="text-xs text-stone-600 mt-1.5 leading-relaxed max-w-sm mx-auto">
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
}
