import AuthAlert from '@/Components/Auth/AuthAlert';
import AuthHeader from '@/Components/Auth/AuthHeader';
import AuthSubmitButton from '@/Components/Auth/AuthSubmitButton';
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
                    description="A verification link has been sent to your institutional email address. Check your inbox and follow the link to activate your account."
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

            <form onSubmit={submit} className="space-y-4">
                <AuthSubmitButton
                    processing={processing}
                    loadingText="Sending Verification Link..."
                >
                    Resend Verification Email
                </AuthSubmitButton>

                <div className="text-center">
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="text-xs font-semibold text-stone-600 hover:text-red-900 hover:underline transition-colors"
                    >
                        Log Out
                    </Link>
                </div>
            </form>
        </CompactAuthLayout>
    );
}