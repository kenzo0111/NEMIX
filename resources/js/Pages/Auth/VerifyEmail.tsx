import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <>
            <Head title="Email Verification" />

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
                        <h2 className="text-2xl font-bold text-gray-900 font-serif">Verify Email Address</h2>
                        <p className="text-sm text-gray-500 mt-2 font-medium">Complete your registration</p>
                    </div>

                    {/* Info Block */}
                    <div className="mb-6 text-sm text-gray-600 leading-relaxed bg-gray-50 p-5 rounded-lg border border-gray-200">
                        <p className="mb-2 font-bold text-gray-800">Thanks for signing up!</p>
                        <p>
                            Before getting started, could you verify your email address by clicking on the link we just emailed to you? 
                            If you didn't receive the email, we will gladly send you another.
                        </p>
                    </div>

                    {status === 'verification-link-sent' && (
                        <div className="mb-6 bg-green-50 border-l-4 border-green-600 p-4 rounded-r shadow-sm animate-fade-in">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-green-800">
                                        A new verification link has been sent to the email address you provided during registration.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-6">
                        <div className="flex flex-col gap-4">
                            <PrimaryButton 
                                className="w-full justify-center bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 text-white font-bold py-3 rounded shadow-lg shadow-red-900/20 border-b-4 border-red-950 active:border-b-0 active:mt-1 active:shadow-none transition-all text-sm tracking-wide"
                                disabled={processing}
                            >
                                {processing ? 'Sending...' : 'Resend Verification Email'}
                            </PrimaryButton>

                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="text-center text-sm text-gray-500 hover:text-red-800 hover:underline transition-colors font-medium"
                            >
                                Log Out
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