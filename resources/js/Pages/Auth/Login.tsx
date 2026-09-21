import AuthAlert from '@/Components/Auth/AuthAlert';
import AuthSubmitButton from '@/Components/Auth/AuthSubmitButton';
import PasswordField from '@/Components/Auth/PasswordField';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import FullAuthLayout from '@/Layouts/Auth/FullAuthLayout';
import { PageProps } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Mail } from 'lucide-react';
import { FormEventHandler } from 'react';
import { LoginPageProps } from './types';

export default function Login({
    status,
    canResetPassword,
}: LoginPageProps) {
    const { branding } = usePage<PageProps>().props;
    const institutionName = branding?.institutionName || 'University of Camarines Norte';

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
            badgeText="Official Portal"
            headline="Supply &amp; Property Management System"
            subheadline="Centralized consumable inventory records, stock movement control, and verified property tracking."
            headerSlot={
                <div className="mb-6 pb-3.5 border-b border-stone-200 dark:border-slate-800">
                    <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-slate-100 font-serif tracking-tight">
                        Administrative Login
                    </h2>
                    <p className="text-sm text-stone-600 dark:text-slate-300 mt-1 font-sans">
                        Sign in using your authorized institutional account.
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
                            <Mail className="w-4 h-4" aria-hidden="true" />
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

                {/* Primary Action Button */}
                <div className="pt-2.5">
                    <AuthSubmitButton
                        processing={processing}
                        loadingText="Signing in..."
                    >
                        Sign In
                    </AuthSubmitButton>
                </div>
            </form>
        </FullAuthLayout>
    );
}