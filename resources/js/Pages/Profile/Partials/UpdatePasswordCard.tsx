import React from 'react';
import { usePasswordOtpFlow } from '../hooks/usePasswordOtpFlow';
import PasswordCredentialsStep from '../components/Security/PasswordCredentialsStep';
import PasswordOtpStep from '../components/Security/PasswordOtpStep';
import PasswordSuccessStep from '../components/Security/PasswordSuccessStep';
import { KeyRound, ShieldAlert, MailCheck, CheckCircle2, Shield } from 'lucide-react';

interface Props {
    className?: string;
    userEmail?: string;
}

export default function UpdatePasswordCard({ className = '', userEmail }: Props) {
    const flow = usePasswordOtpFlow({ userEmail });

    const steps = [
        { id: 'credentials', label: '1. Credentials', icon: KeyRound },
        { id: 'otp', label: '2. Email OTP', icon: MailCheck },
        { id: 'success', label: '3. Complete', icon: CheckCircle2 },
    ];

    return (
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${className}`}>
            {/* Left Column: Security Advisory & Policy */}
            <div className="lg:col-span-4 space-y-6">
                <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-red-900" />
                        <h3 className="text-xs font-bold font-serif text-slate-900 uppercase tracking-wider">
                            Security Protocol
                        </h3>
                    </div>

                    <div className="p-5 space-y-4 text-xs">
                        <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-lg bg-red-50 text-red-900 flex items-center justify-center shrink-0 mt-0.5 border border-red-100">
                                <KeyRound className="w-3.5 h-3.5" />
                            </div>
                            <div className="space-y-1">
                                <span className="font-semibold text-slate-800 block">
                                    Two-Factor Authorization
                                </span>
                                <p className="text-slate-500 leading-relaxed text-[11px]">
                                    Password updates require real-time verification of a 6-digit one-time PIN dispatched to your registered institutional address.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 pt-3 border-t border-slate-100">
                            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-900 flex items-center justify-center shrink-0 mt-0.5 border border-amber-200">
                                <ShieldAlert className="w-3.5 h-3.5" />
                            </div>
                            <div className="space-y-1">
                                <span className="font-semibold text-slate-800 block">
                                    Audited Transaction
                                </span>
                                <p className="text-slate-500 leading-relaxed text-[11px]">
                                    All credential updates are permanently recorded in the institutional security ledger with client IP and browser fingerprints.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 pt-3 border-t border-slate-100">
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-900 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                            <div className="space-y-1">
                                <span className="font-semibold text-slate-800 block">
                                    Session Invalidation
                                </span>
                                <p className="text-slate-500 leading-relaxed text-[11px]">
                                    Modifying your password ensures active sessions on secondary devices are terminated for institutional safety.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50/80 border-t border-slate-100 text-[11px] text-slate-500">
                        Institutional Email: <span className="font-mono font-semibold text-slate-700">{userEmail || 'Configured address'}</span>
                    </div>
                </div>
            </div>

            {/* Right Column: Interactive Password Flow Form */}
            <div className="lg:col-span-8">
                <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
                    {/* Top Decorative Line */}
                    <div className="h-1 bg-red-900 w-full" />

                    {/* Section Header */}
                    <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-900 border border-red-100 flex items-center justify-center shrink-0">
                                <KeyRound className="w-4 h-4" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold font-serif text-slate-900">
                                    Security Credentials
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Update your account password with two-step institutional verification
                                </p>
                            </div>
                        </div>

                        {/* Step Progression Pills */}
                        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100/90 p-1 rounded-lg border border-slate-200">
                            {steps.map((s, idx) => {
                                const isCurrent = flow.step === s.id;
                                const isPast =
                                    (flow.step === 'otp' && idx === 0) ||
                                    (flow.step === 'success' && idx < 2);

                                return (
                                    <div
                                        key={s.id}
                                        className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                                            isCurrent
                                                ? 'bg-white text-red-950 shadow-2xs border border-slate-200/80'
                                                : isPast
                                                ? 'text-emerald-700'
                                                : 'text-slate-400'
                                        }`}
                                    >
                                        <s.icon className={`w-3 h-3 ${isCurrent ? 'text-red-900' : isPast ? 'text-emerald-600' : 'text-slate-400'}`} />
                                        <span className="hidden sm:inline">{s.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-6 sm:p-7">
                        {flow.step === 'credentials' && (
                            <PasswordCredentialsStep
                                currentPassword={flow.currentPassword}
                                setCurrentPassword={flow.setCurrentPassword}
                                newPassword={flow.newPassword}
                                setNewPassword={flow.setNewPassword}
                                confirmPassword={flow.confirmPassword}
                                setConfirmPassword={flow.setConfirmPassword}
                                showCurrentPassword={flow.showCurrentPassword}
                                setShowCurrentPassword={flow.setShowCurrentPassword}
                                showNewPassword={flow.showNewPassword}
                                setShowNewPassword={flow.setShowNewPassword}
                                showConfirmPassword={flow.showConfirmPassword}
                                setShowConfirmPassword={flow.setShowConfirmPassword}
                                hasMinLength={flow.hasMinLength}
                                passwordsMatch={flow.passwordsMatch}
                                isStep1Valid={flow.isStep1Valid}
                                isSubmitting={flow.isSubmitting}
                                errors={flow.errors}
                                currentPasswordInputRef={flow.currentPasswordInputRef}
                                newPasswordInputRef={flow.newPasswordInputRef}
                                onSubmit={flow.handleRequestOtp}
                                onReset={flow.handleResetAll}
                            />
                        )}

                        {flow.step === 'otp' && (
                            <PasswordOtpStep
                                maskedEmail={flow.maskedEmail}
                                otpDigits={flow.otpDigits}
                                otpInputRefs={flow.otpInputRefs}
                                timeRemaining={flow.timeRemaining}
                                resendCooldown={flow.resendCooldown}
                                remainingAttempts={flow.remainingAttempts}
                                isExpired={flow.isExpired}
                                isMaxAttemptsExceeded={flow.isMaxAttemptsExceeded}
                                isRateLimited={flow.isRateLimited}
                                isVerifyingSuccess={flow.isVerifyingSuccess}
                                isSubmitting={flow.isSubmitting}
                                isResending={flow.isResending}
                                errors={flow.errors}
                                isOtpComplete={flow.isOtpComplete}
                                formatCooldown={flow.formatCooldown}
                                onOtpChange={flow.handleOtpChange}
                                onOtpKeyDown={flow.handleOtpKeyDown}
                                onOtpPaste={flow.handleOtpPaste}
                                onSubmit={flow.handleVerifyOtp}
                                onResend={flow.handleResendOtp}
                                onBack={flow.handleBackToCredentials}
                            />
                        )}

                        {flow.step === 'success' && (
                            <PasswordSuccessStep onDone={flow.handleResetAll} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
