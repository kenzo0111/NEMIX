import React from 'react';
import { UserProfileDetails } from '../types';
import { Shield, Mail, User } from 'lucide-react';

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

    return (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="flex items-center gap-4 min-w-0">
                    {/* Personnel Avatar / Initials */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-red-900 text-white flex items-center justify-center font-bold font-serif text-xl sm:text-2xl shadow-xs shrink-0 select-none border border-red-950/20">
                        {initials}
                    </div>

                    {/* Identity Details */}
                    <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 tracking-tight truncate">
                                {profile.name}
                            </h1>
                            {profile.username && (
                                <span className="text-xs text-slate-500 font-mono">
                                    (@{profile.username})
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-medium">
                            <span className="inline-flex items-center gap-1.5 text-slate-800 font-semibold">
                                <Shield className="w-3.5 h-3.5 text-red-900" />
                                {profile.role}
                            </span>
                            <span className="text-slate-300 hidden sm:inline">•</span>
                            <span className="inline-flex items-center gap-1.5 text-slate-600 truncate">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                {profile.email}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Account Status Badge */}
                <div className="shrink-0 self-start sm:self-center">
                    <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            isActive
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                    >
                        <span
                            className={`w-2 h-2 rounded-full ${
                                isActive ? 'bg-emerald-600' : 'bg-slate-400'
                            }`}
                        />
                        <span>{isActive ? 'Active Account' : 'Inactive'}</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
