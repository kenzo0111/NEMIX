import ApplicationLogo from '@/Components/ApplicationLogo';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

export default function Register({
    email,
    token,
}: {
    email?: string;
    token?: string;
}) {
    const isInvitation = Boolean(email && token);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: email ?? '',
        password: '',
        password_confirmation: '',
        token: token ?? '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Register - University of Camarines Norte" />

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
                <div className="relative z-10 w-full max-w-6xl bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/60 overflow-hidden flex flex-col lg:flex-row min-h-[640px] border border-white/30 transition-all duration-300">
                    
                    {/* LEFT PANEL: Institutional Branding & Identity */}
                    <div className="lg:w-5/12 text-white p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-red-950 via-red-900 to-red-950">
                        
                        {/* Background Decorative Rings */}
                        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full border border-yellow-500/10 pointer-events-none"></div>
                        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full border border-yellow-500/10 pointer-events-none"></div>

                        {/* Internal Watermark Seal */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                            <ApplicationLogo alt="" className="w-[420px] h-[420px] object-contain grayscale brightness-150 transform scale-110" />
                        </div>

                        {/* Top: Institution Hierarchy & Tagline */}
                        <div className="relative z-10 space-y-4">
                            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-4 text-center lg:text-left">
                                <div className="bg-white/95 p-3 rounded-2xl shadow-xl ring-2 ring-yellow-400/60 shrink-0 flex items-center justify-center backdrop-blur-md transition-transform duration-300 hover:scale-105">
                                    <ApplicationLogo alt="UCN Seal" className="h-16 w-16 md:h-18 md:w-18 object-contain" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-serif text-yellow-400 uppercase tracking-[0.2em] text-[11px] font-extrabold drop-shadow">
                                        Republic of the Philippines
                                    </p>
                                    <h2 className="font-serif text-2xl lg:text-3xl font-extrabold leading-tight text-white drop-shadow-md tracking-tight">
                                        University of Camarines Norte
                                    </h2>

                                    {/* Tagline Badge */}
                                    <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-2">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 via-amber-500/25 to-yellow-500/20 border border-yellow-400/40 text-yellow-300 text-xs font-serif tracking-wider shadow-sm backdrop-blur-sm">
                                            <svg className="w-3.5 h-3.5 text-yellow-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                            </svg>
                                            <span className="font-semibold tracking-widest uppercase text-[11px] text-yellow-200">
                                                Innovate &bull; Lead &bull; Transform
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Middle: System Title / Proposition */}
                        <div className="relative z-10 my-8 lg:my-6">
                            <div className="border-l-4 border-yellow-400 pl-5 py-3 bg-gradient-to-r from-black/30 via-red-950/20 to-transparent rounded-r-xl backdrop-blur-xs">
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-yellow-400/90 font-bold mb-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    Staff Account Provisioning
                                </span>
                                <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight mb-2 text-white drop-shadow-sm leading-snug">
                                    Join the Institutional Network
                                </h1>
                                <p className="text-yellow-100/90 font-medium text-sm leading-relaxed mb-3">
                                    Register your personnel credentials to access the Smart Supply &amp; Property Management System.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <div className="bg-white/10 backdrop-blur-md border border-yellow-400/30 px-3 py-1 rounded text-xs text-yellow-200 font-semibold shadow-sm">
                                        Secure Authentication
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md border border-yellow-400/30 px-3 py-1 rounded text-xs text-yellow-200 font-semibold shadow-sm">
                                        SPMO Personnel Only
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom: Department Footer */}
                        <div className="relative z-10 border-t border-white/15 pt-5 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
                            <div>
                                <p className="font-serif italic text-white/70 text-xs">Managed by the</p>
                                <p className="font-bold text-sm lg:text-base uppercase tracking-wider text-white mt-0.5 drop-shadow-sm">
                                    Supply and Property Management Office
                                </p>
                            </div>
                            <div className="text-left sm:text-right">
                                <span className="inline-block px-2.5 py-1 rounded bg-black/40 border border-white/10 text-[10px] font-mono text-yellow-300/80">
                                    Ref: UCN-REG-2026
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: Registration Form */}
                    <div className="lg:w-7/12 bg-white/95 p-8 lg:p-14 flex flex-col justify-center relative select-text">
                        {/* Decorative Top Accent Line */}
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-950 via-red-800 to-yellow-500"></div>

                        <div className="max-w-md mx-auto w-full">
                            {/* Header */}
                            <div className="mb-8 border-b border-gray-100 pb-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-xl bg-red-900/10 text-red-900">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900 font-serif tracking-tight">
                                            {isInvitation ? 'Complete Registration' : 'Create Staff Account'}
                                        </h3>
                                        <p className="text-gray-500 text-xs mt-0.5">University Administrative Access</p>
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm leading-relaxed mt-2">
                                    {isInvitation
                                        ? 'Set your password to activate your official staff account.'
                                        : 'Please fill in your personnel details to register for system authorization.'}
                                </p>
                            </div>

                            <form onSubmit={submit} className="space-y-4">
                                {/* Name Field */}
                                <div>
                                    <InputLabel htmlFor="name" value="Full Name" className="text-gray-800 font-semibold text-sm mb-1.5" />
                                    <div className="relative rounded-lg shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <TextInput
                                            id="name"
                                            name="name"
                                            value={data.name}
                                            className="pl-11 block w-full rounded-lg border-gray-300 shadow-sm focus:border-red-900 focus:ring-2 focus:ring-red-900/20 transition-all py-3 text-sm bg-gray-50/70 focus:bg-white"
                                            autoComplete="name"
                                            isFocused={true}
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                            placeholder="Juan A. Dela Cruz"
                                        />
                                    </div>
                                    <InputError message={errors.name} className="mt-1.5 text-xs" />
                                </div>

                                {/* Email Field */}
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
                                            className="pl-11 block w-full rounded-lg border-gray-300 shadow-sm focus:border-red-900 focus:ring-2 focus:ring-red-900/20 transition-all py-3 text-sm bg-gray-50/70 focus:bg-white disabled:bg-gray-100 disabled:text-gray-500"
                                            autoComplete="username"
                                            onChange={(e) => setData('email', e.target.value)}
                                            required
                                            placeholder="juandelacruz@ucn.edu.ph"
                                            readOnly={isInvitation}
                                            disabled={isInvitation}
                                        />
                                    </div>
                                    <InputError message={errors.email} className="mt-1.5 text-xs" />
                                </div>

                                {/* Password Field */}
                                <div>
                                    <InputLabel htmlFor="password" value="Password" className="text-gray-800 font-semibold text-sm mb-1.5" />
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
                                            onChange={(e) => setData('password', e.target.value)}
                                            required
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

                                {/* Confirm Password Field */}
                                <div>
                                    <InputLabel htmlFor="password_confirmation" value="Confirm Password" className="text-gray-800 font-semibold text-sm mb-1.5" />
                                    <div className="relative rounded-lg shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                        </div>
                                        <TextInput
                                            id="password_confirmation"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            name="password_confirmation"
                                            value={data.password_confirmation}
                                            className="pl-11 pr-11 block w-full rounded-lg border-gray-300 shadow-sm focus:border-red-900 focus:ring-2 focus:ring-red-900/20 transition-all py-3 text-sm bg-gray-50/70 focus:bg-white"
                                            autoComplete="new-password"
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            required
                                            placeholder="••••••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                                            title={showConfirmPassword ? "Hide password" : "Show password"}
                                        >
                                            {showConfirmPassword ? (
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
                                    <InputError message={errors.password_confirmation} className="mt-1.5 text-xs" />
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-between pt-3">
                                    <Link
                                        href={route('login')}
                                        className="text-xs text-red-800 hover:text-red-950 font-semibold hover:underline transition-colors"
                                    >
                                        &larr; Already registered?
                                    </Link>

                                    <PrimaryButton 
                                        className="bg-gradient-to-r from-red-950 via-red-900 to-red-800 hover:from-red-900 hover:to-red-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-red-950/25 border-b-4 border-red-950 active:border-b-0 active:translate-y-1 active:shadow-none transition-all text-sm tracking-wide flex items-center gap-2 group"
                                        disabled={processing}
                                    >
                                        {processing ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>{isInvitation ? 'Activating...' : 'Registering...'}</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>{isInvitation ? 'Activate Account' : 'Register Account'}</span>
                                                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                </svg>
                                            </>
                                        )}
                                    </PrimaryButton>
                                </div>
                            </form>

                            {/* Footer */}
                            <div className="mt-8 pt-5 border-t border-gray-100 text-center space-y-2">
                                <p className="text-[11px] font-semibold text-gray-500 font-serif tracking-wider uppercase">
                                    Innovate &bull; Lead &bull; Transform
                                </p>
                                <p className="text-[11px] text-gray-400 leading-tight">
                                    &copy; 2026 University of Camarines Norte. All rights reserved.<br />
                                    By registering, you agree to institutional data privacy guidelines.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

