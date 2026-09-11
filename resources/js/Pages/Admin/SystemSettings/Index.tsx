import React, { useState, useEffect } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import Sidebar from '@/Components/Sidebar';
import PageHeader from '@/Components/PageHeader';
import { getSidebarModules } from '@/utils/sidebarConfig';
import {
    Save,
    RotateCcw,
    CheckCircle2,
    AlertCircle,
    X,
} from 'lucide-react';

import {
    SystemSettings,
    SystemSettingsPageProps,
    TabId,
    ToastAlert,
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
    telemetry,
}: SystemSettingsPageProps) {
    const user = auth?.user;

    // Sidebar collapse state
    const [collapsed, setCollapsed] = useState<boolean>(() => {
        try {
            return localStorage.getItem('nemix_sidebar_collapsed') === 'true';
        } catch {
            return false;
        }
    });

    const handleToggleCollapse = () => {
        setCollapsed((prev) => {
            const next = !prev;
            try {
                localStorage.setItem('nemix_sidebar_collapsed', String(next));
            } catch {}
            return next;
        });
    };

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

    // Lightweight Toast Notifications
    const [toast, setToast] = useState<ToastAlert | null>(null);

    const showToast = (type: 'success' | 'error' | 'info', message: string) => {
        setToast({ id: String(Date.now()), type, message });
    };

    // Synchronize Inertia flash messages into toasts
    const { flash } = usePage<SystemSettingsPageProps>().props;
    useEffect(() => {
        if (flash?.success) {
            showToast('success', flash.success);
        } else if (flash?.error) {
            showToast('error', flash.error);
        }
    }, [flash?.success, flash?.error]);

    // Auto-dismiss toast
    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 5000);
        return () => clearTimeout(timer);
    }, [toast]);

    // Generic setting field change handler
    const handleFieldChange = <K extends keyof SystemSettings>(
        key: K,
        value: SystemSettings[K]
    ) => {
        setData('settings', {
            ...data.settings,
            [key]: value,
        });
    };

    // Client-side cross-validation check
    const hasThresholdError =
        Number(data.settings['inventory.critical_stock_threshold'] ?? 0) >
        Number(data.settings['inventory.low_stock_threshold'] ?? 1);

    // Single primary save submission
    const handleSave = (e?: React.FormEvent) => {
        if (e) e.preventDefault();

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
        <div className="min-h-screen bg-slate-50/70 flex font-sans text-slate-900 selection:bg-red-900 selection:text-white antialiased">
            <Head title="System Settings & Policies — UCN SPMO" />

            {/* Persistent Sidebar */}
            <Sidebar
                modules={modules}
                user={user ?? undefined}
                collapsed={collapsed}
                onToggleCollapse={handleToggleCollapse}
            />

            {/* Main Application Area */}
            <main
                className={`flex-1 transition-all duration-300 ease-in-out ${
                    collapsed ? 'ml-20' : 'ml-72'
                }`}
            >
                {/* 1. PageHeader with Single Primary Save Controls */}
                <PageHeader
                    title="System Settings & Policies"
                    description="Official Supply & Property Management Office configuration and policy parameters."
                    breadcrumbs={[
                        { name: 'Administration & Governance' },
                        { name: 'System Settings' },
                    ]}
                    actions={
                        <div className="flex items-center gap-3">
                            {isDirty && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                    <span>Unsaved changes</span>
                                </div>
                            )}

                            {isDirty && (
                                <button
                                    type="button"
                                    onClick={() => reset()}
                                    disabled={processing}
                                    className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 hover:border-slate-400 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
                                >
                                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Reset</span>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={processing || !isDirty || hasThresholdError}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.98] ${
                                    isDirty && !hasThresholdError
                                        ? 'bg-red-900 hover:bg-red-800 active:bg-red-950 shadow-red-950/15 shadow-md'
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                }`}
                            >
                                <Save className="w-3.5 h-3.5" />
                                <span>{processing ? 'Saving...' : 'Save Settings'}</span>
                            </button>
                        </div>
                    }
                />

                {/* Main Content Body */}
                <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto pb-20">
                    {/* 2. Institutional Hero Banner */}
                    <SettingsHero userName={user?.name} />

                    {/* 3. Horizontal Category Navigation Bar */}
                    <SettingsNavigation
                        activeTab={activeTab}
                        onChange={setActiveTab}
                    />

                    {/* 4. Active Settings Domain Panel */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                        <SettingsSectionHeader tab={currentTabMeta} />

                        <div className="p-6 sm:p-8">
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
                                    errors={errors}
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
                                <NumberingSettings
                                    settings={data.settings}
                                    onChange={handleFieldChange}
                                    errors={errors}
                                />
                            )}

                            {activeTab === 'rfid' && (
                                <RfidSettings
                                    settings={data.settings}
                                    onChange={handleFieldChange}
                                    errors={errors}
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
            </main>

            {/* Non-intrusive Toast Notification */}
            {toast && (
                <div
                    role="alert"
                    aria-live="assertive"
                    className="fixed top-5 right-5 z-50 max-w-md animate-in fade-in slide-in-from-top-2 duration-200"
                >
                    <div
                        className={`rounded-2xl p-4 shadow-xl border flex items-start gap-3 backdrop-blur-md ${
                            toast.type === 'success'
                                ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900'
                                : toast.type === 'error'
                                ? 'bg-rose-50/95 border-rose-200 text-rose-900'
                                : 'bg-sky-50/95 border-sky-200 text-sky-900'
                        }`}
                    >
                        <div className="shrink-0 mt-0.5">
                            {toast.type === 'success' && (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            )}
                            {toast.type === 'error' && (
                                <AlertCircle className="w-5 h-5 text-rose-600" />
                            )}
                        </div>
                        <div className="flex-1 text-xs font-medium leading-relaxed whitespace-pre-line">
                            {toast.message}
                        </div>
                        <button
                            type="button"
                            onClick={() => setToast(null)}
                            className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                            aria-label="Close notification"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
