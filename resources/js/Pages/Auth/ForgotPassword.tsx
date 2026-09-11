import AuthAlert from '@/Components/Auth/AuthAlert';
import AuthHeader from '@/Components/Auth/AuthHeader';
import AuthSubmitButton from '@/Components/Auth/AuthSubmitButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import CompactAuthLayout from '@/Layouts/Auth/CompactAuthLayout';
import { PageProps } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Mail } from 'lucide-react';
import { FormEventHandler } from 'react';
import { ForgotPasswordPageProps } from './types';

export default function ForgotPassword({ status }: ForgotPasswordPageProps) {
    const { branding } = usePage<PageProps>().props;
    const institutionName = branding?.institutionName || 'University of Camarines Norte';

    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <CompactAuthLayout
            headerSlot={
                <AuthHeader
                    title="Password Recovery"
                    description="Enter your registered institutional email address. We will send a password reset link if the account is eligible."
                />
            }
        >
            <Head title={`Password Recovery | ${institutionName}`} />

            {status && (
                <AuthAlert variant="success" className="mb-5">
                    {status}
                </AuthAlert>
            )}

            <form onSubmit={submit} className="space-y-4">
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
                            isFocused={true}
                            onChange={(e) => setData('email', e.target.value)}
                            required
                            placeholder="username@ucn.edu.ph"
                        />
                    </div>
                    <InputError message={errors.email} className="mt-1.5 text-xs" />
                </div>

                <div className="pt-2 space-y-3">
                    <AuthSubmitButton
                        processing={processing}
                        loadingText="Sending Reset Link..."
                    >
                        Send Reset Link
                    </AuthSubmitButton>

                    <div className="text-center">
                        <Link
                            href={route('login')}
                            className="text-xs font-semibold text-red-900 hover:text-red-950 hover:underline transition-colors"
                        >
                            &larr; Return to Sign In
                        </Link>
                    </div>
                </div>
            </form>
        </CompactAuthLayout>
    );
}