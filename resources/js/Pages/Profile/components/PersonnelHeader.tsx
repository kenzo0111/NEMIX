import React from 'react';
import { UserProfileDetails } from '../types';

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

    return (
        <div className="bg-red-950 text-white rounded-lg border border-red-900 border-l-4 border-l-amber-500 p-4 sm:p-5 lg:p-6 shadow-xs mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 sm:gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-red-900/90 text-amber-300 flex items-center justify-center font-bold font-serif text-lg sm:text-xl border border-red-800 shadow-xs shrink-0 select-none">
                        {initials}
                    </div>
                    <div className="space-y-1 min-w-0">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-red-900/80 border border-red-800 text-[11px] font-semibold text-amber-300 uppercase tracking-wide">
                            Supply & Property Management Office
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-tight break-words">
                            {profile.name}
                            {profile.username && (
                                <span className="text-xs text-red-200/80 font-mono font-normal ml-2">
                                    (@{profile.username})
                                </span>
                            )}
                        </h1>
                        <p className="text-red-200/90 text-xs sm:text-sm max-w-2xl font-normal leading-relaxed break-words">
                            Official university personnel profile, security credentials, and system access activity for <strong className="text-white font-medium">{profile.email}</strong>.
                        </p>
                    </div>
                </div>

                {/* Inline Restrained Status Overview Strip */}
                <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-900/60 border border-red-800 text-xs text-red-100">
                        <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                        <span className="text-red-200">Account:</span>
                        <span className={`font-bold font-mono ${isActive ? 'text-emerald-300' : 'text-slate-300'}`}>
                            {isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-900/60 border border-red-800 text-xs text-red-100">
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                        <span className="text-red-200">Role:</span>
                        <span className="font-bold text-amber-300 font-mono">{profile.role || 'Personnel'}</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-900/60 border border-red-800 text-xs text-red-100">
                        <span className={`h-2 w-2 rounded-full ${isVerified ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        <span className="text-red-200">Identity:</span>
                        <span className={`font-bold font-mono ${isVerified ? 'text-emerald-300' : 'text-amber-300'}`}>
                            {isVerified ? 'Verified' : 'Pending'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
