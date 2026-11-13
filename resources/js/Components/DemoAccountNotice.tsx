import Modal from '@/Components/Modal';
import { PageProps } from '@/types';
import { usePage } from '@inertiajs/react';
import { Building2, Mail, ShieldAlert } from 'lucide-react';
import { useState } from 'react';

export default function DemoAccountNotice() {
    const { auth, branding, demoAccountNotice } = usePage<PageProps>().props;
    const [show, setShow] = useState(Boolean(demoAccountNotice && auth.user?.is_demo_account));

    if (!auth.user?.is_demo_account) return null;

    const roleName = auth.user.primary_role || auth.user.role || 'institutional';
    const officeName = branding?.officeName || 'Supply & Property Management Office (SPMO)';

    return <Modal show={show} onClose={() => setShow(false)} maxWidth="lg" ariaLabel="Demo account notice">
        <div className="overflow-hidden rounded-xl bg-white dark:bg-slate-900">
            <div className="h-1.5 bg-gradient-to-r from-amber-500 via-red-800 to-red-950" />
            <div className="p-6 sm:p-7">
                <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/70 dark:bg-amber-950/40 dark:text-amber-300">
                        <ShieldAlert size={25} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-amber-700 dark:text-amber-300">Demo testing access</p>
                        <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950 dark:text-slate-100">You are signed in to a demo account</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">This is the shared <strong>{roleName}</strong> account provided for demonstration and system testing only.</p>
                    </div>
                </div>

                <div className="mt-5 space-y-3">
                    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm leading-6 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100">
                        Do not treat records entered through this account as the permanent official records of your office or department unit.
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                        <div className="flex items-start gap-3">
                            <Mail size={19} className="mt-0.5 shrink-0 text-red-800 dark:text-red-300" aria-hidden="true" />
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Request your dedicated account</h3>
                                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">Send your official institutional email address and the name of your office or department unit to the Head Office. The {officeName} will create the appropriate dedicated account.</p>
                            </div>
                        </div>
                    </div>
                    <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><Building2 size={16} aria-hidden="true" />Dedicated accounts keep each office and department unit’s records separate.</p>
                </div>
            </div>
            <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/50">
                <button type="button" onClick={() => setShow(false)} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-red-900 px-5 text-sm font-semibold text-white transition hover:bg-red-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2">
                    I Understand
                </button>
            </div>
        </div>
    </Modal>;
}
