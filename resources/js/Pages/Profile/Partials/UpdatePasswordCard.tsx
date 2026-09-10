import React from 'react';
import { usePasswordOtpFlow } from '../hooks/usePasswordOtpFlow';
import PasswordCredentialsStep from '../components/Security/PasswordCredentialsStep';
import PasswordOtpStep from '../components/Security/PasswordOtpStep';
import PasswordSuccessStep from '../components/Security/PasswordSuccessStep';
import { KeyRound } from 'lucide-react';

interface Props {
    className?: string;
    userEmail?: string;
}

export default function UpdatePasswordCard({ className = '', userEmail }: Props) {
    const flow = usePasswordOtpFlow({ userEmail });

    return (
        <div className={`bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden ${className}`}>
            {/* Section Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-50 text-red-900 border border-red-100 flex items-center justify-center shrink-0">
                        <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold font-serif text-slate-900">
                            Security Credentials
                        </h2>
                        <p className="text-xs text-slate-500">
                            Update your account password using two-step institutional email verification
                        </p>
                    </div>
                </div>

                {/* Minimalist Step Indicator */}
                {flow.step !== 'success' && (
                    <div className="text-xs font-mono text-slate-500 hidden sm:block">
                        Step {flow.step === 'credentials' ? '1 of 2' : '2 of 2'}
                    </div>
                )}
            </div>

            <div className="p-6">
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
    );
}
