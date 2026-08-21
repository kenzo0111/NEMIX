import ApplicationLogo from '@/Components/ApplicationLogo';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import {
    ArrowRight,
    CheckCircle2,
    Loader2,
    Lock,
    ShieldCheck,
    Sparkles,
    User as UserIcon,
} from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';

interface AuthenticatedUserData {
    id?: number;
    name?: string;
    email?: string;
    role?: string;
}

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Authentication & Modal stages: 'idle' | 'lazy_loading' | 'success'
    const [authStage, setAuthStage] = useState<'idle' | 'lazy_loading' | 'success'>('idle');
    const [userData, setUserData] = useState<AuthenticatedUserData | null>(null);
    const [destinationUrl, setDestinationUrl] = useState<string>('');

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        if (processing || authStage !== 'idle') return;

        setProcessing(true);
        setErrors({});

        try {
            const response = await axios.post(
                route('login'),
                {
                    email,
                    password,
                    remember,
                },
                {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                }
            );

            // Authentication succeeded -> Trigger lazy loading phase
            const dest = response.data?.redirect || route('dashboard');
            setDestinationUrl(dest);
            setUserData(response.data?.user || { email, name: email.split('@')[0], role: 'Institutional Staff' });
            setAuthStage('lazy_loading');
        } catch (err: any) {
            setProcessing(false);
            setPassword('');

            if (err.response?.data?.errors) {
                const responseErrors: { [key: string]: string } = {};
                for (const key of Object.keys(err.response.data.errors)) {
                    responseErrors[key] = Array.isArray(err.response.data.errors[key])
                        ? err.response.data.errors[key][0]
                        : err.response.data.errors[key];
                }
                setErrors(responseErrors);
            } else if (err.response?.data?.message) {
                setErrors({ email: err.response.data.message });
            } else {
                setErrors({ email: 'Failed to verify credentials. Please try again.' });
            }
        }
    };

    // Transition from lazy_loading to success modal, and handle auto-redirect
    useEffect(() => {
        if (authStage === 'lazy_loading') {
            const loadingTimer = setTimeout(() => {
                setAuthStage('success');
            }, 1400); // 1.4 seconds lazy loading phase

            return () => clearTimeout(loadingTimer);
        }

        if (authStage === 'success') {
            const redirectTimer = setTimeout(() => {
                window.location.href = destinationUrl || route('dashboard');
            }, 2500); // 2.5 seconds display before auto-redirecting

            return () => clearTimeout(redirectTimer);
        }
    }, [authStage, destinationUrl]);

    const handleImmediateRedirect = () => {
        window.location.href = destinationUrl || route('dashboard');
    };

    return (
        <>
            <Head title="Log in - University of Camarines Norte" />

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
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                            <span className="font-semibold tracking-widest uppercase text-[11px] text-yellow-200">
                                                Innovate &bull; Lead &bull; Transform
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Middle: System Title Card */}
                        <div className="relative z-10 my-8 lg:my-6">
                            <div className="border-l-4 border-yellow-400 pl-5 py-3 bg-gradient-to-r from-black/30 via-red-950/20 to-transparent rounded-r-xl backdrop-blur-xs">
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-yellow-400/90 font-bold mb-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    Institutional Enterprise Portal
                                </span>
                                <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight mb-2 text-white drop-shadow-sm leading-snug">
                                    Smart Supply and Inventory Management
                                </h1>
                                <p className="text-yellow-100/90 font-medium text-base mb-3 leading-relaxed">
                                    RFID Integration Tracking &amp; Automated Reporting System
                                </p>
                                <div className="inline-block bg-white/10 backdrop-blur-md border border-yellow-400/30 px-3 py-1.5 rounded-lg text-xs tracking-wide text-yellow-200 font-semibold shadow-sm">
                                    Enhanced Inventory Control &amp; Asset Management
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
                                    Ref: UCN-SPMO-2026
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: Administrative Login Form */}
                    <div className="lg:w-7/12 bg-white/95 p-8 lg:p-14 flex flex-col justify-center relative select-text">
                        {/* Decorative Top Accent Line */}
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-950 via-red-800 to-yellow-500"></div>

                        <div className="max-w-md mx-auto w-full">
                            {/* Header */}
                            <div className="mb-8 border-b border-gray-100 pb-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-xl bg-red-900/10 text-red-900">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900 font-serif tracking-tight">Administrative Login</h3>
                                        <p className="text-gray-500 text-xs mt-0.5">University Account Portal</p>
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm leading-relaxed mt-2">
                                    Please enter your official institutional credentials to access the system.
                                </p>
                            </div>

                            {status && (
                                <div className="mb-6 bg-emerald-50 border-l-4 border-emerald-600 p-4 rounded-r-lg shadow-sm flex items-start gap-3">
                                    <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-emerald-800 text-sm font-medium">{status}</p>
                                </div>
                            )}

                            <form onSubmit={submit} className="space-y-5">
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
                                            value={email}
                                            disabled={processing || authStage !== 'idle'}
                                            className="pl-11 block w-full rounded-lg border-gray-300 shadow-sm focus:border-red-900 focus:ring-2 focus:ring-red-900/20 transition-all py-3 text-sm bg-gray-50/70 focus:bg-white disabled:opacity-60"
                                            autoComplete="username"
                                            isFocused={true}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="juandelacruz@ucn.edu.ph"
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
                                            value={password}
                                            disabled={processing || authStage !== 'idle'}
                                            className="pl-11 pr-11 block w-full rounded-lg border-gray-300 shadow-sm focus:border-red-900 focus:ring-2 focus:ring-red-900/20 transition-all py-3 text-sm bg-gray-50/70 focus:bg-white disabled:opacity-60"
                                            autoComplete="current-password"
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••••••"
                                        />
                                        <button
                                            type="button"
                                            disabled={processing || authStage !== 'idle'}
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                                            title={showPassword ? 'Hide password' : 'Show password'}
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

                                {/* Form Options */}
                                <div className="flex items-center justify-between pt-1">
                                    <label className="flex items-center cursor-pointer group">
                                        <Checkbox
                                            name="remember"
                                            checked={remember}
                                            disabled={processing || authStage !== 'idle'}
                                            onChange={(e) => setRemember(Boolean(e.target.checked))}
                                            className="rounded border-gray-300 text-red-900 focus:ring-red-900/30 w-4 h-4"
                                        />
                                        <span className="ml-2 text-xs font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                                            Remember credentials
                                        </span>
                                    </label>

                                    {canResetPassword && (
                                        <Link
                                            href={route('password.request')}
                                            className="text-xs text-red-800 hover:text-red-950 font-semibold hover:underline transition-colors"
                                        >
                                            Forgot password?
                                        </Link>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <div className="pt-3">
                                    <PrimaryButton
                                        className="w-full justify-center bg-gradient-to-r from-red-950 via-red-900 to-red-800 hover:from-red-900 hover:to-red-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-red-950/25 border-b-4 border-red-950 active:border-b-0 active:translate-y-1 active:shadow-none transition-all text-sm tracking-wide flex items-center gap-2 group"
                                        disabled={processing || authStage !== 'idle'}
                                    >
                                        {processing ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Verifying Credentials...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Access System Portal</span>
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
                                    Authorized Personnel &amp; Institutional Use Only.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* === 1. LAZY LOADING OVERLAY STATE === */}
            {authStage === 'lazy_loading' && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md transition-all duration-300"
                    style={{ animation: 'loginModalFadeIn 0.3s ease-out' }}
                >
                    <div
                        className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-black/70 border border-white/40 overflow-hidden text-center relative transition-all duration-300 transform"
                        style={{ animation: 'loginModalScaleUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)' }}
                    >
                        {/* Top Institutional Header Band */}
                        <div className="relative bg-gradient-to-br from-red-950 via-red-900 to-red-950 text-white p-6 pb-12 overflow-hidden">
                            {/* Decorative Background Rings */}
                            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full border border-yellow-400/20 pointer-events-none"></div>
                            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full border border-yellow-400/10 pointer-events-none"></div>
                            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]"></div>

                            {/* Top University Brand Badge */}
                            <div className="relative z-10 flex items-center justify-center gap-2 mb-2">
                                <div className="p-1.5 rounded-xl bg-white/95 shadow-md ring-1 ring-yellow-400/60 shrink-0 flex items-center justify-center backdrop-blur-md">
                                    <ApplicationLogo alt="UCN Seal" className="h-7 w-7 object-contain" />
                                </div>
                                <span className="font-serif text-yellow-300 text-xs sm:text-sm font-bold tracking-widest uppercase drop-shadow-sm">
                                    University of Camarines Norte
                                </span>
                            </div>

                            <p className="relative z-10 text-[10px] font-mono text-yellow-200/80 uppercase tracking-wider">
                                SPMO Enterprise Security
                            </p>
                        </div>

                        {/* Central Animated Dual-Spin Loader & Seal */}
                        <div className="relative -mt-12 flex justify-center z-20">
                            <div className="relative">
                                {/* Glowing Amber Pulse Halo */}
                                <div className="absolute -inset-3 rounded-full bg-yellow-400/30 animate-pulse"></div>

                                {/* Outer Institutional Ring with Orbital Spinner & White Seal Container */}
                                <div className="relative h-24 w-24 rounded-full bg-white shadow-2xl shadow-black/50 ring-4 ring-yellow-400/90 flex items-center justify-center p-3">
                                    <div className="absolute -inset-1 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin"></div>
                                    <ApplicationLogo alt="UCN Seal" className="h-16 w-16 object-contain drop-shadow" />
                                </div>
                            </div>
                        </div>

                        {/* Modal Body with Lazy Loading Status */}
                        <div className="p-6 pt-4 space-y-4">
                            <div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-400/40 text-yellow-950 text-xs font-bold mb-2">
                                    <Loader2 className="w-3.5 h-3.5 text-yellow-600 animate-spin" />
                                    <span>Establishing Secure Session</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 font-serif tracking-tight">
                                    Initializing Workspace...
                                </h3>
                                <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                                    Synchronizing institutional permissions and security tokens.
                                </p>
                            </div>

                            {/* Animated Loading Dots in Institutional Palette */}
                            <div className="flex items-center justify-center gap-2 py-3">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-950 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-2.5 h-2.5 rounded-full bg-red-900 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: '450ms' }}></span>
                            </div>
                        </div>

                        {/* Bottom Accent Bar */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-red-950 via-yellow-400 to-red-950"></div>
                    </div>
                </div>
            )}

            {/* === 2. LOGIN SUCCESS MODAL (LOGIN COLOR PALETTE, NO PROGRESS BAR) === */}
            {authStage === 'success' && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md transition-all duration-300"
                    style={{ animation: 'loginModalFadeIn 0.3s ease-out' }}
                >
                    <div
                        className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-black/70 border border-white/40 overflow-hidden text-center relative transition-all duration-300 transform"
                        style={{ animation: 'loginModalScaleUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)' }}
                    >
                        {/* Top Institutional Header Band */}
                        <div className="relative bg-gradient-to-br from-red-950 via-red-900 to-red-950 text-white p-6 pb-12 overflow-hidden">
                            {/* Decorative Background Rings */}
                            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full border border-yellow-400/20 pointer-events-none"></div>
                            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full border border-yellow-400/10 pointer-events-none"></div>
                            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]"></div>

                            {/* Top University Brand Badge */}
                            <div className="relative z-10 flex items-center justify-center gap-2 mb-2">
                                <div className="p-1.5 rounded-xl bg-white/95 shadow-md ring-1 ring-yellow-400/60 shrink-0 flex items-center justify-center backdrop-blur-md">
                                    <ApplicationLogo alt="UCN Seal" className="h-7 w-7 object-contain" />
                                </div>
                                <span className="font-serif text-yellow-300 text-xs sm:text-sm font-bold tracking-widest uppercase drop-shadow-sm">
                                    University of Camarines Norte
                                </span>
                            </div>

                            <p className="relative z-10 text-[10px] font-mono text-yellow-200/80 uppercase tracking-wider">
                                SPMO Enterprise Security
                            </p>
                        </div>

                        {/* Floating Central Institutional Seal & Success Verification Badge */}
                        <div className="relative -mt-12 flex justify-center z-20">
                            <div className="relative">
                                {/* Outer Golden Glow Pulse */}
                                <div className="absolute -inset-3 rounded-full bg-yellow-400/30 animate-pulse"></div>

                                {/* Main Institutional Seal Container with Official Logo */}
                                <div className="relative h-24 w-24 rounded-full bg-white shadow-2xl shadow-black/50 ring-4 ring-yellow-400/90 flex items-center justify-center p-3">
                                    <ApplicationLogo alt="UCN Seal" className="h-16 w-16 object-contain drop-shadow" />

                                    {/* Floating Success Verification Check Badge */}
                                    <div className="absolute -bottom-1 -right-1 bg-gradient-to-tr from-emerald-600 to-emerald-500 text-white rounded-full p-1.5 ring-2 ring-white shadow-lg flex items-center justify-center">
                                        <CheckCircle2 className="w-5 h-5 text-white stroke-[2.5]" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 pt-4 space-y-4">
                            {/* Main Heading */}
                            <div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-400/40 text-yellow-950 text-xs font-bold mb-2">
                                    <Sparkles className="w-3.5 h-3.5 text-yellow-600" />
                                    <span>Authentication Successful</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 font-serif tracking-tight">
                                    Welcome Back!
                                </h3>
                                <p className="text-gray-500 text-xs mt-1">
                                    Your institutional credentials have been verified.
                                </p>
                            </div>

                            {/* Authenticated User Card */}
                            {userData && (
                                <div className="bg-gradient-to-r from-gray-50 via-amber-50/20 to-gray-50 rounded-2xl p-3.5 border border-gray-200/80 shadow-xs flex items-center gap-3.5 text-left">
                                    <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-red-950 to-red-800 text-yellow-300 font-serif font-bold text-base flex items-center justify-center shadow-md shadow-red-950/20 shrink-0 ring-2 ring-yellow-400/50">
                                        {userData.name ? userData.name.charAt(0).toUpperCase() : <UserIcon className="w-5 h-5 text-yellow-300" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold text-gray-900 truncate">
                                                {userData.name || 'Authorized Personnel'}
                                            </p>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate font-mono">
                                            {userData.email}
                                        </p>
                                        <div className="mt-1 flex items-center gap-1.5">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100/90 text-amber-950 border border-amber-300/60">
                                                <ShieldCheck className="w-3 h-3 text-amber-700" />
                                                {userData.role || 'Institutional Staff'}
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-mono text-red-950 bg-red-900/10 border border-red-900/20">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                                Active Session
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Security Reference Bar (Replacing Progress Bar) */}
                            <div className="bg-gradient-to-r from-red-950/5 via-amber-50/50 to-red-950/5 rounded-xl p-2.5 border border-red-950/10 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                                    <Lock className="w-3.5 h-3.5 text-red-900" />
                                    <span>Ready for SPMO Dashboard</span>
                                </div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-yellow-400/20 text-yellow-950 font-mono text-[10px] font-bold border border-yellow-400/30">
                                    SPMO-SECURE
                                </span>
                            </div>

                            {/* Action Button for Immediate Navigation */}
                            <div className="pt-1">
                                <button
                                    type="button"
                                    onClick={handleImmediateRedirect}
                                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-950 via-red-900 to-red-800 hover:from-red-900 hover:to-red-700 text-white font-bold py-3.5 px-5 rounded-xl shadow-lg shadow-red-950/20 text-xs uppercase tracking-wider transition-all duration-200 hover:shadow-red-900/40 hover:-translate-y-0.5 active:translate-y-0 border-b-4 border-red-950 active:border-b-0 group"
                                >
                                    <span>Proceed to Dashboard Now</span>
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </button>
                            </div>
                        </div>

                        {/* Bottom Accent Bar */}
                        <div className="h-1.5 w-full bg-gradient-to-r from-red-950 via-yellow-400 to-red-950"></div>
                    </div>
                </div>
            )}

            {/* Custom Animations Style */}
            <style>{`
                @keyframes loginModalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes loginModalScaleUp {
                    from { opacity: 0; transform: scale(0.92); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </>
    );
}