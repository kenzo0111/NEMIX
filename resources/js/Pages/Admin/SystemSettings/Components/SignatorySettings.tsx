import React, { useState } from 'react';
import axios from 'axios';
import { SystemSettings, Signatory } from '../types';
import SignatorySelect from './SignatorySelect';
import AddSignatoryDialog from './AddSignatoryDialog';

interface SignatorySettingsProps {
    settings: SystemSettings;
    onChange: <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => void;
    errors?: Record<string, string>;
    signatories: Signatory[];
    onAddSignatory: (newSignatory: Signatory) => void;
    onDeleteSignatory: (signatory: Signatory) => void;
    onToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

type TargetFieldPair = {
    nameKey: keyof SystemSettings;
    designationKey?: keyof SystemSettings;
    idKey?: keyof SystemSettings;
};

export default function SignatorySettings({
    settings,
    onChange,
    errors = {},
    signatories = [],
    onAddSignatory,
    onDeleteSignatory,
    onToast,
}: SignatorySettingsProps) {
    // Modal state for Add Signatory
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [dialogInitialName, setDialogInitialName] = useState<string>('');
    const [activeTarget, setActiveTarget] = useState<TargetFieldPair | null>(null);

    // Open creation modal triggered from a specific field
    const handleCreateSignatory = (
        name: string,
        target: TargetFieldPair
    ) => {
        setDialogInitialName(name);
        setActiveTarget(target);
        setIsDialogOpen(true);
    };

    // Callback when a new signatory is successfully created via modal
    const handleSignatoryCreated = (newSignatory: Signatory) => {
        onAddSignatory(newSignatory);

        if (activeTarget) {
            onChange(activeTarget.nameKey, newSignatory.name as any);
            if (activeTarget.idKey) {
                onChange(activeTarget.idKey, newSignatory.id as any);
            }
            if (activeTarget.designationKey) {
                onChange(activeTarget.designationKey, newSignatory.designation as any);
            }
        }

        if (onToast) {
            onToast('success', `Signatory "${newSignatory.name}" added to directory.`);
        }
    };

    // Callback when user requests deleting a signatory from directory
    const handleDeleteSignatory = async (sig: Signatory) => {
        if (
            !window.confirm(
                `Are you sure you want to remove "${sig.name}" from the signatories directory?`
            )
        ) {
            return;
        }

        try {
            await axios.delete(route('admin.signatories.destroy', sig.id));
            onDeleteSignatory(sig);

            // If deleted signatory is currently selected in any field, clear its ID
            const allIdKeys: (keyof SystemSettings)[] = [
                'signatories.ris_approved_by_id',
                'signatories.ris_issued_by_id',
                'signatories.rsmi_certified_by_id',
                'signatories.rsmi_posted_by_id',
                'signatories.rpci_accountable_officer_id',
                'signatories.rpci_committee_chair_id',
                'signatories.rpci_certified_by_id',
                'signatories.rpci_verified_by_id',
                'signatories.stock_card_custodian_id',
                'signatories.mor_issued_by_id',
            ];

            allIdKeys.forEach((key) => {
                if (settings[key] === sig.id) {
                    onChange(key, null as any);
                }
            });

            if (onToast) {
                onToast('info', `Signatory "${sig.name}" removed from directory.`);
            }
        } catch (err: any) {
            const msg =
                err.response?.data?.message || 'Failed to remove signatory from directory.';
            if (onToast) {
                onToast('error', msg);
            } else {
                alert(msg);
            }
        }
    };

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
                    {/* Approving Officer Name */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                            Approving Officer
                        </label>
                        <SignatorySelect
                            valueName={settings['signatories.ris_approved_by_name']}
                            valueId={settings['signatories.ris_approved_by_id']}
                            signatories={signatories}
                            hasError={Boolean(errors['settings.signatories.ris_approved_by_name'])}
                            placeholder="Search or add approving officer..."
                            onCreateSignatory={(name) =>
                                handleCreateSignatory(name, {
                                    nameKey: 'signatories.ris_approved_by_name',
                                    designationKey: 'signatories.ris_approved_by_designation',
                                    idKey: 'signatories.ris_approved_by_id',
                                })
                            }
                            onDeleteSignatory={handleDeleteSignatory}
                            onChange={(selected) => {
                                if (!selected) {
                                    onChange('signatories.ris_approved_by_name', '');
                                    onChange('signatories.ris_approved_by_id', null);
                                    onChange('signatories.ris_approved_by_designation', '');
                                } else {
                                    onChange('signatories.ris_approved_by_name', selected.name);
                                    onChange('signatories.ris_approved_by_id', selected.id);
                                    onChange('signatories.ris_approved_by_designation', selected.designation);
                                }
                            }}
                        />
                        {errors['settings.signatories.ris_approved_by_name'] && (
                            <p className="text-xs text-red-600 mt-1">
                                {errors['settings.signatories.ris_approved_by_name']}
                            </p>
                        )}
                    </div>

                    {/* Approving Officer Designation */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                            Approving Officer Designation
                        </label>
                        <input
                            type="text"
                            value={settings['signatories.ris_approved_by_designation']}
                            onChange={(e) =>
                                onChange('signatories.ris_approved_by_designation', e.target.value)
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-all shadow-2xs hover:border-slate-300"
                            placeholder="SUPPLY OFFICER III / ADMIN OFFICER V"
                        />
                        {errors['settings.signatories.ris_approved_by_designation'] && (
                            <p className="text-xs text-red-600 mt-1">
                                {errors['settings.signatories.ris_approved_by_designation']}
                            </p>
                        )}
                    </div>

                    {/* Issuing Custodian Name */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                            Issuing Custodian
                        </label>
                        <SignatorySelect
                            valueName={settings['signatories.ris_issued_by_name']}
                            valueId={settings['signatories.ris_issued_by_id']}
                            signatories={signatories}
                            hasError={Boolean(errors['settings.signatories.ris_issued_by_name'])}
                            placeholder="Search or add issuing custodian..."
                            onCreateSignatory={(name) =>
                                handleCreateSignatory(name, {
                                    nameKey: 'signatories.ris_issued_by_name',
                                    designationKey: 'signatories.ris_issued_by_designation',
                                    idKey: 'signatories.ris_issued_by_id',
                                })
                            }
                            onDeleteSignatory={handleDeleteSignatory}
                            onChange={(selected) => {
                                if (!selected) {
                                    onChange('signatories.ris_issued_by_name', '');
                                    onChange('signatories.ris_issued_by_id', null);
                                    onChange('signatories.ris_issued_by_designation', '');
                                } else {
                                    onChange('signatories.ris_issued_by_name', selected.name);
                                    onChange('signatories.ris_issued_by_id', selected.id);
                                    onChange('signatories.ris_issued_by_designation', selected.designation);
                                }
                            }}
                        />
                        {errors['settings.signatories.ris_issued_by_name'] && (
                            <p className="text-xs text-red-600 mt-1">
                                {errors['settings.signatories.ris_issued_by_name']}
                            </p>
                        )}
                    </div>

                    {/* Issuing Custodian Designation */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                            Issuing Custodian Designation
                        </label>
                        <input
                            type="text"
                            value={settings['signatories.ris_issued_by_designation']}
                            onChange={(e) =>
                                onChange('signatories.ris_issued_by_designation', e.target.value)
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-all shadow-2xs hover:border-slate-300"
                            placeholder="Administrative Aide VI / Storekeeper"
                        />
                        {errors['settings.signatories.ris_issued_by_designation'] && (
                            <p className="text-xs text-red-600 mt-1">
                                {errors['settings.signatories.ris_issued_by_designation']}
                            </p>
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
                    {/* Certified Correct By */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                            Certified Correct By (Supply Custodian)
                        </label>
                        <SignatorySelect
                            valueName={settings['signatories.rsmi_certified_by_name']}
                            valueId={settings['signatories.rsmi_certified_by_id']}
                            signatories={signatories}
                            hasError={Boolean(errors['settings.signatories.rsmi_certified_by_name'])}
                            placeholder="Search or add certifying officer..."
                            onCreateSignatory={(name) =>
                                handleCreateSignatory(name, {
                                    nameKey: 'signatories.rsmi_certified_by_name',
                                    designationKey: 'signatories.rsmi_certified_by_designation',
                                    idKey: 'signatories.rsmi_certified_by_id',
                                })
                            }
                            onDeleteSignatory={handleDeleteSignatory}
                            onChange={(selected) => {
                                if (!selected) {
                                    onChange('signatories.rsmi_certified_by_name', '');
                                    onChange('signatories.rsmi_certified_by_id', null);
                                    onChange('signatories.rsmi_certified_by_designation', '');
                                } else {
                                    onChange('signatories.rsmi_certified_by_name', selected.name);
                                    onChange('signatories.rsmi_certified_by_id', selected.id);
                                    onChange('signatories.rsmi_certified_by_designation', selected.designation);
                                }
                            }}
                        />
                        {errors['settings.signatories.rsmi_certified_by_name'] && (
                            <p className="text-xs text-red-600 mt-1">
                                {errors['settings.signatories.rsmi_certified_by_name']}
                            </p>
                        )}
                    </div>

                    {/* Certification Designation */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                            Certification Designation
                        </label>
                        <input
                            type="text"
                            value={settings['signatories.rsmi_certified_by_designation']}
                            onChange={(e) =>
                                onChange('signatories.rsmi_certified_by_designation', e.target.value)
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-all shadow-2xs hover:border-slate-300"
                            placeholder="Supply Officer III / SPMO Head"
                        />
                        {errors['settings.signatories.rsmi_certified_by_designation'] && (
                            <p className="text-xs text-red-600 mt-1">
                                {errors['settings.signatories.rsmi_certified_by_designation']}
                            </p>
                        )}
                    </div>

                    {/* Posted By (Accounting Representative) */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                            Posted By (Accounting Representative)
                        </label>
                        <SignatorySelect
                            valueName={settings['signatories.rsmi_posted_by_name']}
                            valueId={settings['signatories.rsmi_posted_by_id']}
                            signatories={signatories}
                            hasError={Boolean(errors['settings.signatories.rsmi_posted_by_name'])}
                            placeholder="Search or add accounting representative..."
                            onCreateSignatory={(name) =>
                                handleCreateSignatory(name, {
                                    nameKey: 'signatories.rsmi_posted_by_name',
                                    designationKey: 'signatories.rsmi_posted_by_designation',
                                    idKey: 'signatories.rsmi_posted_by_id',
                                })
                            }
                            onDeleteSignatory={handleDeleteSignatory}
                            onChange={(selected) => {
                                if (!selected) {
                                    onChange('signatories.rsmi_posted_by_name', '');
                                    onChange('signatories.rsmi_posted_by_id', null);
                                    onChange('signatories.rsmi_posted_by_designation', '');
                                } else {
                                    onChange('signatories.rsmi_posted_by_name', selected.name);
                                    onChange('signatories.rsmi_posted_by_id', selected.id);
                                    onChange('signatories.rsmi_posted_by_designation', selected.designation);
                                }
                            }}
                        />
                        {errors['settings.signatories.rsmi_posted_by_name'] && (
                            <p className="text-xs text-red-600 mt-1">
                                {errors['settings.signatories.rsmi_posted_by_name']}
                            </p>
                        )}
                    </div>

                    {/* Accounting Designation */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                            Accounting Designation
                        </label>
                        <input
                            type="text"
                            value={settings['signatories.rsmi_posted_by_designation']}
                            onChange={(e) =>
                                onChange('signatories.rsmi_posted_by_designation', e.target.value)
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-all shadow-2xs hover:border-slate-300"
                            placeholder="Administrative Officer IV"
                        />
                        {errors['settings.signatories.rsmi_posted_by_designation'] && (
                            <p className="text-xs text-red-600 mt-1">
                                {errors['settings.signatories.rsmi_posted_by_designation']}
                            </p>
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
                    {/* Accountable Officer Name */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                            Accountable Officer
                        </label>
                        <SignatorySelect
                            valueName={settings['signatories.rpci_accountable_officer_name']}
                            valueId={settings['signatories.rpci_accountable_officer_id']}
                            signatories={signatories}
                            hasError={Boolean(errors['settings.signatories.rpci_accountable_officer_name'])}
                            placeholder="Search or add accountable officer..."
                            onCreateSignatory={(name) =>
                                handleCreateSignatory(name, {
                                    nameKey: 'signatories.rpci_accountable_officer_name',
                                    designationKey: 'signatories.rpci_accountable_officer_designation',
                                    idKey: 'signatories.rpci_accountable_officer_id',
                                })
                            }
                            onDeleteSignatory={handleDeleteSignatory}
                            onChange={(selected) => {
                                if (!selected) {
                                    onChange('signatories.rpci_accountable_officer_name', '');
                                    onChange('signatories.rpci_accountable_officer_id', null);
                                    onChange('signatories.rpci_accountable_officer_designation', '');
                                } else {
                                    onChange('signatories.rpci_accountable_officer_name', selected.name);
                                    onChange('signatories.rpci_accountable_officer_id', selected.id);
                                    onChange('signatories.rpci_accountable_officer_designation', selected.designation);
                                }
                            }}
                        />
                        {errors['settings.signatories.rpci_accountable_officer_name'] && (
                            <p className="text-xs text-red-600 mt-1">
                                {errors['settings.signatories.rpci_accountable_officer_name']}
                            </p>
                        )}
                    </div>

                    {/* Accountable Officer Designation */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                            Accountable Officer Designation
                        </label>
                        <input
                            type="text"
                            value={settings['signatories.rpci_accountable_officer_designation']}
                            onChange={(e) =>
                                onChange('signatories.rpci_accountable_officer_designation', e.target.value)
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-all shadow-2xs hover:border-slate-300"
                            placeholder="Supply Custodian / Supply Officer III"
                        />
                        {errors['settings.signatories.rpci_accountable_officer_designation'] && (
                            <p className="text-xs text-red-600 mt-1">
                                {errors['settings.signatories.rpci_accountable_officer_designation']}
                            </p>
                        )}
                    </div>

                    {/* Inventory Committee Chairman */}
                    <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-semibold text-slate-700 block">
                            Inventory Committee Chairman
                        </label>
                        <SignatorySelect
                            valueName={settings['signatories.rpci_committee_chair']}
                            valueId={settings['signatories.rpci_committee_chair_id']}
                            signatories={signatories}
                            hasError={Boolean(errors['settings.signatories.rpci_committee_chair'])}
                            placeholder="Search or add committee chair..."
                            onCreateSignatory={(name) =>
                                handleCreateSignatory(name, {
                                    nameKey: 'signatories.rpci_committee_chair',
                                    idKey: 'signatories.rpci_committee_chair_id',
                                })
                            }
                            onDeleteSignatory={handleDeleteSignatory}
                            onChange={(selected) => {
                                if (!selected) {
                                    onChange('signatories.rpci_committee_chair', '');
                                    onChange('signatories.rpci_committee_chair_id', null);
                                } else {
                                    onChange('signatories.rpci_committee_chair', selected.name);
                                    onChange('signatories.rpci_committee_chair_id', selected.id);
                                }
                            }}
                        />
                        {errors['settings.signatories.rpci_committee_chair'] && (
                            <p className="text-xs text-red-600 mt-1">
                                {errors['settings.signatories.rpci_committee_chair']}
                            </p>
                        )}
                    </div>

                    {/* Certified Correct By - Name */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                            Certified Correct By - Name
                        </label>
                        <SignatorySelect
                            valueName={settings['signatories.rpci_certified_by_name']}
                            valueId={settings['signatories.rpci_certified_by_id']}
                            signatories={signatories}
                            hasError={Boolean(errors['settings.signatories.rpci_certified_by_name'])}
                            placeholder="Search or add certification official..."
                            onCreateSignatory={(name) =>
                                handleCreateSignatory(name, {
                                    nameKey: 'signatories.rpci_certified_by_name',
                                    designationKey: 'signatories.rpci_certified_by_position',
                                    idKey: 'signatories.rpci_certified_by_id',
                                })
                            }
                            onDeleteSignatory={handleDeleteSignatory}
                            onChange={(selected) => {
                                if (!selected) {
                                    onChange('signatories.rpci_certified_by_name', '');
                                    onChange('signatories.rpci_certified_by_id', null);
                                    onChange('signatories.rpci_certified_by_position', '');
                                } else {
                                    onChange('signatories.rpci_certified_by_name', selected.name);
                                    onChange('signatories.rpci_certified_by_id', selected.id);
                                    onChange('signatories.rpci_certified_by_position', selected.designation);
                                }
                            }}
                        />
                        {errors['settings.signatories.rpci_certified_by_name'] && (
                            <p className="text-xs text-red-600 mt-1">
                                {errors['settings.signatories.rpci_certified_by_name']}
                            </p>
                        )}
                    </div>

                    {/* Certified Correct By - Designation */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                            Certified Correct By - Designation
                        </label>
                        <input
                            type="text"
                            value={settings['signatories.rpci_certified_by_position']}
                            onChange={(e) =>
                                onChange('signatories.rpci_certified_by_position', e.target.value)
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-all shadow-2xs hover:border-slate-300"
                            placeholder="Inventory Committee Chair and Members"
                        />
                        {errors['settings.signatories.rpci_certified_by_position'] && (
                            <p className="text-xs text-red-600 mt-1">
                                {errors['settings.signatories.rpci_certified_by_position']}
                            </p>
                        )}
                    </div>

                    {/* Verified By - Name */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                            Verified By - Name
                        </label>
                        <SignatorySelect
                            valueName={settings['signatories.rpci_verified_by_name']}
                            valueId={settings['signatories.rpci_verified_by_id']}
                            signatories={signatories}
                            hasError={Boolean(errors['settings.signatories.rpci_verified_by_name'])}
                            placeholder="Search or add verification official..."
                            onCreateSignatory={(name) =>
                                handleCreateSignatory(name, {
                                    nameKey: 'signatories.rpci_verified_by_name',
                                    designationKey: 'signatories.rpci_verified_by_position',
                                    idKey: 'signatories.rpci_verified_by_id',
                                })
                            }
                            onDeleteSignatory={handleDeleteSignatory}
                            onChange={(selected) => {
                                if (!selected) {
                                    onChange('signatories.rpci_verified_by_name', '');
                                    onChange('signatories.rpci_verified_by_id', null);
                                    onChange('signatories.rpci_verified_by_position', '');
                                } else {
                                    onChange('signatories.rpci_verified_by_name', selected.name);
                                    onChange('signatories.rpci_verified_by_id', selected.id);
                                    onChange('signatories.rpci_verified_by_position', selected.designation);
                                }
                            }}
                        />
                        {errors['settings.signatories.rpci_verified_by_name'] && (
                            <p className="text-xs text-red-600 mt-1">
                                {errors['settings.signatories.rpci_verified_by_name']}
                            </p>
                        )}
                    </div>

                    {/* Verified By - Designation */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                            Verified By - Designation
                        </label>
                        <input
                            type="text"
                            value={settings['signatories.rpci_verified_by_position']}
                            onChange={(e) =>
                                onChange('signatories.rpci_verified_by_position', e.target.value)
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-all shadow-2xs hover:border-slate-300"
                            placeholder="COA Representative"
                        />
                        {errors['settings.signatories.rpci_verified_by_position'] && (
                            <p className="text-xs text-red-600 mt-1">
                                {errors['settings.signatories.rpci_verified_by_position']}
                            </p>
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
                    <SignatorySelect
                        valueName={settings['signatories.stock_card_custodian']}
                        valueId={settings['signatories.stock_card_custodian_id']}
                        signatories={signatories}
                        hasError={Boolean(errors['settings.signatories.stock_card_custodian'])}
                        placeholder="Search or add stock card custodian..."
                        onCreateSignatory={(name) =>
                            handleCreateSignatory(name, {
                                nameKey: 'signatories.stock_card_custodian',
                                idKey: 'signatories.stock_card_custodian_id',
                            })
                        }
                        onDeleteSignatory={handleDeleteSignatory}
                        onChange={(selected) => {
                            if (!selected) {
                                onChange('signatories.stock_card_custodian', '');
                                onChange('signatories.stock_card_custodian_id', null);
                            } else {
                                onChange('signatories.stock_card_custodian', selected.name);
                                onChange('signatories.stock_card_custodian_id', selected.id);
                            }
                        }}
                    />
                    {errors['settings.signatories.stock_card_custodian'] && (
                        <p className="text-xs text-red-600 mt-1">
                            {errors['settings.signatories.stock_card_custodian']}
                        </p>
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
                    {/* Issued / Released By Name */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                            Issued / Released By (Property Custodian)
                        </label>
                        <SignatorySelect
                            valueName={settings['signatories.mor_issued_by_name']}
                            valueId={settings['signatories.mor_issued_by_id']}
                            signatories={signatories}
                            hasError={Boolean(errors['settings.signatories.mor_issued_by_name'])}
                            placeholder="Search or add property custodian..."
                            onCreateSignatory={(name) =>
                                handleCreateSignatory(name, {
                                    nameKey: 'signatories.mor_issued_by_name',
                                    designationKey: 'signatories.mor_issued_by_designation',
                                    idKey: 'signatories.mor_issued_by_id',
                                })
                            }
                            onDeleteSignatory={handleDeleteSignatory}
                            onChange={(selected) => {
                                if (!selected) {
                                    onChange('signatories.mor_issued_by_name', '');
                                    onChange('signatories.mor_issued_by_id', null);
                                    onChange('signatories.mor_issued_by_designation', '');
                                } else {
                                    onChange('signatories.mor_issued_by_name', selected.name);
                                    onChange('signatories.mor_issued_by_id', selected.id);
                                    onChange('signatories.mor_issued_by_designation', selected.designation);
                                }
                            }}
                        />
                        {errors['settings.signatories.mor_issued_by_name'] && (
                            <p className="text-xs text-red-600 mt-1">
                                {errors['settings.signatories.mor_issued_by_name']}
                            </p>
                        )}
                    </div>

                    {/* Issued By Designation */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                            Issued By Designation / Position
                        </label>
                        <input
                            type="text"
                            value={settings['signatories.mor_issued_by_designation'] || ''}
                            onChange={(e) =>
                                onChange('signatories.mor_issued_by_designation', e.target.value)
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-all shadow-2xs hover:border-slate-300"
                            placeholder="SUPPLY OFFICER III / PROPERTY CUSTODIAN"
                        />
                        {errors['settings.signatories.mor_issued_by_designation'] && (
                            <p className="text-xs text-red-600 mt-1">
                                {errors['settings.signatories.mor_issued_by_designation']}
                            </p>
                        )}
                    </div>

                    {/* Issuing Office Title */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                            Issuing / Custodial Office Title
                        </label>
                        <input
                            type="text"
                            value={settings['signatories.mor_issued_by_office'] || ''}
                            onChange={(e) =>
                                onChange('signatories.mor_issued_by_office', e.target.value)
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-all shadow-2xs hover:border-slate-300"
                            placeholder="Supply & Property Management Office (SPMO)"
                        />
                        {errors['settings.signatories.mor_issued_by_office'] && (
                            <p className="text-xs text-red-600 mt-1">
                                {errors['settings.signatories.mor_issued_by_office']}
                            </p>
                        )}
                    </div>

                    {/* Form Appendix Header Number */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 block">
                            Form Appendix Header Number
                        </label>
                        <input
                            type="text"
                            value={settings['compliance.mor_appendix_number'] || ''}
                            onChange={(e) =>
                                onChange('compliance.mor_appendix_number', e.target.value)
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-all shadow-2xs hover:border-slate-300"
                            placeholder="Appendix 59-A"
                        />
                        {errors['settings.compliance.mor_appendix_number'] && (
                            <p className="text-xs text-red-600 mt-1">
                                {errors['settings.compliance.mor_appendix_number']}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Dialog for Adding Signatory */}
            <AddSignatoryDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                initialName={dialogInitialName}
                onSuccess={handleSignatoryCreated}
            />
        </div>
    );
}
