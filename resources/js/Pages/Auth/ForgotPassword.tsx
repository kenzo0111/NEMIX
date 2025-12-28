import ApplicationLogo from '@/Components/ApplicationLogo';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <>
            <Head title="Forgot Password" />

            {/* MAIN CONTAINER: Matches Login Background */}
            <div 
                className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden" 
                style={{
                    backgroundImage: 'url(/images/cnsc-campus-bg.jpg)', 
                    backgroundSize: 'cover', 
                    backgroundPosition: 'center'
                }}
            >
                {/* === ENHANCED OVERLAY SYSTEM (Same as Login) === */}
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
                    <div className="mb-6 text-center">
                        <div className="inline-flex justify-center mb-4">
                            <div className="bg-white p-2 rounded-full shadow-lg border border-yellow-500/30">
                                {/* Assuming you have the logo image available, otherwise use SVG */}
                                <img src="/images/cnscrefine.png" alt="CNSC Logo" className="h-12 w-12 object-contain" /> 
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 font-serif">Account Recovery</h2>
                        <p className="text-sm text-gray-500 mt-2 font-medium">Supply and Property Management Office</p>
                    </div>

                    <div className="mb-6 text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
                        Forgot your password? No problem. Just let us know your email
                        address and we will email you a password reset link that will
                        allow you to choose a new one.
                    </div>

                    {status && (
                        <div className="mb-6 bg-green-50 border-l-4 border-green-600 p-4 rounded-r shadow-sm">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-green-800">{status}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <InputLabel htmlFor="email" value="Official Email Address" className="text-gray-700 font-bold" />
                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-900 focus:ring-red-900 transition-all py-3 bg-gray-50 focus:bg-white"
                                isFocused={true}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="juandelacruz@cnsc.edu.ph"
                            />
                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        <div className="flex flex-col gap-4">
                            <PrimaryButton 
                                className="w-full justify-center bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 text-white font-bold py-3 rounded shadow-lg shadow-red-900/20 border-b-4 border-red-950 active:border-b-0 active:mt-1 active:shadow-none transition-all text-sm tracking-wide" 
                                disabled={processing}
                            >
                                {processing ? 'Sending Link...' : 'Email Password Reset Link'}
                            </PrimaryButton>

                            <Link 
                                href={route('login')}
                                className="text-center text-sm text-gray-500 hover:text-red-800 hover:underline transition-colors"
                            >
                                &larr; Return to Login
                            </Link>
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