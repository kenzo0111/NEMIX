import { notify } from '@/utils/notifications';
import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import PageHeader from '@/Components/PageHeader';
import { getSidebarModules } from '@/utils/sidebarConfig';
import { useAuthorization } from '@/Hooks/useAuthorization';
import {
    Save,
    RotateCcw,
} from 'lucide-react';

import {
    Signatory,
    SystemSettings,
    SystemSettingsPageProps,
    TabId,
} from './types';
import { SETTINGS_TABS } from './tabs';
import { normalizeSystemSettings } from './normalizeSettings';

import SettingsHero from './Components/SettingsHero';
import SettingsNavigation from './Components/SettingsNavigation';
import SettingsSectionHeader from './Components/SettingsSectionHeader';
import InstitutionSettings from './Components/InstitutionSettings';
import SignatorySettings from './Components/SignatorySettings';
import InventoryPolicySettings from './Components/InventoryPolicySettings';
import NumberingSettings from './Components/NumberingSettings';
import RfidSettings from './Components/RfidSettings';
import NotificationSettings from './Components/NotificationSettings';
import OperationsSettings from './Components/OperationsSettings';

export default function Index({
    auth,
    groupedSettings,
    numberingPreviews,
    telemetry,
    signatories: initialSignatories = [],
    rfidDevices = [],
}: SystemSettingsPageProps) {
    const user = auth?.user;
    const { can } = useAuthorization();
    const canUpdateSettings = can('system.settings.update');

    // Centralized Signatories directory state
    const [signatoriesList, setSignatoriesList] = useState<Signatory[]>(
        () => initialSignatories || []
    );

    const handleAddSignatory = (newSig: Signatory) => {
        setSignatoriesList((prev) => {
            const exists = prev.some((s) => s.id === newSig.id);
            if (exists) return prev;
            return [...prev, newSig].sort((a, b) => a.name.localeCompare(b.name));
        });
    };

    const handleDeleteSignatory = (deletedSig: Signatory) => {
        setSignatoriesList((prev) => prev.filter((s) => s.id !== deletedSig.id));
    };

    // Sidebar collapse state with synchronized hook

    const modules = getSidebarModules('System Settings');

    // Strongly-typed form initialized via normalizer
    const initialSettings = normalizeSystemSettings(groupedSettings);
    const {
        data,
        setData,
        post,
        processing,
        isDirty,
        reset,
        errors,
    } = useForm<{ settings: SystemSettings }>({
        settings: initialSettings,
    });

    // Active category tab state
    const [activeTab, setActiveTab] = useState<TabId>('institution');
    const currentTabMeta =
        SETTINGS_TABS.find((t) => t.id === activeTab) || SETTINGS_TABS[0];

    const showToast = (type: 'success' | 'error' | 'info', message: string) => notify({ type, message });

    // Generic setting field change handler with functional updater to avoid stale closures
    const handleFieldChange = <K extends keyof SystemSettings>(
        key: K,
        value: SystemSettings[K]
    ) => {
        if (!canUpdateSettings) return;
        setData((prev) => ({
            ...prev,
            settings: {
                ...prev.settings,
                [key]: value,
            },
        }));
    };

    // Atomic batch updates for related fields (e.g. signatory ID, name, designation)
    const handleBatchChange = (updates: Partial<SystemSettings>) => {
        if (!canUpdateSettings) return;
        setData((prev) => ({
            ...prev,
            settings: {
                ...prev.settings,
                ...updates,
            },
        }));
    };

    // Client-side cross-validation check
    const hasThresholdError =
        Number(data.settings['inventory.critical_stock_threshold'] ?? 0) >
        Number(data.settings['inventory.low_stock_threshold'] ?? 1);

    // Single primary save submission
    const handleSave = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!canUpdateSettings) return;

        if (hasThresholdError) {
            showToast(
                'error',
                'Critical stock threshold cannot exceed the low-stock threshold.'
            );
            return;
        }

        post(route('system.settings.update'), {
            preserveScroll: true,
            onSuccess: (page: any) => {
                showToast(
                    'success',
                    page?.props?.flash?.success ||
                        'System settings saved successfully.'
                );
            },
            onError: (formErrors: any) => {
                const message =
                    Object.values(formErrors).flat().join('\n') ||
                    'Unable to update system settings. Please check the fields and try again.';
                showToast('error', message);
            },
        });
    };

    return (
        <>
            <Head title="System Settings & Policies — UCN SPMO" />

            {/* Persistent Sidebar */}


            {/* Main Application Area */}
            <DashboardLayout modules={modules} user={user ?? undefined}>
                {/* 1. PageHeader with Single Primary Save Controls */}
                <PageHeader
                    title="System Settings & Policies"
                    description="Manage institution settings and system policies."
                    breadcrumbs={[
                        { name: 'Administration & Governance' },
                        { name: 'System Settings' },
                    ]}
                    actions={
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            {canUpdateSettings && isDirty && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-amber-800 dark:text-amber-400 text-sm font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                    <span>Unsaved changes</span>
                                </div>
                            )}

                            {canUpdateSettings && isDirty && (
                                <button
                                    type="button"
                                    onClick={() => reset()}
                                    disabled={processing}
                                    className="px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-600 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
                                >
                                    <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                    <span>Reset</span>
                                </button>
                            )}

                            {canUpdateSettings && <button
                                type="button"
                                onClick={handleSave}
                                disabled={processing || !isDirty || hasThresholdError}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.98] ${
                                    isDirty && !hasThresholdError
                                        ? 'bg-red-900 hover:bg-red-800 active:bg-red-950 shadow-red-950/15 shadow-md'
                                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                                }`}
                            >
                                <Save className="w-3.5 h-3.5" />
                                <span>{processing ? 'Saving...' : 'Save Settings'}</span>
                            </button>}
                        </div>
                    }
                />

                {/* Main Content Body */}
                <div className="p-4 sm:p-7 lg:p-8 space-y-6 max-w-7xl mx-auto pb-20 min-w-0 w-full">
                    {/* 2. Institutional Hero Banner */}
                    <SettingsHero userName={user?.name} />

                    {/* 3. Horizontal Category Navigation Bar */}
                    <SettingsNavigation
                        activeTab={activeTab}
                        onChange={setActiveTab}
                    />

                    {/* 4. Active Settings Domain Panel */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                        <SettingsSectionHeader tab={currentTabMeta} />

                        <div className="p-4 sm:p-6 lg:p-8">
                            {activeTab === 'institution' && (
                                <InstitutionSettings
                                    settings={data.settings}
                                    onChange={handleFieldChange}
                                    errors={errors}
                                />
                            )}

                            {activeTab === 'signatories' && (
                                <SignatorySettings
                                    settings={data.settings}
                                    onChange={handleFieldChange}
                                    onBatchChange={handleBatchChange}
                                    errors={errors}
                                    signatories={signatoriesList}
                                    onAddSignatory={handleAddSignatory}
                                    onDeleteSignatory={handleDeleteSignatory}
                                    onToast={showToast}
                                />
                            )}

                            {activeTab === 'inventory' && (
                                <InventoryPolicySettings
                                    settings={data.settings}
                                    onChange={handleFieldChange}
                                    errors={errors}
                                />
                            )}

                            {activeTab === 'numbering' && (
                                <NumberingSettings previews={numberingPreviews} />
                            )}

                            {activeTab === 'rfid' && (
                                <RfidSettings
                                    settings={data.settings}
                                    onChange={handleFieldChange}
                                    errors={errors}
                                    devices={rfidDevices}
                                    onToast={showToast}
                                />
                            )}

                            {activeTab === 'mail' && (
                                <NotificationSettings
                                    settings={data.settings}
                                    onChange={handleFieldChange}
                                    errors={errors}
                                    defaultAdminEmail={user?.email || 'admin@ucn.edu.ph'}
                                    onToast={showToast}
                                />
                            )}

                            {activeTab === 'operations' && (
                                <OperationsSettings
                                    settings={data.settings}
                                    onChange={handleFieldChange}
                                    telemetry={telemetry}
                                    errors={errors}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </DashboardLayout>


        </>
    );
}
