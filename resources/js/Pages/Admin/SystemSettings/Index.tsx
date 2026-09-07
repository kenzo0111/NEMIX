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
                <header className="sticky top-0 z-40 shadow-xs bg-white border-b border-slate-200">
                    {/* Operating Mode Banner */}
                    {systemMode !== 'LIVE PRODUCTION' && (
                        <div
                            className={`px-6 py-1.5 text-xs font-mono font-bold text-center flex items-center justify-center gap-2 shadow-xs border-b ${
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

                    {/* Page Sub-Header */}
                    <div className="px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-800 to-red-950 text-amber-400 flex items-center justify-center shadow-md shadow-red-950/20 border border-red-800/60">
                                <Sliders className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-extrabold text-slate-900 font-serif tracking-tight">
                                        System Settings & Policies
                                    </h1>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                                        Consumables Only
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Configure institutional branding, official signatories, stock reorder thresholds, and document numbering for RIS, RSMI, RPCI, and Stock Cards.
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <SystemModeBadge />
                            {isDirty && (
                                <button
                                    type="button"
                                    onClick={() => reset()}
                                    disabled={processing}
                                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Reset Changes</span>
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={processing || !isDirty}
                                className={`px-5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-md transition-all cursor-pointer ${
                                    isDirty
                                        ? 'bg-red-800 hover:bg-red-900 active:bg-red-950 shadow-red-950/20'
                                        : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                                }`}
                            >
                                <Save className="w-4 h-4" />
                                <span>{processing ? 'Saving Changes...' : 'Save All Settings'}</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content Body */}
                <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
                    {/* Breadcrumbs */}
                    <Breadcrumbs
                        items={[
                            { name: 'Administration & Governance' },
                            { name: 'System Settings' },
                        ]}
                    />

                    {/* Operational Scope Notice */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-900 leading-relaxed">
                            <span className="font-bold">Consumables Inventory Engine:</span> This administrative console applies exclusively to <strong>Consumable Supplies & Materials</strong> (office supplies, bond paper, inks/toners, janitorial chemicals, and lab consumables). Official document sequences and signatories are strictly mapped to the 4 active consumable reports: <strong>Requisition and Issue Slip (RIS)</strong>, <strong>Report of Supplies and Materials Issued (RSMI)</strong>, <strong>Report on the Physical Count of Inventories (RPCI)</strong>, and <strong>Stock Card</strong>.
                        </div>
                    </div>

                    {/* Navigation Tabs Bar */}
                    <div className="bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-xs flex flex-wrap gap-1">
                        {tabs.map((tab) => {
                            const IconComponent = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        isActive
                                            ? 'bg-red-950 text-amber-400 shadow-md shadow-red-950/20'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                                    }`}
                                >
                                    <IconComponent className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                                    <span>{tab.label}</span>
                                    <span
                                        className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                                            isActive ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-100 text-slate-500'
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
                            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 lg:p-8 space-y-6">
                                <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
                                            <Building2 className="w-5 h-5 text-red-800" />
                                            <span>Institutional Profile & Printable Branding</span>
                                        </h2>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Controls agency headers, campus stationing, and institutional crests rendered on all consumable forms.
                                        </p>
                                    </div>
                                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                                        Public Form Header
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <span>Full Institution Name</span>
                                            <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.settings['institution.name'] || ''}
                                            onChange={(e) => handleFieldChange('institution.name', e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-medium text-slate-900"
                                            placeholder="University of Camarines Norte"
                                        />
                                        <p className="text-[11px] text-slate-400">
                                            Printed atop RIS, RSMI, RPCI, and Stock Cards. Replaces all legacy hardcoded college strings.
                                        </p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <span>Agency Acronym</span>
                                            <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.settings['institution.acronym'] || ''}
                                            onChange={(e) => handleFieldChange('institution.acronym', e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-medium text-slate-900"
                                            placeholder="UCN"
                                        />
                                        <p className="text-[11px] text-slate-400">
                                            Short identification acronym (e.g. UCN) used for stock bin tags and summary headers.
                                        </p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <span>Custodial Supply Office</span>
                                            <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.settings['institution.custodial_office'] || ''}
                                            onChange={(e) => handleFieldChange('institution.custodial_office', e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-medium text-slate-900"
                                            placeholder="Supply & Property Management Office (SPMO)"
                                        />
                                        <p className="text-[11px] text-slate-400">
                                            Department in custody of consumable inventory and issuance.
                                        </p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <span>Campus / Postal Address</span>
                                            <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.settings['institution.campus_address'] || ''}
                                            onChange={(e) => handleFieldChange('institution.campus_address', e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-medium text-slate-900"
                                            placeholder="Daet, Camarines Norte"
                                        />
                                        <p className="text-[11px] text-slate-400">
                                            Physical campus address printed on official compliance reports.
                                        </p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <span>Responsibility Center Code (RCC)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.settings['institution.responsibility_center_code'] || ''}
                                            onChange={(e) => handleFieldChange('institution.responsibility_center_code', e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-medium text-slate-900 font-mono"
                                            placeholder="01-101-00"
                                        />
                                        <p className="text-[11px] text-slate-400">
                                            Official government accounting station code for SPMO inventory disbursements.
                                        </p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <span>Institutional Crest / Logo Asset Path</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.settings['institution.logo_path'] || ''}
                                            onChange={(e) => handleFieldChange('institution.logo_path', e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-medium text-slate-900 font-mono"
                                            placeholder="/images/ucn-crest.png"
                                        />
                                        <p className="text-[11px] text-slate-400">
                                            Asset URL for the official university seal displayed on print forms.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: CONSUMABLE SIGNATORIES */}
                        {activeTab === 'signatories' && (
                            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 lg:p-8 space-y-8">
                                <div className="border-b border-slate-100 pb-4">
                                    <h2 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
                                        <PenTool className="w-5 h-5 text-red-800" />
                                        <span>Consumable Document Signatories & Delegation</span>
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Configure accountable officers and designations for RIS, RSMI, RPCI, and Stock Cards. Eliminates all hardcoded personnel names.
                                    </p>
                                </div>

                                {/* 1. REQUISITION & ISSUE SLIP (RIS) */}
                                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-red-800"></span>
                                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                                                Requisition & Issue Slip (RIS — Appendix 63)
                                            </h3>
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
                                            Issuance Authorization
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                RIS Approving Officer Name
                                            </label>
                                            <input
                                                type="text"
                                                value={data.settings['signatories.ris_approved_by_name'] || ''}
                                                onChange={(e) => handleFieldChange('signatories.ris_approved_by_name', e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-medium text-slate-900"
                                                placeholder="ARSENIO GEM A. GARCILLANOSA"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                RIS Approving Officer Designation
                                            </label>
                                            <input
                                                type="text"
                                                value={data.settings['signatories.ris_approved_by_designation'] || ''}
                                                onChange={(e) => handleFieldChange('signatories.ris_approved_by_designation', e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-medium text-slate-900"
                                                placeholder="SUPPLY OFFICER III/ADMIN OFFICER V"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                RIS Issuing Custodian / Storekeeper Name
                                            </label>
                                            <input
                                                type="text"
                                                value={data.settings['signatories.ris_issued_by_name'] || ''}
                                                onChange={(e) => handleFieldChange('signatories.ris_issued_by_name', e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-medium text-slate-900"
                                                placeholder="Supply Custodian / Storekeeper"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                RIS Issuing Custodian Designation
                                            </label>
                                            <input
                                                type="text"
                                                value={data.settings['signatories.ris_issued_by_designation'] || ''}
                                                onChange={(e) => handleFieldChange('signatories.ris_issued_by_designation', e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-medium text-slate-900"
                                                placeholder="Administrative Aide VI / Storekeeper"
                                            />
                                        </div>
                                    </div>

                                    {/* OIC / Officer-in-Charge Delegation Toggle */}
                                    <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-4 mt-2">
                                        <div className="pt-0.5">
                                            <input
                                                type="checkbox"
                                                id="oic_toggle"
                                                checked={Boolean(data.settings['signatories.ris_oic_active'])}
                                                onChange={(e) => handleFieldChange('signatories.ris_oic_active', e.target.checked)}
                                                className="w-4 h-4 rounded text-red-800 focus:ring-red-500 border-slate-300 cursor-pointer"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <label htmlFor="oic_toggle" className="text-xs font-bold text-amber-950 cursor-pointer flex items-center gap-2">
                                                <span>Enable Officer-in-Charge (OIC) Delegation on RIS Forms</span>
                                                {Boolean(data.settings['signatories.ris_oic_active']) && (
                                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-bold uppercase">
                                                        Active
                                                    </span>
                                                )}
                                            </label>
                                            <p className="text-[11px] text-amber-800/90 leading-normal">
                                                When checked, automatically prepends the OIC prefix text (e.g. <em>"OIC, "</em>) to the approved signatory without permanently altering baseline profile records.
                                            </p>
                                            {Boolean(data.settings['signatories.ris_oic_active']) && (
                                                <div className="pt-1 max-w-sm">
                                                    <input
                                                        type="text"
                                                        value={data.settings['signatories.ris_oic_prefix'] || ''}
                                                        onChange={(e) => handleFieldChange('signatories.ris_oic_prefix', e.target.value)}
                                                        className="w-full px-3 py-1.5 rounded-lg border border-amber-300 text-xs font-semibold bg-white text-slate-900"
                                                        placeholder="OIC, "
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 2. REPORT OF SUPPLIES ISSUED (RSMI) */}
                                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-red-800"></span>
                                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                                                Report of Supplies & Materials Issued (RSMI — Monthly Summary)
                                            </h3>
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                                            Accounting Ledger
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                Certified Correct By (Supply Custodian)
                                            </label>
                                            <input
                                                type="text"
                                                value={data.settings['signatories.rsmi_certified_by_name'] || ''}
                                                onChange={(e) => handleFieldChange('signatories.rsmi_certified_by_name', e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-medium text-slate-900"
                                                placeholder="ARSENIO GEM A. GARCILLANOSA"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                Certification Position / Designation
                                            </label>
                                            <input
                                                type="text"
                                                value={data.settings['signatories.rsmi_certified_by_designation'] || ''}
                                                onChange={(e) => handleFieldChange('signatories.rsmi_certified_by_designation', e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-medium text-slate-900"
                                                placeholder="Supply Officer III / SPMO Head"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                Posted By (Accounting Representative)
                                            </label>
                                            <input
                                                type="text"
                                                value={data.settings['signatories.rsmi_posted_by_name'] || ''}
                                                onChange={(e) => handleFieldChange('signatories.rsmi_posted_by_name', e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-medium text-slate-900"
                                                placeholder="Accounting Bookkeeper"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                Accounting Posted Designation
                                            </label>
                                            <input
                                                type="text"
                                                value={data.settings['signatories.rsmi_posted_by_designation'] || ''}
                                                onChange={(e) => handleFieldChange('signatories.rsmi_posted_by_designation', e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-medium text-slate-900"
                                                placeholder="Administrative Officer IV"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 3. PHYSICAL COUNT OF INVENTORIES (RPCI) & STOCK CARD */}
                                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-red-800"></span>
                                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                                                Physical Count (RPCI) & Stock Card Custodians
                                            </h3>
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                                            Annual Count & Cards
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                RPCI Accountable Officer Name
                                            </label>
                                            <input
                                                type="text"
                                                value={data.settings['signatories.rpci_accountable_officer_name'] || ''}
                                                onChange={(e) => handleFieldChange('signatories.rpci_accountable_officer_name', e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-medium text-slate-900"
                                                placeholder="Arsenio Gem A. Garcillanosa"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                RPCI Accountable Officer Designation
                                            </label>
                                            <input
                                                type="text"
                                                value={data.settings['signatories.rpci_accountable_officer_designation'] || ''}
                                                onChange={(e) => handleFieldChange('signatories.rpci_accountable_officer_designation', e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-medium text-slate-900"
                                                placeholder="Supply Custodian / Supply Officer III"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                Inventory Committee Chairman
                                            </label>
                                            <input
                                                type="text"
                                                value={data.settings['signatories.rpci_committee_chair'] || ''}
                                                onChange={(e) => handleFieldChange('signatories.rpci_committee_chair', e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-medium text-slate-900"
                                                placeholder="Inspection Committee Chairman"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                Stock Card Storekeeper / Custodian
                                            </label>
                                            <input
                                                type="text"
                                                value={data.settings['signatories.stock_card_custodian'] || ''}
                                                onChange={(e) => handleFieldChange('signatories.stock_card_custodian', e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-medium text-slate-900"
                                                placeholder="Storekeeper / Property Custodian"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: STOCK & REORDER POLICIES */}
                        {activeTab === 'inventory' && (
                            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 lg:p-8 space-y-6">
                                <div className="border-b border-slate-100 pb-4">
                                    <h2 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
                                        <PackageSearch className="w-5 h-5 text-red-800" />
                                        <span>Consumable Stock Reorder Points & Classifications</span>
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Define minimum inventory levels, strict issuance enforcement, and standardized consumable measurement units.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <span>Global Low-Stock Reorder Threshold</span>
                                            <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="1"
                                                max="1000"
                                                value={data.settings['inventory.low_stock_threshold'] ?? 10}
                                                onChange={(e) => handleFieldChange('inventory.low_stock_threshold', parseInt(e.target.value, 10))}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-bold text-slate-900"
                                            />
                                            <span className="absolute right-4 top-2.5 text-xs text-slate-400 font-semibold">Units</span>
                                        </div>
                                        <p className="text-[11px] text-slate-400">
                                            When stock falls to or below this count, the item status changes to <strong>Low Stock</strong>.
                                        </p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <span>Critical Red-Alert Threshold</span>
                                            <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={data.settings['inventory.critical_stock_threshold'] ?? 3}
                                                onChange={(e) => handleFieldChange('inventory.critical_stock_threshold', parseInt(e.target.value, 10))}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-bold text-slate-900"
                                            />
                                            <span className="absolute right-4 top-2.5 text-xs text-slate-400 font-semibold">Units</span>
                                        </div>
                                        <p className="text-[11px] text-slate-400">
                                            Emergency threshold requiring immediate purchase replenishment.
                                        </p>
                                    </div>
                                </div>

                                {/* Strict Balance Issuance Toggle */}
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-4">
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
                                        <label htmlFor="strict_stock" className="text-xs font-bold text-slate-900 cursor-pointer block">
                                            Strict Stock Balance Enforcement (Prevent Negative Stock)
                                        </label>
                                        <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                                            When enabled, the system strictly forbids creating a Requisition & Issue Slip (RIS) if requested quantity exceeds current available on-hand stock.
                                        </p>
                                    </div>
                                </div>

                                {/* Category Specific Thresholds */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                        Category-Specific Reorder Points (Overrides Global Default)
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {Object.entries(data.settings['inventory.category_thresholds'] || {}).map(([catName, thresh]: [string, any]) => (
                                            <div key={catName} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                                                <span className="text-xs font-semibold text-slate-700 truncate mr-2">{catName}</span>
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
                                                        className="w-full px-2 py-1 rounded-lg border border-slate-300 text-xs font-bold text-center bg-white"
                                                    />
                                                    <span className="text-[10px] text-slate-400">units</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Units of Issue */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                        Standard Consumable Units of Issue
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {(data.settings['inventory.units_of_issue'] || []).map((unit: string, idx: number) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-900 border border-red-200"
                                            >
                                                {unit}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-[11px] text-slate-400">
                                        Standardized measurement units for consumable stock: piece, box, ream, pack, roll, bottle, gallon, liter, tube, pad, set.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* TAB 4: DOCUMENT NUMBERING */}
                        {activeTab === 'numbering' && (
                            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 lg:p-8 space-y-6">
                                <div className="border-b border-slate-100 pb-4">
                                    <h2 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
                                        <Hash className="w-5 h-5 text-red-800" />
                                        <span>Consumable Document Reference Sequences</span>
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Configure server-side numbering prefixes and atomic sequences for the 4 active consumable forms.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* RIS */}
                                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-800 uppercase">Requisition & Issue Slip (RIS)</span>
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold">Annual Reset</span>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[11px] text-slate-500 font-medium">Prefix</label>
                                            <input
                                                type="text"
                                                value={data.settings['numbering.ris_prefix'] || ''}
                                                onChange={(e) => handleFieldChange('numbering.ris_prefix', e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold bg-white"
                                                placeholder="RIS-"
                                            />
                                        </div>
                                        <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs flex items-center justify-between">
                                            <span className="text-slate-500">Live Preview:</span>
                                            <span className="font-mono font-extrabold text-red-800">
                                                {risPrefix}{sampleYear}-{sampleMonth}-0042
                                            </span>
                                        </div>
                                    </div>

                                    {/* RSMI */}
                                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-800 uppercase">Report of Supplies Issued (RSMI)</span>
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">Monthly Reset</span>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[11px] text-slate-500 font-medium">Prefix</label>
                                            <input
                                                type="text"
                                                value={data.settings['numbering.rsmi_prefix'] || ''}
                                                onChange={(e) => handleFieldChange('numbering.rsmi_prefix', e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold bg-white"
                                                placeholder="RSMI-"
                                            />
                                        </div>
                                        <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs flex items-center justify-between">
                                            <span className="text-slate-500">Live Preview:</span>
                                            <span className="font-mono font-extrabold text-blue-800">
                                                {rsmiPrefix}{sampleYear}-{sampleMonth}-003
                                            </span>
                                        </div>
                                    </div>

                                    {/* RPCI */}
                                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-800 uppercase">Physical Count Report (RPCI)</span>
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">Annual Reset</span>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[11px] text-slate-500 font-medium">Prefix</label>
                                            <input
                                                type="text"
                                                value={data.settings['numbering.rpci_prefix'] || ''}
                                                onChange={(e) => handleFieldChange('numbering.rpci_prefix', e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold bg-white"
                                                placeholder="RPCI-"
                                            />
                                        </div>
                                        <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs flex items-center justify-between">
                                            <span className="text-slate-500">Live Preview:</span>
                                            <span className="font-mono font-extrabold text-purple-800">
                                                {rpciPrefix}{sampleYear}-001
                                            </span>
                                        </div>
                                    </div>

                                    {/* Stock Card Code */}
                                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-800 uppercase">Stock Card Code (SKU)</span>
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">Continuous</span>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[11px] text-slate-500 font-medium">Prefix</label>
                                            <input
                                                type="text"
                                                value={data.settings['numbering.stock_card_prefix'] || ''}
                                                onChange={(e) => handleFieldChange('numbering.stock_card_prefix', e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold bg-white"
                                                placeholder="STOCK-"
                                            />
                                        </div>
                                        <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs flex items-center justify-between">
                                            <span className="text-slate-500">Live Preview:</span>
                                            <span className="font-mono font-extrabold text-emerald-800">
                                                {stockPrefix}00542
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 5: RFID & BIN STORAGE */}
                        {activeTab === 'rfid' && (
                            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 lg:p-8 space-y-6">
                                <div className="border-b border-slate-100 pb-4">
                                    <h2 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
                                        <Radio className="w-5 h-5 text-red-800" />
                                        <span>Consumables Storage & Bin RFID Configuration</span>
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Tune hardware scanner parameters for tracking consumable shelf bins, racks, and bulk supply packs.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <span>Scan Cooldown / Debounce Delay (ms)</span>
                                            <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="300"
                                                max="10000"
                                                step="100"
                                                value={data.settings['rfid.scan_debounce_ms'] ?? 1200}
                                                onChange={(e) => handleFieldChange('rfid.scan_debounce_ms', parseInt(e.target.value, 10))}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-bold text-slate-900"
                                            />
                                            <span className="absolute right-4 top-2.5 text-xs text-slate-400 font-semibold">Milliseconds</span>
                                        </div>
                                        <p className="text-[11px] text-slate-400">
                                            Prevents accidental multi-reads when a consumable shelf bin or box tag lingers near reader antenna.
                                        </p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <span>Default Stockroom RFID Mode</span>
                                            <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={data.settings['rfid.active_mode'] || 'bin_association'}
                                            onChange={(e) => handleFieldChange('rfid.active_mode', e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-semibold text-slate-900 bg-white"
                                        >
                                            <option value="bin_association">Bin / Shelf Tag Association Mode</option>
                                            <option value="issuance_verification">Consumable Issuance Verification Mode</option>
                                            <option value="rpci_stocktake">RPCI Physical Inventory Stocktaking Mode</option>
                                        </select>
                                        <p className="text-[11px] text-slate-400">
                                            Default operational mode when opening the RFID Scanner module.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 6: EMAIL & NOTIFICATIONS */}
                        {activeTab === 'mail' && (
                            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 lg:p-8 space-y-6">
                                <div className="border-b border-slate-100 pb-4">
                                    <h2 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
                                        <Mail className="w-5 h-5 text-red-800" />
                                        <span>Consumables Low-Stock Alerts & Mail Diagnostics</span>
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Configure automatic email alerts sent to SPMO supply officers when consumable inventory dips below reorder thresholds.
                                    </p>
                                </div>

                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-4">
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
                                        <label htmlFor="low_stock_mail" className="text-xs font-bold text-slate-900 cursor-pointer block">
                                            Dispatch Automated Low-Stock Warning Emails
                                        </label>
                                        <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                                            When stock is issued and drops to or below the reorder point, immediately dispatches an alert email to designated supply personnel.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-1.5 max-w-lg">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <span>Alert Recipient Email (Optional)</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={data.settings['mail.alert_recipient_email'] || ''}
                                        onChange={(e) => handleFieldChange('mail.alert_recipient_email', e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-medium text-slate-900"
                                        placeholder="spmo-alerts@ucn.edu.ph"
                                    />
                                    <p className="text-[11px] text-slate-400">
                                        Leave empty to notify the current active System Administrator.
                                    </p>
                                </div>

                                {/* Interactive SMTP Test Tool */}
                                <div className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-red-950 to-slate-950 text-white space-y-4 border border-red-900/60 shadow-md">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center">
                                            <Send className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white font-serif">In-Browser SMTP Mail Diagnostic Tool</h3>
                                            <p className="text-xs text-red-200/80 mt-0.5">
                                                Test outgoing email connectivity without manual console commands.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3 pt-1">
                                        <input
                                            type="email"
                                            value={testEmailForm.data.recipient}
                                            onChange={(e) => testEmailForm.setData('recipient', e.target.value)}
                                            placeholder={`Test recipient (Default: ${user?.email || 'admin@ucn.edu.ph'})`}
                                            className="flex-1 px-4 py-2 rounded-xl bg-white/10 border border-red-800 text-white placeholder-red-300/50 text-xs focus:ring-2 focus:ring-amber-400/30"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleSendTestEmail}
                                            disabled={testEmailForm.processing}
                                            className="px-5 py-2 rounded-xl text-xs font-bold text-red-950 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 active:scale-95 shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                                        >
                                            <Send className="w-3.5 h-3.5" />
                                            <span>{testEmailForm.processing ? 'Testing Connection...' : 'Send Diagnostic Test'}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 7: OPERATIONS & BACKUP */}
                        {activeTab === 'security' && (
                            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 lg:p-8 space-y-6">
                                <div className="border-b border-slate-100 pb-4">
                                    <h2 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
                                        <ShieldCheck className="w-5 h-5 text-red-800" />
                                        <span>Stockroom Terminal Security & Disaster Recovery</span>
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Terminal auto-logout duration, live system telemetry, and manual database export.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <span>Stockroom Inactivity Auto-Logout</span>
                                            <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="5"
                                                max="480"
                                                value={data.settings['security.session_timeout_minutes'] ?? 30}
                                                onChange={(e) => handleFieldChange('security.session_timeout_minutes', parseInt(e.target.value, 10))}
                                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-sm font-bold text-slate-900"
                                            />
                                            <span className="absolute right-4 top-2.5 text-xs text-slate-400 font-semibold">Minutes</span>
                                        </div>
                                        <p className="text-[11px] text-slate-400">
                                            Locks idle warehouse terminals to prevent unauthorized supply issuance.
                                        </p>
                                    </div>

                                    {/* One-Click Backup Export */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                            Database & Policy Snapshot Export
                                        </label>
                                        <a
                                            href={route('system.settings.backup')}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                                        >
                                            <Download className="w-4 h-4 text-red-800" />
                                            <span>Export Snapshot JSON Archive</span>
                                        </a>
                                        <p className="text-[11px] text-slate-400">
                                            Exports consumable policy parameters and operating state as a downloadable JSON backup.
                                        </p>
                                    </div>
                                </div>

                                {/* System Telemetry Card */}
                                <div className="mt-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                                        <Server className="w-4 h-4 text-red-800" />
                                        <span>Environment Telemetry</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                                        <div className="p-3 bg-white rounded-xl border border-slate-200">
                                            <span className="text-[10px] text-slate-400 uppercase font-mono block">PHP Runtime</span>
                                            <span className="font-bold text-slate-800">{telemetry?.php_version}</span>
                                        </div>
                                        <div className="p-3 bg-white rounded-xl border border-slate-200">
                                            <span className="text-[10px] text-slate-400 uppercase font-mono block">Framework</span>
                                            <span className="font-bold text-slate-800">Laravel {telemetry?.laravel_version}</span>
                                        </div>
                                        <div className="p-3 bg-white rounded-xl border border-slate-200">
                                            <span className="text-[10px] text-slate-400 uppercase font-mono block">DB Driver</span>
                                            <span className="font-bold text-slate-800">{telemetry?.database_driver?.toUpperCase()}</span>
                                        </div>
                                        <div className="p-3 bg-white rounded-xl border border-slate-200">
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
                <aside aria-label="Unsaved changes alert" className="fixed bottom-6 right-8 z-50 bg-gradient-to-r from-red-950 to-slate-900 text-white backdrop-blur-md px-6 py-4 rounded-2xl shadow-2xl border border-amber-500/30 flex items-center gap-6 animate-in fade-in slide-in-from-bottom-5">
                    <div className="flex items-center gap-3">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400"></span>
                        </span>
                        <div>
                            <p className="text-xs font-bold text-amber-300">Unsaved Policy Changes</p>
                            <p className="text-[11px] text-slate-300">You have modified system settings. Save your changes to apply them live.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => reset()}
                            disabled={processing}
                            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        >
                            Discard
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSubmit()}
                            disabled={processing}
                            className="px-5 py-2 rounded-xl text-xs font-bold text-red-950 bg-gradient-to-r from-yellow-400 via-amber-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 active:scale-95 shadow-lg shadow-amber-950/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            <span>{processing ? 'Saving...' : 'Save All Settings'}</span>
                        </button>
                    </div>
                </aside>
            )}

            {/* GLOBAL SUCCESS MODAL */}
            <Modal show={showFormSuccessModal} onClose={() => setShowFormSuccessModal(false)} maxWidth="sm">
                <div className="relative bg-white rounded-2xl shadow-2xl w-full overflow-hidden border border-green-100 text-center">
                    <div className="h-2 w-full bg-gradient-to-r from-green-500 via-emerald-500 to-green-600"></div>
                    <div className="p-8">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{modalSuccessTitle}</h3>
                        <p className="text-sm text-gray-500 mb-8 whitespace-pre-line leading-relaxed">{formSuccessMessage}</p>
                        <button
                            type="button"
                            onClick={() => setShowFormSuccessModal(false)}
                            className="w-full px-5 py-3 rounded-xl text-sm font-bold text-white bg-green-600 hover:bg-green-700 active:bg-green-800 shadow-md focus:outline-none transition-all cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>

            {/* GLOBAL ERROR MODAL */}
            <Modal show={showFormErrorModal} onClose={() => setShowFormErrorModal(false)} maxWidth="sm">
                <div className="relative bg-white rounded-2xl shadow-2xl w-full overflow-hidden border border-red-100 text-center">
                    <div className="h-2 w-full bg-gradient-to-r from-red-500 via-rose-500 to-red-600"></div>
                    <div className="p-8">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{modalErrorTitle}</h3>
                        <p className="text-sm text-gray-500 mb-8 whitespace-pre-line leading-relaxed">
                            {formErrorMessage || 'Please check the form for completeness or errors and try again.'}
                        </p>
                        <button
                            type="button"
                            onClick={() => setShowFormErrorModal(false)}
                            className="w-full px-5 py-3 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 shadow-md focus:outline-none transition-all cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
