import React from 'react';
import { SystemSettings } from '../types';

interface SignatorySettingsProps {
    settings: SystemSettings;
    onChange: <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => void;
    errors?: Record<string, string>;
}

export default function SignatorySettings({
    settings,
    onChange,
    errors = {},
}: SignatorySettingsProps) {
    return (
        <div className="space-y-8">
            {/* SUBSECTION 1: REQUISITION & ISSUE SLIP */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 font-serif">
                        Requisition & Issue Slip (RIS — Appendix 63)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Authorized approving and issuing personnel appearing on official RIS issuance vouchers.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                            Approving Officer Name
                        </label>
                        <input
                            type="text"
                            value={settings['signatories.ris_approved_by_name']}
                            onChange={(e) => onChange('signatories.ris_approved_by_name', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-all shadow-2xs hover:border-slate-300"
                            placeholder="ARSENIO GEM A. GARCILLANOSA"
                        />
                        {errors['settings.signatories.ris_approved_by_name'] && (
                            <p className="text-xs text-red-600 mt-1">{errors['settings.signatories.ris_approved_by_name']}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                            Approving Officer Designation
                        </label>
                        <input
                            type="text"
                            value={settings['signatories.ris_approved_by_designation']}
                            onChange={(e) => onChange('signatories.ris_approved_by_designation', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-all shadow-2xs hover:border-slate-300"
                            placeholder="SUPPLY OFFICER III / ADMIN OFFICER V"
                        />
                        {errors['settings.signatories.ris_approved_by_designation'] && (
                            <p className="text-xs text-red-600 mt-1">{errors['settings.signatories.ris_approved_by_designation']}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                            Issuing Custodian Name
                        </label>
                        <input
                            type="text"
                            value={settings['signatories.ris_issued_by_name']}
                            onChange={(e) => onChange('signatories.ris_issued_by_name', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-all shadow-2xs hover:border-slate-300"
                            placeholder="Supply Custodian / Storekeeper"
                        />
                        {errors['settings.signatories.ris_issued_by_name'] && (
                            <p className="text-xs text-red-600 mt-1">{errors['settings.signatories.ris_issued_by_name']}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                            Issuing Custodian Designation
                        </label>
                        <input
                            type="text"
                            value={settings['signatories.ris_issued_by_designation']}
                            onChange={(e) => onChange('signatories.ris_issued_by_designation', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-all shadow-2xs hover:border-slate-300"
                            placeholder="Administrative Aide VI / Storekeeper"
                        />
                        {errors['settings.signatories.ris_issued_by_designation'] && (
                            <p className="text-xs text-red-600 mt-1">{errors['settings.signatories.ris_issued_by_designation']}</p>
                        )}
                    </div>
                </div>

                {/* OIC Delegation */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center gap-2.5">
                        <input
                            type="checkbox"
                            id="oic_toggle"
                            checked={settings['signatories.ris_oic_active']}
                            onChange={(e) => onChange('signatories.ris_oic_active', e.target.checked)}
                            className="w-4 h-4 rounded text-red-900 focus:ring-red-800 border-slate-300 cursor-pointer"
                        />
                        <label htmlFor="oic_toggle" className="text-xs font-semibold text-slate-900 cursor-pointer">
                            Enable Officer-in-Charge (OIC) Delegation on RIS Forms
                        </label>
                    </div>
                    <p className="text-xs text-slate-500 pl-6 leading-relaxed">
                        Prepends designated prefix text to the approving officer name on printed documents during official administrative absence.
                    </p>

                    {settings['signatories.ris_oic_active'] && (
                        <div className="pt-2 pl-6 max-w-xs">
                            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                                Delegation Prefix
                            </label>
                            <input
                                type="text"
                                value={settings['signatories.ris_oic_prefix']}
                                onChange={(e) => onChange('signatories.ris_oic_prefix', e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium bg-white text-slate-900 focus:ring-1 focus:ring-red-900 focus:border-red-800 shadow-2xs"
                                placeholder="OIC, "
                            />
                        </div>
                    )}
                </div>
            </div>

            <hr className="border-slate-200/80" />

            {/* SUBSECTION 2: RSMI */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 font-serif">
                        Report of Supplies & Materials Issued (RSMI — Monthly Summary)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Custodian certification and accounting posting personnel for monthly summary ledgers.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                            Certified Correct By (Supply Custodian)
                        </label>
                        <input
                            type="text"
                            value={settings['signatories.rsmi_certified_by_name']}
                            onChange={(e) => onChange('signatories.rsmi_certified_by_name', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-all shadow-2xs hover:border-slate-300"
                            placeholder="ARSENIO GEM A. GARCILLANOSA"
                        />
                        {errors['settings.signatories.rsmi_certified_by_name'] && (
                            <p className="text-xs text-red-600 mt-1">{errors['settings.signatories.rsmi_certified_by_name']}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                            Certification Designation
                        </label>
                        <input
                            type="text"
                            value={settings['signatories.rsmi_certified_by_designation']}
                            onChange={(e) => onChange('signatories.rsmi_certified_by_designation', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-all shadow-2xs hover:border-slate-300"
                            placeholder="Supply Officer III / SPMO Head"
                        />
                        {errors['settings.signatories.rsmi_certified_by_designation'] && (
                            <p className="text-xs text-red-600 mt-1">{errors['settings.signatories.rsmi_certified_by_designation']}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                            Posted By (Accounting Representative)
                        </label>
                        <input
                            type="text"
                            value={settings['signatories.rsmi_posted_by_name']}
                            onChange={(e) => onChange('signatories.rsmi_posted_by_name', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-all shadow-2xs hover:border-slate-300"
                            placeholder="Accounting Representative / Bookkeeper"
                        />
                        {errors['settings.signatories.rsmi_posted_by_name'] && (
                            <p className="text-xs text-red-600 mt-1">{errors['settings.signatories.rsmi_posted_by_name']}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                            Accounting Designation
                        </label>
                        <input
                            type="text"
                            value={settings['signatories.rsmi_posted_by_designation']}
                            onChange={(e) => onChange('signatories.rsmi_posted_by_designation', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-all shadow-2xs hover:border-slate-300"
                            placeholder="Administrative Officer IV"
                        />
                        {errors['settings.signatories.rsmi_posted_by_designation'] && (
                            <p className="text-xs text-red-600 mt-1">{errors['settings.signatories.rsmi_posted_by_designation']}</p>
                        )}
                    </div>
                </div>
            </div>

            <hr className="border-slate-200/80" />

            {/* SUBSECTION 3: RPCI */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 font-serif">
                        Report on the Physical Count of Inventories (RPCI)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Accountable officers and inventory committee heads for annual physical inventory verification.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                            Accountable Officer Name
                        </label>
                        <input
                            type="text"
                            value={settings['signatories.rpci_accountable_officer_name']}
                            onChange={(e) => onChange('signatories.rpci_accountable_officer_name', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-all shadow-2xs hover:border-slate-300"
                            placeholder="Arsenio Gem A. Garcillanosa"
                        />
                        {errors['settings.signatories.rpci_accountable_officer_name'] && (
                            <p className="text-xs text-red-600 mt-1">{errors['settings.signatories.rpci_accountable_officer_name']}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                            Accountable Officer Designation
                        </label>
                        <input
                            type="text"
                            value={settings['signatories.rpci_accountable_officer_designation']}
                            onChange={(e) => onChange('signatories.rpci_accountable_officer_designation', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-all shadow-2xs hover:border-slate-300"
                            placeholder="Supply Custodian / Supply Officer III"
                        />
                        {errors['settings.signatories.rpci_accountable_officer_designation'] && (
                            <p className="text-xs text-red-600 mt-1">{errors['settings.signatories.rpci_accountable_officer_designation']}</p>
                        )}
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-semibold text-slate-700 block">
                            Inventory Committee Chairman
                        </label>
                        <input
                            type="text"
                            value={settings['signatories.rpci_committee_chair']}
                            onChange={(e) => onChange('signatories.rpci_committee_chair', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-all shadow-2xs hover:border-slate-300"
                            placeholder="Inspection Committee Chairman"
                        />
                        {errors['settings.signatories.rpci_committee_chair'] && (
                            <p className="text-xs text-red-600 mt-1">{errors['settings.signatories.rpci_committee_chair']}</p>
                        )}
                    </div>
                </div>
            </div>

            <hr className="border-slate-200/80" />

            {/* SUBSECTION 4: STOCK CARD */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 font-serif">
                        Stock Card Custodian
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Storekeeper or property custodian maintaining bin-level physical stock cards.
                    </p>
                </div>

                <div className="max-w-xl space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">
                        Stock Card Storekeeper / Custodian
                    </label>
                    <input
                        type="text"
                        value={settings['signatories.stock_card_custodian']}
                        onChange={(e) => onChange('signatories.stock_card_custodian', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-all shadow-2xs hover:border-slate-300"
                        placeholder="Storekeeper / Property Custodian"
                    />
                    {errors['settings.signatories.stock_card_custodian'] && (
                        <p className="text-xs text-red-600 mt-1">{errors['settings.signatories.stock_card_custodian']}</p>
                    )}
                </div>
            </div>

            <hr className="border-slate-200/80" />

            {/* SUBSECTION 5: MEMORANDUM RECEIPT FOR PROPERTY (MOR / MR) */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 font-serif">
                        Memorandum Receipt for Property (MOR / MR — Appendix 59-A)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Issuing authority and property custodian designations for equipment and property receipts. Note that Entity Name is inherited globally from Organization Settings.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                            Issued / Released By Name (Property Custodian)
                        </label>
                        <input
                            type="text"
                            value={settings['signatories.mor_issued_by_name'] || ''}
                            onChange={(e) => onChange('signatories.mor_issued_by_name', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-all shadow-2xs hover:border-slate-300"
                            placeholder="ARSENIO GEM A. GARCILLANOSA"
                        />
                        {errors['settings.signatories.mor_issued_by_name'] && (
                            <p className="text-xs text-red-600 mt-1">{errors['settings.signatories.mor_issued_by_name']}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                            Issued By Designation / Position
                        </label>
                        <input
                            type="text"
                            value={settings['signatories.mor_issued_by_designation'] || ''}
                            onChange={(e) => onChange('signatories.mor_issued_by_designation', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-all shadow-2xs hover:border-slate-300"
                            placeholder="SUPPLY OFFICER III / PROPERTY CUSTODIAN"
                        />
                        {errors['settings.signatories.mor_issued_by_designation'] && (
                            <p className="text-xs text-red-600 mt-1">{errors['settings.signatories.mor_issued_by_designation']}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                            Issuing / Custodial Office Title
                        </label>
                        <input
                            type="text"
                            value={settings['signatories.mor_issued_by_office'] || ''}
                            onChange={(e) => onChange('signatories.mor_issued_by_office', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-all shadow-2xs hover:border-slate-300"
                            placeholder="Supply & Property Management Office (SPMO)"
                        />
                        {errors['settings.signatories.mor_issued_by_office'] && (
                            <p className="text-xs text-red-600 mt-1">{errors['settings.signatories.mor_issued_by_office']}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                            Form Appendix Header Number
                        </label>
                        <input
                            type="text"
                            value={settings['compliance.mor_appendix_number'] || ''}
                            onChange={(e) => onChange('compliance.mor_appendix_number', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-all shadow-2xs hover:border-slate-300"
                            placeholder="Appendix 59-A"
                        />
                        {errors['settings.compliance.mor_appendix_number'] && (
                            <p className="text-xs text-red-600 mt-1">{errors['settings.compliance.mor_appendix_number']}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
