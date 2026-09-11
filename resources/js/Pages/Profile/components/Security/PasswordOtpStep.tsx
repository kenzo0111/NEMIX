import React, { FormEventHandler, KeyboardEvent, ClipboardEvent } from 'react';
import { Mail, Clock, ShieldCheck, ArrowLeft, RefreshCw, AlertCircle, ShieldAlert } from 'lucide-react';
import OtpDigitInput from './OtpDigitInput';
import { FieldErrors } from '../../types';

interface Props {
    maskedEmail: string;
    otpDigits: string[];
    otpInputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
    timeRemaining: string;
    resendCooldown: number;
    remainingAttempts: number | null;
    isExpired: boolean;
    isMaxAttemptsExceeded: boolean;
    isRateLimited: boolean;
    isVerifyingSuccess: boolean;
    isSubmitting: boolean;
    isResending: boolean;
    errors: FieldErrors;
    isOtpComplete: boolean;
    formatCooldown: (seconds: number) => string;
    onOtpChange: (index: number, val: string) => void;
    onOtpKeyDown: (index: number, e: KeyboardEvent<HTMLInputElement>) => void;
    onOtpPaste: (e: ClipboardEvent<HTMLInputElement>) => void;
    onSubmit: FormEventHandler;
    onResend: () => void;
    onBack: () => void;
}

export default function PasswordOtpStep({
    maskedEmail,
    otpDigits,
    otpInputRefs,
    timeRemaining,
    resendCooldown,
    remainingAttempts,
    isExpired,
    isMaxAttemptsExceeded,
    isRateLimited,
    isVerifyingSuccess,
    isSubmitting,
    isResending,
    errors,
    isOtpComplete,
    formatCooldown,
    onOtpChange,
    onOtpKeyDown,
    onOtpPaste,
    onSubmit,
    onResend,
    onBack,
}: Props) {
    const isLockedOut = isMaxAttemptsExceeded || remainingAttempts === 0;

    return (
        <form onSubmit={onSubmit} className="space-y-6 max-w-md mx-auto py-2">
            {/* Context Header */}
            <div className="text-center space-y-2">
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center mx-auto border border-slate-200">
                    <Mail className="w-5 h-5 text-red-900" />
                </div>
                <h3 className="text-base font-bold font-serif text-slate-900">
                    Identity Verification
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                    Enter the 6-digit verification code transmitted to:
                    <br />
                    <strong className="text-slate-900 font-mono">{maskedEmail}</strong>
                </p>
            </div>

            {/* Success verifying transition */}
            {isVerifyingSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-center gap-2 text-xs font-semibold">
                    <svg className="animate-spin w-4 h-4 text-emerald-700" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Code verified. Updating password...</span>
                </div>
            )}

            {/* Expired State */}
            {isExpired && !isVerifyingSuccess && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>This verification code has expired.</span>
                    </div>
                    <button
                        type="button"
                        onClick={onResend}
                        disabled={resendCooldown > 0 || isResending}
                        className="font-bold text-red-900 underline hover:text-red-950 disabled:opacity-50 cursor-pointer"
                    >
                        {resendCooldown > 0 ? `Resend (${formatCooldown(resendCooldown)})` : 'Resend Code'}
                    </button>
                </div>
            )}

            {/* Max attempts exceeded */}
            {isLockedOut && !isVerifyingSuccess && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0" />
                        <span>Maximum attempts exceeded. Code invalidated.</span>
                    </div>
                    <button
                        type="button"
                        onClick={onResend}
                        disabled={resendCooldown > 0 || isResending}
                        className="font-bold text-red-900 underline hover:text-red-950 disabled:opacity-50 cursor-pointer"
                    >
                        Request New Code
                    </button>
                </div>
            )}

            {/* Rate limited */}
            {isRateLimited && !isVerifyingSuccess && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2 text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>Too many verification attempts. Please wait before requesting another code.</span>
                </div>
            )}

            {/* General validation error */}
            {errors.otp && !isExpired && !isLockedOut && !isRateLimited && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2 text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{errors.otp}</span>
                </div>
            )}

            {/* 6-Digit OTP Inputs */}
            <div className="space-y-2">
                <OtpDigitInput
                    digits={otpDigits}
                    inputRefs={otpInputRefs}
                    onChange={onOtpChange}
                    onKeyDown={onOtpKeyDown}
                    onPaste={onOtpPaste}
                    disabled={isSubmitting || isExpired || isLockedOut || isVerifyingSuccess}
                    hasError={Boolean(errors.otp)}
                />
            </div>

            {/* Status & Timer Footer */}
            <div className="flex items-center justify-between text-xs text-slate-500 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-mono">
                <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Expires in:</span>
                    <strong className={isExpired ? 'text-rose-600' : 'text-slate-800'}>
                        {timeRemaining}
                    </strong>
                </div>

                <div className="flex items-center gap-2">
                    {resendCooldown > 0 ? (
                        <span className="text-[11px] text-slate-500">
                            Resend in {formatCooldown(resendCooldown)}
                        </span>
                    ) : (
                        <span className="text-[11px] text-emerald-700 font-semibold">
                            Resend ready
                        </span>
                    )}

                    {remainingAttempts !== null && remainingAttempts > 0 && remainingAttempts < 5 && (
                        <span className="text-[11px] text-amber-800 border-l pl-2 border-slate-300 font-semibold">
                            {remainingAttempts} try left
                        </span>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
                <button
                    type="submit"
                    disabled={!isOtpComplete || isSubmitting || isExpired || isLockedOut || isVerifyingSuccess}
                    className={`w-full py-2.5 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.98] ${
                        isOtpComplete && !isSubmitting && !isExpired && !isLockedOut && !isVerifyingSuccess
                            ? 'bg-red-900 hover:bg-red-800 active:bg-red-950 shadow-red-950/15 shadow-md'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    }`}
                >
                    {isSubmitting ? (
                        <>
                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            <span>Verifying...</span>
                        </>
                    ) : (
                        <>
                            <ShieldCheck className="w-4 h-4" />
                            <span>Verify and Update Password</span>
                        </>
                    )}
                </button>

                <div className="flex items-center justify-between pt-1">
                    <button
                        type="button"
                        onClick={onBack}
                        disabled={isSubmitting}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 hover:border-slate-400 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                        <span>Back</span>
                    </button>

                    <button
                        type="button"
                        onClick={onResend}
                        disabled={resendCooldown > 0 || isResending || isSubmitting || isVerifyingSuccess}
                        className="px-3 py-1.5 text-xs font-semibold text-red-900 hover:text-red-950 bg-red-50/70 border border-red-200/80 rounded-xl hover:bg-red-100/80 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                        <span>
                            {resendCooldown > 0
                                ? `Resend in ${formatCooldown(resendCooldown)}`
                                : 'Resend Code'}
                        </span>
                    </button>
                </div>
            </div>
        </form>
    );
}
