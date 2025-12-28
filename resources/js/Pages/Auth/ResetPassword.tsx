import ApplicationLogo from '@/Components/ApplicationLogo';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ResetPassword({
    token,
    email,
}: {
    token: string;
    email: string;
}) {
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
        <>
            <Head title="Reset Password" />

            {/* MAIN CONTAINER: Consistent Academic Background */}
            <div 
                className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden" 
                style={{
                    backgroundImage: 'url(/images/cnsc-campus-bg.jpg)', 
                    backgroundSize: 'cover', 
                    backgroundPosition: 'center'
                }}
            >
                {/* === ENHANCED OVERLAY SYSTEM === */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    {/* Layer 1: Deep Maroon Tint */}
                    <div className="absolute inset-0 bg-red-950/80 mix-blend-multiply"></div>
                    {/* Layer 2: Black Fade */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80"></div>
                    {/* Layer 3: Academic Gold Glow */}
                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-yellow-600/40 via-orange-900/20 to-transparent mix-blend-overlay"></div>
                    {/* Layer 4: Texture */}
                    <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
                </div>

                {/* CARD CONTAINER */}
                <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-md rounded-xl shadow-2xl shadow-black/50 border border-white/20 p-8 sm:p-10">
                    
                    {/* Decorative Top Line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-900 via-red-700 to-yellow-500 rounded-t-xl"></div>

                    {/* Header Section */}
                    <div className="mb-8 text-center">
                        <div className="inline-flex justify-center mb-4">
                            <div className="bg-white p-2 rounded-full shadow-lg border border-yellow-500/30">
                                <img src="/images/cnscrefine.png" alt="CNSC Logo" className="h-12 w-12 object-contain" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 font-serif">Create New Password</h2>
                        <p className="text-sm text-gray-500 mt-2 font-medium">Secure your account access</p>
                    </div>

                    <form onSubmit={submit} className="space-y-6">
                        {/* Email Address */}
                        <div>
                            <InputLabel htmlFor="email" value="Email Address" className="text-gray-700 font-bold" />
                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-900 focus:ring-red-900 transition-all py-3 bg-gray-50 focus:bg-white"
                                autoComplete="username"
                                onChange={(e) => setData('email', e.target.value)}
                                disabled={true} // Usually reset links are bound to the email, making this readonly implies security
                            />
                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        {/* New Password */}
                        <div>
                            <InputLabel htmlFor="password" value="New Password" className="text-gray-700 font-bold" />
                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-900 focus:ring-red-900 transition-all py-3 bg-gray-50 focus:bg-white"
                                autoComplete="new-password"
                                isFocused={true}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="••••••••"
                            />
                            <InputError message={errors.password} className="mt-2" />
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <InputLabel htmlFor="password_confirmation" value="Confirm New Password" className="text-gray-700 font-bold" />
                            <TextInput
                                type="password"
                                name="password_confirmation"
                                value={data.password_confirmation}
                                className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-900 focus:ring-red-900 transition-all py-3 bg-gray-50 focus:bg-white"
                                autoComplete="new-password"
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                placeholder="••••••••"
                            />
                            <InputError message={errors.password_confirmation} className="mt-2" />
                        </div>

                        <div className="pt-2">
                            <PrimaryButton 
                                className="w-full justify-center bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 text-white font-bold py-3 rounded shadow-lg shadow-red-900/20 border-b-4 border-red-950 active:border-b-0 active:mt-1 active:shadow-none transition-all text-sm tracking-wide"
                                disabled={processing}
                            >
                                {processing ? 'Updating...' : 'Reset Password'}
                            </PrimaryButton>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 pt-4 border-t border-gray-100 text-center">
                        <p className="text-xs text-gray-400">
                            &copy; 2025 Camarines Norte State College.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}