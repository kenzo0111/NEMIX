import { DialogHeader, DialogBody, DialogFooter } from '@/Components/ui/dialog-frame';
import { Button } from '@/Components/ui/button';
import AuthAlert from '@/Components/Auth/AuthAlert';
import AuthHeader from '@/Components/Auth/AuthHeader';
import AuthSubmitButton from '@/Components/Auth/AuthSubmitButton';
import AuthTextInput from '@/Components/Auth/AuthTextInput';
import PasswordField from '@/Components/Auth/PasswordField';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import FullAuthLayout from '@/Layouts/Auth/FullAuthLayout';
import { PageProps } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowRight, HelpCircle, Mail, X } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import { LoginPageProps } from './types';

export default function Login({
    status,
    canResetPassword,
}: LoginPageProps) {
    const { branding } = usePage<PageProps>().props;
    const institutionName = branding?.institutionName || 'University of Camarines Norte';
    const officeName = branding?.officeName || 'Supply & Property Management Office (SPMO)';

    const [showHelpModal, setShowHelpModal] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <FullAuthLayout
            badgeText="INSTITUTIONAL ACCESS"
            headerSlot={
                <AuthHeader
                    title="Welcome back"
                    description="Sign in to your institutional account to access SupplySync."
                    showBranding={false}
                />
            }
        >
            <Head title={`Administrative Login | ${institutionName}`} />

            {status && (
                <AuthAlert variant="success" className="mb-5">
                    {status}
                </AuthAlert>
            )}

            <form onSubmit={submit} className="space-y-5">
                {/* Official Email Address */}
                <div>
                    <InputLabel
                        htmlFor="email"
                        value="Official Email Address"
                        className="text-slate-900 dark:text-slate-200 font-semibold text-sm mb-1.5 font-sans"
                    />
                    <div className="relative rounded-lg shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 dark:text-slate-400">
                            <Mail className="w-4 h-4 text-slate-500 dark:text-slate-400" strokeWidth={2} aria-hidden="true" />
                        </div>
                        <AuthTextInput aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined}
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="pl-10"
                            autoComplete="username"
                            isFocused={true}
                            onChange={(e) => setData('email', e.target.value)}
                            required
                            placeholder="username@ucn.edu.ph"
                        />
                    </div>
                    <InputError id="email-error" message={errors.email} className="mt-1.5 text-sm font-medium text-red-700 dark:text-red-400 font-sans" />
                </div>

                {/* Password Field */}
                <PasswordField
                    id="password"
                    label="Password"
                    value={data.password}
                    error={errors.password}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    onChange={(e) => setData('password', e.target.value)}
                    required
                />

                {/* Remember Me & Forgot Password - Connected Alignment */}
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <label className="inline-flex items-center gap-2.5 min-h-[44px] cursor-pointer select-none">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-red-900 dark:text-red-300 focus:ring-red-900/30 dark:focus:ring-red-300/40"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium font-sans">
                            Remember me
                        </span>
                    </label>

                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="text-sm font-semibold text-red-900 dark:text-red-300 hover:text-red-950 dark:hover:text-red-200 hover:underline transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-900 dark:focus-visible:ring-red-300 rounded-sm py-2 px-1 font-sans"
                        >
                            Forgot password?
                        </Link>
                    )}
                </div>

                {/* Primary Action Button - with increased space above */}
                <div className="pt-1">
                    <AuthSubmitButton
                        processing={processing}
                        loadingText="Signing in..."
                    >
                        Sign In
                        <ArrowRight className="w-5 h-5" aria-hidden="true" />
                    </AuthSubmitButton>
                </div>

                {/* Compact Institutional Support Link */}
                <div className="pt-5 border-t border-slate-200 dark:border-slate-800 text-center">
                    <Button variant="secondary"
                        type="button"
                        onClick={() => setShowHelpModal(true)}
                        className="inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1"
                        aria-haspopup="dialog"
                    >
                        <span>Need access help?</span>
                        <span className="font-semibold text-red-900 dark:text-red-400 hover:underline inline-flex items-center gap-1">
                            Contact IT support
                            <HelpCircle className="w-3.5 h-3.5 opacity-80" strokeWidth={2} aria-hidden="true" />
                        </span>
                    </Button>
                </div>
            </form>

            {/* Institutional Access Support Modal */}
            <Modal show={showHelpModal} onClose={() => setShowHelpModal(false)} maxWidth="md" ariaLabel="Institutional Access Support">
                <div className="h-1.5 w-full bg-gradient-to-r from-red-950 via-red-900 to-red-950 shrink-0" />
                <DialogHeader className="shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-900 dark:text-red-400 border border-red-100 dark:border-red-900/50 shrink-0">
                            <HelpCircle className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="break-words text-lg font-semibold text-slate-900 dark:text-slate-100 font-sans leading-tight">
                                Institutional Access Support
                            </h3>
                            <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 font-sans break-words mt-1">
                                {institutionName}
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" type="button" onClick={() => setShowHelpModal(false)} aria-label="Close modal">
                        <X className="w-5 h-5" />
                    </Button>
                </DialogHeader>

                <DialogBody className="space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                    <p>
                        Access to SupplySync is restricted to authorized personnel of <strong className="text-slate-800 dark:text-slate-100">{institutionName}</strong>.
                    </p>

                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/80 p-4 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                        <h4 className="text-base font-semibold text-slate-900 dark:text-slate-200 normal-case tracking-normal">
                            Official Assistance Channels
                        </h4>
                        <ul className="space-y-2 text-sm list-disc pl-4 text-slate-600 dark:text-slate-300">
                            <li>
                                <strong className="text-slate-800 dark:text-slate-200">Account Provisioning &amp; Clearances:</strong> Coordinate directly with the <span className="text-red-900 dark:text-red-400 font-medium">{officeName}</span>.
                            </li>
                            <li>
                                <strong className="text-slate-800 dark:text-slate-200">Network &amp; Credential Inquiries:</strong> Contact your campus Information &amp; Communications Technology (ICT / MIS) Unit during official university administrative hours.
                            </li>
                            <li>
                                <strong className="text-slate-800 dark:text-slate-200">Forgotten Password:</strong> If you already have an activated institutional account, you can initiate self-service recovery below.
                            </li>
                        </ul>
                    </div>
                </DialogBody>

                <DialogFooter className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
                    {canResetPassword ? (
                        <Link
                            href={route('password.request')}
                            className="text-sm font-semibold text-red-900 dark:text-red-400 hover:underline"
                        >
                            Go to Password Recovery &rarr;
                        </Link>
                    ) : (
                        <span />
                    )}
                    <Button variant="secondary"
                        type="button"
                        onClick={() => setShowHelpModal(false)}
                        className="w-full sm:w-auto"
                    >
                        Close
                    </Button>
                </DialogFooter>
            </Modal>
        </FullAuthLayout>
    );
}
