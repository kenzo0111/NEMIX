import React, { FormEventHandler } from 'react';
import { useForm, usePage, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import { UserProfileDetails } from '../types';
import {
    User,
    Mail,
    AlertCircle,
    Info,
    Save,
    RotateCcw,
    CheckCircle2,
    Building2,
    Shield,
    Lock,
    Clock,
    FileText,
} from 'lucide-react';

interface Props {
    profile: UserProfileDetails;
    mustVerifyEmail: boolean;
    status?: string;
    className?: string;
}

export default function UpdateProfileInformationCard({
    profile,
    mustVerifyEmail,
    status,
    className = '',
}: Props) {
    const { auth } = usePage<PageProps>().props;
    const currentUser = profile || auth.user;

    const {
        data,
        setData,
        patch,
        errors,
        processing,
        recentlySuccessful,
        reset,
        isDirty,
        clearErrors,
    } = useForm({
        name: currentUser.name || '',
        email: currentUser.email || '',
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('profile.update'), {
            preserveScroll: true,
        });
    };

    const handleCancel = () => {
        reset();
        clearErrors();
    };

    const formattedId = `EMP-${String(currentUser.id || 1).padStart(4, '0')}`;
    const isVerified = Boolean(currentUser.email_verified_at);

    return (
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${className}`}>
            {/* Left Column: Official Personnel Dossier Card */}
            <div className="lg:col-span-4 space-y-6">
                <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-red-900" />
                            <h3 className="text-xs font-bold font-serif text-slate-900 uppercase tracking-wider">
                                Personnel Dossier
                            </h3>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200/70 text-slate-700 font-semibold">
                            {formattedId}
                        </span>
                    </div>

                    <div className="p-5 space-y-4 text-xs">
                        {/* Unit / Office */}
                        <div className="space-y-1">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                                Office Assignment
                            </span>
                            <div className="flex items-center gap-2 text-slate-800 font-medium">
                                <Building2 className="w-4 h-4 text-red-900 shrink-0" />
                                <span>Supply & Property Management Office</span>
                            </div>
                        </div>

                        {/* Official Role */}
                        <div className="space-y-1 pt-3 border-t border-slate-100">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                                Primary Role & Clearance
                            </span>
                            <div className="flex items-center gap-2 text-slate-800 font-medium">
                                <Shield className="w-4 h-4 text-red-900 shrink-0" />
                                <span>{currentUser.role}</span>
                            </div>
                        </div>

                        {/* Account Verification */}
                        <div className="space-y-1 pt-3 border-t border-slate-100">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                                Verification Status
                            </span>
                            <div className="flex items-center gap-2 font-medium">
                                {isVerified ? (
                                    <span className="inline-flex items-center gap-1.5 text-emerald-700">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        <span>Institutional Email Confirmed</span>
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 text-amber-700">
                                        <AlertCircle className="w-4 h-4 text-amber-600" />
                                        <span>Awaiting Verification</span>
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Record Timestamp */}
                        <div className="space-y-1 pt-3 border-t border-slate-100">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                                System Tenure
                            </span>
                            <div className="flex items-center gap-2 text-slate-600">
                                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                                <span>{currentUser.created_at_formatted || 'Official Record Established'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Legal Notice Footer */}
                    <div className="p-4 bg-red-950/5 border-t border-red-950/10 text-[11px] text-slate-600 leading-relaxed">
                        <span className="font-bold text-red-950 block mb-0.5">COA Accountability Notice:</span>
                        Official name and institutional email are legally binding on Property Acknowledgement Receipts (PAR) and Inventory Custodian Slips (ICS).
                    </div>
                </div>
            </div>

            {/* Right Column: Profile Edit Form */}
            <div className="lg:col-span-8">
                <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
                    {/* Top Decorative Line */}
                    <div className="h-1 bg-red-900 w-full" />

                    {/* Header */}
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-900 border border-red-100 flex items-center justify-center shrink-0">
                                <User className="w-4 h-4" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold font-serif text-slate-900">
                                    Personnel Information
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Update your official profile records used in reports and communications
                                </p>
                            </div>
                        </div>

                        {isDirty && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium font-mono bg-amber-50 text-amber-900 border border-amber-200/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                Unsaved changes
                            </span>
                        )}
                    </div>

                    <div className="p-6 sm:p-7">
                        {/* Success Feedback Banner */}
                        {recentlySuccessful && (
                            <div className="mb-6 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2.5 text-xs font-medium">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>Profile information updated successfully. System records reflect the latest values.</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Editable Fields */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {/* Full Legal Name */}
                                <div>
                                    <label
                                        htmlFor="profile_name"
                                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                                    >
                                        Full Legal Name <span className="text-red-900">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <input
                                            id="profile_name"
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                            autoComplete="name"
                                            disabled={processing}
                                            className={`w-full pl-9 pr-3.5 py-2.5 text-xs rounded-lg border text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                                                errors.name
                                                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                                                    : 'border-slate-300 focus:border-red-900 focus:ring-red-900/15'
                                            }`}
                                            placeholder="Enter full legal name"
                                        />
                                    </div>
                                    {errors.name ? (
                                        <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
                                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                            <span>{errors.name}</span>
                                        </p>
                                    ) : (
                                        <p className="mt-1.5 text-[11px] text-slate-400 leading-tight">
                                            Official name recorded on property transfer receipts and custodian forms.
                                        </p>
                                    )}
                                </div>

                                {/* Institutional Email */}
                                <div>
                                    <label
                                        htmlFor="profile_email"
                                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                                    >
                                        Institutional Email <span className="text-red-900">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <input
                                            id="profile_email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            required
                                            autoComplete="username"
                                            disabled={processing}
                                            className={`w-full pl-9 pr-3.5 py-2.5 text-xs rounded-lg border text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                                                errors.email
                                                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                                                    : 'border-slate-300 focus:border-red-900 focus:ring-red-900/15'
                                            }`}
                                            placeholder="name@ucn.edu.ph"
                                        />
                                    </div>
                                    {errors.email ? (
                                        <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
                                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                            <span>{errors.email}</span>
                                        </p>
                                    ) : (
                                        <p className="mt-1.5 text-[11px] text-slate-400 leading-tight">
                                            Primary address for security codes, OTP dispatches, and audit warnings.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Institutional Read-Only Properties */}
                            <div className="pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-slate-500">
                                        Institutional Office Assignment
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            readOnly
                                            disabled
                                            value="Supply & Property Management Office"
                                            className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/80 text-slate-600 cursor-not-allowed select-none"
                                        />
                                        <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                                    </div>
                                    <p className="text-[10px] text-slate-400">
                                        Assigned by University HR & Administration.
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-semibold text-slate-500">
                                        System Authority Role
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            readOnly
                                            disabled
                                            value={currentUser.role}
                                            className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/80 text-slate-600 cursor-not-allowed select-none"
                                        />
                                        <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                                    </div>
                                    <p className="text-[10px] text-slate-400">
                                        Role adjustments require Administrator authorization.
                                    </p>
                                </div>
                            </div>

                            {/* Email Verification Warning if Unverified */}
                            {mustVerifyEmail && currentUser.email_verified_at === null && (
                                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3 text-xs">
                                    <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                                    <div className="space-y-1.5">
                                        <p className="font-bold text-amber-950">Email Verification Pending</p>
                                        <p className="text-amber-800 leading-relaxed">
                                            Your institutional email address has not been verified yet. Important security notices and OTP dispatches require a verified address.
                                        </p>
                                        <div>
                                            <Link
                                                href={route('verification.send')}
                                                method="post"
                                                as="button"
                                                className="inline-flex items-center gap-1 font-bold text-red-950 hover:text-red-800 underline focus:outline-none cursor-pointer"
                                            >
                                                Click here to dispatch a new verification link
                                            </Link>
                                        </div>
                                        {status === 'verification-link-sent' && (
                                            <p className="font-semibold text-emerald-800 mt-1 flex items-center gap-1.5">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                <span>A new verification link has been dispatched to your email address.</span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Form Action Row */}
                            <div className="pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <p className="text-[11px] text-slate-400 leading-tight">
                                    Changes take effect immediately across all inventory forms and logged entries.
                                </p>

                                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        disabled={processing || !isDirty}
                                        className="px-4 py-2 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Cancel</span>
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={processing || !isDirty}
                                        className="px-5 py-2 bg-red-900 hover:bg-red-950 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors border border-red-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                                    >
                                        {processing ? (
                                            <>
                                                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                                </svg>
                                                <span>Saving Changes...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-3.5 h-3.5" />
                                                <span>Save Profile</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
