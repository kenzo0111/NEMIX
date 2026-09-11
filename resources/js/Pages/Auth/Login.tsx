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
            badgeText="Institutional Access"
            headline="Smart Supply and Inventory Management System"
            subheadline="RFID Inventory Tracking and Automated Reporting"
            headerSlot={
                <div className="mb-5 pb-3 border-b border-stone-200/80">
                    <h2 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif tracking-tight">
                        Administrative Login
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-600 mt-1">
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

            <form onSubmit={submit} className="space-y-4">
                {/* Official Email Address */}
                <div>
                    <InputLabel htmlFor="email" value="Official Email Address" className="text-stone-800 font-semibold text-sm mb-1.5" />
                    <div className="relative rounded-lg shadow-2xs">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                            <Mail className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="pl-10 block w-full rounded-lg border-stone-300 shadow-2xs focus:border-red-900 focus:ring-2 focus:ring-red-900/20 transition-colors py-2.5 text-sm bg-stone-50/60 focus:bg-white"
                            autoComplete="username"
                            isFocused={true}
                            onChange={(e) => setData('email', e.target.value)}
                            required
                            placeholder="username@ucn.edu.ph"
                        />
                    </div>
                    <InputError message={errors.email} className="mt-1.5 text-xs" />
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

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="rounded border-stone-300 text-red-900 focus:ring-red-900/30"
                        />
                        <span className="text-xs text-stone-700 font-medium">Remember me</span>
                    </label>

                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="text-xs font-semibold text-red-900 hover:text-red-950 hover:underline transition-colors"
                        >
                            Forgot password?
                        </Link>
                    )}
                </div>

                {/* Primary Action Button */}
                <div className="pt-2">
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