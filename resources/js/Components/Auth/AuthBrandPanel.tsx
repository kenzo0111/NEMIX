import ApplicationLogo from '@/Components/ApplicationLogo';
import { usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import { BarChart3, ClipboardList, Package } from 'lucide-react';

interface AuthBrandPanelProps {
    badgeText?: string;
    headline?: string;
    subheadline?: string;
}

export default function AuthBrandPanel({
    headline = 'SupplySync',
    subheadline = 'Consumable Supplies and Requisition Management System',
}: AuthBrandPanelProps) {
    const { branding } = usePage<PageProps>().props;
    const institutionName = branding?.institutionName || 'University of Camarines Norte';
    const officeName = branding?.officeName || 'Supply & Property Management Office (SPMO)';

    return (
        <div className="hidden lg:flex lg:w-[51%] shrink-0 text-white p-8 xl:p-10 flex-col gap-14 relative overflow-hidden bg-[#570b10] border-r border-[#52090d] dark:border-slate-800">
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                <div className="absolute inset-0 bg-[url('/images/cnsc-campus-bg.jpg')] bg-cover bg-bottom opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#570b10] via-[#570b10]/95 to-[#570b10]/30" />
                <div className="absolute -bottom-48 -left-48 w-[440px] h-[440px] rounded-full border-2 border-amber-300/60" />
                <div className="absolute -bottom-56 -left-56 w-[440px] h-[440px] rounded-full border border-amber-300/15" />
            </div>
            {/* 1. Top: Institutional Identity Block: Horizontal Logo + Name Lockup */}
            <div className="relative z-10">
                <div className="flex items-center gap-3 xl:gap-4">
                    <div className="bg-white p-3 rounded-2xl shadow-xs shrink-0 flex items-center justify-center">
                        <ApplicationLogo alt={`${institutionName} Seal`} className="h-10 w-10 object-contain" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                        <p className="leading-snug font-sans text-[11px] xl:text-xs uppercase tracking-wide text-amber-300 font-medium">
                            REPUBLIC OF THE PHILIPPINES
                        </p>
                        <h1 className="text-[14px] xl:text-[17px] font-sans font-bold uppercase leading-snug text-white tracking-tight whitespace-nowrap">
                            {institutionName}
                        </h1>
                        <p className="leading-snug font-sans text-xs xl:text-sm text-white/85 font-normal pt-1">
                            {officeName}
                        </p>
                    </div>
                </div>
            </div>

            {/* System title and full description */}
            <div className="relative z-10 pb-28 xl:pb-36">
                <div className="w-16 h-1 bg-amber-300 mb-5" aria-hidden="true" />
                <h2 className="text-5xl xl:text-6xl font-bold tracking-tight text-white leading-tight font-sans">
                    {headline}
                </h2>
                <p className="text-sm xl:text-base text-white/85 leading-relaxed font-sans mt-4 max-w-md [text-wrap:pretty]">
                    {subheadline}
                </p>
                <div className="grid grid-cols-3 divide-x divide-white/15 mt-9 text-xs xl:text-sm leading-relaxed">
                    <div className="flex items-center gap-2 pr-3">
                        <Package className="w-6 h-6 xl:w-7 xl:h-7 shrink-0 text-amber-300" aria-hidden="true" />
                        <span>Digital<br />Requisitions</span>
                    </div>
                    <div className="flex items-center gap-2 px-3">
                        <ClipboardList className="w-6 h-6 xl:w-7 xl:h-7 shrink-0 text-amber-300" aria-hidden="true" />
                        <span>Inventory<br />Monitoring</span>
                    </div>
                    <div className="flex items-center gap-2 pl-3">
                        <BarChart3 className="w-6 h-6 xl:w-7 xl:h-7 shrink-0 text-amber-300" aria-hidden="true" />
                        <span>Automated<br />Reports</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
