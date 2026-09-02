import React, { FormEventHandler, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
    KeyRound,
    Lock,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
    ShieldCheck,
    ShieldAlert,
    RotateCcw,
    Mail,
    ArrowRight,
    ArrowLeft,
    Clock,
    RefreshCw,
    Sparkles
} from 'lucide-react';

interface Props {
    className?: string;
    userEmail?: string;
}

type Step = 'credentials' | 'otp' | 'success';

interface FieldErrors {
    current_password?: string;
    password?: string;
    password_confirmation?: string;
    otp?: string;
    general?: string;
}

export default function UpdatePasswordCard({ className = '', userEmail }: Props) {
    const [step, setStep] = useState<Step>('credentials');

    // Step 1: Credentials State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Step 2: OTP State
    const [otpToken, setOtpToken] = useState('');
    const [maskedEmail, setMaskedEmail] = useState('');
    const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
    const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Timers & Counts
    const [resendCooldown, setResendCooldown] = useState<number>(0);
    const [expiresAt, setExpiresAt] = useState<Date | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<string>('10:00');
    const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

    // General UI State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [errors, setErrors] = useState<FieldErrors>({});

    const currentPasswordInputRef = useRef<HTMLInputElement>(null);
    const newPasswordInputRef = useRef<HTMLInputElement>(null);

    // Password Validation Rules
    const hasMinLength = newPassword.length >= 8;
    const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
    const isStep1Valid = Boolean(currentPassword && hasMinLength && passwordsMatch);

    // Countdown Timer for Resend Button Cooldown
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => {
            setResendCooldown((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);

    // Countdown Timer for OTP Expiration
    useEffect(() => {
        if (!expiresAt || step !== 'otp') return;

        const updateTimer = () => {
            const now = new Date().getTime();
            const distance = expiresAt.getTime() - now;

            if (distance <= 0) {
                setTimeRemaining('00:00');
                setErrors((prev) => ({
                    ...prev,
                    otp: 'The verification code has expired. Please click "Resend OTP" to receive a new code.',
                }));
                return;
            }

            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            setTimeRemaining(
                `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
            );
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [expiresAt, step]);

    // Auto-focus first OTP input upon entering Step 2
    useEffect(() => {
        if (step === 'otp') {
            setTimeout(() => {
                otpInputRefs.current[0]?.focus();
            }, 100);
        }
    }, [step]);

    // Handle Step 1 Submission: Validate & Request OTP
    const handleRequestOtp: FormEventHandler = async (e) => {
        e.preventDefault();
        setErrors({});

        // Client-side quick checks
        if (!currentPassword) {
            setErrors({ current_password: 'Your current password is required.' });
            currentPasswordInputRef.current?.focus();
            return;
        }

        if (newPassword.length < 8) {
            setErrors({ password: 'The new password must be at least 8 characters.' });
            newPasswordInputRef.current?.focus();
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrors({ password_confirmation: 'The password confirmation does not match.' });
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await axios.post(route('password.otp.request'), {
                current_password: currentPassword,
                password: newPassword,
                password_confirmation: confirmPassword,
            });

            if (response.data?.success) {
                setOtpToken(response.data.token);
                setMaskedEmail(response.data.masked_email || userEmail || 'your registered email');
                if (response.data.expires_at) {
                    setExpiresAt(new Date(response.data.expires_at));
                } else {
                    setExpiresAt(new Date(Date.now() + 10 * 60 * 1000));
                }
                setResendCooldown(response.data.resend_available_in || 60);
                setOtpDigits(['', '', '', '', '', '']);
                setRemainingAttempts(5);
                setStep('otp');
            }
        } catch (err: any) {
            const resData = err.response?.data;
            const status = err.response?.status;

            if (status === 401) {
                setErrors({ general: 'Your session has expired. Please refresh the page and log in again.' });
            } else if (resData?.errors) {
                const newErrors: FieldErrors = {};
                if (resData.errors.current_password) {
                    newErrors.current_password = Array.isArray(resData.errors.current_password)
                        ? resData.errors.current_password[0]
                        : resData.errors.current_password;
                }
                if (resData.errors.password) {
                    newErrors.password = Array.isArray(resData.errors.password)
                        ? resData.errors.password[0]
                        : resData.errors.password;
                }
                if (resData.errors.password_confirmation) {
                    newErrors.password_confirmation = Array.isArray(resData.errors.password_confirmation)
                        ? resData.errors.password_confirmation[0]
                        : resData.errors.password_confirmation;
                }
                if (resData.errors.otp) {
                    newErrors.otp = Array.isArray(resData.errors.otp)
                        ? resData.errors.otp[0]
                        : resData.errors.otp;
                }
                setErrors(newErrors);
            } else if (resData?.message) {
                setErrors({ general: resData.message });
            } else {
                setErrors({ general: 'Failed to initiate password change request. Please check connection.' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle OTP Input typing
    const handleOtpChange = (index: number, val: string) => {
        const cleanVal = val.replace(/\D/g, '');

        if (!cleanVal) {
            const next = [...otpDigits];
            next[index] = '';
            setOtpDigits(next);
            return;
        }

        // Single digit input
        const digit = cleanVal.slice(-1);
        const next = [...otpDigits];
        next[index] = digit;
        setOtpDigits(next);

        // Auto-advance
        if (index < 5 && digit) {
            otpInputRefs.current[index + 1]?.focus();
        }
    };

    // Handle KeyDown on OTP inputs (Backspace navigation)
    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (!otpDigits[index] && index > 0) {
                otpInputRefs.current[index - 1]?.focus();
            }
        }
    };

    // Handle Paste on OTP inputs
    const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text').trim().replace(/\D/g, '');
        if (!pasteData) return;

        const next = [...otpDigits];
        for (let i = 0; i < 6; i++) {
            next[i] = pasteData[i] || '';
        }
        setOtpDigits(next);

        const focusIndex = Math.min(pasteData.length, 5);
        otpInputRefs.current[focusIndex]?.focus();
    };

    // Full 6-digit OTP string
    const enteredOtp = otpDigits.join('');
    const isOtpComplete = enteredOtp.length === 6;

    // Handle Step 2 Submission: Verify OTP
    const handleVerifyOtp: FormEventHandler = async (e) => {
        e.preventDefault();
        setErrors({});

        if (!isOtpComplete) {
            setErrors({ otp: 'Please enter all 6 digits of the verification code.' });
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await axios.post(route('password.otp.verify'), {
                token: otpToken,
                otp: enteredOtp,
            });

            if (response.data?.success) {
                // Clear sensitive password data from local memory
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setOtpDigits(['', '', '', '', '', '']);
                setStep('success');
            }
        } catch (err: any) {
            const resData = err.response?.data;
            const status = err.response?.status;

            if (typeof resData?.remaining_attempts === 'number') {
                setRemainingAttempts(resData.remaining_attempts);
            }

            if (status === 401) {
                setErrors({ otp: 'Your session has expired. Please refresh the page and log in again.' });
            } else if (resData?.errors?.otp) {
                const msg = Array.isArray(resData.errors.otp) ? resData.errors.otp[0] : resData.errors.otp;
                setErrors({ otp: msg });
            } else if (resData?.message) {
                setErrors({ otp: resData.message });
            } else {
                setErrors({ otp: 'Failed to verify code. Please verify your internet connection and try again.' });
            }

            // Clear digits and focus first cell on error
            setOtpDigits(['', '', '', '', '', '']);
            otpInputRefs.current[0]?.focus();
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Resend OTP
    const handleResendOtp = async () => {
        if (resendCooldown > 0 || isResending) return;

        setErrors({});
        setIsResending(true);

        try {
            const response = await axios.post(route('password.otp.resend'), {
                token: otpToken,
            });

            if (response.data?.success) {
                setResendCooldown(response.data.resend_available_in || 60);
                if (response.data.expires_at) {
                    setExpiresAt(new Date(response.data.expires_at));
                } else {
                    setExpiresAt(new Date(Date.now() + 10 * 60 * 1000));
                }
                setOtpDigits(['', '', '', '', '', '']);
                setRemainingAttempts(5);
                otpInputRefs.current[0]?.focus();
            }
        } catch (err: any) {
            const resData = err.response?.data;
            if (resData?.errors?.otp) {
                const msg = Array.isArray(resData.errors.otp) ? resData.errors.otp[0] : resData.errors.otp;
                setErrors({ otp: msg });
            } else if (resData?.message) {
                setErrors({ otp: resData.message });
            } else {
                setErrors({ otp: 'Unable to resend OTP code. Please check your network and mail settings.' });
            }
        } finally {
            setIsResending(false);
        }
    };

    // Reset everything back to Step 1 initial state
    const handleResetAll = () => {
        setStep('credentials');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setOtpToken('');
        setOtpDigits(['', '', '', '', '', '']);
        setErrors({});
        setRemainingAttempts(null);
        setExpiresAt(null);
        setResendCooldown(0);
    };

    return (
        <div className={`bg-white rounded-2xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] border border-slate-200/80 flex flex-col overflow-hidden transition-all duration-300 ${className}`}>
            {/* Institutional Header with Step Progress */}
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
                                2-Step Verification
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Two-factor email OTP authentication protects credentials against unauthorized changes
                        </p>
                    </div>
                </div>

                {/* Multi-step Status Badge */}
                <div className="flex items-center gap-2 text-xs font-mono font-bold">
                    <div className={`px-2.5 py-1 rounded border flex items-center gap-1.5 transition-colors ${
                        step === 'credentials'
                            ? 'bg-red-900 text-white border-red-900 shadow-2xs'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                        <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
                        <span>Credentials</span>
                    </div>

                    <ArrowRight className="w-3 h-3 text-slate-300" />

                    <div className={`px-2.5 py-1 rounded border flex items-center gap-1.5 transition-colors ${
                        step === 'otp'
                            ? 'bg-amber-500 text-red-950 border-amber-600 shadow-2xs'
                            : step === 'success'
                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                            : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60'
                    }`}>
                        <span className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center text-[10px]">2</span>
                        <span>Email OTP</span>
                    </div>

                    <ArrowRight className="w-3 h-3 text-slate-300" />

                    <div className={`px-2.5 py-1 rounded border flex items-center gap-1.5 transition-colors ${
                        step === 'success'
                            ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                            : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60'
                    }`}>
                        <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">3</span>
                        <span>Success</span>
                    </div>
                </div>
            </div>

            <div className="p-6 lg:p-8">
                {/* Global Error Banner */}
                {errors.general && (
                    <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 text-xs font-medium animate-in fade-in duration-200">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold uppercase tracking-wider text-[11px]">Request Error</p>
                            <p className="text-rose-700 mt-0.5">{errors.general}</p>
                        </div>
                    </div>
                )}

                {/* ========================================================= */}
                {/* STEP 1: CHANGE PASSWORD FORM                              */}
                {/* ========================================================= */}
                {step === 'credentials' && (
                    <form onSubmit={handleRequestOtp} className="space-y-6">
                        {/* Information Note */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3 text-xs">
                            <ShieldCheck className="w-4 h-4 text-red-900 shrink-0 mt-0.5" />
                            <div className="text-slate-600 leading-relaxed">
                                <span className="font-bold text-slate-800">Security Requirement:</span> To protect institutional integrity, clicking <strong className="text-red-950 font-semibold">Continue</strong> will verify your existing password and transmit a 6-digit one-time code to your authorized institutional email before updating your credentials.
                            </div>
                        </div>

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
                                    ref={currentPasswordInputRef}
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) => {
                                        setCurrentPassword(e.target.value);
                                        if (errors.current_password) {
                                            setErrors((prev) => ({ ...prev, current_password: undefined }));
                                        }
                                    }}
                                    required
                                    autoComplete="current-password"
                                    disabled={isSubmitting}
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
                                    Verify your active credentials to generate the authorization token.
                                </p>
                            )}
                        </div>

                        {/* New Password & Confirmation Grid */}
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
                                        ref={newPasswordInputRef}
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => {
                                            setNewPassword(e.target.value);
                                            if (errors.password) {
                                                setErrors((prev) => ({ ...prev, password: undefined }));
                                            }
                                        }}
                                        required
                                        autoComplete="new-password"
                                        disabled={isSubmitting}
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
                                        value={confirmPassword}
                                        onChange={(e) => {
                                            setConfirmPassword(e.target.value);
                                            if (errors.password_confirmation) {
                                                setErrors((prev) => ({ ...prev, password_confirmation: undefined }));
                                            }
                                        }}
                                        required
                                        autoComplete="new-password"
                                        disabled={isSubmitting}
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

                        {/* Security Requirements Checklist Card */}
                        <div className="bg-white rounded-lg p-4 shadow-xs border border-gray-200 border-t-2 border-t-red-900 max-w-2xl">
                            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                                Security Verification Requirements
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center gap-2">
                                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                                        hasMinLength ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                                    }`}>
                                        ✓
                                    </span>
                                    <span className={hasMinLength ? 'text-emerald-900 font-bold' : 'text-slate-500 font-medium'}>
                                        At least 8 characters minimum
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
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

                        {/* Step 1 Actions */}
                        <div className="pt-4 border-t border-gray-200 flex items-center justify-between gap-4">
                            <p className="text-xs text-gray-500 hidden sm:block font-medium">
                                Step 1 of 2: Password details are verified before dispatching security code.
                            </p>

                            <div className="flex items-center gap-3 ml-auto">
                                <button
                                    type="button"
                                    onClick={handleResetAll}
                                    disabled={isSubmitting || (!currentPassword && !newPassword && !confirmPassword)}
                                    className="px-4 py-2.5 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                >
                                    <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                                    <span>Reset</span>
                                </button>

                                <button
                                    type="submit"
                                    disabled={isSubmitting || !isStep1Valid}
                                    className="px-5 py-2.5 bg-red-900 hover:bg-red-950 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs transition-colors border border-red-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                            </svg>
                                            <span>Validating & Sending Code...</span>
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
                )}

                {/* ========================================================= */}
                {/* STEP 2: EMAIL OTP VERIFICATION                            */}
                {/* ========================================================= */}
                {step === 'otp' && (
                    <form onSubmit={handleVerifyOtp} className="space-y-6 max-w-xl mx-auto py-2">
                        {/* Email Dispatch Notice */}
                        <div className="text-center space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-center mx-auto shadow-2xs">
                                <Mail className="w-6 h-6 text-amber-700" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-900 tracking-tight font-sans">
                                Email Verification Code
                            </h4>
                            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                                We sent a 6-digit verification code to your registered email:
                                <br />
                                <strong className="text-slate-900 font-mono font-bold">{maskedEmail}</strong>
                            </p>
                        </div>

                        {/* OTP Error Banner */}
                        {errors.otp && (
                            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2.5 text-xs font-medium animate-in fade-in duration-200">
                                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <span className="font-bold">Verification Error:</span> {errors.otp}
                                </div>
                            </div>
                        )}

                        {/* 6-Digit OTP Inputs */}
                        <div className="space-y-3">
                            <label className="block text-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Enter the 6-digit OTP below
                            </label>

                            <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                                {otpDigits.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        ref={(el) => (otpInputRefs.current[idx] = el)}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                        disabled={isSubmitting}
                                        aria-label={`Digit ${idx + 1}`}
                                        className={`w-11 h-13 sm:w-13 sm:h-15 text-center text-xl sm:text-2xl font-bold font-mono rounded-xl border bg-slate-50/70 text-slate-900 shadow-2xs focus:bg-white focus:outline-none focus:ring-2 transition-all select-none ${
                                            digit
                                                ? 'border-red-900/60 ring-1 ring-red-900/20 bg-white'
                                                : errors.otp
                                                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-400/30'
                                                : 'border-slate-300 focus:border-red-900 focus:ring-red-900/30'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Timer & Security Status Information */}
                        <div className="flex items-center justify-between text-xs text-slate-500 px-2 py-1">
                            <div className="flex items-center gap-1.5 font-mono">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>Code expires in:</span>
                                <strong className={`font-bold ${timeRemaining === '00:00' ? 'text-rose-600' : 'text-slate-800'}`}>
                                    {timeRemaining}
                                </strong>
                            </div>

                            {remainingAttempts !== null && remainingAttempts < 5 && (
                                <div className="text-[11px] font-bold text-amber-800 font-mono">
                                    {remainingAttempts} attempt(s) remaining
                                </div>
                            )}
                        </div>

                        {/* Step 2 Actions */}
                        <div className="space-y-3 pt-2">
                            <button
                                type="submit"
                                disabled={!isOtpComplete || isSubmitting}
                                className="w-full py-2.5 bg-red-900 hover:bg-red-950 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs transition-colors border border-red-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                        <span>Verifying Code...</span>
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="w-4 h-4" />
                                        <span>Verify OTP & Update Password</span>
                                    </>
                                )}
                            </button>

                            <div className="flex items-center justify-between pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep('credentials');
                                        setErrors({});
                                    }}
                                    disabled={isSubmitting}
                                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    <span>Back to edit password</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={resendCooldown > 0 || isResending || isSubmitting}
                                    className="text-xs font-bold text-red-900 hover:text-red-950 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                    <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                                    <span>
                                        {resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : 'Resend OTP'}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {/* ========================================================= */}
                {/* STEP 3: SUCCESS CONFIRMATION                              */}
                {/* ========================================================= */}
                {step === 'success' && (
                    <div className="max-w-md mx-auto text-center py-8 space-y-5 animate-in fade-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center text-emerald-600 mx-auto shadow-sm">
                            <CheckCircle2 className="w-9 h-9" />
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-xl font-bold text-slate-900 font-serif tracking-tight">
                                Password Changed Successfully
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                                Your account password has been updated securely. A confirmation security notification has also been sent to your registered email.
                            </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 font-mono">
                            Institutional audit event logged • Authenticated session active
                        </div>

                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={handleResetAll}
                                className="px-6 py-2.5 bg-red-900 hover:bg-red-950 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs transition-colors border border-red-900 cursor-pointer inline-flex items-center gap-2"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                <span>Done</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
