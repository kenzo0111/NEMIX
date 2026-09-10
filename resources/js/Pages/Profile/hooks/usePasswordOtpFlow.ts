import { useState, useEffect, useRef, FormEventHandler, KeyboardEvent, ClipboardEvent } from 'react';
import axios from 'axios';
import { PasswordStep, FieldErrors } from '../types';

interface UsePasswordOtpFlowOptions {
    userEmail?: string;
}

export function usePasswordOtpFlow({ userEmail }: UsePasswordOtpFlowOptions = {}) {
    const [step, setStep] = useState<PasswordStep>('credentials');

    // Credentials State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // OTP State
    const [otpToken, setOtpToken] = useState('');
    const [maskedEmail, setMaskedEmail] = useState('');
    const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
    const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Timers & Security Limits
    const [resendCooldown, setResendCooldown] = useState<number>(0);
    const [expiresAt, setExpiresAt] = useState<Date | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<string>('05:00');
    const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
    const [isExpired, setIsExpired] = useState<boolean>(false);
    const [isMaxAttemptsExceeded, setIsMaxAttemptsExceeded] = useState<boolean>(false);
    const [isVerifyingSuccess, setIsVerifyingSuccess] = useState<boolean>(false);
    const [isRateLimited, setIsRateLimited] = useState<boolean>(false);

    // Processing & Errors
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [errors, setErrors] = useState<FieldErrors>({});

    const currentPasswordInputRef = useRef<HTMLInputElement>(null);
    const newPasswordInputRef = useRef<HTMLInputElement>(null);

    // Password validation rules
    const hasMinLength = newPassword.length >= 8;
    const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
    const isStep1Valid = Boolean(currentPassword && hasMinLength && passwordsMatch);

    // Format seconds into mm:ss
    const formatCooldown = (seconds: number): string => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    // Cooldown interval
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => {
            setResendCooldown((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);

    // Expiration timer
    useEffect(() => {
        if (!expiresAt || step !== 'otp') return;

        const updateTimer = () => {
            const now = new Date().getTime();
            const distance = expiresAt.getTime() - now;

            if (distance <= 0) {
                setTimeRemaining('00:00');
                setIsExpired(true);
                return;
            }

            setIsExpired(false);
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

    // Auto-focus first digit cell upon entering OTP step
    useEffect(() => {
        if (step === 'otp' && !isExpired && !isMaxAttemptsExceeded) {
            const focusTimer = setTimeout(() => {
                otpInputRefs.current[0]?.focus();
            }, 100);
            return () => clearTimeout(focusTimer);
        }
    }, [step, isExpired, isMaxAttemptsExceeded]);

    // Step 1: Request OTP
    const handleRequestOtp: FormEventHandler = async (e) => {
        e.preventDefault();
        setErrors({});

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
                setMaskedEmail(response.data.masked_email || userEmail || 'your registered institutional email');
                if (response.data.expires_at) {
                    setExpiresAt(new Date(response.data.expires_at));
                } else {
                    setExpiresAt(new Date(Date.now() + 5 * 60 * 1000));
                }
                setResendCooldown(response.data.resend_available_in || 60);
                setOtpDigits(['', '', '', '', '', '']);
                setRemainingAttempts(5);
                setIsExpired(false);
                setIsMaxAttemptsExceeded(false);
                setIsVerifyingSuccess(false);
                setIsRateLimited(false);
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

    // OTP Input Change
    const handleOtpChange = (index: number, val: string) => {
        const cleanVal = val.replace(/\D/g, '');

        if (!cleanVal) {
            const next = [...otpDigits];
            next[index] = '';
            setOtpDigits(next);
            return;
        }

        const digit = cleanVal.slice(-1);
        const next = [...otpDigits];
        next[index] = digit;
        setOtpDigits(next);

        if (index < 5 && digit) {
            otpInputRefs.current[index + 1]?.focus();
        }
    };

    // OTP Backspace navigation
    const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (!otpDigits[index] && index > 0) {
                otpInputRefs.current[index - 1]?.focus();
            }
        }
    };

    // OTP Paste
    const handleOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
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

    const enteredOtp = otpDigits.join('');
    const isOtpComplete = enteredOtp.length === 6;

    // Step 2: Verify OTP
    const handleVerifyOtp: FormEventHandler = async (e) => {
        e.preventDefault();
        setErrors({});

        if (isExpired) {
            setErrors({ otp: 'This code has expired. Please request a new verification code.' });
            return;
        }

        if (isMaxAttemptsExceeded) {
            setErrors({ otp: 'Too many incorrect attempts. This code has been invalidated. Please request a new code.' });
            return;
        }

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
                setIsVerifyingSuccess(true);
                setTimeout(() => {
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setOtpDigits(['', '', '', '', '', '']);
                    setIsVerifyingSuccess(false);
                    setStep('success');
                }, 600);
            }
        } catch (err: any) {
            const resData = err.response?.data;
            const status = err.response?.status;

            if (resData?.expired) {
                setIsExpired(true);
                setTimeRemaining('00:00');
            }

            if (resData?.max_attempts_exceeded || resData?.remaining_attempts === 0) {
                setIsMaxAttemptsExceeded(true);
                setRemainingAttempts(0);
            } else if (typeof resData?.remaining_attempts === 'number') {
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
                setErrors({ otp: 'Failed to verify code. Please verify your connection and try again.' });
            }

            setOtpDigits(['', '', '', '', '', '']);
            if (!resData?.max_attempts_exceeded && !resData?.expired) {
                otpInputRefs.current[0]?.focus();
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Resend OTP
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
                    setExpiresAt(new Date(Date.now() + 5 * 60 * 1000));
                }
                setOtpDigits(['', '', '', '', '', '']);
                setRemainingAttempts(5);
                setIsExpired(false);
                setIsMaxAttemptsExceeded(false);
                setIsRateLimited(false);
                setTimeout(() => {
                    otpInputRefs.current[0]?.focus();
                }, 100);
            }
        } catch (err: any) {
            const resData = err.response?.data;
            if (resData?.rate_limited) {
                setIsRateLimited(true);
            }
            if (resData?.resend_available_in) {
                setResendCooldown(resData.resend_available_in);
            }
            if (resData?.errors?.otp) {
                const msg = Array.isArray(resData.errors.otp) ? resData.errors.otp[0] : resData.errors.otp;
                setErrors({ otp: msg });
            } else if (resData?.message) {
                setErrors({ otp: resData.message });
            } else {
                setErrors({ otp: 'Unable to resend verification code. Please try again.' });
            }
        } finally {
            setIsResending(false);
        }
    };

    // Return to Step 1 or reset all state
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
        setIsExpired(false);
        setIsMaxAttemptsExceeded(false);
        setIsVerifyingSuccess(false);
        setIsRateLimited(false);
    };

    const handleBackToCredentials = () => {
        setStep('credentials');
        setErrors({});
    };

    return {
        step,
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
        maskedEmail,
        otpDigits,
        otpInputRefs,
        resendCooldown,
        timeRemaining,
        remainingAttempts,
        isExpired,
        isMaxAttemptsExceeded,
        isVerifyingSuccess,
        isRateLimited,
        isSubmitting,
        isResending,
        errors,
        setErrors,
        currentPasswordInputRef,
        newPasswordInputRef,
        isOtpComplete,
        formatCooldown,
        handleRequestOtp,
        handleOtpChange,
        handleOtpKeyDown,
        handleOtpPaste,
        handleVerifyOtp,
        handleResendOtp,
        handleResetAll,
        handleBackToCredentials,
    };
}
