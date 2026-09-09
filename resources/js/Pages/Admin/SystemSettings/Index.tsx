import React, { useState, useEffect } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import Sidebar from '@/Components/Sidebar';
import SystemModeBadge from '@/Components/SystemModeBadge';
import Breadcrumbs from '@/Components/Breadcrumbs';
import Modal from '@/Components/Modal';
import { getSidebarModules } from '@/utils/sidebarConfig';
import {
    Building2,
    PenTool,
    PackageSearch,
    Hash,
    Radio,
    Mail,
    ShieldCheck,
    Save,
    RotateCcw,
    Send,
    Download,
    AlertCircle,
    Sliders,
    Server
} from 'lucide-react';

interface SettingItem {
    id: number;
    key: string;
    category: string;
    label: string;
    description: string;
    data_type: 'string' | 'integer' | 'boolean' | 'json';
    is_public: boolean;
    value: any;
}

interface TelemetryData {
    php_version: string;
    laravel_version: string;
    database_driver: string;
    system_mode: string;
    server_node: string;
    environment: string;
    cached_at: string;
}

interface PageProps {
    auth: any;
    system: any;
    groupedSettings: Record<string, SettingItem[]>;
    telemetry: TelemetryData;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Index({ auth, system, groupedSettings = {}, telemetry }: PageProps) {
    const user = auth?.user;

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
    const systemMode = system?.mode || 'LIVE PRODUCTION';

    // Build initial form state from groupedSettings
    const initialSettingsState: Record<string, any> = {};
    Object.values(groupedSettings).forEach((categoryItems) => {
        categoryItems.forEach((item) => {
            initialSettingsState[item.key] = item.value;
        });
    });

    const { data, setData, post, processing, isDirty, reset } = useForm({
        settings: initialSettingsState,
    });

    // Global Modal States for Success & Error Notifications
    const [showFormSuccessModal, setShowFormSuccessModal] = useState(false);
    const [formSuccessMessage, setFormSuccessMessage] = useState('');
    const [modalSuccessTitle, setModalSuccessTitle] = useState('Settings Saved Successfully');

    const [showFormErrorModal, setShowFormErrorModal] = useState(false);
    const [formErrorMessage, setFormErrorMessage] = useState('');
    const [modalErrorTitle, setModalErrorTitle] = useState('Operation Failed');

    // Synchronize with Inertia flash messages
    const pageProps = usePage().props as any;
    const flash = pageProps.flash;
    useEffect(() => {
        if (flash?.success) {
            setModalSuccessTitle('Success!');
            setFormSuccessMessage(flash.success);
            setShowFormSuccessModal(true);
        } else if (flash?.error) {
            setModalErrorTitle('Operation Failed');
            setFormErrorMessage(flash.error);
            setShowFormErrorModal(true);
        }
    }, [flash?.success, flash?.error]);

    // Test email form
    const testEmailForm = useForm({
        recipient: '',
    });

    const [activeTab, setActiveTab] = useState<
        'institution' | 'signatories' | 'inventory' | 'numbering' | 'rfid' | 'mail' | 'security'
    >('institution');

    const handleFieldChange = (key: string, value: any) => {
        setData('settings', {
            ...data.settings,
            [key]: value,
        });
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        post(route('system.settings.update'), {
            preserveScroll: true,
            onSuccess: (page: any) => {
                setModalSuccessTitle('Settings Saved Successfully');
                setFormSuccessMessage(
                    page?.props?.flash?.success ||
                    'Consumable system policies, signatories, and inventory thresholds have been updated and cached successfully.'
                );
                setShowFormSuccessModal(true);
            },
            onError: (errors: any) => {
                setModalErrorTitle('Settings Update Failed');
                const errorMessages = Object.values(errors).flat().join('\n');
                setFormErrorMessage(errorMessages || 'Unable to update system settings. Please check the fields and try again.');
                setShowFormErrorModal(true);
            },
        });
    };

    const handleSendTestEmail = (e: React.FormEvent) => {
        e.preventDefault();
        testEmailForm.post(route('system.settings.test-email'), {
            preserveScroll: true,
            onSuccess: (page: any) => {
                if (page?.props?.flash?.error) {
                    setModalErrorTitle('Email Test Failed');
                    setFormErrorMessage(page.props.flash.error);
                    setShowFormErrorModal(true);
                } else {
                    setModalSuccessTitle('Test Email Dispatched');
                    setFormSuccessMessage(
                        page?.props?.flash?.success ||
                        `A diagnostic test email was successfully dispatched to ${testEmailForm.data.recipient || user?.email || 'the configured recipient'}.`
                    );
                    setShowFormSuccessModal(true);
                    testEmailForm.reset();
                }
            },
            onError: (errors: any) => {
                setModalErrorTitle('Email Test Failed');
                const errorMessages = Object.values(errors).flat().join('\n');
                setFormErrorMessage(errorMessages || 'Failed to dispatch test email. Please check your mail settings.');
                setShowFormErrorModal(true);
            },
        });
    };

    // Calculate sample numbering preview
    const sampleYear = new Date().getFullYear();
    const sampleMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const risPrefix = data.settings['numbering.ris_prefix'] || 'RIS-';
    const rsmiPrefix = data.settings['numbering.rsmi_prefix'] || 'RSMI-';
    const rpciPrefix = data.settings['numbering.rpci_prefix'] || 'RPCI-';
    const stockPrefix = data.settings['numbering.stock_card_prefix'] || 'STOCK-';

    const tabs = [
        {
            id: 'institution',
            label: 'Institution & Branding',
            badge: 'Form Header & Agency',
            description: 'Institutional name, agency acronym, custodial office, and printed seals.',
            icon: Building2,
            count: groupedSettings['institution']?.length || 6
        },
        {
            id: 'signatories',
            label: 'Consumable Signatories',
            badge: 'Accountable Officers',
            description: 'Delegated signers for Requisition (RIS), Monthly Summary (RSMI), and Physical Count (RPCI).',
            icon: PenTool,
            count: groupedSettings['signatories']?.length || 13
        },
        {
            id: 'inventory',
            label: 'Stock & Reorder Rules',
            badge: 'Threshold Policies',
            description: 'Define minimum inventory reorder levels, strict negative stock prevention, and units of issue.',
            icon: PackageSearch,
            count: groupedSettings['inventory']?.length || 6
        },
        {
            id: 'numbering',
            label: 'Document Sequences',
            badge: 'Atomic Sequence Prefixes',
            description: 'Configure server-side numbering prefixes and atomic sequences for consumable vouchers.',
            icon: Hash,
            count: groupedSettings['numbering']?.length || 4
        },
        {
            id: 'rfid',
            label: 'RFID & Bin Storage',
            badge: 'Scanner & Hardware',
            description: 'Hardware debounce delay and stockroom reader modes for shelf bin tracking.',
            icon: Radio,
            count: groupedSettings['rfid']?.length || 2
        },
        {
            id: 'mail',
            label: 'Email & Notifications',
            badge: 'Automated Dispatch',
            description: 'Automated low-stock threshold warning emails and live SMTP diagnostic testing.',
            icon: Mail,
            count: groupedSettings['mail']?.length || 2
        },
        {
            id: 'security',
            label: 'Operations & Telemetry',
            badge: 'Terminal & Server',
            description: 'Stockroom terminal auto-logout, JSON archive snapshot backup, and runtime environment telemetry.',
            icon: ShieldCheck,
            count: groupedSettings['security']?.length || 1
        },
    ];

    const currentTabMeta = tabs.find((t) => t.id === activeTab) || tabs[0];
    const ActiveTabIcon = currentTabMeta.icon;

    return (
        <div className="min-h-screen bg-gray-100/80 flex font-sans text-gray-900 selection:bg-red-900 selection:text-white">
            <Head title="System Settings & Policy Engine — UCN SPMO" />

            {/* Persistent Sidebar */}
            <Sidebar
                modules={modules}
                user={user}
                collapsed={collapsed}
                onToggleCollapse={handleToggleCollapse}
            />

            {/* Main Application Area */}
            <main className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? 'ml-20' : 'ml-72'}`}>
                {/* Merged Sticky Institutional Header (Identical to Dashboard) */}
                <header className="sticky top-0 z-40 shadow-xs">
                    {/* Non-Production Mode Alert Banner */}
                    {systemMode !== 'LIVE PRODUCTION' && (
                        <div
                            className={`px-6 py-2 text-xs font-mono font-bold text-center flex items-center justify-center gap-2 shadow-xs border-b ${
                                systemMode === 'MAINTENANCE MODE'
                                    ? 'bg-amber-950 text-amber-300 border-amber-800'
                                    : systemMode === 'STAGING SANDBOX'
                                    ? 'bg-sky-950 text-sky-300 border-sky-800'
                                    : 'bg-purple-950 text-purple-300 border-purple-800'
                            }`}
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                            </span>
                            <span>
                                {systemMode === 'MAINTENANCE MODE' &&
                                    'SYSTEM MAINTENANCE MODE ACTIVE — Consumable data writes restricted to Administrators.'}
                                {systemMode === 'STAGING SANDBOX' &&
                                    'STAGING SANDBOX ENVIRONMENT — Operating with isolated test consumable records.'}
                                {systemMode === 'TRAINING SIMULATION' &&
                                    'TRAINING SIMULATION MODE — Operating with synthetic consumable demonstration data.'}
                            </span>
                        </div>
                    )}

                    {/* Top Institutional Bar */}
                    <div className="bg-red-950 text-red-100 text-[11px] px-6 lg:px-8 py-1.5 flex items-center justify-between border-b border-red-900 font-medium tracking-wide">
                        <div className="flex items-center gap-3">
                            <span className="font-bold tracking-wider uppercase text-amber-300">
                                Supply & Property Management Office (SPMO)
                            </span>
                            <span className="hidden md:inline text-red-400">|</span>
                            <span className="hidden md:inline text-red-200/80">
                                Consumables & Inventory Policy Engine
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-mono text-red-300">
                            <SystemModeBadge />
                            <span>•</span>
                            <span>PORTAL NODE: {telemetry?.server_node || 'PH-MNL-PRM01'}</span>
                        </div>
                    </div>

                    {/* Main Header Content */}
                    <div className="bg-white border-b border-gray-200 px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <div className="mb-1">
                                <Breadcrumbs
                                    items={[
                                        { name: 'Administration & Governance' },
                                        { name: 'System Settings' },
                                    ]}
                                />
                            </div>
                            <div className="flex items-center gap-2.5">
                                <h2 className="text-2xl font-bold text-gray-900 font-serif tracking-tight">
                                    System Settings & Policies
                                </h2>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-900 border border-red-200/70 shadow-2xs">
                                    Consumables Engine
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                                Manage institutional branding, document signatories, stock reorder thresholds, and document numbering.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block border-l border-gray-200 pl-6">
                                <span className="block text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">
                                    {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block mt-0.5">
                                    {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                                </span>
                            </div>

                            <div className="flex items-center gap-2.5 pl-2 border-l border-gray-200">
                                <a
                                    href={route('system.settings.backup')}
                                    className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                                    title="Export JSON Configuration Snapshot"
                                >
                                    <Download className="w-3.5 h-3.5 text-gray-500" />
                                    <span className="hidden sm:inline">Export Snapshot</span>
                                </a>
                                {isDirty && (
                                    <button
                                        type="button"
                                        onClick={() => reset()}
                                        disabled={processing}
                                        className="px-3.5 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>Reset</span>
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={processing || !isDirty}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold text-white flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                                        isDirty
                                            ? 'bg-red-900 hover:bg-red-800 active:bg-red-950 ring-2 ring-red-900/20'
                                            : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                    }`}
                                >
                                    <Save className="w-4 h-4" />
                                    <span>{processing ? 'Saving...' : 'Save All Settings'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Body */}
                <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto pb-16">
                    {/* Main Settings Section Card */}
                    <div className="bg-white rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] border border-slate-200/80 flex flex-col overflow-hidden">
                        {/* Modern Top Header & Segmented Tab Switcher (Apple/Linear style from Dashboard) */}
                        <div className="px-6 py-5 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/40">
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-950 via-red-900 to-red-800 flex items-center justify-center text-white shadow-xs ring-4 ring-red-50 shrink-0">
                                    <ActiveTabIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2.5">
                                        <h3 className="text-base font-bold text-slate-900 tracking-tight font-sans">
                                            {currentTabMeta.label}
                                        </h3>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-900 border border-red-200/70 shadow-2xs">
                                            {currentTabMeta.badge}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                                        {currentTabMeta.description}
                                    </p>
                                </div>
                            </div>

