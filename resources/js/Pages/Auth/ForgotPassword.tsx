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
            <Head title="Forgot Password - University of Camarines Norte" />

            {/* MAIN CONTAINER */}
            <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden login-bg select-none">
                {/* === ENHANCED OVERLAY SYSTEM === */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    {/* Layer 1: Deep Maroon Tint */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-red-950/90 via-red-900/80 to-red-950/90 mix-blend-multiply"></div>

                    {/* Layer 2: Vignette / Ambient Shadow */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/40 to-black/90"></div>

                    {/* Layer 3: Academic Gold Glow Highlights */}
                    <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-yellow-500/20 via-amber-600/10 to-transparent blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-red-950/40 via-yellow-600/10 to-transparent blur-3xl"></div>

                    {/* Layer 4: Texture Grid */}
                    <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                </div>

                {/* CARD CONTAINER */}
                <div className="relative z-10 w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/60 border border-white/30 p-8 sm:p-10 select-text overflow-hidden">
                    
                    {/* Decorative Top Accent Line */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-950 via-red-800 to-yellow-500"></div>

                    {/* Header Section */}
                    <div className="mb-6 text-center space-y-3">
                        <div className="inline-flex justify-center">
                            <div className="bg-white/95 p-3 rounded-2xl shadow-xl ring-2 ring-yellow-400/60 shrink-0 flex items-center justify-center backdrop-blur-md">
                                <ApplicationLogo alt="UCN Logo" className="h-14 w-14 object-contain" />
                            </div>
                        </div>

                        <div>
                            <p className="font-serif text-red-900 uppercase tracking-[0.18em] text-[10px] font-extrabold">
                                Republic of the Philippines
                            </p>
                            <h2 className="font-serif text-2xl font-extrabold text-gray-900 tracking-tight">
                                University of Camarines Norte
                            </h2>
                            <div className="mt-1.5 flex items-center justify-center gap-2">
                                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-800 text-[11px] font-serif font-semibold tracking-wider uppercase">
                                    Innovate &bull; Lead &bull; Transform
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 font-serif">Account Password Recovery</h3>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">Supply and Property Management Office</p>
                        </div>
                    </div>

                    <div className="mb-6 text-xs text-gray-600 leading-relaxed bg-gray-50/80 p-4 rounded-xl border border-gray-200/80 flex items-start gap-3">
                        <svg className="w-5 h-5 text-red-900 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>
                            Forgot your password? No problem. Provide your registered institutional email address and we will dispatch a secure password reset link to your inbox.
                        </p>
                    </div>

                    {status && (
                        <div className="mb-6 bg-emerald-50 border-l-4 border-emerald-600 p-4 rounded-r-lg shadow-sm flex items-start gap-3">
                            <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-emerald-800 text-xs font-medium">{status}</p>
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-5">
                        <div>
                            <InputLabel htmlFor="email" value="Official Email Address" className="text-gray-800 font-semibold text-sm mb-1.5" />
                            <div className="relative rounded-lg shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </div>
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="pl-11 block w-full rounded-lg border-gray-300 shadow-sm focus:border-red-900 focus:ring-2 focus:ring-red-900/20 transition-all py-3 text-sm bg-gray-50/70 focus:bg-white"
                                    isFocused={true}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="juandelacruz@ucn.edu.ph"
                                />
                            </div>
                            <InputError message={errors.email} className="mt-1.5 text-xs" />
                        </div>

                        <div className="flex flex-col gap-3 pt-2">
                            <PrimaryButton 
                                className="w-full justify-center bg-gradient-to-r from-red-950 via-red-900 to-red-800 hover:from-red-900 hover:to-red-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-red-950/25 border-b-4 border-red-950 active:border-b-0 active:translate-y-1 active:shadow-none transition-all text-sm tracking-wide flex items-center gap-2 group"
                                disabled={processing}
                            >
                                {processing ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Dispatching Reset Link...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Email Password Reset Link</span>
                                        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </>
                                )}
                            </PrimaryButton>

                            <Link 
                                href={route('login')}
                                className="text-center text-xs font-semibold text-red-800 hover:text-red-950 hover:underline transition-colors py-1"
                            >
                                &larr; Return to Administrative Login
                            </Link>
                        </div>
                    </form>
                    
                    {/* Footer */}
                    <div className="mt-8 pt-5 border-t border-gray-100 text-center space-y-1.5">
                        <p className="text-[11px] font-semibold text-gray-500 font-serif tracking-wider uppercase">
                            Innovate &bull; Lead &bull; Transform
                        </p>
                        <p className="text-[11px] text-gray-400 leading-tight">
                            &copy; 2026 University of Camarines Norte. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}