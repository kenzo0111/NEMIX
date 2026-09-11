import AuthHeader from '@/Components/Auth/AuthHeader';
import PasswordField from '@/Components/Auth/PasswordField';
import PrimaryButton from '@/Components/PrimaryButton';
import CompactAuthLayout from '@/Layouts/Auth/CompactAuthLayout';
import { PageProps } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { ConfirmPasswordPageProps } from './types';

export default function ConfirmPassword(_props: ConfirmPasswordPageProps) {
    const { branding } = usePage<PageProps>().props;
    const institutionName = branding?.institutionName || 'University of Camarines Norte';

    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <CompactAuthLayout
            maxWidth="md"
            headerSlot={
                <AuthHeader
                    title="Confirm Password"
                    description="This is a secure institutional area. Please confirm your password before continuing."
                />
            }
        >
            <Head title={`Confirm Password | ${institutionName}`} />

            <form onSubmit={submit} className="space-y-4">
                <PasswordField
                    id="password"
                    label="Current Password"
                    value={data.password}
                    error={errors.password}
                    autoComplete="current-password"
                    autoFocus={true}
                    onChange={(e) => setData('password', e.target.value)}
                    required
                />

                <div className="pt-2">
                    <PrimaryButton
                        type="submit"
                        className="w-full justify-center py-2.5 px-4 bg-red-900 hover:bg-red-950 focus:bg-red-950 active:bg-red-950 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                        disabled={processing}
                        aria-busy={processing}
                    >
                        {processing ? 'Confirming...' : 'Confirm'}
                    </PrimaryButton>
                </div>
            </form>
        </CompactAuthLayout>
    );
}