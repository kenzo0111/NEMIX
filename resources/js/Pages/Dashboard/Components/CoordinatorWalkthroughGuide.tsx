import Modal from '@/Components/Modal';
import useAuthorization from '@/Hooks/useAuthorization';
import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    BookOpen,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    FileText,
    PackageCheck,
    Send,
    X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface Props {
    show: boolean;
    onClose: () => void;
}

type GuideStep = {
    title: string;
    eyebrow: string;
    description: string;
    points: string[];
    icon: LucideIcon;
    tone: string;
    action?: { label: string; href: string };
};

export default function CoordinatorWalkthroughGuide({ show, onClose }: Props) {
    const { can } = useAuthorization();
    const [stepIndex, setStepIndex] = useState(0);

    useEffect(() => {
        if (show) setStepIndex(0);
    }, [show]);

    const steps: GuideStep[] = [
        {
            eyebrow: 'Your starting point',
            title: 'Understand the dashboard',
            description: 'The dashboard summarizes your Delivery Unit’s requests, stock on hand, low-stock items, and recent movements.',
            points: [
                'Active requests show items still being reviewed, corrected, or prepared for release.',
                'Stock alerts identify supplies that may need replenishment.',
                'Movement cards and charts summarize supplies received and issued by your unit.',
            ],
            icon: ClipboardList,
            tone: 'bg-red-50 text-red-900 dark:bg-red-950/50 dark:text-red-300',
        },
        {
            eyebrow: 'Step 1 · Request supplies',
            title: 'Browse central stock and submit a request',
            description: 'Use the Supply Catalog to see what the Supply Office can currently provide, then create a requisition for your Delivery Unit.',
            points: [
                'Available quantity already accounts for approved supplies reserved for other requests.',
                'Choose the needed items and quantities, then explain their intended purpose.',
                'Your assigned Delivery Unit and office head are filled in automatically.',
            ],
            icon: BookOpen,
            tone: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
            action: can('coordinator.catalog.index')
                ? { label: 'Open Supply Catalog', href: route('coordinator.catalog.index') }
                : undefined,
        },
        {
            eyebrow: 'Step 2 · Follow the review',
            title: 'Track every request status',
            description: 'My Requests is your complete request history and shows what needs to happen next.',
            points: [
                'Pending Review means the request is with the Supply Office.',
                'For Correction means you need to edit the request or replace its supporting document.',
                'Approved or Ready for Pickup means quantities are confirmed and reserved until release.',
            ],
            icon: FileText,
            tone: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
            action: can('inventory.requests.index')
                ? { label: 'Open My Requests', href: route('inventory.requests.index') }
                : undefined,
        },
        {
            eyebrow: 'Step 3 · Receive released supplies',
            title: 'Build your Delivery Unit inventory',
            description: 'Once the Supply Office releases an approved request, the released quantities automatically appear in your unit inventory.',
            points: [
                'Central inventory is controlled by the Supply Office; your workspace shows only your unit’s stock.',
                'Released supplies are recorded with their official RIS and stock information.',
                'Low-stock indicators help you decide when to submit another request.',
            ],
            icon: PackageCheck,
            tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
            action: can('coordinator.inventory.index')
                ? { label: 'Open Unit Inventory', href: route('coordinator.inventory.index') }
                : undefined,
        },
        {
            eyebrow: 'Step 4 · Distribute and document',
            title: 'Record issues and keep accountable records',
            description: 'Record supplies distributed to personnel so balances, transaction history, and Stock Cards remain accurate.',
            points: [
                'Record Issue deducts the distributed quantity from your unit balance.',
                'Transaction History provides an audit trail of receipts and issues.',
                'Stock Cards provide the official per-item running balance for reporting and review.',
            ],
            icon: Send,
            tone: 'bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300',
            action: can('coordinator.inventory.index')
                ? { label: 'View Inventory Records', href: route('coordinator.inventory.index', { tab: 'history' }) }
                : undefined,
        },
    ];

    const step = steps[stepIndex];
    const isFirst = stepIndex === 0;
    const isLast = stepIndex === steps.length - 1;
    const Icon = step.icon;

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl" ariaLabel="Supply Coordinator Walkthrough Guide">
            <div className="overflow-hidden rounded-xl bg-white dark:bg-slate-900">
                <div className="h-1.5 bg-gradient-to-r from-red-950 via-red-800 to-amber-500" />
                <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6 dark:border-slate-800">
                    <div>
                        <p className="text-sm font-semibold text-red-900 dark:text-red-300">Supply Coordinator</p>
                        <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-slate-100">Walkthrough Guide</h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Learn how supplies move from the central catalog to your Delivery Unit.</p>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close walkthrough guide" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"><X size={19} /></button>
                </header>

                <div className="grid sm:grid-cols-[180px_minmax(0,1fr)]">
                    <nav aria-label="Walkthrough steps" className="border-b border-slate-200 bg-slate-50/80 p-3 sm:border-b-0 sm:border-r sm:p-4 dark:border-slate-800 dark:bg-slate-950/40">
                        <ol className="grid grid-cols-5 gap-2 sm:grid-cols-1">
                            {steps.map((guideStep, index) => (
                                <li key={guideStep.title}>
                                    <button type="button" onClick={() => setStepIndex(index)} aria-current={index === stepIndex ? 'step' : undefined} aria-label={`Step ${index + 1}: ${guideStep.title}`} className={`flex min-h-10 w-full items-center justify-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 sm:justify-start ${index === stepIndex ? 'bg-red-900 text-white shadow-sm' : 'text-slate-500 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'}`}>
                                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${index === stepIndex ? 'bg-white/20' : index < stepIndex ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>{index < stepIndex ? <CheckCircle2 size={15} /> : index + 1}</span>
                                        <span className="hidden sm:block">{index === 0 ? 'Overview' : `Step ${index}`}</span>
                                    </button>
                                </li>
                            ))}
                        </ol>
                    </nav>

                    <section aria-live="polite" className="min-h-[390px] p-5 sm:p-7">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${step.tone}`}><Icon size={24} aria-hidden="true" /></div>
                        <p className="mt-5 text-sm font-bold text-red-900 dark:text-red-300">{step.eyebrow}</p>
                        <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{step.title}</h3>
                        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">{step.description}</p>
                        <ul className="mt-5 space-y-3">
                            {step.points.map(point => <li key={point} className="flex gap-3 text-sm leading-6 text-slate-600 dark:text-slate-300"><CheckCircle2 size={18} className="mt-1 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" /><span>{point}</span></li>)}
                        </ul>
                        {step.action && <Link href={step.action.href} className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-semibold text-red-900 transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/70">{step.action.label}<ArrowRight size={15} /></Link>}
                    </section>
                </div>

                <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-slate-800 dark:bg-slate-950/40">
                    <p className="text-sm text-slate-500 dark:text-slate-400">{stepIndex + 1} of {steps.length}</p>
                    <div className="flex items-center justify-end gap-2">
                        {!isFirst && <button type="button" onClick={() => setStepIndex(index => index - 1)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"><ChevronLeft size={16} />Back</button>}
                        <button type="button" onClick={() => isLast ? onClose() : setStepIndex(index => index + 1)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-red-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900">{isLast ? 'Finish Guide' : 'Next'}{!isLast && <ChevronRight size={16} />}</button>
                    </div>
                </footer>
            </div>
        </Modal>
    );
}
