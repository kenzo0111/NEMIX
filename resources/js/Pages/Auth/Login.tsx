import AuthAlert from '@/Components/Auth/AuthAlert';
import AuthSubmitButton from '@/Components/Auth/AuthSubmitButton';
import PasswordField from '@/Components/Auth/PasswordField';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import FullAuthLayout from '@/Layouts/Auth/FullAuthLayout';
import { PageProps } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { HelpCircle, Mail } from 'lucide-react';
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
            headline="Smart Supply and Inventory Management System"
            subheadline="RFID Inventory Tracking and Automated Reporting"
            headerSlot={
                <div className="mb-5 pb-3.5 border-b border-stone-200/80 dark:border-slate-800">
                    <h2 className="text-2xl font-bold text-stone-900 dark:text-slate-100 font-serif tracking-tight">
                        Administrative Login
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400 mt-1 font-sans">
                        Sign in using your institutional account.
                    </p>
                </div>
            }
        >
            <Head title={`Administrative Login | ${institutionName}`} />

            {status && (
                <AuthAlert variant="success" className="mb-5">
                    {status}
                </AuthAlert>
            )}

            <form onSubmit={submit} className="space-y-4.5">
                {/* Official Email Address */}
                <div>
                    <InputLabel
                        htmlFor="email"
                        value="Official Email Address"
                        className="text-stone-900 dark:text-slate-200 font-semibold text-sm mb-1.5 font-sans"
                    />
                    <div className="relative rounded-lg shadow-2xs">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500 dark:text-slate-400">
                            <Mail className="w-4 h-4 text-stone-500 dark:text-slate-400" strokeWidth={2} aria-hidden="true" />
                        </div>
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="pl-10 block w-full min-h-[44px] rounded-lg border-stone-300 dark:border-slate-700 shadow-2xs focus:border-[#7B1113] dark:focus:border-red-500 focus:ring-2 focus:ring-[#7B1113]/25 dark:focus:ring-red-500/30 transition-colors py-2.5 text-sm sm:text-base bg-stone-50/70 dark:bg-slate-850 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 font-sans"
                            autoComplete="username"
                            isFocused={true}
                            onChange={(e) => setData('email', e.target.value)}
                            required
                            placeholder="username@ucn.edu.ph"
                        />
                    </div>
                    <InputError message={errors.email} className="mt-1.5 text-xs sm:text-sm font-medium text-red-700 dark:text-red-400 font-sans" />
                </div>

                {/* Password Field */}
                <PasswordField
                    id="password"
                    label="Password"
                    value={data.password}
                    error={errors.password}
                    autoComplete="current-password"
                    onChange={(e) => setData('password', e.target.value)}
                    required
                />

                {/* Remember Me & Forgot Password - Connected Alignment */}
                <div className="flex items-center justify-between pt-1">
                    <label className="inline-flex items-center gap-2.5 min-h-[44px] cursor-pointer select-none">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="w-4 h-4 rounded border-stone-300 dark:border-slate-700 text-[#7B1113] dark:text-red-600 focus:ring-[#7B1113]/30 dark:focus:ring-red-500/40"
                        />
                        <span className="text-sm text-stone-700 dark:text-slate-300 font-medium font-sans">
                            Remember me
                        </span>
                    </label>

                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="text-sm font-semibold text-[#7B1113] dark:text-red-400 hover:text-[#5e0d0f] dark:hover:text-red-300 hover:underline transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7B1113] dark:focus-visible:ring-red-400 rounded-sm py-2 px-1 font-sans"
                        >
                            Forgot password?
                        </Link>
                    )}
                </div>

                {/* Primary Action Button - with increased space above */}
                <div className="pt-4 sm:pt-4.5">
                    <AuthSubmitButton
                        processing={processing}
                        loadingText="Signing in..."
                    >
                        Sign In
                    </AuthSubmitButton>
                </div>

                {/* Compact Institutional Support Link */}
                <div className="pt-2 text-center">
                    <button
                        type="button"
                        onClick={() => setShowHelpModal(true)}
                        className="inline-flex items-center justify-center gap-1.5 text-xs text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-slate-200 transition-colors font-sans focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7B1113] dark:focus-visible:ring-red-400 rounded px-2 py-1 cursor-pointer"
                        aria-haspopup="dialog"
                    >
                        <span>Need access help?</span>
                        <span className="font-semibold text-[#7B1113] dark:text-red-400 hover:underline inline-flex items-center gap-1">
                            Contact IT support
                            <HelpCircle className="w-3.5 h-3.5 opacity-80" strokeWidth={2} aria-hidden="true" />
                        </span>
                    </button>
                </div>
            </form>

            {/* Institutional Access Support Modal */}
            <Modal show={showHelpModal} onClose={() => setShowHelpModal(false)} maxWidth="md" ariaLabel="Institutional Access Support">
                <div className="p-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-stone-200 dark:border-slate-800">
                        <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/60 text-[#7B1113] dark:text-red-400 border border-red-100 dark:border-red-900/50 shrink-0">
                            <HelpCircle className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-slate-100 font-serif leading-tight">
                                Institutional Access Support
                            </h3>
                            <p className="text-xs text-stone-500 dark:text-slate-400 font-sans truncate mt-0.5">
                                {institutionName}
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 space-y-3.5 text-xs sm:text-sm text-stone-600 dark:text-slate-300 leading-relaxed font-sans">
                        <p>
                            Access to the Smart Supply and Inventory Management System is restricted to authorized personnel of <strong className="text-stone-800 dark:text-slate-100">{institutionName}</strong>.
                        </p>

                        <div className="rounded-lg bg-stone-50 dark:bg-slate-800/80 p-3.5 border border-stone-200/80 dark:border-slate-700/80 space-y-2">
                            <h4 className="font-semibold text-stone-900 dark:text-slate-200 text-xs uppercase tracking-wider">
                                Official Assistance Channels
                            </h4>
                            <ul className="space-y-2 text-xs list-disc pl-4 text-stone-600 dark:text-slate-300">
                                <li>
                                    <strong className="text-stone-800 dark:text-slate-200">Account Provisioning &amp; Clearances:</strong> Coordinate directly with the <span className="text-[#7B1113] dark:text-red-400 font-medium">{officeName}</span>.
                                </li>
                                <li>
                                    <strong className="text-stone-800 dark:text-slate-200">Network &amp; Credential Inquiries:</strong> Contact your campus Information &amp; Communications Technology (ICT / MIS) Unit during official university administrative hours.
                                </li>
                                <li>
                                    <strong className="text-stone-800 dark:text-slate-200">Forgotten Password:</strong> If you already have an activated institutional account, you can initiate self-service recovery below.
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-3 border-t border-stone-200/80 dark:border-slate-800">
                        {canResetPassword ? (
                            <Link
                                href={route('password.request')}
                                className="text-xs font-semibold text-[#7B1113] dark:text-red-400 hover:underline"
                            >
                                Go to Password Recovery &rarr;
                            </Link>
                        ) : (
                            <span />
                        )}
                        <button
                            type="button"
                            onClick={() => setShowHelpModal(false)}
                            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7B1113] cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>
        </FullAuthLayout>
    );
}