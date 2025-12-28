import ApplicationLogo from '@/Components/ApplicationLogo';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ConfirmPassword() {
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
        <>
            <Head title="Confirm Password" />

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
                                {/* Logo Placeholder */}
                                <img src="/images/cnscrefine.png" alt="CNSC Logo" className="h-12 w-12 object-contain" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 font-serif">Security Verification</h2>
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                            </span>
                            <p className="text-sm text-yellow-700 font-medium uppercase tracking-wider">Restricted Area</p>
                        </div>
                    </div>

                    {/* Notice Box */}
                    <div className="mb-6 bg-red-50 border-l-4 border-red-800 p-4 rounded-r">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-800" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-900">
                                    This is a secure area of the application. Please confirm your password before continuing.
                                </p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <InputLabel htmlFor="password" value="Confirm Current Password" className="text-gray-700 font-bold" />
                            
                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-900 focus:ring-red-900 transition-all py-3 bg-gray-50 focus:bg-white"
                                isFocused={true}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="••••••••"
                            />

                            <InputError message={errors.password} className="mt-2" />
                        </div>

                        <div className="flex justify-end pt-2">
                            <PrimaryButton 
                                className="w-full justify-center bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 text-white font-bold py-3 rounded shadow-lg shadow-red-900/20 border-b-4 border-red-950 active:border-b-0 active:mt-1 active:shadow-none transition-all text-sm tracking-wide" 
                                disabled={processing}
                            >
                                {processing ? 'Verifying...' : 'Confirm Authorization'}
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