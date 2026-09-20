import React, { FormEventHandler } from 'react';
import { Lock, KeyRound, Eye, EyeOff, AlertCircle, ArrowRight, RotateCcw } from 'lucide-react';
import PasswordRequirements from './PasswordRequirements';
import { FieldErrors } from '../../types';

interface Props {
    currentPassword: string;
    setCurrentPassword: (val: string) => void;
    newPassword: string;
    setNewPassword: (val: string) => void;
    confirmPassword: string;
    setConfirmPassword: (val: string) => void;
    showCurrentPassword: boolean;
    setShowCurrentPassword: React.Dispatch<React.SetStateAction<boolean>>;
    showNewPassword: boolean;
    setShowNewPassword: React.Dispatch<React.SetStateAction<boolean>>;
    showConfirmPassword: boolean;
    setShowConfirmPassword: React.Dispatch<React.SetStateAction<boolean>>;
    hasMinLength: boolean;
    passwordsMatch: boolean;
    isStep1Valid: boolean;
    isSubmitting: boolean;
    errors: FieldErrors;
    currentPasswordInputRef: React.RefObject<HTMLInputElement>;
    newPasswordInputRef: React.RefObject<HTMLInputElement>;
    onSubmit: FormEventHandler;
    onReset: () => void;
}

export default function PasswordCredentialsStep({
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showCurrentPassword,
    setShowCurrentPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    hasMinLength,
    passwordsMatch,
    isStep1Valid,
    isSubmitting,
    errors,
    currentPasswordInputRef,
    newPasswordInputRef,
    onSubmit,
    onReset,
}: Props) {
    return (
        <form onSubmit={onSubmit} className="space-y-6 max-w-2xl">
            {/* Information Header */}
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <span className="font-bold text-slate-900 dark:text-slate-100">Security Verification:</span> To protect institutional integrity, advancing to the next step will verify your active credentials and dispatch a 6-digit one-time code to your registered university email.
            </div>

            {/* General Error Banner */}
            {errors.general && (
                <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200 flex items-start gap-2.5 text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold">Request Error</p>
                        <p className="text-rose-700 dark:text-rose-300 mt-0.5">{errors.general}</p>
                    </div>
                </div>
            )}

            {/* Current Password */}
            <div>
                <label
                    htmlFor="current_password"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                    Current Password <span className="text-rose-600 dark:text-rose-400">*</span>
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                        <Lock className="w-4 h-4" />
                    </div>
                    <input
                        id="current_password"
                        ref={currentPasswordInputRef}
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        disabled={isSubmitting}
                        className={`w-full pl-9 pr-10 py-2 text-xs rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 transition-all ${
                            errors.current_password
                                ? 'border-rose-400 dark:border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                                : 'border-slate-300 dark:border-slate-700 focus:border-red-900 dark:focus:border-red-600 focus:ring-red-900 dark:focus:ring-red-600'
                        }`}
                        placeholder="Enter your existing account password"
                    />
                    <button
                        type="button"
                        onClick={() => setShowCurrentPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none cursor-pointer"
                        tabIndex={-1}
                    >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
                {errors.current_password && (
                    <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.current_password}</span>
                    </p>
                )}
            </div>

            {/* New Password & Confirmation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* New Password */}
                <div>
                    <label
                        htmlFor="new_password"
                        className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                        New Password <span className="text-rose-600 dark:text-rose-400">*</span>
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                            <KeyRound className="w-4 h-4" />
                        </div>
                        <input
                            id="new_password"
                            ref={newPasswordInputRef}
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                            disabled={isSubmitting}
                            className={`w-full pl-9 pr-10 py-2 text-xs rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 transition-all ${
                                errors.password
                                    ? 'border-rose-400 dark:border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                                    : 'border-slate-300 dark:border-slate-700 focus:border-red-900 dark:focus:border-red-600 focus:ring-red-900 dark:focus:ring-red-600'
                            }`}
                            placeholder="Enter new password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowNewPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none cursor-pointer"
                            tabIndex={-1}
                        >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{errors.password}</span>
                        </p>
                    )}
                </div>

                {/* Confirm Password */}
                <div>
                    <label
                        htmlFor="password_confirmation"
                        className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                        Confirm New Password <span className="text-rose-600 dark:text-rose-400">*</span>
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                            <KeyRound className="w-4 h-4" />
                        </div>
                        <input
                            id="password_confirmation"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                            disabled={isSubmitting}
                            className={`w-full pl-9 pr-10 py-2 text-xs rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 transition-all ${
                                errors.password_confirmation
                                    ? 'border-rose-400 dark:border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                                    : 'border-slate-300 dark:border-slate-700 focus:border-red-900 dark:focus:border-red-600 focus:ring-red-900 dark:focus:ring-red-600'
                            }`}
                            placeholder="Confirm new password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none cursor-pointer"
                            tabIndex={-1}
                        >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    {errors.password_confirmation && (
                        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{errors.password_confirmation}</span>
                        </p>
                    )}
                </div>
            </div>

            {/* Restrained Requirements Checklist */}
            <PasswordRequirements
                hasMinLength={hasMinLength}
                passwordsMatch={passwordsMatch}
            />

            {/* Form Actions */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                    Step 1 of 2: Password details are verified before dispatching security code.
                </p>

                <div className="flex items-center gap-3 ml-auto">
                    <button
                        type="button"
                        onClick={onReset}
                        disabled={isSubmitting || (!currentPassword && !newPassword && !confirmPassword)}
                        className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-750 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <span>Reset</span>
                    </button>

                    <button
                        type="submit"
                        disabled={isSubmitting || !isStep1Valid}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold text-white flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.98] ${
                            isStep1Valid && !isSubmitting
                                ? 'bg-red-900 hover:bg-red-800 active:bg-red-950 shadow-red-950/15 shadow-md'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                        }`}
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                <span>Sending Code...</span>
                            </>
                        ) : (
                            <>
                                <span>Continue</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}
