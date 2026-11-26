import StatusBadge from '@/Components/ui/status-badge';
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
        <div className="bg-red-950 text-white rounded-xl border border-red-900 border-l-4 border-l-amber-500 p-4 sm:p-5 lg:p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 sm:gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-red-900/90 text-amber-300 flex items-center justify-center font-semibold font-sans text-lg sm:text-xl border border-red-800 shadow-sm shrink-0 select-none">
                        {initials}
                    </div>
                    <div className="space-y-1 min-w-0">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-red-900/80 border border-red-800 text-sm font-semibold text-amber-300 normal-case tracking-normal">
                            Supply & Property Management Office
                        </div>
                        <h2 className="text-xl sm:text-2xl font-semibold font-sans text-white tracking-tight break-words">
                            {profile.name}
                            {profile.username && (
                                <span className="text-sm text-red-200/80 tabular-nums font-normal ml-2">
                                    (@{profile.username})
                                </span>
                            )}
                        </h2>
                        <p className="text-red-200/90 text-sm max-w-2xl font-normal leading-relaxed break-words">
                            Official university personnel profile, security credentials, and system access activity for <strong className="text-white font-medium">{profile.email}</strong>.
                        </p>
                    </div>
                </div>

                {/* Inline Restrained Status Overview Strip */}
                <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
                    <StatusBadge tone={isActive ? 'success' : 'neutral'}>
                        Account: {isActive ? 'Active' : 'Inactive'}
                    </StatusBadge>
                    <StatusBadge tone="warning">
                        Role: {profile.role || 'Personnel'}
                    </StatusBadge>
                    <StatusBadge tone={isVerified ? 'success' : 'warning'}>
                        Identity: {isVerified ? 'Verified' : 'Pending'}
                    </StatusBadge>
                </div>
            </div>
        </div>
    );
}
