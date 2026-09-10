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
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-900">Security Verification:</span> To protect institutional integrity, advancing to the next step will verify your active credentials and dispatch a 6-digit one-time code to your registered university email.
            </div>

            {/* General Error Banner */}
            {errors.general && (
                <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2.5 text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold">Request Error</p>
                        <p className="text-rose-700 mt-0.5">{errors.general}</p>
                    </div>
                </div>
            )}

            {/* Current Password */}
            <div>
                <label
                    htmlFor="current_password"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                    Current Password <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
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
                        className={`w-full pl-9 pr-10 py-2 text-xs rounded-lg border text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 transition-all ${
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
                {errors.current_password && (
                    <p className="mt-1 text-xs text-rose-600 flex items-center gap-1 font-medium">
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
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                        New Password <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
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
                            className={`w-full pl-9 pr-10 py-2 text-xs rounded-lg border text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 transition-all ${
                                errors.password
                                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500'
                                    : 'border-slate-300 focus:border-red-900 focus:ring-red-900'
                            }`}
                            placeholder="Enter new password"
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
                        <p className="mt-1 text-xs text-rose-600 flex items-center gap-1 font-medium">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{errors.password}</span>
                        </p>
                    )}
                </div>

                {/* Confirm Password */}
                <div>
                    <label
                        htmlFor="password_confirmation"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                        Confirm New Password <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
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
                            className={`w-full pl-9 pr-10 py-2 text-xs rounded-lg border text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 transition-all ${
                                errors.password_confirmation
                                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500'
                                    : 'border-slate-300 focus:border-red-900 focus:ring-red-900'
                            }`}
                            placeholder="Confirm new password"
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
                        <p className="mt-1 text-xs text-rose-600 flex items-center gap-1 font-medium">
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
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-4">
                <p className="text-xs text-slate-500 hidden sm:block">
                    Step 1 of 2: Password details are verified before dispatching security code.
                </p>

                <div className="flex items-center gap-3 ml-auto">
                    <button
                        type="button"
                        onClick={onReset}
                        disabled={isSubmitting || (!currentPassword && !newPassword && !confirmPassword)}
                        className="px-3.5 py-2 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                        <span>Reset</span>
                    </button>

                    <button
                        type="submit"
                        disabled={isSubmitting || !isStep1Valid}
                        className="px-4 py-2 bg-red-900 hover:bg-red-950 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors border border-red-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
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
