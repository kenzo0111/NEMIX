import ApplicationLogo from '@/Components/ApplicationLogo';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

export default function ResetPassword({
    token,
    email,
}: {
    token: string;
    email: string;
}) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
            <Head title="Reset Password - University of Camarines Norte" />

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
                            <h3 className="text-lg font-bold text-gray-900 font-serif">Create New Password</h3>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">Secure your institutional account access</p>
                        </div>
                    </div>

                    <form onSubmit={submit} className="space-y-4">
                        {/* Email Address */}
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
                                    className="pl-11 block w-full rounded-lg border-gray-300 shadow-sm py-3 text-sm bg-gray-100 text-gray-600 cursor-not-allowed"
                                    autoComplete="username"
                                    onChange={(e) => setData('email', e.target.value)}
                                    disabled={true}
                                />
                            </div>
                            <InputError message={errors.email} className="mt-1.5 text-xs" />
                        </div>

                        {/* New Password */}
                        <div>
                            <InputLabel htmlFor="password" value="New Password" className="text-gray-800 font-semibold text-sm mb-1.5" />
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
                                    autoComplete="new-password"
                                    isFocused={true}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="••••••••••••"
                                />
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                                    title={showPassword ? "Hide password" : "Show password"}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                                    ) : (
                                        <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                                    )}
                                </button>
                            </div>
                            <InputError message={errors.password} className="mt-1.5 text-xs" />
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <InputLabel htmlFor="password_confirmation" value="Confirm New Password" className="text-gray-800 font-semibold text-sm mb-1.5" />
                            <div className="relative rounded-lg shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <TextInput
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="password_confirmation"
                                    value={data.password_confirmation}
                                    className="pl-11 pr-11 block w-full rounded-lg border-gray-300 shadow-sm focus:border-red-900 focus:ring-2 focus:ring-red-900/20 transition-all py-3 text-sm bg-gray-50/70 focus:bg-white"
                                    autoComplete="new-password"
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    placeholder="••••••••••••"
                                />
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                                    title={showConfirmPassword ? "Hide password" : "Show password"}
                                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                                    ) : (
                                        <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                                    )}
                                </button>
                            </div>
                            <InputError message={errors.password_confirmation} className="mt-1.5 text-xs" />
                        </div>

                        <div className="pt-3">
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
                                        <span>Updating Credentials...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Reset Password</span>
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