import React, { FormEventHandler, useState } from 'react';
import { useForm, usePage, Link } from '@inertiajs/react';
import { PageProps, UserProfileDetails } from '@/types';
import {
    User,
    Mail,
    Lock,
    Shield,
    Calendar,
    CheckCircle2,
    AlertCircle,
    Info,
    Save,
    RotateCcw
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
        clearErrors
    } = useForm({
        name: currentUser.name || '',
        email: currentUser.email || '',
    });

    const [showSuccessNotice, setShowSuccessNotice] = useState(false);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        patch(route('profile.update'), {
            preserveScroll: true,
            onSuccess: () => {
                setShowSuccessNotice(true);
                setTimeout(() => setShowSuccessNotice(false), 5000);
            },
        });
    };

    const handleCancel = () => {
        reset();
        clearErrors();
        setShowSuccessNotice(false);
    };

    return (
        <div className={`bg-white rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] border border-slate-200/80 flex flex-col overflow-hidden ${className}`}>
            {/* Modern Top Header (Matches Dashboard Card Headers) */}
            <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/40">
                <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-950 via-red-900 to-red-800 flex items-center justify-center text-white shadow-xs ring-4 ring-red-50 shrink-0">
                        <User className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h3 className="text-base font-bold text-slate-900 tracking-tight font-sans">
                                Profile Information
                            </h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-900 border border-red-200/70 shadow-2xs">
                                Identity & Contact
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Update your personal identity details and official university contact email address
                        </p>
                    </div>
                </div>

                {isDirty && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider font-mono bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                        Unsaved Changes
                    </span>
                )}
            </div>

            <div className="p-6 lg:p-8 space-y-6">
                {/* Success Feedback Banner */}
                {(recentlySuccessful || showSuccessNotice) && (
                    <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 text-xs font-medium animate-in fade-in duration-200">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div className="flex-1">
                            <p className="font-bold uppercase tracking-wider text-[11px]">Profile Information Updated</p>
                            <p className="text-emerald-700 mt-0.5">Your official full name and email address have been persisted to the system database.</p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Editable Information Group */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                Editable Fields
                            </span>
                            <div className="h-px flex-1 bg-gray-200"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Full Name */}
                            <div>
                                <label htmlFor="profile_name" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Full Name <span className="text-red-600">*</span>
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
                                        className={`w-full pl-9 pr-3.5 py-2.5 text-xs font-medium rounded-lg border bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 transition-all ${
                                            errors.name
                                                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500'
                                                : 'border-slate-300 focus:border-red-900 focus:ring-red-900'
                                        }`}
                                        placeholder="Enter your official full name"
                                    />
                                </div>
                                {errors.name ? (
                                    <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
                                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                        <span>{errors.name}</span>
                                    </p>
                                ) : (
                                    <p className="mt-1 text-[11px] text-slate-400">
                                        Official employee name displayed on inventory logs and transfer receipts.
                                    </p>
                                )}
                            </div>

                            {/* Email Address */}
                            <div>
                                <label htmlFor="profile_email" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                    Email Address <span className="text-red-600">*</span>
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
                                        className={`w-full pl-9 pr-3.5 py-2.5 text-xs font-medium rounded-lg border bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 transition-all ${
                                            errors.email
                                                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500'
                                                : 'border-slate-300 focus:border-red-900 focus:ring-red-900'
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
                                    <p className="mt-1 text-[11px] text-slate-400">
                                        Primary institutional email used for authentication and security dispatch.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Email Verification Notice */}
                    {mustVerifyEmail && currentUser.email_verified_at === null && (
                        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 text-xs">
                            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-bold uppercase tracking-wider text-[11px]">Email Verification Pending</p>
                                <p className="mt-0.5 text-amber-800">
                                    Your institutional email address has not yet been verified.
                                </p>
                                <Link
                                    href={route('verification.send')}
                                    method="post"
                                    as="button"
                                    className="mt-2 inline-flex items-center text-xs font-bold text-amber-950 underline hover:text-red-900 focus:outline-none"
                                >
                                    Click here to resend the verification email
                                </Link>

                                {status === 'verification-link-sent' && (
                                    <p className="mt-2 text-xs font-semibold text-emerald-700">
                                        A new verification link has been dispatched to your email address.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* System Managed Read-Only Fields (Matches Dashboard Top Border Cards) */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                                <Lock className="w-3.5 h-3.5 text-slate-400" />
                                System Managed Read-Only Fields
                            </span>
                            <div className="h-px flex-1 bg-gray-200"></div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Username Handle */}
                            <div className="bg-white rounded-lg p-4 shadow-xs border border-gray-200 border-t-2 border-t-red-900 flex flex-col justify-between">
                                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                    <span>System Handle</span>
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                        LOCKED
                                    </span>
                                </div>
                                <div className="font-mono font-bold text-sm text-slate-900 truncate flex items-center gap-1">
                                    <span className="text-red-900 font-extrabold">@</span>
                                    <span className="truncate">{profile.username || 'user'}</span>
                                </div>
                                <p className="text-[11px] font-medium text-gray-500 mt-1">
                                    Unique handle for audit trails
                                </p>
                            </div>

                            {/* Access Role */}
                            <div className="bg-white rounded-lg p-4 shadow-xs border border-gray-200 border-t-2 border-t-red-900 flex flex-col justify-between">
                                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                    <span>Access Role</span>
                                    <Shield className="w-3.5 h-3.5 text-yellow-600" />
                                </div>
                                <div className="font-sans font-bold text-sm text-slate-900 truncate">
                                    {profile.role || 'Staff'}
                                </div>
                                <p className="text-[11px] font-medium text-gray-500 mt-1">
                                    Managed via Access Control
                                </p>
                            </div>

                            {/* Account Status */}
                            <div className="bg-white rounded-lg p-4 shadow-xs border border-gray-200 border-t-2 border-t-red-900 flex flex-col justify-between">
                                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                    <span>Account Status</span>
                                    <Lock className="w-3 h-3 text-slate-400" />
                                </div>
                                <div className="flex items-center gap-1.5 font-bold text-sm text-emerald-700 uppercase font-mono">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    <span>{profile.account_status || 'Active'}</span>
                                </div>
                                <p className="text-[11px] font-medium text-gray-500 mt-1">
                                    Self-deactivation restricted
                                </p>
                            </div>

                            {/* Date Joined */}
                            <div className="bg-white rounded-lg p-4 shadow-xs border border-gray-200 border-t-2 border-t-red-900 flex flex-col justify-between">
                                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                    <span>Date Joined</span>
                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                </div>
                                <div className="font-sans font-bold text-sm text-slate-900 truncate">
                                    {profile.created_at_formatted || 'System Initial Setup'}
                                </div>
                                <p className="text-[11px] font-medium text-gray-500 mt-1 truncate">
                                    {profile.created_at_diff || 'Official Record'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons (Matches Dashboard Button Style) */}
                    <div className="pt-4 border-t border-gray-200 flex items-center justify-between gap-4">
                        <p className="text-xs text-gray-500 hidden sm:block font-medium">
                            Changes take effect immediately across all system modules and reports.
                        </p>

                        <div className="flex items-center gap-3 ml-auto">
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={processing || !isDirty}
                                className="px-4 py-2.5 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                                <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                                <span>Cancel</span>
                            </button>

                            <button
                                type="submit"
                                disabled={processing || !isDirty}
                                className="px-5 py-2.5 bg-red-900 hover:bg-red-950 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs transition-colors border border-red-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                            >
                                {processing ? (
                                    <>
                                        <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-3.5 h-3.5" />
                                        <span>Save Changes</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
