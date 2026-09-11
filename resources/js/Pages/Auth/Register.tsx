import AuthAlert from '@/Components/Auth/AuthAlert';
import PasswordField from '@/Components/Auth/PasswordField';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import FullAuthLayout from '@/Layouts/Auth/FullAuthLayout';
import { PageProps } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Mail, User } from 'lucide-react';
import { FormEventHandler } from 'react';
import { RegisterPageProps } from './types';

export default function Register({
    email,
    token,
}: RegisterPageProps) {
    const { branding } = usePage<PageProps>().props;
    const institutionName = branding?.institutionName || 'University of Camarines Norte';

    const isInvitation = Boolean(email && token);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: email ?? '',
        password: '',
        password_confirmation: '',
        token: token ?? '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <FullAuthLayout
            badgeText="Staff Account Provisioning"
            headline="Institutional Account Activation"
            subheadline="Activate your official credentials for the SPMO Smart Supply and Inventory System."
            headerSlot={
                <div className="mb-6 border-b border-stone-200/80 pb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif tracking-tight">
                        {isInvitation ? 'Complete Registration' : 'Staff Account Registration'}
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-500 mt-1">
                        {isInvitation
                            ? 'Your institutional account has been provisioned. Set your password to activate system access.'
                            : 'Register your personnel credentials to activate official SPMO system access.'}
                    </p>
                </div>
            }
        >
            <Head title={`${isInvitation ? 'Complete Registration' : 'Register'} | ${institutionName}`} />

            {isInvitation && (
                <AuthAlert variant="info" className="mb-5">
                    This invitation is tied to <strong>{email}</strong>. Verify your full name and create your official password below.
                </AuthAlert>
            )}

            <form onSubmit={submit} className="space-y-4">
                {/* Full Name */}
                <div>
                    <InputLabel htmlFor="name" value="Full Name" className="text-stone-800 font-semibold text-sm mb-1.5" />
                    <div className="relative rounded-lg shadow-xs">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                            <User className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <TextInput
                            id="name"
                            name="name"
                            value={data.name}
                            className="pl-10 block w-full rounded-lg border-stone-300 shadow-xs focus:border-red-900 focus:ring-2 focus:ring-red-900/20 transition-colors py-2.5 text-sm bg-stone-50/60 focus:bg-white"
                            autoComplete="name"
                            isFocused={true}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            placeholder="e.g. Juan A. Dela Cruz"
                        />
                    </div>
                    <InputError message={errors.name} className="mt-1.5 text-xs" />
                </div>

                {/* Official Email */}
                <div>
                    <InputLabel htmlFor="email" value="Official Email Address" className="text-stone-800 font-semibold text-sm mb-1.5" />
                    <div className="relative rounded-lg shadow-xs">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                            <Mail className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className={`pl-10 block w-full rounded-lg border-stone-300 shadow-xs focus:border-red-900 focus:ring-2 focus:ring-red-900/20 transition-colors py-2.5 text-sm ${
                                isInvitation ? 'bg-stone-100 text-stone-600 cursor-not-allowed' : 'bg-stone-50/60 focus:bg-white'
                            }`}
                            autoComplete="username"
                            onChange={(e) => setData('email', e.target.value)}
                            required
                            readOnly={isInvitation}
                            placeholder="username@ucn.edu.ph"
                        />
                    </div>
                    <InputError message={errors.email} className="mt-1.5 text-xs" />
                </div>

                {/* Password */}
                <PasswordField
                    id="password"
                    label="Password"
                    value={data.password}
                    error={errors.password}
                    autoComplete="new-password"
                    onChange={(e) => setData('password', e.target.value)}
                    required
                />

                {/* Confirm Password */}
                <PasswordField
                    id="password_confirmation"
                    label="Confirm Password"
                    value={data.password_confirmation}
                    error={errors.password_confirmation}
                    autoComplete="new-password"
                    onChange={(e) => setData('password_confirmation', e.target.value)}
                    required
                />

                {/* Actions */}
                <div className="pt-2 space-y-3">
                    <PrimaryButton
                        type="submit"
                        className="w-full justify-center py-2.5 px-4 bg-red-900 hover:bg-red-950 focus:bg-red-950 active:bg-red-950 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                        disabled={processing}
                        aria-busy={processing}
                    >
                        {processing
                            ? (isInvitation ? 'Activating Account...' : 'Registering...')
                            : (isInvitation ? 'Activate Account' : 'Register Account')}
                    </PrimaryButton>

                    <div className="text-center">
                        <Link
                            href={route('login')}
                            className="text-xs font-semibold text-red-900 hover:text-red-950 hover:underline transition-colors"
                        >
                            &larr; Already have an account? Sign In
                        </Link>
                    </div>
                </div>
            </form>
        </FullAuthLayout>
    );
}
