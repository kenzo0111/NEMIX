import React, { useState, useEffect } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import Sidebar from '@/Components/Sidebar';
import PageHeader from '@/Components/PageHeader';
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
    Server,
    CheckCircle2,
    AlertCircle
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
            setModalSuccessTitle('Success');
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
            description: 'Configure the official university identity and information used across SPMO documents and generated reports.',
            icon: Building2,
        },
        {
            id: 'signatories',
            label: 'Consumable Signatories',
            description: 'Configure authorized approving, issuing, and certifying personnel across official SPMO forms and ledgers.',
            icon: PenTool,
        },
        {
            id: 'inventory',
            label: 'Stock & Reorder Rules',
            description: 'Define global inventory reorder levels, emergency thresholds, strict negative balance controls, and units of issue.',
            icon: PackageSearch,
        },
        {
            id: 'numbering',
            label: 'Document Sequences',
            description: 'Manage standard numbering prefixes and atomic sequence rules for official university inventory vouchers.',
            icon: Hash,
        },
        {
            id: 'rfid',
            label: 'RFID & Bin Storage',
            description: 'Configure hardware scanner debounce intervals and default operational modes for stockroom shelf tracking.',
            icon: Radio,
        },
        {
            id: 'mail',
            label: 'Email & Notifications',
            description: 'Manage automated low-stock email alert triggers and verify outbound SMTP server connectivity.',
            icon: Mail,
        },
        {
            id: 'security',
            label: 'Operations & Telemetry',
            description: 'Manage terminal security timeouts, export system policy archives, and review runtime environment telemetry.',
            icon: ShieldCheck,
        },
    ];

    const currentTabMeta = tabs.find((t) => t.id === activeTab) || tabs[0];
    const ActiveTabIcon = currentTabMeta.icon;

    return (
        <div className="min-h-screen bg-gray-100/70 flex font-sans text-gray-900 selection:bg-red-900 selection:text-white">
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
                {/* 1. Unified Sticky PageHeader */}
                <PageHeader
                    title="System Settings & Policies"
                    description="Official Supply & Property Management Office configuration and policy parameters."
                    breadcrumbs={[
                        { name: 'Administration & Governance' },
                        { name: 'System Settings' },
                    ]}
                    actions={
                        <div className="flex items-center gap-2">
                            {isDirty && (
                                <button
                                    type="button"
                                    onClick={() => reset()}
                                    disabled={processing}
                                    className="px-3.5 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Reset</span>
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={processing || !isDirty}
                                className={`px-4 py-2 rounded-lg text-xs font-semibold text-white flex items-center gap-2 transition-colors cursor-pointer shadow-xs ${
                                    isDirty
                                        ? 'bg-red-900 hover:bg-red-800 active:bg-red-950 ring-1 ring-red-900'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                                }`}
                            >
                                <Save className="w-4 h-4" />
                                <span>{processing ? 'Saving Changes...' : 'Save Settings'}</span>
                            </button>
                        </div>
                    }
                />

                {/* Main Content Body */}
                <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto pb-24">
                    {/* 2. University Hero Banner (Preserved Identity) */}
                    <div className="bg-red-950 text-white rounded-lg border border-red-900 border-l-4 border-l-amber-400 p-6 lg:p-7 shadow-xs relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 bg-red-800/20 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
                            <div className="max-w-3xl space-y-2.5">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-red-900/90 border border-red-800 text-[11px] font-bold text-amber-300 uppercase tracking-wider font-mono">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                    </span>
                                    Official System Configuration: Active & Enforced
                                </div>
                                <h1 className="text-2xl lg:text-3xl font-bold font-serif leading-tight text-white tracking-tight">
                                    University Supply & Inventory Policy Engine
                                </h1>
                                <p className="text-red-100/90 text-sm font-normal leading-relaxed">
                                    Authorized configuration console for <strong className="text-white">{user?.name}</strong>. Manage institutional letterheads, authorized document signatories, consumable safety reorder thresholds, barcode/RFID debounce delays, and terminal security.
                                </p>
                            </div>

                            <div className="shrink-0 w-full lg:w-auto flex flex-wrap gap-2.5">
                                <a
                                    href={route('system.settings.backup')}
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-400 text-red-950 rounded font-bold text-xs uppercase tracking-wider hover:bg-amber-300 transition-colors shadow-xs border border-amber-300"
                                >
                                    <Download className="w-4 h-4 text-red-950" />
                                    <span>Export Policy Snapshot</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* 3. Settings Navigation (Cleaner University-Style Horizontal Bar) */}
                    <nav
                        aria-label="Settings Categories"
                        className="bg-white rounded-lg border border-gray-200 shadow-xs px-2 sm:px-3 overflow-x-auto scrollbar-none"
                    >
                        <div className="flex items-center gap-1 min-w-max">
                            {tabs.map((tab) => {
                                const IconComponent = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`inline-flex items-center gap-2 px-3.5 py-3 text-xs font-semibold transition-colors border-b-2 cursor-pointer ${
                                            isActive
                                                ? 'border-red-900 text-red-900 bg-red-50/60 font-bold'
                                                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                    >
                                        <IconComponent className={`w-4 h-4 ${isActive ? 'text-red-900' : 'text-gray-400'}`} />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </nav>

                    {/* 4. Active Settings Section Panel */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
                        {/* Institutional Section Header */}
                        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/60 flex items-start sm:items-center gap-3.5">
                            <div className="w-10 h-10 rounded-lg bg-red-100/80 text-red-900 flex items-center justify-center shrink-0 border border-red-200/80">
                                <ActiveTabIcon className="w-5 h-5 text-red-900" />
                            </div>
                            <div>
                                <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight font-serif">
                                    {currentTabMeta.label}
                                </h2>
                                <p className="text-xs text-gray-600 mt-0.5">
                                    {currentTabMeta.description}
                                </p>
                            </div>
                        </div>

                        {/* Form Container */}
                        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-6">
                            {/* SECTION 1: INSTITUTION & BRANDING */}
                            {activeTab === 'institution' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-gray-700 block">
                                                Full Institution Name <span className="text-red-600">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={data.settings['institution.name'] || ''}
                                                onChange={(e) => handleFieldChange('institution.name', e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-900/15 focus:border-red-800 text-sm font-medium text-gray-900 bg-white placeholder:text-gray-400 transition-colors shadow-2xs"
                                                placeholder="University of Camarines Norte"
                                            />
                                            <p className="text-xs text-gray-500">
                                                Official university header title appearing on all generated reports.
                                            </p>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-gray-700 block">
                                                Agency Acronym <span className="text-red-600">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={data.settings['institution.acronym'] || ''}
                                                onChange={(e) => handleFieldChange('institution.acronym', e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-900/15 focus:border-red-800 text-sm font-medium text-gray-900 bg-white placeholder:text-gray-400 transition-colors shadow-2xs"
                                                placeholder="UCN"
                                            />
                                            <p className="text-xs text-gray-500">
                                                Short identification acronym used for bin tags and summary headers.
                                            </p>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-gray-700 block">
                                                Custodial Supply Office <span className="text-red-600">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={data.settings['institution.custodial_office'] || ''}
                                                onChange={(e) => handleFieldChange('institution.custodial_office', e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-900/15 focus:border-red-800 text-sm font-medium text-gray-900 bg-white placeholder:text-gray-400 transition-colors shadow-2xs"
                                                placeholder="Supply & Property Management Office (SPMO)"
                                            />
                                            <p className="text-xs text-gray-500">
                                                Office in primary custody of consumable inventory and issuance.
                                            </p>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-gray-700 block">
                                                Campus / Postal Address <span className="text-red-600">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={data.settings['institution.campus_address'] || ''}
                                                onChange={(e) => handleFieldChange('institution.campus_address', e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-900/15 focus:border-red-800 text-sm font-medium text-gray-900 bg-white placeholder:text-gray-400 transition-colors shadow-2xs"
                                                placeholder="Daet, Camarines Norte"
                                            />
                                            <p className="text-xs text-gray-500">
                                                Physical campus address printed on official compliance reports.
                                            </p>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-gray-700 block">
                                                Responsibility Center Code (RCC)
                                            </label>
                                            <input
                                                type="text"
                                                value={data.settings['institution.responsibility_center_code'] || ''}
                                                onChange={(e) => handleFieldChange('institution.responsibility_center_code', e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-900/15 focus:border-red-800 text-sm font-mono font-medium text-gray-900 bg-white placeholder:text-gray-400 transition-colors shadow-2xs"
                                                placeholder="01-101-00"
                                            />
                                            <p className="text-xs text-gray-500">
                                                Official government accounting station code for SPMO inventory disbursements.
                                            </p>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-gray-700 block">
                                                Institutional Crest / Logo Asset Path
                                            </label>
                                            <input
                                                type="text"
                                                value={data.settings['institution.logo_path'] || ''}
                                                onChange={(e) => handleFieldChange('institution.logo_path', e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-900/15 focus:border-red-800 text-sm font-mono font-medium text-gray-900 bg-white placeholder:text-gray-400 transition-colors shadow-2xs"
                                                placeholder="/images/ucn-crest.png"
                                            />
                                            <p className="text-xs text-gray-500">
                                                Asset path for the official university seal displayed on print forms.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SECTION 2: CONSUMABLE SIGNATORIES */}
                            {activeTab === 'signatories' && (
                                <div className="space-y-6">
                                    {/* 1. RIS Subsection */}
                                    <div className="border border-gray-200 rounded-lg p-5 space-y-4">
                                        <div className="border-b border-gray-200 pb-3">
                                            <h3 className="text-sm font-bold text-gray-900 font-serif">
                                                Requisition & Issue Slip (RIS — Appendix 63)
                                            </h3>
                                            <p className="text-xs text-gray-600 mt-0.5">
                                                Configure authorized approving and issuing personnel appearing on official RIS documents.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-gray-700 block">
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
                                                <label className="text-xs font-semibold text-gray-700 block">
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
                                                <label className="text-xs font-semibold text-gray-700 block">
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
                                                <label className="text-xs font-semibold text-gray-700 block">
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

                                        {/* Simple Institutional OIC Delegation Option Panel */}
                                        <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 mt-2">
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    id="oic_toggle"
                                                    checked={Boolean(data.settings['signatories.ris_oic_active'])}
                                                    onChange={(e) => handleFieldChange('signatories.ris_oic_active', e.target.checked)}
                                                    className="w-4 h-4 mt-0.5 rounded text-red-900 focus:ring-red-800 border-gray-300 cursor-pointer"
                                                />
                                                <div className="flex-1 space-y-1">
                                                    <label htmlFor="oic_toggle" className="text-xs font-semibold text-gray-800 cursor-pointer flex items-center gap-2">
                                                        Enable Officer-in-Charge (OIC) Delegation on RIS Forms
                                                        {Boolean(data.settings['signatories.ris_oic_active']) && (
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-semibold border border-amber-200">
                                                                Delegation Active
                                                            </span>
                                                        )}
                                                    </label>
                                                    <p className="text-xs text-gray-500">
                                                        Prepends designated prefix text to the approving officer name on printed documents.
                                                    </p>
                                                    {Boolean(data.settings['signatories.ris_oic_active']) && (
                                                        <div className="pt-2 max-w-xs">
                                                            <label className="text-xs text-gray-600 block mb-1">Delegation Prefix</label>
                                                            <input
                                                                type="text"
                                                                value={data.settings['signatories.ris_oic_prefix'] || ''}
                                                                onChange={(e) => handleFieldChange('signatories.ris_oic_prefix', e.target.value)}
                                                                className="w-full px-3 py-1.5 rounded-md border border-gray-300 text-xs font-medium bg-white text-gray-900 focus:ring-1 focus:ring-red-900 focus:border-red-800"
                                                                placeholder="OIC, "
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. RSMI Subsection */}
                                    <div className="border border-gray-200 rounded-lg p-5 space-y-4">
                                        <div className="border-b border-gray-200 pb-3">
                                            <h3 className="text-sm font-bold text-gray-900 font-serif">
                                                Report of Supplies & Materials Issued (RSMI — Monthly Summary)
                                            </h3>
                                            <p className="text-xs text-gray-600 mt-0.5">
                                                Configure custodian certification and accounting posting personnel for monthly summary ledgers.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-gray-700 block">
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
                                                <label className="text-xs font-semibold text-gray-700 block">
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
                                                <label className="text-xs font-semibold text-gray-700 block">
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
                                                <label className="text-xs font-semibold text-gray-700 block">
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

                                    {/* 3. RPCI Subsection */}
                                    <div className="border border-gray-200 rounded-lg p-5 space-y-4">
                                        <div className="border-b border-gray-200 pb-3">
                                            <h3 className="text-sm font-bold text-gray-900 font-serif">
                                                Report on the Physical Count of Inventories (RPCI)
                                            </h3>
                                            <p className="text-xs text-gray-600 mt-0.5">
                                                Configure accountable officers and inventory committee heads for annual physical inventory verification.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-gray-700 block">
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
                                                <label className="text-xs font-semibold text-gray-700 block">
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

                                            <div className="space-y-1.5 md:col-span-2">
                                                <label className="text-xs font-semibold text-gray-700 block">
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
                                        </div>
                                    </div>

                                    {/* 4. Stock Card Subsection */}
                                    <div className="border border-gray-200 rounded-lg p-5 space-y-4">
                                        <div className="border-b border-gray-200 pb-3">
                                            <h3 className="text-sm font-bold text-gray-900 font-serif">
                                                Stock Card Custodian
                                            </h3>
                                            <p className="text-xs text-gray-600 mt-0.5">
                                                Configure authorized storekeeper or property custodian responsible for maintaining physical stock cards.
                                            </p>
                                        </div>

                                        <div className="max-w-xl space-y-1.5">
                                            <label className="text-xs font-semibold text-gray-700 block">
                                                Stock Card Storekeeper / Custodian
                                            </label>
                                            <input
                                                type="text"
                                                value={data.settings['signatories.stock_card_custodian'] || ''}
                                                onChange={(e) => handleFieldChange('signatories.stock_card_custodian', e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-900/15 focus:border-red-800 text-sm font-medium text-gray-900 bg-white"
                                                placeholder="Storekeeper / Property Custodian"
                                            />
                                            <p className="text-xs text-gray-500">
                                                Designated officer certified on official stock card entries and ledger balances.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SECTION 3: STOCK & REORDER RULES */}
                            {activeTab === 'inventory' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-gray-700 block">
                                                Global Low-Stock Threshold <span className="text-red-600">*</span>
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
                                                <span className="absolute right-3.5 top-2.5 text-xs text-gray-500 font-medium">Units</span>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                Triggers Low Stock warning when available balance reaches or falls below this point.
                                            </p>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-gray-700 block">
                                                Critical Stock Threshold <span className="text-red-600">*</span>
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
                                                <span className="absolute right-3.5 top-2.5 text-xs text-amber-700 font-medium">Units</span>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                Emergency threshold requiring immediate purchase replenishment.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Strict Balance Issuance Option Panel */}
                                    <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            id="strict_stock"
                                            checked={Boolean(data.settings['inventory.strict_stock_enforcement'])}
                                            onChange={(e) => handleFieldChange('inventory.strict_stock_enforcement', e.target.checked)}
                                            className="w-4 h-4 mt-0.5 rounded text-red-900 focus:ring-red-800 border-gray-300 cursor-pointer"
                                        />
                                        <div className="flex-1">
                                            <label htmlFor="strict_stock" className="text-xs font-semibold text-gray-800 cursor-pointer block">
                                                Strict Stock Balance Enforcement (Prevent Negative Stock)
                                            </label>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                Strictly prevents creating or approving a Requisition & Issue Slip (RIS) if requested quantity exceeds current on-hand balance.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Category Specific Thresholds */}
                                    <div className="space-y-3 pt-2">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-800 block">
                                                Category-Specific Reorder Points
                                            </label>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                Specific reorder limits overriding the global threshold for designated item categories.
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {Object.entries(data.settings['inventory.category_thresholds'] || {}).map(([catName, thresh]: [string, any]) => (
                                                <div key={catName} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                                                    <span className="text-xs font-medium text-gray-800 truncate mr-2">{catName}</span>
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
                                                            className="w-full px-2 py-1 rounded border border-gray-300 text-xs font-semibold text-center bg-white text-gray-900 focus:ring-1 focus:ring-red-900 focus:border-red-800"
                                                        />
                                                        <span className="text-[11px] text-gray-500">units</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Units of Issue */}
                                    <div className="space-y-2 pt-2">
                                        <label className="text-xs font-semibold text-gray-800 block">
                                            Standard Units of Issue
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {(data.settings['inventory.units_of_issue'] || []).map((unit: string, idx: number) => (
                                                <span
                                                    key={idx}
                                                    className="px-2.5 py-1 rounded text-xs font-mono font-medium bg-gray-100 text-gray-700 border border-gray-200"
                                                >
                                                    {unit}
                                                </span>
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Standardized units of measure recognized across SPMO delivery receipts and RIS slips.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* SECTION 4: DOCUMENT SEQUENCES */}
                            {activeTab === 'numbering' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* RIS Sequence */}
                                        <div className="border border-gray-200 rounded-lg p-5 space-y-3.5 bg-white">
                                            <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
                                                <h3 className="text-xs font-bold text-gray-900">
                                                    Requisition & Issue Slip (RIS)
                                                </h3>
                                                <span className="text-[11px] text-gray-500 font-medium">
                                                    Annual Reset
                                                </span>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-gray-700 block">Sequence Prefix</label>
                                                <input
                                                    type="text"
                                                    value={data.settings['numbering.ris_prefix'] || ''}
                                                    onChange={(e) => handleFieldChange('numbering.ris_prefix', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono font-semibold bg-white text-gray-900 focus:ring-2 focus:ring-red-900/15 focus:border-red-800"
                                                    placeholder="RIS-"
                                                />
                                            </div>
                                            <div className="p-3 rounded-lg bg-red-50/40 border border-red-100 text-xs flex items-center justify-between">
                                                <span className="text-gray-600 font-medium">Live Voucher Preview:</span>
                                                <span className="font-mono font-bold text-red-950 text-xs px-2.5 py-1 bg-white rounded border border-red-200">
                                                    {risPrefix}{sampleYear}-{sampleMonth}-0042
                                                </span>
                                            </div>
                                        </div>

                                        {/* RSMI Sequence */}
                                        <div className="border border-gray-200 rounded-lg p-5 space-y-3.5 bg-white">
                                            <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
                                                <h3 className="text-xs font-bold text-gray-900">
                                                    Report of Supplies Issued (RSMI)
                                                </h3>
                                                <span className="text-[11px] text-gray-500 font-medium">
                                                    Monthly Reset
                                                </span>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-gray-700 block">Sequence Prefix</label>
                                                <input
                                                    type="text"
                                                    value={data.settings['numbering.rsmi_prefix'] || ''}
                                                    onChange={(e) => handleFieldChange('numbering.rsmi_prefix', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono font-semibold bg-white text-gray-900 focus:ring-2 focus:ring-red-900/15 focus:border-red-800"
                                                    placeholder="RSMI-"
                                                />
                                            </div>
                                            <div className="p-3 rounded-lg bg-red-50/40 border border-red-100 text-xs flex items-center justify-between">
                                                <span className="text-gray-600 font-medium">Live Voucher Preview:</span>
                                                <span className="font-mono font-bold text-red-950 text-xs px-2.5 py-1 bg-white rounded border border-red-200">
                                                    {rsmiPrefix}{sampleYear}-{sampleMonth}-003
                                                </span>
                                            </div>
                                        </div>

                                        {/* RPCI Sequence */}
                                        <div className="border border-gray-200 rounded-lg p-5 space-y-3.5 bg-white">
                                            <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
                                                <h3 className="text-xs font-bold text-gray-900">
                                                    Physical Count Report (RPCI)
                                                </h3>
                                                <span className="text-[11px] text-gray-500 font-medium">
                                                    Annual Reset
                                                </span>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-gray-700 block">Sequence Prefix</label>
                                                <input
                                                    type="text"
                                                    value={data.settings['numbering.rpci_prefix'] || ''}
                                                    onChange={(e) => handleFieldChange('numbering.rpci_prefix', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono font-semibold bg-white text-gray-900 focus:ring-2 focus:ring-red-900/15 focus:border-red-800"
                                                    placeholder="RPCI-"
                                                />
                                            </div>
                                            <div className="p-3 rounded-lg bg-red-50/40 border border-red-100 text-xs flex items-center justify-between">
                                                <span className="text-gray-600 font-medium">Live Voucher Preview:</span>
                                                <span className="font-mono font-bold text-red-950 text-xs px-2.5 py-1 bg-white rounded border border-red-200">
                                                    {rpciPrefix}{sampleYear}-001
                                                </span>
                                            </div>
                                        </div>

                                        {/* Stock Card Sequence */}
                                        <div className="border border-gray-200 rounded-lg p-5 space-y-3.5 bg-white">
                                            <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
                                                <h3 className="text-xs font-bold text-gray-900">
                                                    Stock Card Code (SKU)
                                                </h3>
                                                <span className="text-[11px] text-gray-500 font-medium">
                                                    Continuous
                                                </span>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-gray-700 block">Sequence Prefix</label>
                                                <input
                                                    type="text"
                                                    value={data.settings['numbering.stock_card_prefix'] || ''}
                                                    onChange={(e) => handleFieldChange('numbering.stock_card_prefix', e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono font-semibold bg-white text-gray-900 focus:ring-2 focus:ring-red-900/15 focus:border-red-800"
                                                    placeholder="STOCK-"
                                                />
                                            </div>
                                            <div className="p-3 rounded-lg bg-red-50/40 border border-red-100 text-xs flex items-center justify-between">
                                                <span className="text-gray-600 font-medium">Live Voucher Preview:</span>
                                                <span className="font-mono font-bold text-red-950 text-xs px-2.5 py-1 bg-white rounded border border-red-200">
                                                    {stockPrefix}00542
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SECTION 5: RFID & BIN STORAGE */}
                            {activeTab === 'rfid' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-gray-700 block">
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
                                                <span className="absolute right-3.5 top-2.5 text-xs text-gray-500 font-medium">Milliseconds</span>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                Prevents duplicate scans when a bin tag lingers near the reader antenna.
                                            </p>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-gray-700 block">
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
                                            <p className="text-xs text-gray-500">
                                                Default operational mode when launching the RFID Scanner terminal.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SECTION 6: EMAIL & NOTIFICATIONS */}
                            {activeTab === 'mail' && (
                                <div className="space-y-6">
                                    {/* Low stock alert toggle */}
                                    <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            id="low_stock_mail"
                                            checked={Boolean(data.settings['mail.low_stock_email_alerts'])}
                                            onChange={(e) => handleFieldChange('mail.low_stock_email_alerts', e.target.checked)}
                                            className="w-4 h-4 mt-0.5 rounded text-red-900 focus:ring-red-800 border-gray-300 cursor-pointer"
                                        />
                                        <div className="flex-1">
                                            <label htmlFor="low_stock_mail" className="text-xs font-semibold text-gray-800 cursor-pointer block">
                                                Dispatch Automated Low-Stock Warning Emails
                                            </label>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                Sends an automated notification to custodial personnel when an item balance drops to or below the reorder threshold.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Recipient email */}
                                    <div className="space-y-1.5 max-w-xl">
                                        <label className="text-xs font-semibold text-gray-700 block">
                                            Alert Recipient Email (Optional)
                                        </label>
                                        <input
                                            type="email"
                                            value={data.settings['mail.alert_recipient_email'] || ''}
                                            onChange={(e) => handleFieldChange('mail.alert_recipient_email', e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-900/15 focus:border-red-800 text-sm font-medium text-gray-900 bg-white"
                                            placeholder="spmo-alerts@ucn.edu.ph"
                                        />
                                        <p className="text-xs text-gray-500">
                                            Leave blank to route alerts to the currently active System Administrator.
                                        </p>
                                    </div>

                                    {/* Institutional SMTP Diagnostic Panel */}
                                    <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-5 space-y-4">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 rounded-md bg-red-100 text-red-900 shrink-0">
                                                <Send className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                                                    SMTP Diagnostic Test
                                                </h3>
                                                <p className="text-xs text-gray-600 mt-0.5">
                                                    Verify outbound mail server connectivity and test automated notification dispatch.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-3 pt-1">
                                            <input
                                                type="email"
                                                value={testEmailForm.data.recipient}
                                                onChange={(e) => testEmailForm.setData('recipient', e.target.value)}
                                                placeholder={`Recipient email (Default: ${user?.email || 'admin@ucn.edu.ph'})`}
                                                className="flex-1 px-3.5 py-2 rounded-lg border border-gray-300 text-xs text-gray-900 bg-white focus:ring-2 focus:ring-red-900/15 focus:border-red-800"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleSendTestEmail}
                                                disabled={testEmailForm.processing}
                                                className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-red-900 hover:bg-red-800 active:bg-red-950 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
                                            >
                                                <Send className="w-3.5 h-3.5" />
                                                <span>{testEmailForm.processing ? 'Testing...' : 'Send Test Email'}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SECTION 7: OPERATIONS & TELEMETRY */}
                            {activeTab === 'security' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-gray-700 block">
                                                Terminal Inactivity Auto-Logout <span className="text-red-600">*</span>
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
                                                <span className="absolute right-3.5 top-2.5 text-xs text-gray-500 font-medium">Minutes</span>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                Automatically locks idle stockroom terminals to safeguard records.
                                            </p>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-gray-700 block">
                                                System Policy Snapshot Export
                                            </label>
                                            <a
                                                href={route('system.settings.backup')}
                                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                                            >
                                                <Download className="w-4 h-4 text-red-900" />
                                                <span>Download Policy Snapshot (JSON)</span>
                                            </a>
                                            <p className="text-xs text-gray-500">
                                                Exports all system configuration parameters and policies as an archival JSON file.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Compact Administrative Telemetry Table */}
                                    <div className="space-y-2 pt-2">
                                        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                                            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                                                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                                                    <Server className="w-3.5 h-3.5 text-red-900" />
                                                    Runtime Environment Telemetry
                                                </span>
                                                {telemetry?.cached_at && (
                                                    <span className="text-[11px] text-gray-500 font-mono">
                                                        Cached: {telemetry.cached_at}
                                                    </span>
                                                )}
                                            </div>
                                            <table className="w-full text-xs text-left">
                                                <tbody className="divide-y divide-gray-200">
                                                    <tr>
                                                        <th className="px-4 py-3 font-medium text-gray-500 w-1/3 bg-gray-50/40">PHP Runtime</th>
                                                        <td className="px-4 py-3 font-semibold text-gray-900 font-mono">{telemetry?.php_version || '8.2'}</td>
                                                    </tr>
                                                    <tr>
                                                        <th className="px-4 py-3 font-medium text-gray-500 bg-gray-50/40">Framework</th>
                                                        <td className="px-4 py-3 font-semibold text-gray-900">Laravel {telemetry?.laravel_version || '11.x'}</td>
                                                    </tr>
                                                    <tr>
                                                        <th className="px-4 py-3 font-medium text-gray-500 bg-gray-50/40">Database Driver</th>
                                                        <td className="px-4 py-3 font-semibold text-gray-900 font-mono">{telemetry?.database_driver?.toUpperCase() || 'POSTGRESQL'}</td>
                                                    </tr>
                                                    <tr>
                                                        <th className="px-4 py-3 font-medium text-gray-500 bg-gray-50/40">Operating Mode</th>
                                                        <td className="px-4 py-3 font-semibold text-red-900 font-mono flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                                                            {telemetry?.system_mode || 'LIVE PRODUCTION'}
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <th className="px-4 py-3 font-medium text-gray-500 bg-gray-50/40">Server Node</th>
                                                        <td className="px-4 py-3 font-semibold text-gray-700 font-mono">{telemetry?.server_node || 'PH-MNL-PRM01'}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Section Bottom Actions */}
                            <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                    {isDirty ? 'You have unsaved changes in this session.' : 'All system policies are up to date.'}
                                </span>
                                <div className="flex items-center gap-2.5">
                                    {isDirty && (
                                        <button
                                            type="button"
                                            onClick={() => reset()}
                                            disabled={processing}
                                            className="px-3.5 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                        >
                                            Discard Changes
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={processing || !isDirty}
                                        className={`px-4 py-2 rounded-lg text-xs font-semibold text-white flex items-center gap-2 transition-colors cursor-pointer shadow-xs ${
                                            isDirty
                                                ? 'bg-red-900 hover:bg-red-800 active:bg-red-950'
                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                                        }`}
                                    >
                                        <Save className="w-4 h-4" />
                                        <span>{processing ? 'Saving...' : 'Save Settings'}</span>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </main>

            {/* 6. Compact Sticky Save Bar when Dirty */}
            {isDirty && (
                <aside
                    aria-label="Unsaved changes alert"
                    className="fixed bottom-6 right-8 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-lg shadow-lg border border-gray-800 flex items-center gap-4 text-xs animate-in fade-in"
                >
                    <div className="flex items-center gap-2 font-medium">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        <span>Unsaved changes</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => reset()}
                            disabled={processing}
                            className="px-2.5 py-1 text-xs text-gray-300 hover:text-white hover:bg-gray-800 rounded transition-colors cursor-pointer"
                        >
                            Discard
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSubmit()}
                            disabled={processing}
                            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-900 hover:bg-red-800 active:bg-red-950 rounded transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        >
                            <Save className="w-3.5 h-3.5" />
                            <span>{processing ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                    </div>
                </aside>
            )}

            {/* Global Success Modal */}
            <Modal show={showFormSuccessModal} onClose={() => setShowFormSuccessModal(false)} maxWidth="sm">
                <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200 text-center">
                    <div className="h-1.5 w-full bg-emerald-700"></div>
                    <div className="p-6">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-50 text-emerald-700 mb-3 border border-emerald-100">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-1 font-serif">{modalSuccessTitle}</h3>
                        <p className="text-xs text-gray-600 mb-5 whitespace-pre-line leading-relaxed">{formSuccessMessage}</p>
                        <button
                            type="button"
                            onClick={() => setShowFormSuccessModal(false)}
                            className="w-full px-4 py-2 rounded-lg text-xs font-semibold text-white bg-gray-900 hover:bg-gray-800 active:bg-gray-950 transition-colors cursor-pointer"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Global Error Modal */}
            <Modal show={showFormErrorModal} onClose={() => setShowFormErrorModal(false)} maxWidth="sm">
                <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200 text-center">
                    <div className="h-1.5 w-full bg-red-700"></div>
                    <div className="p-6">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-50 text-red-700 mb-3 border border-red-100">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-1 font-serif">{modalErrorTitle}</h3>
                        <p className="text-xs text-gray-600 mb-5 whitespace-pre-line leading-relaxed">
                            {formErrorMessage || 'Please check the form for completeness or errors and try again.'}
                        </p>
                        <button
                            type="button"
                            onClick={() => setShowFormErrorModal(false)}
                            className="w-full px-4 py-2 rounded-lg text-xs font-semibold text-white bg-red-900 hover:bg-red-800 active:bg-red-950 transition-colors cursor-pointer"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
