import React, { FormEventHandler, useRef, useState } from 'react';
import { useForm } from '@inertiajs/react';
import {
    KeyRound,
    Lock,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
    ShieldCheck,
    Save,
    RotateCcw
} from 'lucide-react';

interface Props {
    className?: string;
}

export default function UpdatePasswordCard({ className = '' }: Props) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showSuccessNotice, setShowSuccessNotice] = useState(false);

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
        clearErrors,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const isFormFilled = Boolean(data.current_password || data.password || data.password_confirmation);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setShowSuccessNotice(true);
                setTimeout(() => setShowSuccessNotice(false), 5000);
            },
            onError: (errs) => {
                if (errs.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }
                if (errs.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    const handleCancel = () => {
        reset();
        clearErrors();
        setShowSuccessNotice(false);
    };

    const hasMinLength = data.password.length >= 8;
    const passwordsMatch = data.password.length > 0 && data.password === data.password_confirmation;

    return (
        <div className={`bg-white rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] border border-slate-200/80 flex flex-col overflow-hidden ${className}`}>
            {/* Modern Top Header (Matches Dashboard Card Headers) */}
            <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/40">
                <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-950 via-red-900 to-red-800 flex items-center justify-center text-white shadow-xs ring-4 ring-red-50 shrink-0">
                        <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h3 className="text-base font-bold text-slate-900 tracking-tight font-sans">
                                Change Password
                            </h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-900 border border-red-200/70 shadow-2xs">
                                Authentication
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Update your credentials to safeguard institutional access and inventory authorizations
                        </p>
                    </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-700">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Current password verification required</span>
                </div>
            </div>

            <div className="p-6 lg:p-8 space-y-6">
                {/* Success Feedback Banner */}
                {(recentlySuccessful || showSuccessNotice) && (
                    <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 text-xs font-medium animate-in fade-in duration-200">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div className="flex-1">
                            <p className="font-bold uppercase tracking-wider text-[11px]">Password Updated</p>
                            <p className="text-emerald-700 mt-0.5">
                                Your account password has been safely encrypted and updated in the system.
                            </p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Current Password Field */}
                    <div className="max-w-xl">
                        <label htmlFor="current_password" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            Current Password <span className="text-red-600">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <Lock className="w-4 h-4" />
                            </div>
                            <input
                                id="current_password"
                                ref={currentPasswordInput}
                                type={showCurrentPassword ? 'text' : 'password'}
                                value={data.current_password}
                                onChange={(e) => setData('current_password', e.target.value)}
                                required
                                autoComplete="current-password"
                                className={`w-full pl-9 pr-10 py-2.5 text-xs font-medium rounded-lg border bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 transition-all ${
                                    errors.current_password
                                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500'
                                        : 'border-slate-300 focus:border-red-900 focus:ring-red-900'
                                }`}
                                placeholder="Enter your existing account password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword((prev) => !prev)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                                tabIndex={-1}
                            >
                                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {errors.current_password ? (
                            <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>{errors.current_password}</span>
                            </p>
                        ) : (
                            <p className="mt-1 text-[11px] text-slate-400">
                                Verify existing identity before credentials can be revised.
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
                        {/* New Password */}
                        <div>
                            <label htmlFor="new_password" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                New Password <span className="text-red-600">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <KeyRound className="w-4 h-4" />
                                </div>
                                <input
                                    id="new_password"
                                    ref={passwordInput}
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    required
                                    autoComplete="new-password"
                                    className={`w-full pl-9 pr-10 py-2.5 text-xs font-medium rounded-lg border bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 transition-all ${
                                        errors.password
                                            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500'
                                            : 'border-slate-300 focus:border-red-900 focus:ring-red-900'
                                    }`}
                                    placeholder="Enter your new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword((prev) => !prev)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                                    tabIndex={-1}
                                >
                                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>{errors.password}</span>
                                </p>
                            )}
                        </div>

                        {/* Confirm New Password */}
                        <div>
                            <label htmlFor="password_confirmation" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                Confirm New Password <span className="text-red-600">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <KeyRound className="w-4 h-4" />
                                </div>
                                <input
                                    id="password_confirmation"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    required
                                    autoComplete="new-password"
                                    className={`w-full pl-9 pr-10 py-2.5 text-xs font-medium rounded-lg border bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 transition-all ${
                                        errors.password_confirmation
                                            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500'
                                            : 'border-slate-300 focus:border-red-900 focus:ring-red-900'
                                    }`}
                                    placeholder="Confirm your new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password_confirmation && (
                                <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>{errors.password_confirmation}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Security Guidelines Card (Matches Dashboard border-t-2 style) */}
                    <div className="bg-white rounded-lg p-4 shadow-xs border border-gray-200 border-t-2 border-t-red-900 max-w-2xl">
                        <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                            Security Verification Requirements
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-2">
                                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                    hasMinLength ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                                }`}>
                                    ✓
                                </span>
                                <span className={hasMinLength ? 'text-emerald-900 font-bold' : 'text-slate-500 font-medium'}>
                                    At least 8 characters minimum
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                    passwordsMatch ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                                }`}>
                                    ✓
                                </span>
                                <span className={passwordsMatch ? 'text-emerald-900 font-bold' : 'text-slate-500 font-medium'}>
                                    Passwords match exactly
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 border-t border-gray-200 flex items-center justify-between gap-4">
                        <p className="text-xs text-gray-500 hidden sm:block font-medium">
                            Active authenticated sessions will remain signed in after password change.
                        </p>

                        <div className="flex items-center gap-3 ml-auto">
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={processing || !isFormFilled}
                                className="px-4 py-2.5 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                                <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                                <span>Cancel</span>
                            </button>

                            <button
                                type="submit"
                                disabled={processing || !isFormFilled}
                                className="px-5 py-2.5 bg-red-900 hover:bg-red-950 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs transition-colors border border-red-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                            >
                                {processing ? (
                                    <>
                                        <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                        <span>Updating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-3.5 h-3.5" />
                                        <span>Update Password</span>
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
