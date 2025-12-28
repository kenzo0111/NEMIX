import ApplicationLogo from '@/Components/ApplicationLogo';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Log in" />

            {/* MAIN CONTAINER */}
            <div 
                className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden login-bg"
            >
                
                {/* === ENHANCED OVERLAY SYSTEM === */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    {/* Layer 1: Deep Maroon Tint (Multiplies with image for rich color) */}
                    <div className="absolute inset-0 bg-red-950/80 mix-blend-multiply"></div>

                    {/* Layer 2: Black Fade (Ensures text readability / focuses center) */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80"></div>

                    {/* Layer 3: The "Academic Gold" Glow (Top Right) */}
                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-yellow-600/40 via-orange-900/20 to-transparent mix-blend-overlay"></div>

                    {/* Layer 4: Subtle Texture/Noise (Optional depth) */}
                    <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
                </div>
                
                {/* CARD CONTAINER */}
                <div className="relative z-10 w-full max-w-6xl bg-white/95 backdrop-blur-md rounded-xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col lg:flex-row min-h-[600px] border border-white/20">
                    
                    {/* LEFT PANEL: The "Book Cover" */}
                    <div className="lg:w-5/12 text-white p-10 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-red-900 to-red-950">
                        
                        {/* Internal Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                            <img src="/images/cnscrefine.png" alt="" className="w-96 h-96 object-contain grayscale brightness-150" />
                        </div>

                        {/* Top: Institution Hierarchy */}
                        <div className="relative z-10 text-center lg:text-left space-y-4">
                            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-4">
                                <div className="bg-white p-2 rounded-full shadow-lg border-2 border-yellow-500/50">
                                    <img src="/images/cnscrefine.png" alt="CNSC Logo" className="h-16 w-16" />
                                </div>
                                <div className="text-center lg:text-left">
                                    <p className="font-serif text-yellow-400 uppercase tracking-widest text-xs mb-1 font-semibold">Republic of the Philippines</p>
                                    <h2 className="font-serif text-2xl font-bold leading-tight text-white drop-shadow-md">Camarines Norte<br/>State College</h2>
                                </div>
                            </div>
                        </div>

                        {/* Middle: System Title */}
                        <div className="relative z-10 my-10 lg:my-0">
                            <div className="border-l-4 border-yellow-500 pl-6 py-2 bg-gradient-to-r from-red-900/50 to-transparent">
                                <h1 className="text-3xl font-bold tracking-tight mb-2 text-white shadow-black drop-shadow-sm">
                                    Smart Supply and Inventory Management
                                </h1>
                                <p className="text-yellow-200 font-medium text-lg mb-4">
                                    RFID Integration Tracking and Automated Reporting
                                </p>
                                <div className="inline-block bg-white/10 backdrop-blur-sm border border-yellow-500/30 px-3 py-1 rounded text-xs uppercase tracking-wider text-yellow-100 font-semibold shadow-sm">
                                    For Government Compliance
                                </div>
                            </div>
                        </div>

                        {/* Bottom: Department Footer */}
                        <div className="relative z-10 border-t border-white/10 pt-6">
                            <p className="font-serif italic text-white/70 text-sm">Managed by the</p>
                            <p className="font-bold text-lg uppercase tracking-wide text-white mt-1 text-shadow-sm">
                                Supply and Property Management Office
                            </p>
                            <p className="text-xs text-white/40 mt-4 font-mono">System Ref: CNSC-SPMO-2025</p>
                        </div>
                    </div>

                    {/* RIGHT PANEL: The "Administrative Form" */}
                    <div className="lg:w-7/12 bg-white p-10 lg:p-16 flex flex-col justify-center relative">
                        {/* Decorative Top Line */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-900 via-red-700 to-yellow-500"></div>

                        <div className="max-w-md mx-auto w-full">
                            {/* Header */}
                            <div className="mb-10 border-b border-gray-100 pb-6">
                                <h3 className="text-2xl font-bold text-gray-900 font-serif">Administrative Login</h3>
                                <p className="text-gray-500 mt-2 text-sm">
                                    Please enter your institutional credentials to access the system.
                                </p>
                            </div>

                            {status && (
                                <div className="mb-6 bg-green-50 border-l-4 border-green-600 p-4 rounded-r shadow-sm">
                                    <p className="text-green-700 text-sm font-medium">{status}</p>
                                </div>
                            )}

                            <form onSubmit={submit} className="space-y-6">
                                {/* Email */}
                                <div>
                                    <InputLabel htmlFor="email" value="Official Email Address" className="text-gray-700 font-bold" />
                                    <TextInput
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-900 focus:ring-red-900 transition-all py-3 bg-gray-50 focus:bg-white"
                                        autoComplete="username"
                                        isFocused={true}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="juandelacruz@cnsc.edu.ph"
                                    />
                                    <InputError message={errors.email} className="mt-2" />
                                </div>

                                {/* Password */}
                                <div>
                                    <InputLabel htmlFor="password" value="Password" className="text-gray-700 font-bold" />
                                    <TextInput
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={data.password}
                                        className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-900 focus:ring-red-900 transition-all py-3 bg-gray-50 focus:bg-white"
                                        autoComplete="current-password"
                                        onChange={(e) => setData('password', e.target.value)}
                                    />
                                    <InputError message={errors.password} className="mt-2" />
                                </div>

                                {/* Options */}
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center cursor-pointer group">
                                        <Checkbox
                                            name="remember"
                                            checked={data.remember}
                                            onChange={(e) => setData('remember', (e.target.checked || false) as false)}
                                            className="rounded border-gray-300 text-red-900 focus:ring-red-900"
                                        />
                                        <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Keep me logged in</span>
                                    </label>

                                    {canResetPassword && (
                                        <Link
                                            href={route('password.request')}
                                            className="text-sm text-red-700 hover:text-red-900 hover:underline font-medium transition-colors"
                                        >
                                            Forgot password?
                                        </Link>
                                    )}
                                </div>

                                {/* Button */}
                                <div className="pt-4">
                                    <PrimaryButton
                                        className="w-full justify-center bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 text-white font-bold py-4 rounded shadow-lg shadow-red-900/20 border-b-4 border-red-950 active:border-b-0 active:mt-1 active:shadow-none transition-all text-base tracking-wide"
                                        disabled={processing}
                                    >
                                        {processing ? 'Verifying Credentials...' : 'Access System Portal'}
                                    </PrimaryButton>
                                </div>
                            </form>

                            {/* Footer */}
                            <div className="mt-10 pt-6 border-t border-gray-100 text-center">
                                <p className="text-xs text-gray-400">
                                    &copy; 2025 Camarines Norte State College. All rights reserved. <br/>
                                    Authorized Personnel Only.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}