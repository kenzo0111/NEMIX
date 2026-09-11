import React from 'react';
import { SystemSettings } from '../types';
import { Info } from 'lucide-react';

interface InstitutionSettingsProps {
    settings: SystemSettings;
    onChange: <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => void;
    errors?: Record<string, string>;
}

export default function InstitutionSettings({
    settings,
    onChange,
    errors = {},
}: InstitutionSettingsProps) {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm font-bold text-slate-900 font-serif">
                    University Official Identification
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                    Official university naming, office identity, and legal letterhead used across official SPMO forms.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Full Institution Name */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                        <span>Full Institution Name</span>
                        <span className="text-red-600 font-normal">*</span>
                    </label>
                    <input
                        type="text"
                        value={settings['institution.name']}
                        onChange={(e) => onChange('institution.name', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-all shadow-2xs hover:border-slate-300"
                        placeholder="University of Camarines Norte"
                    />
                    {errors['settings.institution.name'] && (
                        <p className="text-xs text-red-600 mt-1">{errors['settings.institution.name']}</p>
                    )}
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                        <Info className="w-3 h-3 text-slate-400 shrink-0" />
                        Official header title appearing on all generated reports.
                    </p>
                </div>

                {/* Agency Acronym */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                        <span>Agency Acronym</span>
                        <span className="text-red-600 font-normal">*</span>
                    </label>
                    <input
                        type="text"
                        value={settings['institution.acronym']}
                        onChange={(e) => onChange('institution.acronym', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-all shadow-2xs hover:border-slate-300 uppercase"
                        placeholder="UCN"
                    />
                    {errors['settings.institution.acronym'] && (
                        <p className="text-xs text-red-600 mt-1">{errors['settings.institution.acronym']}</p>
                    )}
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                        <Info className="w-3 h-3 text-slate-400 shrink-0" />
                        Short identification acronym used for bin tags and summary headers.
                    </p>
                </div>

                {/* Custodial Supply Office */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                        <span>Custodial Supply Office</span>
                        <span className="text-red-600 font-normal">*</span>
                    </label>
                    <input
                        type="text"
                        value={settings['institution.custodial_office']}
                        onChange={(e) => onChange('institution.custodial_office', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-all shadow-2xs hover:border-slate-300"
                        placeholder="Supply & Property Management Office (SPMO)"
                    />
                    {errors['settings.institution.custodial_office'] && (
                        <p className="text-xs text-red-600 mt-1">{errors['settings.institution.custodial_office']}</p>
                    )}
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                        <Info className="w-3 h-3 text-slate-400 shrink-0" />
                        Office in primary custody of consumable inventory and issuance.
                    </p>
                </div>

                {/* Campus Address */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                        <span>Campus / Postal Address</span>
                        <span className="text-red-600 font-normal">*</span>
                    </label>
                    <input
                        type="text"
                        value={settings['institution.campus_address']}
                        onChange={(e) => onChange('institution.campus_address', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-all shadow-2xs hover:border-slate-300"
                        placeholder="Daet, Camarines Norte"
                    />
                    {errors['settings.institution.campus_address'] && (
                        <p className="text-xs text-red-600 mt-1">{errors['settings.institution.campus_address']}</p>
                    )}
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                        <Info className="w-3 h-3 text-slate-400 shrink-0" />
                        Physical campus location printed on official compliance reports.
                    </p>
                </div>

                {/* Responsibility Center Code (RCC) */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">
                        Responsibility Center Code (RCC)
                    </label>
                    <input
                        type="text"
                        value={settings['institution.responsibility_center_code']}
                        onChange={(e) => onChange('institution.responsibility_center_code', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-mono font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-all shadow-2xs hover:border-slate-300"
                        placeholder="01-101-00"
                    />
                    {errors['settings.institution.responsibility_center_code'] && (
                        <p className="text-xs text-red-600 mt-1">{errors['settings.institution.responsibility_center_code']}</p>
                    )}
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                        <Info className="w-3 h-3 text-slate-400 shrink-0" />
                        Official government accounting station code for SPMO disbursements.
                    </p>
                </div>

                {/* Logo Path */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">
                        Institutional Crest / Logo Asset Path
                    </label>
                    <input
                        type="text"
                        value={settings['institution.logo_path']}
                        onChange={(e) => onChange('institution.logo_path', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-mono font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-all shadow-2xs hover:border-slate-300"
                        placeholder="/images/ucn-crest.png"
                    />
                    {errors['settings.institution.logo_path'] && (
                        <p className="text-xs text-red-600 mt-1">{errors['settings.institution.logo_path']}</p>
                    )}
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                        <Info className="w-3 h-3 text-slate-400 shrink-0" />
                        Asset path for the official university seal displayed on print forms.
                    </p>
                </div>
            </div>
        </div>
    );
}
