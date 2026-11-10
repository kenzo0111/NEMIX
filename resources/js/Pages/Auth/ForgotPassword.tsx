import AuthAlert from '@/Components/Auth/AuthAlert';
import AuthHeader from '@/Components/Auth/AuthHeader';
import AuthSubmitButton from '@/Components/Auth/AuthSubmitButton';
import AuthTextInput from '@/Components/Auth/AuthTextInput';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
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

            <form onSubmit={submit} className="space-y-5">
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
                            isFocused={true}
                            onChange={(e) => setData('email', e.target.value)}
                            required
                            placeholder="username@ucn.edu.ph"
                        />
                    </div>
                    <InputError message={errors.email} className="mt-1.5 text-sm font-medium text-red-700 dark:text-red-400 font-sans" />
                </div>

                <div className="pt-1 space-y-3">
                    <AuthSubmitButton
                        processing={processing}
                        loadingText="Sending Reset Link..."
                    >
                        Send Reset Link
                    </AuthSubmitButton>

                    <div className="text-center">
                        <Link
                            href={route('login')}
                            className="text-sm font-semibold text-[#7B1113] dark:text-red-400 hover:text-[#5e0d0f] dark:hover:text-red-300 hover:underline transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7B1113] dark:focus-visible:ring-red-400 rounded-sm py-2 px-1 font-sans"
                        >
                            &larr; Return to Sign In
                        </Link>
                    </div>
                </div>
            </form>
        </CompactAuthLayout>
    );
}
