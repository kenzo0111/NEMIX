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
        <div className="lg:w-5/12 text-white p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-red-950 via-red-900 to-red-950 border-b lg:border-b-0 lg:border-r border-red-800/40">
            {/* Top Identity Block */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row lg:flex-col items-start gap-4">
                    <div className="bg-white p-3 rounded-xl shadow-md shrink-0 flex items-center justify-center">
                        <ApplicationLogo alt={`${institutionName} Crest`} className="h-16 w-16 object-contain" />
                    </div>
                    <div className="space-y-1">
                        <p className="font-serif text-yellow-400 uppercase tracking-[0.16em] text-[11px] font-bold">
                            Republic of the Philippines
                        </p>
                        <h1 className="font-serif text-2xl lg:text-3xl font-bold leading-tight text-white tracking-tight">
                            {institutionName}
                        </h1>
                        <p className="text-xs text-stone-300 font-medium pt-1">
                            {officeName}
                        </p>
                    </div>
                </div>

                {/* Tagline / System Scope Block */}
                <div className="border-l-2 border-yellow-500/80 pl-4 py-2 my-6 bg-black/20 rounded-r-lg">
                    <span className="inline-block text-[11px] uppercase tracking-wider text-yellow-300/90 font-semibold mb-1">
                        {badgeText}
                    </span>
                    <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-white leading-snug">
                        {headline}
                    </h2>
                    <p className="text-stone-300 text-xs leading-relaxed mt-1.5 font-normal">
                        {subheadline}
                    </p>
                </div>
            </div>

            {/* Bottom Scope & Capability Note */}
            <div className="pt-6 mt-6 border-t border-red-800/50 text-xs text-stone-300 space-y-1">
                <p className="font-medium text-stone-200">
                    Official Consumables &amp; Supplies Administration
                </p>
                <p className="text-[11px] text-stone-400">
                    Inventory Receiving &bull; Issuance Processing &bull; RFID Tracking &bull; Compliance Reporting
                </p>
            </div>
        </div>
    );
}
