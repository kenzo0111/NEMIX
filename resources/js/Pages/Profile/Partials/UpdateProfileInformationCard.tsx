import React, { FormEventHandler } from 'react';
import { useForm, usePage, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import { UserProfileDetails } from '../types';
import { User, Mail, AlertCircle, Info, Save, RotateCcw, CheckCircle2 } from 'lucide-react';

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

    return (
        <div className={`bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden ${className}`}>
            {/* Section Header */}
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
                            Update your official profile information used within the university system
                        </p>
                    </div>
                </div>

                {isDirty && (
                    <span className="text-xs text-amber-800 font-medium font-mono">
                        Unsaved changes
                    </span>
                )}
            </div>

            <div className="p-6">
                {/* Success Feedback Banner */}
                {recentlySuccessful && (
                    <div className="mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2 text-xs font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Profile information updated successfully.</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Full Name */}
                        <div>
                            <label
                                htmlFor="profile_name"
                                className="block text-xs font-semibold text-slate-700 mb-1.5"
                            >
                                Full Legal Name <span className="text-rose-600">*</span>
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
                                    className={`w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 transition-all ${
                                        errors.name
                                            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500'
                                            : 'border-slate-300 focus:border-red-900 focus:ring-red-900'
                                    }`}
                                    placeholder="Enter full legal name"
                                />
                            </div>
                            {errors.name ? (
                                <p className="mt-1 text-xs text-rose-600 flex items-center gap-1 font-medium">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>{errors.name}</span>
                                </p>
                            ) : (
                                <p className="mt-1 text-[11px] text-slate-400">
                                    Official name recorded on university property and transfer receipts.
                                </p>
                            )}
                        </div>

                        {/* Email Address */}
                        <div>
                            <label
                                htmlFor="profile_email"
                                className="block text-xs font-semibold text-slate-700 mb-1.5"
                            >
                                Institutional Email <span className="text-rose-600">*</span>
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
                                    className={`w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 transition-all ${
                                        errors.email
                                            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500'
                                            : 'border-slate-300 focus:border-red-900 focus:ring-red-900'
                                    }`}
                                    placeholder="name@ucn.edu.ph"
                                />
                            </div>
                            {errors.email ? (
                                <p className="mt-1 text-xs text-rose-600 flex items-center gap-1 font-medium">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>{errors.email}</span>
                                </p>
                            ) : (
                                <p className="mt-1 text-[11px] text-slate-400">
                                    Primary address for notifications, audit notices, and OTP dispatches.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Email Verification Warning if Unverified */}
                    {mustVerifyEmail && currentUser.email_verified_at === null && (
                        <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5 text-xs">
                            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="font-semibold text-amber-950">Email Verification Pending</p>
                                <p className="text-amber-800">
                                    Your institutional email address has not been verified yet.
                                </p>
                                <Link
                                    href={route('verification.send')}
                                    method="post"
                                    as="button"
                                    className="font-bold underline text-amber-950 hover:text-red-900 focus:outline-none cursor-pointer"
                                >
                                    Click here to resend the verification link
                                </Link>
                                {status === 'verification-link-sent' && (
                                    <p className="font-semibold text-emerald-700 mt-1">
                                        A new verification link has been dispatched to your email address.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Form Action Row */}
                    <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-4">
                        <p className="text-xs text-slate-500 hidden sm:block">
                            Updates reflect immediately on custodial assignments and system logs.
                        </p>

                        <div className="flex items-center gap-3 ml-auto">
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={processing || !isDirty}
                                className="px-3.5 py-2 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                                <span>Cancel</span>
                            </button>

                            <button
                                type="submit"
                                disabled={processing || !isDirty}
                                className="px-4 py-2 bg-red-900 hover:bg-red-950 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors border border-red-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
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
