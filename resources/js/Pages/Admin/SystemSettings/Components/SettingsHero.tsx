import React from 'react';
import { ShieldCheck, Layers, FileCheck } from 'lucide-react';

interface SettingsHeroProps {
    userName?: string;
}

export default function SettingsHero({ userName }: SettingsHeroProps) {
    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-950 via-[#701518] to-stone-950 text-white border border-red-900/60 shadow-md shadow-red-950/10 p-6 sm:p-7">
            {/* Subtle institutional grain / overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40" />

            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="max-w-3xl space-y-3">
                    {/* Static Institutional Indicator */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-900/70 border border-red-700/60 text-[11px] font-semibold text-amber-300 tracking-wide backdrop-blur-xs shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        <span>Official System Configuration</span>
                    </div>

                    <div className="space-y-1.5">
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-serif leading-tight text-white tracking-tight">
                            University Supply & Inventory Policy Engine
                        </h1>
                        <p className="text-red-100/90 text-xs sm:text-sm font-normal leading-relaxed">
                            Manage institutional settings, official document signatories, inventory policies, RFID behavior, notifications, and security parameters
                            {userName ? (
                                <> for <strong className="text-white font-medium">{userName}</strong></>
                            ) : null}.
                        </p>
                    </div>

                    {/* Subtle Contextual Badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-red-200/90 font-medium">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/10 border border-white/10">
                            <Layers className="w-3 h-3 text-amber-300" />
                            7 Policy Modules
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/10 border border-white/10">
                            <FileCheck className="w-3 h-3 text-amber-300" />
                            COA Appendix 63 Compliant
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/10 border border-white/10">
                            <ShieldCheck className="w-3 h-3 text-amber-300" />
                            Policy Enforcement Active
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
