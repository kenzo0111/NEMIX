import AuthHeader from '@/Components/Auth/AuthHeader';
import PasswordField from '@/Components/Auth/PasswordField';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import CompactAuthLayout from '@/Layouts/Auth/CompactAuthLayout';
import { PageProps } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Mail } from 'lucide-react';
import { FormEventHandler } from 'react';
import { ResetPasswordPageProps } from './types';

export default function ResetPassword({
    token,
    email,
}: ResetPasswordPageProps) {
    const { branding } = usePage<PageProps>().props;
    const institutionName = branding?.institutionName || 'University of Camarines Norte';

    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <CompactAuthLayout
            headerSlot={
                <AuthHeader
                    title="Create New Password"
                    description="Enter your new institutional account password to restore secure administrative access."
                />
            }
        >
            <Head title={`Reset Password | ${institutionName}`} />

            <form onSubmit={submit} className="space-y-4">
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
                            className="pl-10 block w-full rounded-lg border-stone-300 shadow-xs py-2.5 text-sm bg-stone-100 text-stone-600 cursor-not-allowed"
                            autoComplete="username"
                            onChange={(e) => setData('email', e.target.value)}
                            disabled={true}
                            readOnly={true}
                        />
                    </div>
                    <InputError message={errors.email} className="mt-1.5 text-xs" />
                </div>

                {/* New Password */}
                <PasswordField
                    id="password"
                    label="New Password"
                    value={data.password}
                    error={errors.password}
                    autoComplete="new-password"
                    autoFocus={true}
                    onChange={(e) => setData('password', e.target.value)}
                    required
                />

                {/* Confirm Password */}
                <PasswordField
                    id="password_confirmation"
                    label="Confirm New Password"
                    value={data.password_confirmation}
                    error={errors.password_confirmation}
                    autoComplete="new-password"
                    onChange={(e) => setData('password_confirmation', e.target.value)}
                    required
                />

                <div className="pt-2">
                    <PrimaryButton
                        type="submit"
                        className="w-full justify-center py-2.5 px-4 bg-red-900 hover:bg-red-950 focus:bg-red-950 active:bg-red-950 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                        disabled={processing}
                        aria-busy={processing}
                    >
                        {processing ? 'Resetting Password...' : 'Reset Password'}
                    </PrimaryButton>
                </div>
            </form>
        </CompactAuthLayout>
    );
}