import React, { useState } from 'react';
import axios from 'axios';
import { SystemSettings, Signatory } from '../types';
import SignatorySelect from './SignatorySelect';
import AddSignatoryDialog from './AddSignatoryDialog';

interface SignatorySettingsProps {
    settings: SystemSettings;
    onChange: <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => void;
    onBatchChange?: (updates: Partial<SystemSettings>) => void;
    errors?: Record<string, string>;
    signatories: Signatory[];
    onAddSignatory: (newSignatory: Signatory) => void;
    onDeleteSignatory: (signatory: Signatory) => void;
    onToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export type TargetFieldPair = {
    nameKey: keyof SystemSettings;
    designationKey?: keyof SystemSettings;
    idKey?: keyof SystemSettings;
};

export const SIGNATORY_TARGET_FIELDS = {
    ris_approved_by: {
        nameKey: 'signatories.ris_approved_by_name' as const,
        designationKey: 'signatories.ris_approved_by_designation' as const,
        idKey: 'signatories.ris_approved_by_id' as const,
    },
    ris_issued_by: {
        nameKey: 'signatories.ris_issued_by_name' as const,
        designationKey: 'signatories.ris_issued_by_designation' as const,
        idKey: 'signatories.ris_issued_by_id' as const,
    },
    rsmi_certified_by: {
        nameKey: 'signatories.rsmi_certified_by_name' as const,
        designationKey: 'signatories.rsmi_certified_by_designation' as const,
        idKey: 'signatories.rsmi_certified_by_id' as const,
    },
    rsmi_posted_by: {
        nameKey: 'signatories.rsmi_posted_by_name' as const,
        designationKey: 'signatories.rsmi_posted_by_designation' as const,
        idKey: 'signatories.rsmi_posted_by_id' as const,
    },
    rpci_accountable_officer: {
        nameKey: 'signatories.rpci_accountable_officer_name' as const,
        designationKey: 'signatories.rpci_accountable_officer_designation' as const,
        idKey: 'signatories.rpci_accountable_officer_id' as const,
    },
    rpci_committee_chair: {
        nameKey: 'signatories.rpci_committee_chair' as const,
        idKey: 'signatories.rpci_committee_chair_id' as const,
    },
    rpci_certified_by: {
        nameKey: 'signatories.rpci_certified_by_name' as const,
        designationKey: 'signatories.rpci_certified_by_position' as const,
        idKey: 'signatories.rpci_certified_by_id' as const,
    },
    rpci_verified_by: {
        nameKey: 'signatories.rpci_verified_by_name' as const,
        designationKey: 'signatories.rpci_verified_by_position' as const,
        idKey: 'signatories.rpci_verified_by_id' as const,
    },
    stock_card_custodian: {
        nameKey: 'signatories.stock_card_custodian' as const,
        idKey: 'signatories.stock_card_custodian_id' as const,
    },
    mor_issued_by: {
        nameKey: 'signatories.mor_issued_by_name' as const,
        designationKey: 'signatories.mor_issued_by_designation' as const,
        idKey: 'signatories.mor_issued_by_id' as const,
    },
} satisfies Record<string, TargetFieldPair>;

export default function SignatorySettings({
    settings,
    onChange,
    onBatchChange,
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

    // Unified atomic handler for changing a signatory role
    const handleSignatoryChange = (
        target: TargetFieldPair,
        selected: { name: string; designation: string; id: number | null } | null
    ) => {
        const updates: Partial<SystemSettings> = {
            [target.nameKey]: selected ? selected.name : '',
        };

        const idKey = target.idKey;
        if (idKey) {
            (updates as Record<keyof SystemSettings, any>)[idKey] = selected ? selected.id : null;
        }

        const designationKey = target.designationKey;
        if (designationKey) {
            (updates as Record<keyof SystemSettings, any>)[designationKey] = selected ? selected.designation : '';
        }

        if (onBatchChange) {
            onBatchChange(updates);
        } else {
            Object.entries(updates).forEach(([key, val]) => {
                onChange(key as any, val as any);
            });
        }
    };

    // Callback when a new signatory is successfully created via modal
    const handleSignatoryCreated = (newSignatory: Signatory) => {
        onAddSignatory(newSignatory);

        if (activeTarget) {
            handleSignatoryChange(activeTarget, {
                id: newSignatory.id,
                name: newSignatory.name,
                designation: newSignatory.designation,
            });
        }

        if (onToast) {
            onToast('success', `Signatory "${newSignatory.name}" added to directory.`);
        }
    };

    // Callback when user requests deleting a signatory from directory
    const handleDeleteSignatory = async (sig: Signatory) => {
        // Pre-check if this signatory is currently selected in any field in the form state
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

        const isCurrentlyAssignedById = allIdKeys.some(
            (k) => Number(settings[k]) === sig.id
        );

        const allNameKeys: (keyof SystemSettings)[] = [
            'signatories.ris_approved_by_name',
            'signatories.ris_issued_by_name',
            'signatories.rsmi_certified_by_name',
            'signatories.rsmi_posted_by_name',
            'signatories.rpci_accountable_officer_name',
            'signatories.rpci_committee_chair',
            'signatories.rpci_certified_by_name',
            'signatories.rpci_verified_by_name',
            'signatories.stock_card_custodian',
            'signatories.mor_issued_by_name',
        ];

        const isCurrentlyAssignedByName = allNameKeys.some(
            (k) =>
                typeof settings[k] === 'string' &&
                (settings[k] as string).trim().toLowerCase() ===
                    sig.name.trim().toLowerCase()
        );

        if (isCurrentlyAssignedById || isCurrentlyAssignedByName) {
            const msg = `Cannot remove "${sig.name}" because they are currently assigned to one or more roles in System Settings. Please reassign those roles first.`;
            if (onToast) {
                onToast('error', msg);
            } else {
                alert(msg);
            }
            return;
        }

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
                                handleCreateSignatory(name, SIGNATORY_TARGET_FIELDS.ris_approved_by)
                            }
                            onDeleteSignatory={handleDeleteSignatory}
                            onChange={(selected) =>
                                handleSignatoryChange(SIGNATORY_TARGET_FIELDS.ris_approved_by, selected)
                            }
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
                                handleCreateSignatory(name, SIGNATORY_TARGET_FIELDS.ris_issued_by)
                            }
                            onDeleteSignatory={handleDeleteSignatory}
                            onChange={(selected) =>
                                handleSignatoryChange(SIGNATORY_TARGET_FIELDS.ris_issued_by, selected)
                            }
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
                                handleCreateSignatory(name, SIGNATORY_TARGET_FIELDS.rsmi_certified_by)
                            }
                            onDeleteSignatory={handleDeleteSignatory}
                            onChange={(selected) =>
                                handleSignatoryChange(SIGNATORY_TARGET_FIELDS.rsmi_certified_by, selected)
                            }
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
                                handleCreateSignatory(name, SIGNATORY_TARGET_FIELDS.rsmi_posted_by)
                            }
                            onDeleteSignatory={handleDeleteSignatory}
                            onChange={(selected) =>
                                handleSignatoryChange(SIGNATORY_TARGET_FIELDS.rsmi_posted_by, selected)
                            }
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
                                handleCreateSignatory(name, SIGNATORY_TARGET_FIELDS.rpci_accountable_officer)
                            }
                            onDeleteSignatory={handleDeleteSignatory}
                            onChange={(selected) =>
                                handleSignatoryChange(SIGNATORY_TARGET_FIELDS.rpci_accountable_officer, selected)
                            }
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
                                handleCreateSignatory(name, SIGNATORY_TARGET_FIELDS.rpci_committee_chair)
                            }
                            onDeleteSignatory={handleDeleteSignatory}
                            onChange={(selected) =>
                                handleSignatoryChange(SIGNATORY_TARGET_FIELDS.rpci_committee_chair, selected)
                            }
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
                                handleCreateSignatory(name, SIGNATORY_TARGET_FIELDS.rpci_certified_by)
                            }
                            onDeleteSignatory={handleDeleteSignatory}
                            onChange={(selected) =>
                                handleSignatoryChange(SIGNATORY_TARGET_FIELDS.rpci_certified_by, selected)
                            }
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
                                handleCreateSignatory(name, SIGNATORY_TARGET_FIELDS.rpci_verified_by)
                            }
                            onDeleteSignatory={handleDeleteSignatory}
                            onChange={(selected) =>
                                handleSignatoryChange(SIGNATORY_TARGET_FIELDS.rpci_verified_by, selected)
                            }
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
                            handleCreateSignatory(name, SIGNATORY_TARGET_FIELDS.stock_card_custodian)
                        }
                        onDeleteSignatory={handleDeleteSignatory}
                        onChange={(selected) =>
                            handleSignatoryChange(SIGNATORY_TARGET_FIELDS.stock_card_custodian, selected)
                        }
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
                                handleCreateSignatory(name, SIGNATORY_TARGET_FIELDS.mor_issued_by)
                            }
                            onDeleteSignatory={handleDeleteSignatory}
                            onChange={(selected) =>
                                handleSignatoryChange(SIGNATORY_TARGET_FIELDS.mor_issued_by, selected)
                            }
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
