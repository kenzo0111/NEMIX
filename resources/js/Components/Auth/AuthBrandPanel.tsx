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
    headline = 'Smart Supply and Inventory Management System',
    subheadline = 'RFID Inventory Tracking and Automated Reporting',
}: AuthBrandPanelProps) {
    const { branding } = usePage<PageProps>().props;
    const institutionName = branding?.institutionName || 'University of Camarines Norte';
    const officeName = branding?.officeName || 'Supply & Property Management Office (SPMO)';

    return (
        <div className="hidden md:flex md:w-5/12 lg:w-[44%] text-white p-8 lg:p-10 flex-col justify-between relative overflow-hidden bg-[#7B1113] border-r border-[#600e0f] dark:border-slate-800">
            {/* Institutional Identity Block: Horizontal Logo + Name Lockup */}
            <div className="space-y-6">
                <div className="flex items-center gap-3.5">
                    <div className="bg-white p-2.5 rounded-xl shadow-xs shrink-0 flex items-center justify-center">
                        <ApplicationLogo alt={`${institutionName} Seal`} className="h-14 w-14 object-contain" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                        <p className="font-sans text-[11px] uppercase tracking-[0.14em] text-yellow-400 font-bold">
                            Republic of the Philippines
                        </p>
                        <h1 className="font-serif text-lg sm:text-xl lg:text-2xl font-bold uppercase leading-tight text-white tracking-tight">
                            {institutionName}
                        </h1>
                        <p className="font-sans text-xs text-stone-200/90 font-medium">
                            {officeName}
                        </p>
                    </div>
                </div>

                {/* System Information Box with Yellow Left Accent */}
                <div className="border-l-[3px] border-yellow-500 pl-4 py-3 my-6 bg-black/25 rounded-r-lg">
                    <span className="inline-block text-[11px] uppercase tracking-wider text-yellow-400 font-bold font-sans mb-1">
                        {badgeText}
                    </span>
                    <h2 className="text-xl font-bold tracking-tight text-white leading-snug font-sans">
                        {headline}
                    </h2>
                    <p className="text-xs text-stone-200/90 leading-relaxed mt-1.5 font-sans">
                        {subheadline}
                    </p>
                </div>
            </div>

            {/* Scope & Capabilities Footer */}
            <div className="pt-6 border-t border-white/15 space-y-1 font-sans">
                <p className="text-xs font-semibold text-white">
                    Official Consumables &amp; Supplies Administration
                </p>
                <p className="text-[11px] text-stone-300/80 leading-relaxed">
                    Inventory Receiving &bull; Issuance Processing &bull; RFID Tracking &bull; Automated Reporting
                </p>
            </div>
        </div>
    );
}
