import React from 'react';
import { SystemSettings } from '../types';
import Field from '@/Components/ui/field';

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
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 font-sans">
                    University Official Identification
                </h3>
                <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Official university naming, office identity, and legal letterhead used across official SPMO forms.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field
                    id="institution-name"
                    label="Entity Name (Official COA Header)"
                    required
                    error={errors['settings.institution.name']}
                    hint="Centralized agency/entity title displayed on all Compliance forms (RIS, RSMI, RPCI, Stock Card, MOR)."
                >
                    <input
                        type="text"
                        value={settings['institution.name']}
                        onChange={(e) => onChange('institution.name', e.target.value)}
                        className="ui-field w-full"
                        placeholder="University of Camarines Norte"
                    />
                </Field>

                <Field
                    id="institution-default-fund-cluster"
                    label="Default Fund Cluster"
                    required
                    error={errors['settings.institution.default_fund_cluster']}
                    hint="Default fund cluster auto-populated across newly generated compliance reports."
                >
                    <input
                        type="text"
                        value={settings['institution.default_fund_cluster'] || '01 - Regular Agency Fund'}
                        onChange={(e) => onChange('institution.default_fund_cluster', e.target.value)}
                        className="ui-field w-full"
                        placeholder="01 - Regular Agency Fund"
                    />
                </Field>

                <Field
                    id="institution-acronym"
                    label="Agency Acronym"
                    required
                    error={errors['settings.institution.acronym']}
                    hint="Short identification acronym used for bin tags and summary headers."
                >
                    <input
                        type="text"
                        value={settings['institution.acronym']}
                        onChange={(e) => onChange('institution.acronym', e.target.value)}
                        className="ui-field w-full"
                        placeholder="UCN"
                    />
                </Field>

                <Field
                    id="institution-custodial-office"
                    label="Custodial Supply Office"
                    required
                    error={errors['settings.institution.custodial_office']}
                    hint="Office in primary custody of consumable inventory and issuance."
                >
                    <input
                        type="text"
                        value={settings['institution.custodial_office']}
                        onChange={(e) => onChange('institution.custodial_office', e.target.value)}
                        className="ui-field w-full"
                        placeholder="Supply & Property Management Office (SPMO)"
                    />
                </Field>

                <Field
                    id="institution-campus-address"
                    label="Campus / Postal Address"
                    required
                    error={errors['settings.institution.campus_address']}
                    hint="Physical campus location printed on official compliance reports."
                >
                    <input
                        type="text"
                        value={settings['institution.campus_address']}
                        onChange={(e) => onChange('institution.campus_address', e.target.value)}
                        className="ui-field w-full"
                        placeholder="Daet, Camarines Norte"
                    />
                </Field>

                <Field
                    id="institution-rcc"
                    label="Responsibility Center Code (RCC)"
                    error={errors['settings.institution.responsibility_center_code']}
                    hint="Official government accounting station code for SPMO disbursements."
                >
                    <input
                        type="text"
                        value={settings['institution.responsibility_center_code']}
                        onChange={(e) => onChange('institution.responsibility_center_code', e.target.value)}
                        className="ui-field w-full tabular-nums"
                        placeholder="01-101-00"
                    />
                </Field>

                <Field
                    id="institution-logo-path"
                    label="Institutional Crest / Logo Asset Path"
                    error={errors['settings.institution.logo_path']}
                    hint="Asset path for the official university seal displayed on print forms."
                >
                    <input
                        type="text"
                        value={settings['institution.logo_path']}
                        onChange={(e) => onChange('institution.logo_path', e.target.value)}
                        className="ui-field w-full tabular-nums"
                        placeholder="/images/ucn-crest.png"
                    />
                </Field>
            </div>
        </div>
    );
}
