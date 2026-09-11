import AuthAlert from '@/Components/Auth/AuthAlert';
import AuthHeader from '@/Components/Auth/AuthHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import CompactAuthLayout from '@/Layouts/Auth/CompactAuthLayout';
import { PageProps } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { VerifyEmailPageProps } from './types';

export default function VerifyEmail({
    status,
    flash,
}: VerifyEmailPageProps) {
    const { branding } = usePage<PageProps>().props;
    const institutionName = branding?.institutionName || 'University of Camarines Norte';

    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    const isLinkSent = status === 'verification-link-sent';

    return (
        <CompactAuthLayout
            maxWidth="md"
            headerSlot={
                <AuthHeader
                    title="Verify Your Email"
                    description="A verification link has been dispatched to your institutional email address. Follow the link to activate your account."
                />
            }
        >
            <Head title={`Verify Email | ${institutionName}`} />

            {/* Notification Alerts */}
            {isLinkSent && (
                <AuthAlert variant="success" className="mb-5">
                    A new verification link has been sent to your institutional email address.
                </AuthAlert>
            )}

            {flash?.error && (
                <AuthAlert variant="error" className="mb-5">
                    {flash.error}
                </AuthAlert>
            )}

            {flash?.warning && (
                <AuthAlert variant="warning" className="mb-5">
                    {flash.warning}
                </AuthAlert>
            )}

            <div className="text-xs text-stone-600 leading-relaxed bg-stone-50 border border-stone-200/80 rounded-lg p-4 mb-5">
                <p>
                    Before accessing administrative records, please verify your email address by clicking on the verification link sent to your inbox. If you did not receive the email, you may request another link below.
                </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <PrimaryButton
                    type="submit"
                    className="w-full justify-center py-2.5 px-4 bg-red-900 hover:bg-red-950 focus:bg-red-950 active:bg-red-950 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                    disabled={processing}
                    aria-busy={processing}
                >
                    {processing ? 'Sending Verification Link...' : 'Resend Verification Email'}
                </PrimaryButton>

                <div className="text-center">
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="text-xs font-semibold text-stone-600 hover:text-red-900 hover:underline transition-colors"
                    >
                        Sign Out of Session
                    </Link>
                </div>
            </form>
        </CompactAuthLayout>
    );
}