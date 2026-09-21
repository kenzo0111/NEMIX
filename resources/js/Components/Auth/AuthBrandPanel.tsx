import ApplicationLogo from '@/Components/ApplicationLogo';
import { usePage } from '@inertiajs/react';
import { PageProps } from '@/types';

interface AuthBrandPanelProps {
    badgeText?: string;
    headline?: string;
    subheadline?: string;
}

export default function AuthBrandPanel({
    badgeText = 'Administrative Access',
    headline = 'Smart Supply and Inventory Management System',
    subheadline = 'RFID Inventory Tracking and Automated Reporting',
}: AuthBrandPanelProps) {
    const { branding } = usePage<PageProps>().props;
    const institutionName = branding?.institutionName || 'University of Camarines Norte';
    const officeName = branding?.officeName || 'Supply and Property Management Office';

    return (
        <div className="hidden md:flex md:w-5/12 lg:w-[40%] text-white p-6 md:p-8 lg:p-10 flex-col justify-between relative overflow-hidden bg-[#7B1113] border-r border-[#600e0f] dark:border-slate-800">
            {/* Institutional Identity Block: Horizontal Alignment */}
            <div className="space-y-5">
                <div className="flex items-center gap-3.5 sm:gap-4">
                    <div className="bg-white p-2 sm:p-2.5 rounded-xl shadow-xs shrink-0 flex items-center justify-center">
                        <ApplicationLogo alt={`${institutionName} Seal`} className="h-12 w-12 sm:h-14 sm:w-14 object-contain" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                        <p className="font-sans text-[11px] sm:text-xs uppercase tracking-widest text-amber-300 font-semibold truncate">
                            Republic of the Philippines
                        </p>
                        <h1 className="font-serif text-lg sm:text-xl lg:text-2xl font-bold leading-tight text-white tracking-tight">
                            {institutionName}
                        </h1>
                        <p className="font-sans text-xs sm:text-sm text-stone-200 font-medium truncate">
                            {officeName}
                        </p>
                    </div>
                </div>

                {/* Simplified System Information Box */}
                <div className="border-l-2 border-amber-400 pl-4 py-2.5 my-4 bg-black/15 rounded-r-lg">
                    <span className="inline-block text-xs uppercase tracking-wider text-amber-300 font-semibold font-sans mb-1">
                        {badgeText}
                    </span>
                    <h2 className="text-base lg:text-lg font-bold tracking-tight text-white leading-snug font-sans">
                        {headline}
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-200 leading-relaxed mt-1 font-sans">
                        {subheadline}
                    </p>
                </div>
            </div>

            {/* Distinct Project Capabilities: Eliminating Redundancy */}
            <div className="pt-4 border-t border-white/15 space-y-2 font-sans">
                <p className="text-xs uppercase tracking-wider text-amber-300/90 font-semibold">
                    Core System Capabilities
                </p>
                <ul className="space-y-1.5 text-xs text-stone-200">
                    <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" aria-hidden="true" />
                        <span>RFID Scanner Hardware &amp; Real-Time Item Verification</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" aria-hidden="true" />
                        <span>Automated Compliance Reports (RSMI, RPCI, Stock Cards)</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" aria-hidden="true" />
                        <span>FIFO Batch Cost Allocation &amp; Audit Trail Accountability</span>
                    </li>
                </ul>
            </div>
        </div>
    );
}
