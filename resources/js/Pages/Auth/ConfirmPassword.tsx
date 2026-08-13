import ApplicationLogo from '@/Components/ApplicationLogo';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

export default function ConfirmPassword() {
    const [showPassword, setShowPassword] = useState(false);

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
            <Head title="Confirm Password - University of Camarines Norte" />

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
                                <img src="/images/cnscrefine.png" alt="UCN Logo" className="h-14 w-14 object-contain" />
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
                            <h3 className="text-lg font-bold text-gray-900 font-serif">Security Verification</h3>
                            <div className="flex items-center justify-center gap-2 mt-1">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                                </span>
                                <p className="text-xs text-red-900 font-bold uppercase tracking-wider">Protected System Area</p>
                            </div>
                        </div>
                    </div>

                    {/* Notice Box */}
                    <div className="mb-6 bg-red-50/80 border-l-4 border-red-900 p-4 rounded-r-lg shadow-sm flex items-start gap-3">
                        <svg className="w-5 h-5 text-red-900 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-xs text-red-950 leading-relaxed font-medium">
                            This is a secure area of the system portal. Please re-enter your current password to verify your administrative identity before continuing.
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-5">
                        <div>
                            <InputLabel htmlFor="password" value="Current Password" className="text-gray-800 font-semibold text-sm mb-1.5" />
                            
                            <div className="relative rounded-lg shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <TextInput
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={data.password}
                                    className="pl-11 pr-11 block w-full rounded-lg border-gray-300 shadow-sm focus:border-red-900 focus:ring-2 focus:ring-red-900/20 transition-all py-3 text-sm bg-gray-50/70 focus:bg-white"
                                    isFocused={true}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="••••••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                                    title={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.025 10.025 0 013.682-.763c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21M3 3l18 18" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>

                            <InputError message={errors.password} className="mt-1.5 text-xs" />
                        </div>

                        <div className="pt-2">
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
                                        <span>Verifying Authorization...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Confirm Authorization</span>
                                        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </>
                                )}
                            </PrimaryButton>
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