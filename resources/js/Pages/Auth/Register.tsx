import ApplicationLogo from '@/Components/ApplicationLogo';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Register" />

            {/* MAIN CONTAINER: Full Campus Background */}
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
                <div className="relative z-10 w-full max-w-6xl bg-white/95 backdrop-blur-md rounded-xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col lg:flex-row min-h-[600px] border border-white/20">
                    
                    {/* LEFT PANEL: The "Book Cover" Branding */}
                    <div className="lg:w-5/12 text-white p-10 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-red-900 to-red-950">
                        
                        {/* Internal Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                            <img src="/images/cnscrefine.png" alt="" className="w-96 h-96 object-contain grayscale brightness-150" />
                        </div>

                        {/* Top: Institution Hierarchy */}
                        <div className="relative z-10 text-center lg:text-left space-y-4">
                            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-4">
                                <div className="bg-white p-2 rounded-full shadow-lg border border-yellow-500/30">
                                    <img src="/images/cnscrefine.png" alt="CNSC Logo" className="h-16 w-16 object-contain" />
                                </div>
                                <div className="text-center lg:text-left">
                                    <p className="font-serif text-yellow-400 uppercase tracking-widest text-xs mb-1 font-semibold">Republic of the Philippines</p>
                                    <h2 className="font-serif text-2xl font-bold leading-tight text-white drop-shadow-md">Camarines Norte<br/>State College</h2>
                                </div>
                            </div>
                        </div>

                        {/* Middle: Value Proposition */}
                        <div className="relative z-10 my-10 lg:my-0">
                            <div className="border-l-4 border-yellow-500 pl-6 py-2 bg-gradient-to-r from-red-900/50 to-transparent">
                                <h1 className="text-2xl font-bold tracking-tight mb-2 text-white">
                                    Join the Network
                                </h1>
                                <p className="text-yellow-100/90 text-sm leading-relaxed mb-4">
                                    Register for an account to access the Smart Supply and Property Management System. 
                                    Authorized for CNSC faculty and staff only.
                                </p>
                                <div className="flex gap-2">
                                    <div className="bg-black/20 backdrop-blur-sm border border-white/10 px-3 py-1 rounded text-xs text-white/80">
                                        Secure Access
                                    </div>
                                    <div className="bg-black/20 backdrop-blur-sm border border-white/10 px-3 py-1 rounded text-xs text-white/80">
                                        Real-time Inventory
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom: Footer */}
                        <div className="relative z-10 border-t border-white/10 pt-6">
                            <p className="font-bold text-sm uppercase tracking-wide text-white text-shadow-sm">
                                Supply and Property Management Office
                            </p>
                            <p className="text-xs text-white/40 mt-1">Official Registration Portal</p>
                        </div>
                    </div>

                    {/* RIGHT PANEL: Registration Form */}
                    <div className="lg:w-7/12 bg-white p-10 lg:p-16 flex flex-col justify-center relative">
                         {/* Decorative Top Line */}
                         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-900 via-red-700 to-yellow-500"></div>

                        <div className="max-w-md mx-auto w-full">
                            {/* Header */}
                            <div className="mb-8 border-b border-gray-100 pb-6">
                                <h3 className="text-2xl font-bold text-gray-900 font-serif">Create Account</h3>
                                <p className="text-gray-500 mt-2 text-sm">
                                    Please fill in the required information to request access.
                                </p>
                            </div>

                            <form onSubmit={submit} className="space-y-5">
                                {/* Name */}
                                <div>
                                    <InputLabel htmlFor="name" value="Full Name" className="text-gray-700 font-bold" />
                                    <TextInput
                                        id="name"
                                        name="name"
                                        value={data.name}
                                        className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-900 focus:ring-red-900 transition-all py-3 bg-gray-50 focus:bg-white"
                                        autoComplete="name"
                                        isFocused={true}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                        placeholder="Juan A. Dela Cruz"
                                    />
                                    <InputError message={errors.name} className="mt-2" />
                                </div>

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
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
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
                                        autoComplete="new-password"
                                        onChange={(e) => setData('password', e.target.value)}
                                        required
                                        placeholder="••••••••"
                                    />
                                    <InputError message={errors.password} className="mt-2" />
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <InputLabel htmlFor="password_confirmation" value="Confirm Password" className="text-gray-700 font-bold" />
                                    <TextInput
                                        id="password_confirmation"
                                        type="password"
                                        name="password_confirmation"
                                        value={data.password_confirmation}
                                        className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-900 focus:ring-red-900 transition-all py-3 bg-gray-50 focus:bg-white"
                                        autoComplete="new-password"
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        required
                                        placeholder="••••••••"
                                    />
                                    <InputError message={errors.password_confirmation} className="mt-2" />
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-between pt-4">
                                    <Link
                                        href={route('login')}
                                        className="text-sm text-gray-600 hover:text-red-900 hover:underline transition-colors"
                                    >
                                        Already registered?
                                    </Link>

                                    <PrimaryButton 
                                        className="bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 text-white font-bold py-3 px-6 rounded shadow-lg shadow-red-900/20 border-b-4 border-red-950 active:border-b-0 active:mt-1 active:shadow-none transition-all text-sm tracking-wide"
                                        disabled={processing}
                                    >
                                        Register Account
                                    </PrimaryButton>
                                </div>
                            </form>

                             {/* Footer */}
                             <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                                <p className="text-xs text-gray-400">
                                    By registering, you agree to the CNSC Data Privacy Policy.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}