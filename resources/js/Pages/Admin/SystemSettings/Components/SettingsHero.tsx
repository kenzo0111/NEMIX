import React from 'react';

interface SettingsHeroProps {
    userName?: string;
}

export default function SettingsHero({ userName }: SettingsHeroProps) {
    return (
        <div className="bg-red-950 text-white rounded-lg border border-red-900 border-l-4 border-l-amber-500 p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col gap-4">
                <div className="space-y-1">
                    <h2 className="text-xl font-semibold text-white">
                        System configuration
                    </h2>
                    <p className="mt-2 text-red-100 text-base max-w-prose leading-relaxed">
                        Manage institution details, signatories, inventory rules, and security
                        {userName ? (
                            <> for <strong className="text-white font-medium">{userName}</strong></>
                        ) : null}.
                    </p>
                </div>

            </div>
        </div>
    );
}
