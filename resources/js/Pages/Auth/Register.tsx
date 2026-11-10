import AuthAlert from '@/Components/Auth/AuthAlert';
import AuthHeader from '@/Components/Auth/AuthHeader';
import AuthSubmitButton from '@/Components/Auth/AuthSubmitButton';
import AuthTextInput from '@/Components/Auth/AuthTextInput';
import PasswordField from '@/Components/Auth/PasswordField';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
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
        post(route('register.invitation.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <FullAuthLayout
            badgeText="Staff Account Provisioning"
            headerSlot={
                <AuthHeader
                    title={isInvitation ? 'Complete Registration' : 'Account Registration'}
                    description={
                        isInvitation
                            ? 'Your staff account has been provisioned. Complete your account activation below.'
                            : 'Register your institutional credentials to activate official SPMO system access.'
                    }
                    showBranding={false}
                />
            }
        >
            <Head title={`${isInvitation ? 'Complete Registration' : 'Register'} | ${institutionName}`} />

            {isInvitation && (
                <AuthAlert variant="info" className="mb-5">
                    This activation is provisioned for <strong>{email}</strong>. Please confirm your name and set your account password.
                </AuthAlert>
            )}

            <form onSubmit={submit} className="space-y-5">
                {/* Full Name */}
                <div>
                    <InputLabel htmlFor="name" value="Full Name" className="text-stone-900 dark:text-slate-200 font-semibold text-sm mb-1.5 font-sans" />
                    <div className="relative rounded-lg shadow-2xs">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500 dark:text-slate-400">
                            <User className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <AuthTextInput
                            id="name"
                            name="name"
                            value={data.name}
                            className="pl-10"
                            autoComplete="name"
                            isFocused={true}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            placeholder="e.g. Juan A. Dela Cruz"
                        />
                    </div>
                    <InputError message={errors.name} className="mt-1.5 text-sm font-medium text-red-700 dark:text-red-400 font-sans" />
                </div>

                {/* Official Email */}
                <div>
                    <InputLabel htmlFor="email" value="Official Email Address" className="text-stone-900 dark:text-slate-200 font-semibold text-sm mb-1.5 font-sans" />
                    <div className="relative rounded-lg shadow-2xs">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500 dark:text-slate-400">
                            <Mail className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <AuthTextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="pl-10"
                            autoComplete="username"
                            onChange={(e) => setData('email', e.target.value)}
                            required
                            readOnly={isInvitation}
                            placeholder="username@ucn.edu.ph"
                        />
                    </div>
                    <InputError message={errors.email} className="mt-1.5 text-sm font-medium text-red-700 dark:text-red-400 font-sans" />
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
                <div className="pt-1 space-y-3">
                    <AuthSubmitButton
                        processing={processing}
                        loadingText={isInvitation ? 'Activating Account...' : 'Registering...'}
                    >
                        {isInvitation ? 'Activate Account' : 'Register Account'}
                    </AuthSubmitButton>

                    <div className="text-center">
                        <Link
                            href={route('login')}
                            className="text-sm font-semibold text-[#7B1113] dark:text-red-400 hover:text-[#5e0d0f] dark:hover:text-red-300 hover:underline transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7B1113] dark:focus-visible:ring-red-400 rounded-sm py-2 px-1 font-sans"
                        >
                            &larr; Already have an account? Sign In
                        </Link>
                    </div>
                </div>
            </form>
        </FullAuthLayout>
    );
}
