import React from 'react';

interface SettingsHeroProps {
    userName?: string;
}

export default function SettingsHero({ userName }: SettingsHeroProps) {
    return (
        <div className="bg-red-950 text-white rounded-lg border border-red-900 border-l-4 border-l-amber-500 p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-red-900/80 border border-red-800 text-[11px] font-semibold text-amber-300 uppercase tracking-wide">
                        Supply & Property Management Office
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-tight">
                        University Supply & Inventory Policy Engine
                    </h1>
                    <p className="text-red-200/90 text-xs sm:text-sm max-w-2xl font-normal leading-relaxed">
                        Manage institutional settings, official document signatories, inventory policies, RFID behavior, notifications, and security parameters
                        {userName ? (
                            <> for <strong className="text-white font-medium">{userName}</strong></>
                        ) : null}.
                    </p>
                </div>

                {/* Inline Restrained Status Overview Strip */}
                <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-900/60 border border-red-800 text-xs text-red-100">
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                        <span className="text-red-200">Modules:</span>
                        <span className="font-bold text-amber-300 font-mono">7 Active</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-900/60 border border-red-800 text-xs text-red-100">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        <span className="text-red-200">Standard:</span>
                        <span className="font-bold text-white font-mono">COA App. 63</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-900/60 border border-red-800 text-xs text-red-100">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        <span className="text-red-200">Policy:</span>
                        <span className="font-bold text-emerald-300 font-mono">Enforced</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
