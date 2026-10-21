import ApplicationLogo from '@/Components/ApplicationLogo';
import { usePage } from '@inertiajs/react';
import { PageProps } from '@/types';

interface AuthBrandPanelProps {
    badgeText?: string;
    headline?: string;
    subheadline?: string;
}

export default function AuthBrandPanel({
    badgeText = 'Institutional Access',
    headline = 'SupplySync',
    subheadline = 'Consumable Supplies and Requisition Management System',
}: AuthBrandPanelProps) {
    const { branding } = usePage<PageProps>().props;
    const institutionName = branding?.institutionName || 'University of Camarines Norte';
    const officeName = branding?.officeName || 'Supply & Property Management Office (SPMO)';

    return (
        <div className="hidden lg:flex lg:w-[46%] shrink-0 text-white p-10 flex-col gap-12 relative overflow-hidden bg-gradient-to-br from-[#680d13] via-[#4d080c] to-[#350406] border-r border-[#52090d] dark:border-slate-800">
            {/* 1. Top: Institutional Identity Block: Horizontal Logo + Name Lockup */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-xl shadow-xs shrink-0 flex items-center justify-center">
                        <ApplicationLogo alt={`${institutionName} Seal`} className="h-10 w-10 object-contain" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                        <p className="leading-snug font-sans text-xs normal-case tracking-normal text-yellow-200 font-medium">
                            Republic of the Philippines
                        </p>
                        <h1 className="text-lg font-sans font-semibold normal-case leading-snug text-white tracking-tight break-words [text-wrap:balance]">
                            {institutionName.toLowerCase() === 'university of camarines norte' ? (
                                <>University of<br />Camarines Norte</>
                            ) : institutionName}
                        </h1>
                    </div>
                </div>
                <p className="leading-relaxed font-sans text-sm text-white/80 font-normal border-t border-white/15 pt-4">
                    {officeName}
                </p>
            </div>

            {/* System title and full description */}
            <div className="my-auto py-2">
                <span className="inline-block text-xs normal-case tracking-widest text-yellow-200 font-semibold font-sans mb-4">
                    {badgeText}
                </span>
                <h2 className="text-4xl font-bold tracking-tight text-white leading-tight font-sans">
                    {headline}
                </h2>
                <div className="w-10 h-0.5 bg-yellow-400 mt-5 mb-5" aria-hidden="true" />
                <p className="text-base text-white/85 leading-relaxed font-sans [text-wrap:pretty]">
                    {subheadline}
                </p>
            </div>

            {/* 3. Bottom: Scope & Capabilities Footer */}
            <div className="pt-5 border-t border-white/15 font-sans">
                <p className="text-xs text-white/75 leading-relaxed tracking-wide">
                    Inventory &bull; Requests &bull; Reports
                </p>
            </div>
        </div>
    );
}
