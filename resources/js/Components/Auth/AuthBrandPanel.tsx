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
        <div className="hidden md:flex md:w-5/12 lg:w-[44%] text-white p-8 lg:p-10 flex-col justify-between relative overflow-hidden bg-gradient-to-b from-[#4d080c] via-[#680d13] to-[#350406] border-r border-[#52090d] dark:border-slate-800">
            {/* 1. Top: Institutional Identity Block: Horizontal Logo + Name Lockup */}
            <div className="flex items-start gap-3">
                <div className="bg-white p-2 rounded-xl shadow-xs shrink-0 flex items-center justify-center">
                    <ApplicationLogo alt={`${institutionName} Seal`} className="h-10 w-10 object-contain" />
                </div>
                <div className="space-y-0.5 min-w-0">
                    <p className="leading-snug font-sans text-xs normal-case tracking-normal text-yellow-400 font-medium">
                        Republic of the Philippines
                    </p>
                    <h1 className="text-lg lg:text-xl font-sans font-semibold normal-case leading-snug text-white tracking-tight break-words">
                        {institutionName}
                    </h1>
                    <p className="leading-snug font-sans text-xs text-stone-200/90 font-normal pt-1">
                        {officeName}
                    </p>
                </div>
            </div>

            {/* 2. Middle: System Information Box */}
            <div className="my-auto py-4">
                <div className="border-l-[3px] border-yellow-500 pl-4 py-3.5 bg-black/30 rounded-r-lg">
                    <span className="inline-block text-sm normal-case tracking-normal text-yellow-400 font-bold font-sans mb-1">
                        {badgeText}
                    </span>
                    <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-white leading-snug font-sans">
                        {headline}
                    </h2>
                    <p className="text-sm text-stone-200/90 leading-relaxed mt-1.5 font-sans">
                        {subheadline}
                    </p>
                </div>
            </div>

            {/* 3. Bottom: Scope & Capabilities Footer */}
            <div className="pt-5 border-t border-white/15 space-y-1 font-sans">
                <p className="leading-relaxed text-sm font-semibold text-white">
                    SupplySync
                </p>
                <p className="text-sm text-stone-300/80 leading-relaxed">
                    Inventory &bull; Requests &bull; Reports
                </p>
            </div>
        </div>
    );
}