                            {/* Segmented Switcher Pill */}
                            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/70 shadow-2xs text-xs">
                                {tabs.map((tab) => {
                                    const IconComponent = tab.icon;
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setActiveTab(tab.id as any)}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                                                isActive
                                                    ? 'bg-white text-slate-900 shadow-xs ring-1 ring-black/5 font-extrabold'
                                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
                                            }`}
                                        >
                                            <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-red-900' : 'text-slate-400'}`} />
                                            <span>{tab.label}</span>
                                            <span
                                                className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                                                    isActive ? 'bg-red-50 text-red-900 font-bold border border-red-200/60' : 'bg-slate-200 text-slate-600'
                                                }`}
                                            >
                                                {tab.count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Form Container */}
                        <form onSubmit={handleSubmit} className="p-6 lg:p-8 space-y-6">
                            {/* TAB 1: INSTITUTION & BRANDING */}
                            {activeTab === 'institution' && (
                                <div className="space-y-6">
                                    <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-6 space-y-6">
                                        <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-800 flex items-center justify-center border border-red-100">
                                                    <Building2 className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-900">Institutional Identity & Agency Profiling</h4>
                                                    <p className="text-xs text-gray-500">Rendered atop official Requisition & Issue Slips (RIS), RSMI summaries, and RPCI sheets.</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                                                Form Headers
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                                    Full Institution Name <span className="text-red-600">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.settings['institution.name'] || ''}
                                                    onChange={(e) => handleFieldChange('institution.name', e.target.value)}
                                                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-900/15 focus:border-red-800 text-sm font-medium text-gray-900 bg-white placeholder:text-gray-400 transition-all shadow-2xs"
                                                    placeholder="University of Camarines Norte"
                                                />
                                                <p className="text-[11px] font-medium text-gray-500">
                                                    Official university header title appearing on all generated reports.
                                                </p>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                                    Agency Acronym <span className="text-red-600">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.settings['institution.acronym'] || ''}
                                                    onChange={(e) => handleFieldChange('institution.acronym', e.target.value)}
                                                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-900/15 focus:border-red-800 text-sm font-medium text-gray-900 bg-white placeholder:text-gray-400 transition-all shadow-2xs"
                                                    placeholder="UCN"
                                                />
                                                <p className="text-[11px] font-medium text-gray-500">
                                                    Short identification acronym used for bin tags and summary headers.
                                                </p>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                                    Custodial Supply Office <span className="text-red-600">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.settings['institution.custodial_office'] || ''}
                                                    onChange={(e) => handleFieldChange('institution.custodial_office', e.target.value)}
                                                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-900/15 focus:border-red-800 text-sm font-medium text-gray-900 bg-white placeholder:text-gray-400 transition-all shadow-2xs"
                                                    placeholder="Supply & Property Management Office (SPMO)"
                                                />
                                                <p className="text-[11px] font-medium text-gray-500">
                                                    Department in primary custody of consumable inventory and issuance.
                                                </p>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                                    Campus / Postal Address <span className="text-red-600">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.settings['institution.campus_address'] || ''}
                                                    onChange={(e) => handleFieldChange('institution.campus_address', e.target.value)}
                                                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-900/15 focus:border-red-800 text-sm font-medium text-gray-900 bg-white placeholder:text-gray-400 transition-all shadow-2xs"
                                                    placeholder="Daet, Camarines Norte"
                                                />
                                                <p className="text-[11px] font-medium text-gray-500">
                                                    Physical campus address printed on official compliance reports.
                                                </p>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                                    Responsibility Center Code (RCC)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.settings['institution.responsibility_center_code'] || ''}
                                                    onChange={(e) => handleFieldChange('institution.responsibility_center_code', e.target.value)}
                                                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-900/15 focus:border-red-800 text-sm font-mono font-medium text-gray-900 bg-white placeholder:text-gray-400 transition-all shadow-2xs"
                                                    placeholder="01-101-00"
                                                />
                                                <p className="text-[11px] font-medium text-gray-500">
                                                    Official government accounting station code for SPMO inventory disbursements.
                                                </p>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                                    Institutional Crest / Logo Asset Path
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.settings['institution.logo_path'] || ''}
                                                    onChange={(e) => handleFieldChange('institution.logo_path', e.target.value)}
                                                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-900/15 focus:border-red-800 text-sm font-mono font-medium text-gray-900 bg-white placeholder:text-gray-400 transition-all shadow-2xs"
                                                    placeholder="/images/ucn-crest.png"
                                                />
                                                <p className="text-[11px] font-medium text-gray-500">
                                                    Asset path for the official university seal displayed on print forms.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: CONSUMABLE SIGNATORIES */}
                            {activeTab === 'signatories' && (
                                <div className="space-y-6">
                                    {/* 1. REQUISITION & ISSUE SLIP (RIS) */}
                                    <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                            <div className="flex items-center gap-2.5">
                                                <span className="w-2.5 h-2.5 rounded-full bg-red-800 ring-2 ring-red-100"></span>
                                                <h4 className="text-sm font-bold text-gray-900">
                                                    Requisition & Issue Slip (RIS — Appendix 63)
                                                </h4>
                                            </div>
                                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-50 text-red-900 border border-red-200/70">
                                                Issuance Authorization
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                                    RIS Approving Officer Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.settings['signatories.ris_approved_by_name'] || ''}
                                                    onChange={(e) => handleFieldChange('signatories.ris_approved_by_name', e.target.value)}
                                                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-900/15 focus:border-red-800 text-sm font-medium text-gray-900 bg-white"
                                                    placeholder="ARSENIO GEM A. GARCILLANOSA"
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                                    RIS Approving Officer Designation
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.settings['signatories.ris_approved_by_designation'] || ''}
                                                    onChange={(e) => handleFieldChange('signatories.ris_approved_by_designation', e.target.value)}
                                                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-900/15 focus:border-red-800 text-sm font-medium text-gray-900 bg-white"
                                                    placeholder="SUPPLY OFFICER III / ADMIN OFFICER V"
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                                    RIS Issuing Custodian Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.settings['signatories.ris_issued_by_name'] || ''}
                                                    onChange={(e) => handleFieldChange('signatories.ris_issued_by_name', e.target.value)}
                                                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-900/15 focus:border-red-800 text-sm font-medium text-gray-900 bg-white"
                                                    placeholder="Supply Custodian / Storekeeper"
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                                    RIS Issuing Custodian Designation
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.settings['signatories.ris_issued_by_designation'] || ''}
                                                    onChange={(e) => handleFieldChange('signatories.ris_issued_by_designation', e.target.value)}
                                                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-900/15 focus:border-red-800 text-sm font-medium text-gray-900 bg-white"
                                                    placeholder="Administrative Aide VI / Storekeeper"
                                                />
                                            </div>
                                        </div>

                                        {/* OIC Delegation Card */}
                                        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 flex items-start gap-3.5 mt-2">
                                            <div className="pt-0.5">
                                                <input
                                                    type="checkbox"
                                                    id="oic_toggle"
                                                    checked={Boolean(data.settings['signatories.ris_oic_active'])}
                                                    onChange={(e) => handleFieldChange('signatories.ris_oic_active', e.target.checked)}
                                                    className="w-4 h-4 rounded text-red-900 focus:ring-red-800 border-gray-300 cursor-pointer"
                                                />
                                            </div>
                                            <div className="flex-1 space-y-1.5">
                                                <label htmlFor="oic_toggle" className="text-xs font-bold text-gray-800 cursor-pointer flex items-center gap-2">
                                                    <span>Enable Officer-in-Charge (OIC) Delegation on RIS Forms</span>
                                                    {Boolean(data.settings['signatories.ris_oic_active']) && (
                                                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-mono font-bold uppercase border border-amber-200">
                                                            Active
                                                        </span>
                                                    )}
                                                </label>
                                                <p className="text-[11px] font-medium text-gray-500">
                                                    Automatically prepends designated prefix text to the approving officer name on printed forms.
                                                </p>
                                                {Boolean(data.settings['signatories.ris_oic_active']) && (
                                                    <div className="pt-1.5 max-w-xs">
                                                        <input
                                                            type="text"
                                                            value={data.settings['signatories.ris_oic_prefix'] || ''}
                                                            onChange={(e) => handleFieldChange('signatories.ris_oic_prefix', e.target.value)}
                                                            className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold bg-white text-gray-900 focus:ring-2 focus:ring-red-900/15 focus:border-red-800"
                                                            placeholder="OIC, "
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. REPORT OF SUPPLIES ISSUED (RSMI) */}
                                    <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                            <div className="flex items-center gap-2.5">
                                                <span className="w-2.5 h-2.5 rounded-full bg-red-800 ring-2 ring-red-100"></span>
                                                <h4 className="text-sm font-bold text-gray-900">
                                                    Report of Supplies & Materials Issued (RSMI — Monthly Summary)
                                                </h4>
                                            </div>
                                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                                Accounting Ledger
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                                    Certified Correct By (Supply Custodian)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.settings['signatories.rsmi_certified_by_name'] || ''}
                                                    onChange={(e) => handleFieldChange('signatories.rsmi_certified_by_name', e.target.value)}
                                                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-900/15 focus:border-red-800 text-sm font-medium text-gray-900 bg-white"
                                                    placeholder="ARSENIO GEM A. GARCILLANOSA"
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                                    Certification Designation
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.settings['signatories.rsmi_certified_by_designation'] || ''}
                                                    onChange={(e) => handleFieldChange('signatories.rsmi_certified_by_designation', e.target.value)}
                                                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-900/15 focus:border-red-800 text-sm font-medium text-gray-900 bg-white"
                                                    placeholder="Supply Officer III / SPMO Head"
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                                    Posted By (Accounting Representative)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.settings['signatories.rsmi_posted_by_name'] || ''}
                                                    onChange={(e) => handleFieldChange('signatories.rsmi_posted_by_name', e.target.value)}
                                                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-900/15 focus:border-red-800 text-sm font-medium text-gray-900 bg-white"
                                                    placeholder="Accounting Bookkeeper"
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                                    Accounting Designation
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.settings['signatories.rsmi_posted_by_designation'] || ''}
                                                    onChange={(e) => handleFieldChange('signatories.rsmi_posted_by_designation', e.target.value)}
                                                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-900/15 focus:border-red-800 text-sm font-medium text-gray-900 bg-white"
                                                    placeholder="Administrative Officer IV"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. PHYSICAL COUNT (RPCI) & STOCK CARD */}
                                    <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                            <div className="flex items-center gap-2.5">
                                                <span className="w-2.5 h-2.5 rounded-full bg-red-800 ring-2 ring-red-100"></span>
                                                <h4 className="text-sm font-bold text-gray-900">
                                                    Physical Count (RPCI) & Stock Card Custodians
                                                </h4>
                                            </div>
                                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                                Annual Count & Cards
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                                    RPCI Accountable Officer Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.settings['signatories.rpci_accountable_officer_name'] || ''}
                                                    onChange={(e) => handleFieldChange('signatories.rpci_accountable_officer_name', e.target.value)}
                                                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-900/15 focus:border-red-800 text-sm font-medium text-gray-900 bg-white"
                                                    placeholder="Arsenio Gem A. Garcillanosa"
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                                    RPCI Accountable Officer Designation
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.settings['signatories.rpci_accountable_officer_designation'] || ''}
                                                    onChange={(e) => handleFieldChange('signatories.rpci_accountable_officer_designation', e.target.value)}
                                                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-900/15 focus:border-red-800 text-sm font-medium text-gray-900 bg-white"
                                                    placeholder="Supply Custodian / Supply Officer III"
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                                    Inventory Committee Chairman
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.settings['signatories.rpci_committee_chair'] || ''}
                                                    onChange={(e) => handleFieldChange('signatories.rpci_committee_chair', e.target.value)}
                                                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-900/15 focus:border-red-800 text-sm font-medium text-gray-900 bg-white"
                                                    placeholder="Inspection Committee Chairman"
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                                    Stock Card Storekeeper / Custodian
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.settings['signatories.stock_card_custodian'] || ''}
                                                    onChange={(e) => handleFieldChange('signatories.stock_card_custodian', e.target.value)}
                                                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-900/15 focus:border-red-800 text-sm font-medium text-gray-900 bg-white"
                                                    placeholder="Storekeeper / Property Custodian"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: STOCK & REORDER POLICIES */}
                            {activeTab === 'inventory' && (
                                <div className="space-y-6">
                                    <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-6 space-y-6">
                                        <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-800 flex items-center justify-center border border-red-100">
                                                    <PackageSearch className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-900">Consumable Stock Reorder Points & Limits</h4>
                                                    <p className="text-xs text-gray-500">Automate safety inventory boundaries and strict non-negative issuance enforcement.</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                                                Inventory Policies
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                                    Global Low-Stock Reorder Threshold <span className="text-red-600">*</span>
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="1000"
                                                        value={data.settings['inventory.low_stock_threshold'] ?? 10}
                                                        onChange={(e) => handleFieldChange('inventory.low_stock_threshold', parseInt(e.target.value, 10))}
                                                        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-900/15 focus:border-red-800 text-sm font-semibold text-gray-900 bg-white"
                                                    />
                                                    <span className="absolute right-3.5 top-2.5 text-xs text-gray-400 font-bold">Units</span>
                                                </div>
                                                <p className="text-[11px] font-medium text-gray-500">
                                                    Triggers Low Stock status when available balance reaches or falls below this point.
                                                </p>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                                    Critical Red-Alert Threshold <span className="text-red-600">*</span>
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={data.settings['inventory.critical_stock_threshold'] ?? 3}
                                                        onChange={(e) => handleFieldChange('inventory.critical_stock_threshold', parseInt(e.target.value, 10))}
                                                        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-900/15 focus:border-red-800 text-sm font-semibold text-gray-900 bg-white"
                                                    />
                                                    <span className="absolute right-3.5 top-2.5 text-xs text-gray-400 font-bold">Units</span>
                                                </div>
                                                <p className="text-[11px] font-medium text-gray-500">
                                                    Emergency threshold requiring immediate purchase replenishment.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Strict Balance Issuance Toggle */}
                                        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 flex items-start gap-3.5">
                                            <div className="pt-0.5">
                                                <input
                                                    type="checkbox"
                                                    id="strict_stock"
                                                    checked={Boolean(data.settings['inventory.strict_stock_enforcement'])}
                                                    onChange={(e) => handleFieldChange('inventory.strict_stock_enforcement', e.target.checked)}
                                                    className="w-4 h-4 rounded text-red-900 focus:ring-red-800 border-gray-300 cursor-pointer"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label htmlFor="strict_stock" className="text-xs font-bold text-gray-900 cursor-pointer block">
                                                    Strict Stock Balance Enforcement (Prevent Negative Stock)
                                                </label>
                                                <p className="text-[11px] font-medium text-gray-500 mt-0.5">
                                                    Strictly prevents creating or approving a Requisition & Issue Slip (RIS) if requested quantity exceeds current on-hand balance.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Category Specific Thresholds */}
                                        <div className="space-y-3 pt-2">
                                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                                Category-Specific Reorder Points (Overrides Global Default)
                                            </label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {Object.entries(data.settings['inventory.category_thresholds'] || {}).map(([catName, thresh]: [string, any]) => (
                                                    <div key={catName} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 flex items-center justify-between">
                                                        <span className="text-xs font-semibold text-gray-800 truncate mr-2">{catName}</span>
                                                        <div className="flex items-center gap-1.5 w-24">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={thresh}
                                                                onChange={(e) => {
                                                                    const newCatObj = {
                                                                        ...data.settings['inventory.category_thresholds'],
                                                                        [catName]: parseInt(e.target.value, 10) || 1,
                                                                    };
                                                                    handleFieldChange('inventory.category_thresholds', newCatObj);
                                                                }}
                                                                className="w-full px-2 py-1 rounded-md border border-gray-300 text-xs font-bold text-center bg-white text-gray-900 focus:ring-1 focus:ring-red-900 focus:border-red-800"
                                                            />
                                                            <span className="text-[10px] font-medium text-gray-400">units</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Units of Issue */}
                                        <div className="space-y-2.5 pt-2">
                                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                                Standard Consumable Units of Issue
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {(data.settings['inventory.units_of_issue'] || []).map((unit: string, idx: number) => (
                                                    <span
                                                        key={idx}
                                                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200/90 shadow-2xs font-mono"
                                                    >
                                                        {unit}
                                                    </span>
                                                ))}
                                            </div>
                                            <p className="text-[11px] font-medium text-gray-500">
                                                Standardized measurement units recognized across SPMO delivery receipts and RIS slips.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 4: DOCUMENT NUMBERING */}
                            {activeTab === 'numbering' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* RIS */}
                                        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
                                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-red-800"></span>
                                                    <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">Requisition & Issue Slip (RIS)</span>
                                                </div>
                                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-bold">Annual Reset</span>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Sequence Prefix</label>
                                                <input
                                                    type="text"
                                                    value={data.settings['numbering.ris_prefix'] || ''}
                                                    onChange={(e) => handleFieldChange('numbering.ris_prefix', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono font-bold bg-white text-gray-900 focus:ring-2 focus:ring-red-900/15 focus:border-red-800"
                                                    placeholder="RIS-"
                                                />
                                            </div>
                                            <div className="p-3 rounded-lg bg-red-50/50 border border-red-100/90 text-xs flex items-center justify-between">
                                                <span className="text-gray-500 font-medium">Live Voucher Preview:</span>
                                                <span className="font-mono font-bold text-red-950 text-xs px-2.5 py-1 bg-white rounded border border-red-200/80 shadow-2xs">
                                                    {risPrefix}{sampleYear}-{sampleMonth}-0042
                                                </span>
                                            </div>
                                        </div>

                                        {/* RSMI */}
                                        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
                                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-red-800"></span>
                                                    <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">Report of Supplies Issued (RSMI)</span>
                                                </div>
                                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-bold">Monthly Reset</span>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Sequence Prefix</label>
                                                <input
                                                    type="text"
                                                    value={data.settings['numbering.rsmi_prefix'] || ''}
                                                    onChange={(e) => handleFieldChange('numbering.rsmi_prefix', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono font-bold bg-white text-gray-900 focus:ring-2 focus:ring-red-900/15 focus:border-red-800"
                                                    placeholder="RSMI-"
                                                />
                                            </div>
                                            <div className="p-3 rounded-lg bg-red-50/50 border border-red-100/90 text-xs flex items-center justify-between">
                                                <span className="text-gray-500 font-medium">Live Voucher Preview:</span>
                                                <span className="font-mono font-bold text-red-950 text-xs px-2.5 py-1 bg-white rounded border border-red-200/80 shadow-2xs">
                                                    {rsmiPrefix}{sampleYear}-{sampleMonth}-003
                                                </span>
                                            </div>
                                        </div>

                                        {/* RPCI */}
                                        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
                                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-red-800"></span>
                                                    <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">Physical Count Report (RPCI)</span>
                                                </div>
                                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-bold">Annual Reset</span>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Sequence Prefix</label>
                                                <input
                                                    type="text"
                                                    value={data.settings['numbering.rpci_prefix'] || ''}
                                                    onChange={(e) => handleFieldChange('numbering.rpci_prefix', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono font-bold bg-white text-gray-900 focus:ring-2 focus:ring-red-900/15 focus:border-red-800"
                                                    placeholder="RPCI-"
                                                />
                                            </div>
                                            <div className="p-3 rounded-lg bg-red-50/50 border border-red-100/90 text-xs flex items-center justify-between">
                                                <span className="text-gray-500 font-medium">Live Voucher Preview:</span>
                                                <span className="font-mono font-bold text-red-950 text-xs px-2.5 py-1 bg-white rounded border border-red-200/80 shadow-2xs">
                                                    {rpciPrefix}{sampleYear}-001
                                                </span>
                                            </div>
                                        </div>

                                        {/* Stock Card Code */}
                                        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
                                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-red-800"></span>
                                                    <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">Stock Card Code (SKU)</span>
                                                </div>
                                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-bold">Continuous</span>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Sequence Prefix</label>
                                                <input
                                                    type="text"
                                                    value={data.settings['numbering.stock_card_prefix'] || ''}
                                                    onChange={(e) => handleFieldChange('numbering.stock_card_prefix', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono font-bold bg-white text-gray-900 focus:ring-2 focus:ring-red-900/15 focus:border-red-800"
                                                    placeholder="STOCK-"
                                                />
                                            </div>
                                            <div className="p-3 rounded-lg bg-red-50/50 border border-red-100/90 text-xs flex items-center justify-between">
                                                <span className="text-gray-500 font-medium">Live Voucher Preview:</span>
                                                <span className="font-mono font-bold text-red-950 text-xs px-2.5 py-1 bg-white rounded border border-red-200/80 shadow-2xs">
                                                    {stockPrefix}00542
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 5: RFID & BIN STORAGE */}
                            {activeTab === 'rfid' && (
                                <div className="space-y-6">
                                    <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-6 space-y-6">
                                        <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-800 flex items-center justify-center border border-red-100">
                                                    <Radio className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-900">Storage & RFID Scanner Tuning</h4>
                                                    <p className="text-xs text-gray-500">Configure barcode/RFID debounce intervals and default scanner module behaviors.</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                                                Hardware Rules
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                                    Scan Cooldown / Debounce Delay (ms) <span className="text-red-600">*</span>
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        min="300"
                                                        max="10000"
                                                        step="100"
                                                        value={data.settings['rfid.scan_debounce_ms'] ?? 1200}
                                                        onChange={(e) => handleFieldChange('rfid.scan_debounce_ms', parseInt(e.target.value, 10))}
                                                        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-900/15 focus:border-red-800 text-sm font-semibold text-gray-900 bg-white"
                                                    />
                                                    <span className="absolute right-3.5 top-2.5 text-xs text-gray-400 font-bold">Milliseconds</span>
                                                </div>
                                                <p className="text-[11px] font-medium text-gray-500">
                                                    Prevents duplicate scans when a bin tag lingers near the reader antenna.
                                                </p>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                                    Default Stockroom RFID Mode <span className="text-red-600">*</span>
                                                </label>
                                                <select
                                                    value={data.settings['rfid.active_mode'] || 'bin_association'}
                                                    onChange={(e) => handleFieldChange('rfid.active_mode', e.target.value)}
                                                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-900/15 focus:border-red-800 text-sm font-semibold text-gray-900 bg-white"
                                                >
                                                    <option value="bin_association">Bin / Shelf Tag Association Mode</option>
                                                    <option value="issuance_verification">Consumable Issuance Verification Mode</option>
                                                    <option value="rpci_stocktake">RPCI Physical Inventory Stocktaking Mode</option>
                                                </select>
                                                <p className="text-[11px] font-medium text-gray-500">
                                                    Default operational mode when launching the RFID Scanner terminal.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 6: EMAIL & NOTIFICATIONS */}
                            {activeTab === 'mail' && (
                                <div className="space-y-6">
                                    <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-6 space-y-6">
                                        <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-800 flex items-center justify-center border border-red-100">
                                                    <Mail className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-900">Low-Stock Alert Dispatch & Mail Routing</h4>
                                                    <p className="text-xs text-gray-500">Automated notification engine dispatches warning messages upon reorder triggers.</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                                                Notifications
                                            </span>
                                        </div>

                                        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/90 flex items-start gap-3.5">
                                            <div className="pt-0.5">
                                                <input
                                                    type="checkbox"
                                                    id="low_stock_mail"
                                                    checked={Boolean(data.settings['mail.low_stock_email_alerts'])}
                                                    onChange={(e) => handleFieldChange('mail.low_stock_email_alerts', e.target.checked)}
                                                    className="w-4 h-4 rounded text-red-900 focus:ring-red-800 border-gray-300 cursor-pointer"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label htmlFor="low_stock_mail" className="text-xs font-bold text-gray-900 cursor-pointer block">
                                                    Dispatch Automated Low-Stock Warning Emails
                                                </label>
                                                <p className="text-[11px] font-medium text-gray-500 mt-0.5">
                                                    When stock is issued and drops to or below the reorder point, immediately sends an alert email to custodial personnel.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5 max-w-xl">
                                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                                Alert Recipient Email (Optional)
                                            </label>
                                            <input
                                                type="email"
                                                value={data.settings['mail.alert_recipient_email'] || ''}
                                                onChange={(e) => handleFieldChange('mail.alert_recipient_email', e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-900/15 focus:border-red-800 text-sm font-medium text-gray-900 bg-white"
                                                placeholder="spmo-alerts@ucn.edu.ph"
                                            />
                                            <p className="text-[11px] font-medium text-gray-500">
                                                Leave blank to default notifications to the currently active System Administrator.
                                            </p>
                                        </div>

                                        {/* Sleek Diagnostic Mail Tool (Matching Dashboard Hero Card Style) */}
                                        <div className="p-5 rounded-xl bg-gradient-to-br from-red-950 via-slate-900 to-slate-950 text-white space-y-4 border border-red-900/60 shadow-xs relative overflow-hidden">
                                            <div className="flex items-center gap-3 relative z-10">
                                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-amber-300 border border-white/10">
                                                    <Send className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h5 className="text-xs font-bold text-white uppercase tracking-wider">SMTP Diagnostic Testing Console</h5>
                                                    <p className="text-xs text-red-100/70 mt-0.5">
                                                        Test outbound mail server connectivity and verify live SMTP routing.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row gap-3 pt-1 relative z-10">
                                                <input
                                                    type="email"
                                                    value={testEmailForm.data.recipient}
                                                    onChange={(e) => testEmailForm.setData('recipient', e.target.value)}
                                                    placeholder={`Recipient (Default: ${user?.email || 'admin@ucn.edu.ph'})`}
                                                    className="flex-1 px-3.5 py-2.5 rounded-lg bg-black/40 border border-white/20 text-white text-xs placeholder:text-gray-400 focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-colors"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleSendTestEmail}
                                                    disabled={testEmailForm.processing}
                                                    className="px-4 py-2.5 rounded-lg text-xs font-bold text-red-950 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                                                >
                                                    <Send className="w-3.5 h-3.5" />
                                                    <span>{testEmailForm.processing ? 'Testing...' : 'Send Test Email'}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 7: OPERATIONS & BACKUP */}
                            {activeTab === 'security' && (
                                <div className="space-y-6">
                                    <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-6 space-y-6">
                                        <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-800 flex items-center justify-center border border-red-100">
                                                    <ShieldCheck className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-900">Terminal Security & System Snapshot Export</h4>
                                                    <p className="text-xs text-gray-500">Configure terminal auto-logout, database snapshot downloads, and runtime telemetry.</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                                                Operations
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                                    Stockroom Terminal Inactivity Auto-Logout <span className="text-red-600">*</span>
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        min="5"
                                                        max="480"
                                                        value={data.settings['security.session_timeout_minutes'] ?? 30}
                                                        onChange={(e) => handleFieldChange('security.session_timeout_minutes', parseInt(e.target.value, 10))}
                                                        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-900/15 focus:border-red-800 text-sm font-semibold text-gray-900 bg-white"
                                                    />
                                                    <span className="absolute right-3.5 top-2.5 text-xs text-gray-400 font-bold">Minutes</span>
                                                </div>
                                                <p className="text-[11px] font-medium text-gray-500">
                                                    Locks idle stockroom terminals to prevent unauthorized supply vouchers.
                                                </p>
                                            </div>

                                            {/* Backup Export */}
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                                                    Database & Policy Snapshot Export
                                                </label>
                                                <a
                                                    href={route('system.settings.backup')}
                                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                                                >
                                                    <Download className="w-4 h-4 text-red-900" />
                                                    <span>Download Snapshot JSON Archive</span>
                                                </a>
                                                <p className="text-[11px] font-medium text-gray-500">
                                                    Downloads all policy parameters and operating state as a JSON backup file.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Runtime Environment Telemetry Strip (Dashboard Executive KPI Style) */}
                                        <div className="space-y-3 pt-2">
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-800 uppercase tracking-wider">
                                                <Server className="w-4 h-4 text-red-900" />
                                                <span>Runtime Environment Telemetry</span>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                                                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
                                                    <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">PHP Runtime</span>
                                                    <span className="text-base font-extrabold text-slate-900 mt-1">{telemetry?.php_version || '8.2'}</span>
                                                    <span className="text-[11px] text-emerald-700 font-bold mt-0.5">Active Engine</span>
                                                </div>
                                                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
                                                    <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Framework</span>
                                                    <span className="text-base font-extrabold text-slate-900 mt-1">Laravel {telemetry?.laravel_version || '11.x'}</span>
                                                    <span className="text-[11px] text-slate-500 font-medium mt-0.5">Inertia + React</span>
                                                </div>
                                                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
                                                    <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Database Driver</span>
                                                    <span className="text-base font-extrabold text-slate-900 mt-1">{telemetry?.database_driver?.toUpperCase() || 'MYSQL'}</span>
                                                    <span className="text-[11px] text-emerald-700 font-bold mt-0.5">Connected</span>
                                                </div>
                                                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
                                                    <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Operating Mode</span>
                                                    <span className="text-base font-extrabold text-red-900 font-mono mt-1">{telemetry?.system_mode || 'LIVE PRODUCTION'}</span>
                                                    <span className="text-[11px] text-slate-500 font-medium mt-0.5">Node {telemetry?.server_node || 'PH-MNL-PRM01'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </main>

            {/* STICKY BOTTOM SAVE BAR WHEN DIRTY (Sleek Floating Pill) */}
            {isDirty && (
                <aside
                    aria-label="Unsaved changes alert"
                    className="fixed bottom-6 right-8 z-50 bg-slate-950/95 backdrop-blur-md text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-5 animate-in fade-in slide-in-from-bottom-4"
                >
                    <div className="flex items-center gap-3">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
                        </span>
                        <div>
                            <p className="text-xs font-bold text-slate-100">Unsaved Policy Changes</p>
                            <p className="text-[11px] text-slate-400">Save your changes to apply them live across the SPMO platform.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => reset()}
                            disabled={processing}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                            Discard
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSubmit()}
                            disabled={processing}
                            className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-red-800 hover:bg-red-700 active:bg-red-900 shadow-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                        >
                            <Save className="w-3.5 h-3.5" />
                            <span>{processing ? 'Saving...' : 'Save All Settings'}</span>
                        </button>
                    </div>
                </aside>
            )}

            {/* GLOBAL SUCCESS MODAL */}
            <Modal show={showFormSuccessModal} onClose={() => setShowFormSuccessModal(false)} maxWidth="sm">
                <div className="relative bg-white rounded-2xl shadow-xl w-full overflow-hidden border border-slate-200 text-center">
                    <div className="h-1.5 w-full bg-emerald-600"></div>
                    <div className="p-6 sm:p-7">
                        <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-emerald-50 text-emerald-600 mb-4 border border-emerald-100">
                            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1.5 font-serif">{modalSuccessTitle}</h3>
                        <p className="text-xs text-gray-600 mb-6 whitespace-pre-line leading-relaxed">{formSuccessMessage}</p>
                        <button
                            type="button"
                            onClick={() => setShowFormSuccessModal(false)}
                            className="w-full px-4 py-2.5 rounded-lg text-xs font-bold text-white bg-gray-900 hover:bg-gray-800 active:bg-gray-950 shadow-xs transition-colors cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>

            {/* GLOBAL ERROR MODAL */}
            <Modal show={showFormErrorModal} onClose={() => setShowFormErrorModal(false)} maxWidth="sm">
                <div className="relative bg-white rounded-2xl shadow-xl w-full overflow-hidden border border-slate-200 text-center">
                    <div className="h-1.5 w-full bg-red-600"></div>
                    <div className="p-6 sm:p-7">
                        <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-50 text-red-600 mb-4 border border-red-100">
                            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1.5 font-serif">{modalErrorTitle}</h3>
                        <p className="text-xs text-gray-600 mb-6 whitespace-pre-line leading-relaxed">
                            {formErrorMessage || 'Please check the form for completeness or errors and try again.'}
                        </p>
                        <button
                            type="button"
                            onClick={() => setShowFormErrorModal(false)}
                            className="w-full px-4 py-2.5 rounded-lg text-xs font-bold text-white bg-red-800 hover:bg-red-700 active:bg-red-900 shadow-xs transition-colors cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
