import React from 'react';
import { UserProfileDetails } from '../types';
import { Shield, Mail, CheckCircle2, AlertCircle, Building2, KeyRound } from 'lucide-react';

interface Props {
    profile: UserProfileDetails;
}

export default function PersonnelHeader({ profile }: Props) {
    const initials = profile.name
        ? profile.name
              .split(' ')
              .map((n) => n[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')
              .toUpperCase()
        : 'U';

    const isActive = profile.is_active ?? true;
    const isVerified = Boolean(profile.email_verified_at);
    const formattedId = `EMP-${String(profile.id).padStart(4, '0')}`;

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950 via-red-900 to-red-950 text-white border border-red-900/80 shadow-xs mb-6">
            {/* Subtle Institutional Gold Accent Top Line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-600 opacity-90" />

            {/* Subtle Institutional Shield Watermark Background */}
            <div className="absolute -right-8 -bottom-10 pointer-events-none opacity-[0.06] select-none">
                <Shield className="w-64 h-64 text-white" />
            </div>

            <div className="p-6 sm:p-7 relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Left: Personnel Identity & Avatar */}
                    <div className="flex items-start sm:items-center gap-4 sm:gap-5 min-w-0">
                        {/* Avatar with Status Pip */}
                        <div className="relative shrink-0">
                            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-red-800 to-red-950 text-amber-200 flex items-center justify-center font-bold font-serif text-2xl sm:text-3xl shadow-sm select-none border-2 border-amber-400/60 ring-4 ring-amber-400/15">
                                {initials}
                            </div>
                            <span
                                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-red-950 ${
                                    isActive ? 'bg-emerald-500 ring-2 ring-emerald-400/40' : 'bg-slate-400'
                                }`}
                                title={isActive ? 'Account Active' : 'Account Inactive'}
                            />
                        </div>

                        {/* Text Metadata */}
                        <div className="min-w-0 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-900/80 border border-red-800/90 text-[10px] font-semibold text-amber-300 uppercase tracking-wider">
                                    <Building2 className="w-3 h-3 text-amber-400" />
                                    Supply & Property Management Office
                                </span>
                                <span className="text-[11px] font-mono text-red-200/80 px-2 py-0.5 rounded bg-black/20 border border-white/10">
                                    {formattedId}
                                </span>
                            </div>

                            <div className="flex flex-wrap items-baseline gap-2">
                                <h1 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-tight truncate">
                                    {profile.name}
                                </h1>
                                {profile.username && (
                                    <span className="text-xs text-red-200/80 font-mono">
                                        (@{profile.username})
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-red-100/90">
                                <span className="inline-flex items-center gap-1.5 font-medium px-2 py-0.5 rounded bg-white/10 border border-white/15">
                                    <Shield className="w-3 h-3 text-amber-400" />
                                    <span>{profile.role}</span>
                                </span>
                                <span className="text-red-300/40 hidden sm:inline">•</span>
                                <span className="inline-flex items-center gap-1.5 text-red-200 truncate">
                                    <Mail className="w-3.5 h-3.5 text-red-300" />
                                    <span>{profile.email}</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Quick Verification & Security Pills */}
                    <div className="flex flex-wrap sm:flex-nowrap lg:flex-col items-start lg:items-end gap-2 shrink-0 border-t border-red-900/60 pt-4 lg:border-t-0 lg:pt-0">
                        {/* Account Status Pill */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/25 border border-white/10 text-xs">
                            <span className="text-red-200 text-[11px]">Status:</span>
                            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-300">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                {isActive ? 'Active Personnel' : 'Inactive'}
                            </span>
                        </div>

                        {/* Email Verification Pill */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/25 border border-white/10 text-xs">
                            <span className="text-red-200 text-[11px]">Identity:</span>
                            {isVerified ? (
                                <span className="inline-flex items-center gap-1 font-semibold text-amber-300">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                                    Institutional Verified
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 font-semibold text-amber-200">
                                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                                    Verification Pending
                                </span>
                            )}
                        </div>

                        {/* Two-Step Verification Guard Pill */}
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-red-950/80 border border-red-800/80 text-[11px] text-red-200">
                            <KeyRound className="w-3 h-3 text-amber-400" />
                            <span>Two-Step OTP Protected</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
