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
    CheckCircle2,
    AlertCircle,
    Info,
    Sliders,
    Server,
    Clock,
    Database,
    HelpCircle
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
        { id: 'institution', label: 'Institution & Branding', icon: Building2, count: groupedSettings['institution']?.length || 6 },
        { id: 'signatories', label: 'Consumable Signatories', icon: PenTool, count: groupedSettings['signatories']?.length || 13 },
        { id: 'inventory', label: 'Stock & Reorder Rules', icon: PackageSearch, count: groupedSettings['inventory']?.length || 6 },
        { id: 'numbering', label: 'Document Sequences', icon: Hash, count: groupedSettings['numbering']?.length || 4 },
        { id: 'rfid', label: 'RFID & Bin Storage', icon: Radio, count: groupedSettings['rfid']?.length || 2 },
        { id: 'mail', label: 'Email & Notifications', icon: Mail, count: groupedSettings['mail']?.length || 2 },
        { id: 'security', label: 'Operations & Backup', icon: ShieldCheck, count: groupedSettings['security']?.length || 1 },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 selection:bg-red-900 selection:text-white">
            <Head title="System Settings — Consumables Management — UCN SPMO" />

            {/* Persistent Sidebar */}
            <Sidebar
                modules={modules}
                user={user}
                collapsed={collapsed}
                onToggleCollapse={handleToggleCollapse}
            />

            {/* Main Application Area */}
            <main className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? 'ml-20' : 'ml-72'}`}>
                {/* Institutional Header */}
                <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
                    {/* Operating Mode Banner */}
                    {systemMode !== 'LIVE PRODUCTION' && (
                        <div
                            className={`px-6 py-1.5 text-xs font-mono font-bold text-center flex items-center justify-center gap-2 border-b ${
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
                        <div className="flex items-center gap-4 text-[10px] font-mono text-red-200/70">
                            <span>PORTAL NODE: {telemetry?.server_node || 'PH-MNL-PRM01'}</span>
                        </div>
                    </div>

                    {/* Main Header Content */}
                    <div className="bg-white border-b border-slate-200 px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <div className="mb-1">
                                <Breadcrumbs
                                    items={[
                                        { name: 'Administration & Governance' },
                                        { name: 'System Settings' },
                                    ]}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-slate-900 font-serif tracking-tight">
                                    System Settings & Policies
                                </h1>
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                                    Consumables Engine
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                Manage institutional branding, document signatories, stock reorder thresholds, and document numbering.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <SystemModeBadge />
                            {isDirty && (
                                <button
                                    type="button"
                                    onClick={() => reset()}
                                    disabled={processing}
                                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Reset Changes</span>
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={processing || !isDirty}
                                className={`px-4 py-2 rounded-lg text-xs font-bold text-white flex items-center gap-2 transition-colors cursor-pointer shadow-xs ${
                                    isDirty
                                        ? 'bg-red-800 hover:bg-red-700 active:bg-red-900'
                                        : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                                }`}
                            >
                                <Save className="w-4 h-4" />
                                <span>{processing ? 'Saving...' : 'Save All Settings'}</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content Body */}
                <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
                    {/* Navigation Tabs Bar */}
                    <div className="bg-white rounded-xl p-1.5 border border-slate-200 shadow-xs flex flex-wrap gap-1.5">
                        {tabs.map((tab) => {
                            const IconComponent = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                        isActive
                                            ? 'bg-red-900 text-white shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                                >
                                    <IconComponent className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                                    <span>{tab.label}</span>
                                    <span
                                        className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-md font-mono font-medium ${
                                            isActive ? 'bg-red-800 text-red-100' : 'bg-slate-100 text-slate-600'
                                        }`}
                                    >
                                        {tab.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Form Container */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* TAB 1: INSTITUTION & BRANDING */}
                        {activeTab === 'institution' && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 lg:p-7 space-y-6">
                                <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-red-50 text-red-800 flex items-center justify-center border border-red-100">
                                            <Building2 className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-bold text-slate-900 tracking-tight">
                                                Institutional Profile & Branding
                                            </h2>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Controls agency headers, campus stationing, and institutional crests rendered on all consumable forms.
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] px-2.5 py-1 rounded-md font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                                        Form Header Settings
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                                            Full Institution Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.settings['institution.name'] || ''}
                                            onChange={(e) => handleFieldChange('institution.name', e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-colors"
                                            placeholder="University of Camarines Norte"
                                        />
                                        <p className="text-[11px] text-slate-500">
                                            Printed atop RIS, RSMI, RPCI, and Stock Cards.
                                        </p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                                            Agency Acronym <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.settings['institution.acronym'] || ''}
                                            onChange={(e) => handleFieldChange('institution.acronym', e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-colors"
                                            placeholder="UCN"
                                        />
                                        <p className="text-[11px] text-slate-500">
                                            Short identification acronym used for bin tags and summary headers.
                                        </p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                                            Custodial Supply Office <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.settings['institution.custodial_office'] || ''}
                                            onChange={(e) => handleFieldChange('institution.custodial_office', e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-colors"
                                            placeholder="Supply & Property Management Office (SPMO)"
                                        />
                                        <p className="text-[11px] text-slate-500">
                                            Department in custody of consumable inventory and issuance.
                                        </p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                                            Campus / Postal Address <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.settings['institution.campus_address'] || ''}
                                            onChange={(e) => handleFieldChange('institution.campus_address', e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-colors"
                                            placeholder="Daet, Camarines Norte"
                                        />
                                        <p className="text-[11px] text-slate-500">
                                            Physical campus address printed on official compliance reports.
                                        </p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                                            Responsibility Center Code (RCC)
                                        </label>
                                        <input
                                            type="text"
                                            value={data.settings['institution.responsibility_center_code'] || ''}
                                            onChange={(e) => handleFieldChange('institution.responsibility_center_code', e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-mono font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-colors"
                                            placeholder="01-101-00"
                                        />
                                        <p className="text-[11px] text-slate-500">
                                            Official government accounting station code for SPMO inventory disbursements.
                                        </p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                                            Institutional Crest / Logo Asset Path
                                        </label>
                                        <input
                                            type="text"
                                            value={data.settings['institution.logo_path'] || ''}
                                            onChange={(e) => handleFieldChange('institution.logo_path', e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-mono font-medium text-slate-900 bg-white placeholder:text-slate-400 transition-colors"
                                            placeholder="/images/ucn-crest.png"
                                        />
                                        <p className="text-[11px] text-slate-500">
                                            Asset path for the official university seal displayed on print forms.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: CONSUMABLE SIGNATORIES */}
                        {activeTab === 'signatories' && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 lg:p-7 space-y-6">
                                <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-red-50 text-red-800 flex items-center justify-center border border-red-100">
                                            <PenTool className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-bold text-slate-900 tracking-tight">
                                                Consumable Document Signatories & Delegation
                                            </h2>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Configure accountable officers and designations for RIS, RSMI, RPCI, and Stock Cards.
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] px-2.5 py-1 rounded-md font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                                        Official Signatories
                                    </span>
                                </div>

                                {/* 1. REQUISITION & ISSUE SLIP (RIS) */}
                                <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-red-800"></span>
                                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                                                Requisition & Issue Slip (RIS — Appendix 63)
                                            </h3>
                                        </div>
                                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                            Issuance Authorization
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                                                RIS Approving Officer Name
                                            </label>
                                            <input
                                                type="text"
                                                value={data.settings['signatories.ris_approved_by_name'] || ''}
                                                onChange={(e) => handleFieldChange('signatories.ris_approved_by_name', e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-medium text-slate-900 bg-white"
                                                placeholder="ARSENIO GEM A. GARCILLANOSA"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                                                RIS Approving Officer Designation
                                            </label>
                                            <input
                                                type="text"
                                                value={data.settings['signatories.ris_approved_by_designation'] || ''}
                                                onChange={(e) => handleFieldChange('signatories.ris_approved_by_designation', e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-medium text-slate-900 bg-white"
                                                placeholder="SUPPLY OFFICER III/ADMIN OFFICER V"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                                                RIS Issuing Custodian Name
                                            </label>
                                            <input
                                                type="text"
                                                value={data.settings['signatories.ris_issued_by_name'] || ''}
                                                onChange={(e) => handleFieldChange('signatories.ris_issued_by_name', e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-medium text-slate-900 bg-white"
                                                placeholder="Supply Custodian / Storekeeper"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                                                RIS Issuing Custodian Designation
                                            </label>
                                            <input
                                                type="text"
                                                value={data.settings['signatories.ris_issued_by_designation'] || ''}
                                                onChange={(e) => handleFieldChange('signatories.ris_issued_by_designation', e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-medium text-slate-900 bg-white"
                                                placeholder="Administrative Aide VI / Storekeeper"
                                            />
                                        </div>
                                    </div>

                                    {/* OIC / Officer-in-Charge Delegation Toggle */}
                                    <div className="p-4 rounded-lg bg-white border border-slate-200 flex items-start gap-3.5 mt-2">
                                        <div className="pt-0.5">
                                            <input
                                                type="checkbox"
                                                id="oic_toggle"
                                                checked={Boolean(data.settings['signatories.ris_oic_active'])}
                                                onChange={(e) => handleFieldChange('signatories.ris_oic_active', e.target.checked)}
                                                className="w-4 h-4 rounded text-red-800 focus:ring-red-500 border-slate-300 cursor-pointer"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-1.5">
                                            <label htmlFor="oic_toggle" className="text-xs font-semibold text-slate-800 cursor-pointer flex items-center gap-2">
                                                <span>Enable Officer-in-Charge (OIC) Delegation on RIS Forms</span>
                                                {Boolean(data.settings['signatories.ris_oic_active']) && (
                                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono font-bold uppercase border border-slate-200">
                                                        Active
                                                    </span>
                                                )}
                                            </label>
                                            <p className="text-[11px] text-slate-500">
                                                Automatically prepends designated prefix text to the approving officer name on printed forms.
                                            </p>
                                            {Boolean(data.settings['signatories.ris_oic_active']) && (
                                                <div className="pt-1.5 max-w-xs">
                                                    <input
                                                        type="text"
                                                        value={data.settings['signatories.ris_oic_prefix'] || ''}
                                                        onChange={(e) => handleFieldChange('signatories.ris_oic_prefix', e.target.value)}
                                                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white text-slate-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                                                        placeholder="OIC, "
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 2. REPORT OF SUPPLIES ISSUED (RSMI) */}
                                <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-red-800"></span>
                                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                                                Report of Supplies & Materials Issued (RSMI — Monthly Summary)
                                            </h3>
                                        </div>
                                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                            Accounting Ledger
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                                                Certified Correct By (Supply Custodian)
                                            </label>
                                            <input
                                                type="text"
                                                value={data.settings['signatories.rsmi_certified_by_name'] || ''}
                                                onChange={(e) => handleFieldChange('signatories.rsmi_certified_by_name', e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-medium text-slate-900 bg-white"
                                                placeholder="ARSENIO GEM A. GARCILLANOSA"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                                                Certification Designation
                                            </label>
                                            <input
                                                type="text"
                                                value={data.settings['signatories.rsmi_certified_by_designation'] || ''}
                                                onChange={(e) => handleFieldChange('signatories.rsmi_certified_by_designation', e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-medium text-slate-900 bg-white"
                                                placeholder="Supply Officer III / SPMO Head"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                                                Posted By (Accounting Representative)
                                            </label>
                                            <input
                                                type="text"
                                                value={data.settings['signatories.rsmi_posted_by_name'] || ''}
                                                onChange={(e) => handleFieldChange('signatories.rsmi_posted_by_name', e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-medium text-slate-900 bg-white"
                                                placeholder="Accounting Bookkeeper"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                                                Accounting Designation
                                            </label>
                                            <input
                                                type="text"
                                                value={data.settings['signatories.rsmi_posted_by_designation'] || ''}
                                                onChange={(e) => handleFieldChange('signatories.rsmi_posted_by_designation', e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-medium text-slate-900 bg-white"
                                                placeholder="Administrative Officer IV"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 3. PHYSICAL COUNT OF INVENTORIES (RPCI) & STOCK CARD */}
                                <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-red-800"></span>
                                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                                                Physical Count (RPCI) & Stock Card Custodians
                                            </h3>
                                        </div>
                                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                            Annual Count & Cards
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                                                RPCI Accountable Officer Name
                                            </label>
                                            <input
                                                type="text"
                                                value={data.settings['signatories.rpci_accountable_officer_name'] || ''}
                                                onChange={(e) => handleFieldChange('signatories.rpci_accountable_officer_name', e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-medium text-slate-900 bg-white"
                                                placeholder="Arsenio Gem A. Garcillanosa"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                                                RPCI Accountable Officer Designation
                                            </label>
                                            <input
                                                type="text"
                                                value={data.settings['signatories.rpci_accountable_officer_designation'] || ''}
                                                onChange={(e) => handleFieldChange('signatories.rpci_accountable_officer_designation', e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-medium text-slate-900 bg-white"
                                                placeholder="Supply Custodian / Supply Officer III"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                                                Inventory Committee Chairman
                                            </label>
                                            <input
                                                type="text"
                                                value={data.settings['signatories.rpci_committee_chair'] || ''}
                                                onChange={(e) => handleFieldChange('signatories.rpci_committee_chair', e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-medium text-slate-900 bg-white"
                                                placeholder="Inspection Committee Chairman"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                                                Stock Card Storekeeper / Custodian
                                            </label>
                                            <input
                                                type="text"
                                                value={data.settings['signatories.stock_card_custodian'] || ''}
                                                onChange={(e) => handleFieldChange('signatories.stock_card_custodian', e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-medium text-slate-900 bg-white"
                                                placeholder="Storekeeper / Property Custodian"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: STOCK & REORDER POLICIES */}
                        {activeTab === 'inventory' && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 lg:p-7 space-y-6">
                                <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-red-50 text-red-800 flex items-center justify-center border border-red-100">
                                            <PackageSearch className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-bold text-slate-900 tracking-tight">
                                                Consumable Stock Reorder Points & Classifications
                                            </h2>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Define minimum inventory levels, strict issuance enforcement, and standardized units.
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] px-2.5 py-1 rounded-md font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                                        Inventory Thresholds
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                                            Global Low-Stock Reorder Threshold <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="1"
                                                max="1000"
                                                value={data.settings['inventory.low_stock_threshold'] ?? 10}
                                                onChange={(e) => handleFieldChange('inventory.low_stock_threshold', parseInt(e.target.value, 10))}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-semibold text-slate-900 bg-white"
                                            />
                                            <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-medium">Units</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500">
                                            Triggers Low Stock status when available balance reaches or falls below this point.
                                        </p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                                            Critical Red-Alert Threshold <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={data.settings['inventory.critical_stock_threshold'] ?? 3}
                                                onChange={(e) => handleFieldChange('inventory.critical_stock_threshold', parseInt(e.target.value, 10))}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-semibold text-slate-900 bg-white"
                                            />
                                            <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-medium">Units</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500">
                                            Emergency threshold requiring immediate purchase replenishment.
                                        </p>
                                    </div>
                                </div>

                                {/* Strict Balance Issuance Toggle */}
                                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-3.5">
                                    <div className="pt-0.5">
                                        <input
                                            type="checkbox"
                                            id="strict_stock"
                                            checked={Boolean(data.settings['inventory.strict_stock_enforcement'])}
                                            onChange={(e) => handleFieldChange('inventory.strict_stock_enforcement', e.target.checked)}
                                            className="w-4 h-4 rounded text-red-800 focus:ring-red-500 border-slate-300 cursor-pointer"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label htmlFor="strict_stock" className="text-xs font-semibold text-slate-900 cursor-pointer block">
                                            Strict Stock Balance Enforcement (Prevent Negative Stock)
                                        </label>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            Strictly prevents creating a Requisition & Issue Slip (RIS) if requested quantity exceeds current available stock.
                                        </p>
                                    </div>
                                </div>

                                {/* Category Specific Thresholds */}
                                <div className="space-y-3">
                                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                                        Category-Specific Reorder Points (Overrides Global Default)
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {Object.entries(data.settings['inventory.category_thresholds'] || {}).map(([catName, thresh]: [string, any]) => (
                                            <div key={catName} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                                                <span className="text-xs font-medium text-slate-700 truncate mr-2">{catName}</span>
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
                                                        className="w-full px-2 py-1 rounded-md border border-slate-300 text-xs font-semibold text-center bg-white text-slate-900 focus:ring-1 focus:ring-red-500 focus:border-red-600"
                                                    />
                                                    <span className="text-[10px] text-slate-500">units</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Units of Issue */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                                        Standard Consumable Units of Issue
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {(data.settings['inventory.units_of_issue'] || []).map((unit: string, idx: number) => (
                                            <span
                                                key={idx}
                                                className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                                            >
                                                {unit}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-[11px] text-slate-500">
                                        Standardized measurement units recognized by SPMO inventory tracking.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* TAB 4: DOCUMENT NUMBERING */}
                        {activeTab === 'numbering' && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 lg:p-7 space-y-6">
                                <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-red-50 text-red-800 flex items-center justify-center border border-red-100">
                                            <Hash className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-bold text-slate-900 tracking-tight">
                                                Document Reference Sequences
                                            </h2>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Configure server-side numbering prefixes and atomic sequences for the 4 active consumable forms.
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] px-2.5 py-1 rounded-md font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                                        Document Prefixes
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* RIS */}
                                    <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-slate-800 uppercase">Requisition & Issue Slip (RIS)</span>
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">Annual Reset</span>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[11px] text-slate-500 font-medium">Prefix</label>
                                            <input
                                                type="text"
                                                value={data.settings['numbering.ris_prefix'] || ''}
                                                onChange={(e) => handleFieldChange('numbering.ris_prefix', e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono font-semibold bg-white text-slate-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                                                placeholder="RIS-"
                                            />
                                        </div>
                                        <div className="p-2.5 rounded-md bg-white border border-slate-200 text-xs flex items-center justify-between">
                                            <span className="text-slate-500">Live Preview:</span>
                                            <span className="font-mono font-bold text-red-900">
                                                {risPrefix}{sampleYear}-{sampleMonth}-0042
                                            </span>
                                        </div>
                                    </div>

                                    {/* RSMI */}
                                    <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-slate-800 uppercase">Report of Supplies Issued (RSMI)</span>
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">Monthly Reset</span>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[11px] text-slate-500 font-medium">Prefix</label>
                                            <input
                                                type="text"
                                                value={data.settings['numbering.rsmi_prefix'] || ''}
                                                onChange={(e) => handleFieldChange('numbering.rsmi_prefix', e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono font-semibold bg-white text-slate-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                                                placeholder="RSMI-"
                                            />
                                        </div>
                                        <div className="p-2.5 rounded-md bg-white border border-slate-200 text-xs flex items-center justify-between">
                                            <span className="text-slate-500">Live Preview:</span>
                                            <span className="font-mono font-bold text-red-900">
                                                {rsmiPrefix}{sampleYear}-{sampleMonth}-003
                                            </span>
                                        </div>
                                    </div>

                                    {/* RPCI */}
                                    <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-slate-800 uppercase">Physical Count Report (RPCI)</span>
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">Annual Reset</span>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[11px] text-slate-500 font-medium">Prefix</label>
                                            <input
                                                type="text"
                                                value={data.settings['numbering.rpci_prefix'] || ''}
                                                onChange={(e) => handleFieldChange('numbering.rpci_prefix', e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono font-semibold bg-white text-slate-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                                                placeholder="RPCI-"
                                            />
                                        </div>
                                        <div className="p-2.5 rounded-md bg-white border border-slate-200 text-xs flex items-center justify-between">
                                            <span className="text-slate-500">Live Preview:</span>
                                            <span className="font-mono font-bold text-red-900">
                                                {rpciPrefix}{sampleYear}-001
                                            </span>
                                        </div>
                                    </div>

                                    {/* Stock Card Code */}
                                    <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-slate-800 uppercase">Stock Card Code (SKU)</span>
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">Continuous</span>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[11px] text-slate-500 font-medium">Prefix</label>
                                            <input
                                                type="text"
                                                value={data.settings['numbering.stock_card_prefix'] || ''}
                                                onChange={(e) => handleFieldChange('numbering.stock_card_prefix', e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono font-semibold bg-white text-slate-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                                                placeholder="STOCK-"
                                            />
                                        </div>
                                        <div className="p-2.5 rounded-md bg-white border border-slate-200 text-xs flex items-center justify-between">
                                            <span className="text-slate-500">Live Preview:</span>
                                            <span className="font-mono font-bold text-red-900">
                                                {stockPrefix}00542
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 5: RFID & BIN STORAGE */}
                        {activeTab === 'rfid' && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 lg:p-7 space-y-6">
                                <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-red-50 text-red-800 flex items-center justify-center border border-red-100">
                                            <Radio className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-bold text-slate-900 tracking-tight">
                                                Storage & RFID Parameters
                                            </h2>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Tune hardware scanner parameters for tracking consumable shelf bins and supply packs.
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] px-2.5 py-1 rounded-md font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                                        Hardware Settings
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                                            Scan Cooldown / Debounce Delay (ms) <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="300"
                                                max="10000"
                                                step="100"
                                                value={data.settings['rfid.scan_debounce_ms'] ?? 1200}
                                                onChange={(e) => handleFieldChange('rfid.scan_debounce_ms', parseInt(e.target.value, 10))}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-semibold text-slate-900 bg-white"
                                            />
                                            <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-medium">Milliseconds</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500">
                                            Prevents duplicate scans when a bin tag lingers near reader antenna.
                                        </p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                                            Default Stockroom RFID Mode <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={data.settings['rfid.active_mode'] || 'bin_association'}
                                            onChange={(e) => handleFieldChange('rfid.active_mode', e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-medium text-slate-900 bg-white"
                                        >
                                            <option value="bin_association">Bin / Shelf Tag Association Mode</option>
                                            <option value="issuance_verification">Consumable Issuance Verification Mode</option>
                                            <option value="rpci_stocktake">RPCI Physical Inventory Stocktaking Mode</option>
                                        </select>
                                        <p className="text-[11px] text-slate-500">
                                            Default operational mode when opening the RFID Scanner module.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 6: EMAIL & NOTIFICATIONS */}
                        {activeTab === 'mail' && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 lg:p-7 space-y-6">
                                <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-red-50 text-red-800 flex items-center justify-center border border-red-100">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-bold text-slate-900 tracking-tight">
                                                Low-Stock Alerts & Email Diagnostics
                                            </h2>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Configure automated alerts dispatched when stock reaches reorder thresholds.
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] px-2.5 py-1 rounded-md font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                                        Notification Engine
                                    </span>
                                </div>

                                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-3.5">
                                    <div className="pt-0.5">
                                        <input
                                            type="checkbox"
                                            id="low_stock_mail"
                                            checked={Boolean(data.settings['mail.low_stock_email_alerts'])}
                                            onChange={(e) => handleFieldChange('mail.low_stock_email_alerts', e.target.checked)}
                                            className="w-4 h-4 rounded text-red-800 focus:ring-red-500 border-slate-300 cursor-pointer"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label htmlFor="low_stock_mail" className="text-xs font-semibold text-slate-900 cursor-pointer block">
                                            Dispatch Automated Low-Stock Warning Emails
                                        </label>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            When stock is issued and drops to or below the reorder point, immediately sends an alert email.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-1.5 max-w-lg">
                                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                                        Alert Recipient Email (Optional)
                                    </label>
                                    <input
                                        type="email"
                                        value={data.settings['mail.alert_recipient_email'] || ''}
                                        onChange={(e) => handleFieldChange('mail.alert_recipient_email', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-medium text-slate-900 bg-white"
                                        placeholder="spmo-alerts@ucn.edu.ph"
                                    />
                                    <p className="text-[11px] text-slate-500">
                                        Leave blank to notify the current active System Administrator.
                                    </p>
                                </div>

                                {/* Clean SMTP Test Tool */}
                                <div className="mt-6 p-5 rounded-xl bg-slate-900 text-white space-y-4 border border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-800 text-red-400 flex items-center justify-center border border-slate-700">
                                            <Send className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-bold text-white uppercase tracking-wider">SMTP Mail Diagnostic Tool</h3>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                Test outbound mail server connectivity and verify SMTP configuration.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3 pt-1">
                                        <input
                                            type="email"
                                            value={testEmailForm.data.recipient}
                                            onChange={(e) => testEmailForm.setData('recipient', e.target.value)}
                                            placeholder={`Recipient (Default: ${user?.email || 'admin@ucn.edu.ph'})`}
                                            className="flex-1 px-3.5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-colors"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleSendTestEmail}
                                            disabled={testEmailForm.processing}
                                            className="px-4 py-2.5 rounded-lg text-xs font-bold text-white bg-red-800 hover:bg-red-700 active:bg-red-900 shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                                        >
                                            <Send className="w-3.5 h-3.5" />
                                            <span>{testEmailForm.processing ? 'Testing...' : 'Send Test Email'}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 7: OPERATIONS & BACKUP */}
                        {activeTab === 'security' && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 lg:p-7 space-y-6">
                                <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-red-50 text-red-800 flex items-center justify-center border border-red-100">
                                            <ShieldCheck className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-bold text-slate-900 tracking-tight">
                                                Terminal Security & Data Export
                                            </h2>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Terminal timeout duration, policy archive export, and runtime environment telemetry.
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] px-2.5 py-1 rounded-md font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                                        System Telemetry
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                                            Stockroom Terminal Inactivity Auto-Logout <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="5"
                                                max="480"
                                                value={data.settings['security.session_timeout_minutes'] ?? 30}
                                                onChange={(e) => handleFieldChange('security.session_timeout_minutes', parseInt(e.target.value, 10))}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-semibold text-slate-900 bg-white"
                                            />
                                            <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-medium">Minutes</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500">
                                            Locks idle terminals to prevent unauthorized supply transactions.
                                        </p>
                                    </div>

                                    {/* Backup Export */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                                            Database & Policy Snapshot Export
                                        </label>
                                        <a
                                            href={route('system.settings.backup')}
                                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                                        >
                                            <Download className="w-4 h-4 text-red-800" />
                                            <span>Export Snapshot JSON Archive</span>
                                        </a>
                                        <p className="text-[11px] text-slate-500">
                                            Downloads complete policy parameters and operating state as a JSON backup.
                                        </p>
                                    </div>
                                </div>

                                {/* System Telemetry Card */}
                                <div className="mt-4 p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                                        <Server className="w-4 h-4 text-red-800" />
                                        <span>Environment Telemetry</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                        <div className="p-3 bg-white rounded-lg border border-slate-200">
                                            <span className="text-[10px] text-slate-400 uppercase font-mono block">PHP Runtime</span>
                                            <span className="font-bold text-slate-800">{telemetry?.php_version}</span>
                                        </div>
                                        <div className="p-3 bg-white rounded-lg border border-slate-200">
                                            <span className="text-[10px] text-slate-400 uppercase font-mono block">Framework</span>
                                            <span className="font-bold text-slate-800">Laravel {telemetry?.laravel_version}</span>
                                        </div>
                                        <div className="p-3 bg-white rounded-lg border border-slate-200">
                                            <span className="text-[10px] text-slate-400 uppercase font-mono block">DB Driver</span>
                                            <span className="font-bold text-slate-800">{telemetry?.database_driver?.toUpperCase()}</span>
                                        </div>
                                        <div className="p-3 bg-white rounded-lg border border-slate-200">
                                            <span className="text-[10px] text-slate-400 uppercase font-mono block">Active Mode</span>
                                            <span className="font-bold text-red-800 font-mono">{telemetry?.system_mode}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </main>

            {/* STICKY BOTTOM SAVE BAR WHEN DIRTY */}
            {isDirty && (
                <aside aria-label="Unsaved changes alert" className="fixed bottom-6 right-8 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-xl border border-slate-800 flex items-center gap-5 animate-in fade-in slide-in-from-bottom-4">
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
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
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
                <div className="relative bg-white rounded-xl shadow-xl w-full overflow-hidden border border-slate-200 text-center">
                    <div className="h-1.5 w-full bg-emerald-600"></div>
                    <div className="p-6 sm:p-7">
                        <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-emerald-50 text-emerald-600 mb-4 border border-emerald-100">
                            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1.5">{modalSuccessTitle}</h3>
                        <p className="text-xs text-slate-600 mb-6 whitespace-pre-line leading-relaxed">{formSuccessMessage}</p>
                        <button
                            type="button"
                            onClick={() => setShowFormSuccessModal(false)}
                            className="w-full px-4 py-2.5 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 shadow-xs transition-colors cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>

            {/* GLOBAL ERROR MODAL */}
            <Modal show={showFormErrorModal} onClose={() => setShowFormErrorModal(false)} maxWidth="sm">
                <div className="relative bg-white rounded-xl shadow-xl w-full overflow-hidden border border-slate-200 text-center">
                    <div className="h-1.5 w-full bg-red-600"></div>
                    <div className="p-6 sm:p-7">
                        <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-50 text-red-600 mb-4 border border-red-100">
                            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1.5">{modalErrorTitle}</h3>
                        <p className="text-xs text-slate-600 mb-6 whitespace-pre-line leading-relaxed">
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
