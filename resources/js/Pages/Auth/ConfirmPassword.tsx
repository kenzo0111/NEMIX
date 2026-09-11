import AuthHeader from '@/Components/Auth/AuthHeader';
import AuthSubmitButton from '@/Components/Auth/AuthSubmitButton';
import PasswordField from '@/Components/Auth/PasswordField';
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
                    description="For security, confirm your current password before continuing."
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
                    <AuthSubmitButton
                        processing={processing}
                        loadingText="Confirming..."
                    >
                        Confirm
                    </AuthSubmitButton>
                </div>
            </form>
        </CompactAuthLayout>
    );
}