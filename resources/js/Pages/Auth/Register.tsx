import AuthAlert from '@/Components/Auth/AuthAlert';
import AuthSubmitButton from '@/Components/Auth/AuthSubmitButton';
import PasswordField from '@/Components/Auth/PasswordField';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
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
                <div className="mb-5 pb-3 border-b border-stone-200/80">
                    <h2 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif tracking-tight">
                        {isInvitation ? 'Complete Registration' : 'Account Registration'}
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-600 mt-1">
                        {isInvitation
                            ? 'Your staff account has been provisioned. Complete your account activation below.'
                            : 'Register your institutional credentials to activate official SPMO system access.'}
                    </p>
                </div>
            }
        >
            <Head title={`${isInvitation ? 'Complete Registration' : 'Register'} | ${institutionName}`} />

            {isInvitation && (
                <AuthAlert variant="info" className="mb-5">
                    This activation is provisioned for <strong>{email}</strong>. Please confirm your name and set your account password.
                </AuthAlert>
            )}

            <form onSubmit={submit} className="space-y-4">
                {/* Full Name */}
                <div>
                    <InputLabel htmlFor="name" value="Full Name" className="text-stone-800 font-semibold text-sm mb-1.5" />
                    <div className="relative rounded-lg shadow-2xs">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                            <User className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <TextInput
                            id="name"
                            name="name"
                            value={data.name}
                            className="pl-10 block w-full rounded-lg border-stone-300 shadow-2xs focus:border-red-900 focus:ring-2 focus:ring-red-900/20 transition-colors py-2.5 text-sm bg-stone-50/60 focus:bg-white"
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
                    <div className="relative rounded-lg shadow-2xs">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                            <Mail className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className={`pl-10 block w-full rounded-lg border-stone-300 shadow-2xs focus:border-red-900 focus:ring-2 focus:ring-red-900/20 transition-colors py-2.5 text-sm ${
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
                    <AuthSubmitButton
                        processing={processing}
                        loadingText={isInvitation ? 'Activating Account...' : 'Registering...'}
                    >
                        {isInvitation ? 'Activate Account' : 'Register Account'}
                    </AuthSubmitButton>

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
