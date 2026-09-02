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
        <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
            {/* Card Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 border border-amber-200 flex items-center justify-center shrink-0">
                        <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            Change Password
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                Authentication
                            </span>
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Ensure your account credentials are strong and unique to protect university system access.
                        </p>
                    </div>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Current verification required</span>
                </div>
            </div>

            <div className="p-6 md:p-8 space-y-6">
                {/* Success Feedback Banner */}
                {(recentlySuccessful || showSuccessNotice) && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 text-xs font-medium animate-in fade-in duration-200">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div className="flex-1">
                            <p className="font-bold">Password Updated Successfully</p>
                            <p className="text-emerald-700 mt-0.5">
                                Your account password has been safely updated in accordance with security requirements.
                            </p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Current Password */}
                    <div className="max-w-xl">
                        <label htmlFor="current_password" className="block text-xs font-bold text-slate-700 mb-1.5">
                            Current Password <span className="text-red-500">*</span>
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
                                className={`w-full pl-9 pr-10 py-2.5 text-xs font-medium rounded-xl border bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                                    errors.current_password
                                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                                        : 'border-slate-300 focus:border-red-900 focus:ring-red-100'
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
                                Verify your identity by providing your active password before setting a new one.
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
                        {/* New Password */}
                        <div>
                            <label htmlFor="new_password" className="block text-xs font-bold text-slate-700 mb-1.5">
                                New Password <span className="text-red-500">*</span>
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
                                    className={`w-full pl-9 pr-10 py-2.5 text-xs font-medium rounded-xl border bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                                        errors.password
                                            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                                            : 'border-slate-300 focus:border-red-900 focus:ring-red-100'
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
                            <label htmlFor="password_confirmation" className="block text-xs font-bold text-slate-700 mb-1.5">
                                Confirm New Password <span className="text-red-500">*</span>
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
                                    className={`w-full pl-9 pr-10 py-2.5 text-xs font-medium rounded-xl border bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                                        errors.password_confirmation
                                            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                                            : 'border-slate-300 focus:border-red-900 focus:ring-red-100'
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

                    {/* Password Requirements Checklist */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 max-w-2xl">
                        <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                            Security Guidelines
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-2">
                                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                                    hasMinLength ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                                }`}>
                                    ✓
                                </span>
                                <span className={hasMinLength ? 'text-emerald-800 font-semibold' : 'text-slate-500'}>
                                    At least 8 characters minimum
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                                    passwordsMatch ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                                }`}>
                                    ✓
                                </span>
                                <span className={passwordsMatch ? 'text-emerald-800 font-semibold' : 'text-slate-500'}>
                                    Passwords match exactly
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                        <p className="text-xs text-slate-400 hidden sm:block">
                            Current session will remain active following password change.
                        </p>

                        <div className="flex items-center gap-3 ml-auto">
                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={processing || !isFormFilled}
                                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 active:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={processing || !isFormFilled}
                                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-900 hover:bg-red-950 active:bg-slate-900 shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
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
