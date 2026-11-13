import useAuthorization from '@/Hooks/useAuthorization';
import { router, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, CheckCircle2, Compass, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const COORDINATOR_TOUR_STORAGE_KEY = 'nemix:coordinator-tour-step';
const AUTHORIZED_PERSONNEL_TOUR_STORAGE_KEY = 'nemix:authorized-personnel-tour-step';
export const COORDINATOR_TOUR_START_EVENT = 'nemix:coordinator-tour:start';

type TourStep = {
    routeName: string;
    href: string;
    selector: string;
    eyebrow: string;
    title: string;
    description: string;
    permission?: string;
    exactUrl?: boolean;
};

type TargetRect = { top: number; left: number; right: number; bottom: number; width: number; height: number };

const clamp = (value: number, minimum: number, maximum: number) => Math.min(Math.max(value, minimum), maximum);

export default function CoordinatorWalkthroughGuide() {
    const { can } = useAuthorization();
    const { props, url } = usePage<any>();
    const usesRequesterWorkspace = Boolean(props.auth?.capabilities?.coordinatorInventory);
    const isAuthorizedPersonnel = Boolean(props.auth?.capabilities?.requiresSupportingDocument);
    const roleName = isAuthorizedPersonnel ? 'Authorized Personnel' : 'Supply Coordinator';
    const tourStorageKey = isAuthorizedPersonnel ? AUTHORIZED_PERSONNEL_TOUR_STORAGE_KEY : COORDINATOR_TOUR_STORAGE_KEY;
    const [active, setActive] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const steps = useMemo<TourStep[]>(() => [
        {
            routeName: 'dashboard',
            href: route('dashboard'),
            selector: '[data-tour="coordinator-dashboard-header"]',
            eyebrow: 'Welcome to your workspace',
            title: isAuthorizedPersonnel ? 'This is your Authorized Personnel workspace' : 'This is your Delivery Unit command center',
            description: isAuthorizedPersonnel
                ? 'Start here to manage document-backed supply requests, review central stock, and account for supplies released to your unit.'
                : 'Start here to see what needs attention and jump directly to requests, central stock, or your unit inventory.',
        },
        {
            routeName: 'dashboard',
            href: route('dashboard'),
            selector: '[data-tour="coordinator-dashboard-summary"]',
            eyebrow: 'Live operational picture',
            title: 'Read your workload at a glance',
            description: isAuthorizedPersonnel
                ? 'These cards summarize requests in verification or review, supplies needing replenishment, stock on hand, and the item types assigned to your unit.'
                : 'These cards show active requests, supplies needing replenishment, stock on hand, and the number of item types assigned to your unit.',
        },
        {
            routeName: 'dashboard',
            href: route('dashboard'),
            selector: '[data-tour="coordinator-stock-alerts"]',
            eyebrow: 'Act before stock runs out',
            title: 'Use stock alerts to plan replenishment',
            description: 'Low and out-of-stock items appear here. When permitted, Request opens a requisition with that item already selected.',
        },
        {
            routeName: 'coordinator.catalog.index',
            href: route('coordinator.catalog.index'),
            selector: '[data-tour="coordinator-catalog-search"]',
            eyebrow: 'Explore central stock',
            title: 'Search what the Supply Office can provide',
            description: 'Search or filter the central catalog. Available quantities already exclude supplies reserved for approved and ready-for-pickup requests.',
            permission: 'coordinator.catalog.index',
        },
        {
            routeName: 'coordinator.catalog.index',
            href: route('coordinator.catalog.index'),
            selector: '[data-tour="coordinator-catalog-items"]',
            eyebrow: 'Start a requisition',
            title: 'Request an available item from its card',
            description: isAuthorizedPersonnel
                ? 'Each card separates total Supply Office stock from the quantity available to request. Request This Item carries your selection into the form, where you will also attach proof of authorization.'
                : 'Each card separates total Supply Office stock from the quantity still available to request. Request This Item carries your selection into the request form.',
            permission: 'coordinator.catalog.index',
        },
        ...(isAuthorizedPersonnel ? [{
            routeName: 'inventory.requests.index',
            href: route('inventory.requests.index', { create: 1 }),
            selector: '[data-tour="authorized-personnel-supporting-document"]',
            eyebrow: 'Required proof of authorization',
            title: 'Attach an approved supporting document',
            description: 'Choose the correct document type and upload a genuine PDF, JPG, JPEG, or PNG file up to 10 MB. This document is reviewed separately from the RIS before the request proceeds.',
            permission: 'inventory.requests.store',
            exactUrl: true,
        }] : []),
        {
            routeName: 'inventory.requests.index',
            href: route('inventory.requests.index'),
            selector: '[data-tour="coordinator-request-summary"]',
            eyebrow: isAuthorizedPersonnel ? 'Follow verification and approval' : 'Follow the approval journey',
            title: isAuthorizedPersonnel ? 'Know what each document-backed request needs next' : 'Know exactly what each request needs next',
            description: isAuthorizedPersonnel
                ? 'Pending Verification is awaiting document review, Needs Correction requires your action, Under Review is being evaluated, Ready for Pickup awaits release, and Released has entered your unit inventory.'
                : 'Pending is with the Supply Office, Needs Correction requires your action, Awaiting Release is approved, and Released has entered your unit inventory.',
            permission: 'inventory.requests.index',
            exactUrl: isAuthorizedPersonnel,
        },
        {
            routeName: 'inventory.requests.index',
            href: route('inventory.requests.index'),
            selector: '[data-tour="coordinator-request-workspace"]',
            eyebrow: 'Find any requisition',
            title: 'Search, filter, review, and correct requests',
            description: isAuthorizedPersonnel
                ? 'Use this workspace to locate a RIS, read document or review remarks, correct and resubmit an eligible request, replace its supporting file when needed, download an approved RIS, or cancel an eligible request.'
                : 'Use this workspace to locate a RIS, open details, edit requests returned for correction, download an approved RIS, or cancel an eligible request.',
            permission: 'inventory.requests.index',
        },
        {
            routeName: 'coordinator.inventory.index',
            href: route('coordinator.inventory.index'),
            selector: '[data-tour="coordinator-inventory-summary"]',
            eyebrow: 'Released supplies arrive here',
            title: 'Monitor your Delivery Unit inventory',
            description: 'These totals cover only your unit. Supplies appear after the Supply Office releases an approved request; central inventory remains view-only to you.',
            permission: 'coordinator.inventory.index',
        },
        {
            routeName: 'coordinator.inventory.index',
            href: route('coordinator.inventory.index'),
            selector: '[data-tour="coordinator-inventory-workspace"]',
            eyebrow: 'Complete the accountability cycle',
            title: 'Record issues, history, and Stock Cards',
            description: 'Record distributions to personnel, review every receipt and issue in Transaction History, and generate per-item Stock Cards with a running balance.',
            permission: 'coordinator.inventory.index',
        },
    ].filter(step => !step.permission || can(step.permission)), [can, isAuthorizedPersonnel]);

    const close = useCallback(() => {
        sessionStorage.removeItem(tourStorageKey);
        setActive(false);
        setCompleted(false);
        setTargetRect(null);
    }, [tourStorageKey]);

    const complete = useCallback(() => {
        sessionStorage.removeItem(tourStorageKey);
        setCompleted(true);
        setTargetRect(null);
    }, [tourStorageKey]);

    const start = useCallback(() => {
        if (!usesRequesterWorkspace || steps.length === 0) return;
        sessionStorage.setItem(tourStorageKey, '0');
        setStepIndex(0);
        setCompleted(false);
        setActive(true);
        if (!route().current(steps[0].routeName)) router.visit(steps[0].href);
    }, [steps, tourStorageKey, usesRequesterWorkspace]);

    useEffect(() => {
        const storedStep = sessionStorage.getItem(tourStorageKey);
        if (usesRequesterWorkspace && storedStep !== null) {
            const parsed = Number(storedStep);
            setStepIndex(Number.isInteger(parsed) ? clamp(parsed, 0, Math.max(steps.length - 1, 0)) : 0);
            setActive(steps.length > 0);
        }
        window.addEventListener(COORDINATOR_TOUR_START_EVENT, start);
        return () => window.removeEventListener(COORDINATOR_TOUR_START_EVENT, start);
    }, [start, steps.length, tourStorageKey, usesRequesterWorkspace]);

    const moveTo = useCallback((nextIndex: number) => {
        const bounded = clamp(nextIndex, 0, steps.length - 1);
        sessionStorage.setItem(tourStorageKey, String(bounded));
        setStepIndex(bounded);
        setTargetRect(null);
    }, [steps, tourStorageKey]);

    useEffect(() => {
        if (!active || completed || !steps[stepIndex]) return;
        const currentStep = steps[stepIndex];
        const targetUrl = new URL(currentStep.href, window.location.origin);
        const exactUrlMatches = window.location.pathname === targetUrl.pathname && window.location.search === targetUrl.search;
        if (!route().current(currentStep.routeName) || (currentStep.exactUrl && !exactUrlMatches)) {
            router.visit(currentStep.href);
            return;
        }

        let cancelled = false;
        let retryTimer: number | undefined;
        const locate = (attempt = 0) => {
            if (cancelled) return;
            const target = document.querySelector<HTMLElement>(currentStep.selector);
            if (!target) {
                setTargetRect(null);
                if (attempt < 12) retryTimer = window.setTimeout(() => locate(attempt + 1), 150);
                return;
            }
            if (attempt === 0) target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            const rect = target.getBoundingClientRect();
            const padding = 8;
            const top = Math.max(0, rect.top - padding);
            const left = Math.max(0, rect.left - padding);
            const right = Math.min(window.innerWidth, rect.right + padding);
            const bottom = Math.min(window.innerHeight, rect.bottom + padding);
            setTargetRect({
                top,
                left,
                right,
                bottom,
                width: Math.max(0, right - left),
                height: Math.max(0, bottom - top),
            });
        };
        const initialTimer = window.setTimeout(() => locate(), 280);
        const update = () => locate(1);
        window.addEventListener('resize', update);
        window.addEventListener('scroll', update, true);
        return () => {
            cancelled = true;
            window.clearTimeout(initialTimer);
            if (retryTimer) window.clearTimeout(retryTimer);
            window.removeEventListener('resize', update);
            window.removeEventListener('scroll', update, true);
        };
    }, [active, completed, stepIndex, steps, url]);

    useEffect(() => {
        if (!active) return;
        tooltipRef.current?.focus();
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') close();
            if (!completed && event.key === 'ArrowRight' && stepIndex < steps.length - 1) moveTo(stepIndex + 1);
            if (!completed && event.key === 'ArrowLeft' && stepIndex > 0) moveTo(stepIndex - 1);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [active, close, completed, moveTo, stepIndex, steps.length]);

    if (!active || !usesRequesterWorkspace || !steps[stepIndex]) return null;

    if (completed) return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-[1px]" role="dialog" aria-modal="true" aria-label={`${roleName} walkthrough completed`}>
        <div ref={tooltipRef} tabIndex={-1} className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
            <div className="h-1.5 bg-gradient-to-r from-red-950 via-red-800 to-amber-400" />
            <div className="p-6 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"><CheckCircle2 size={28} aria-hidden="true" /></span>
                    <button type="button" onClick={close} aria-label="Close completion message" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"><X size={18} /></button>
                </div>
                <p className="mt-5 text-sm font-bold text-emerald-700 dark:text-emerald-300">Walkthrough complete</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight">You are ready for day-to-day operations</h2>
                <div className="mt-5 space-y-3">
                    <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">You can always return to this walkthrough from the <strong>Walkthrough Guide</strong> button on your dashboard.</p>
                    <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-950 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-200">{isAuthorizedPersonnel
                        ? 'You can now use this system for your day-to-day supply requests, document submissions, and unit inventory work with the Supply and Property Management Office.'
                        : 'You can now use this system for your day-to-day supply operations with the Supply and Property Management Office.'}</p>
                </div>
            </div>
            <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/50">
                <button type="button" onClick={() => { close(); router.visit(route('dashboard')); }} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-red-900 px-4 text-sm font-semibold text-white hover:bg-red-950">Go to Dashboard<ArrowRight size={16} aria-hidden="true" /></button>
            </div>
        </div>
    </div>;

    const step = steps[stepIndex];
    const viewportWidth = typeof window === 'undefined' ? 1280 : window.innerWidth;
    const viewportHeight = typeof window === 'undefined' ? 720 : window.innerHeight;
    const tooltipWidth = Math.min(380, viewportWidth - 24);
    const placeBelow = !targetRect || targetRect.bottom + 300 < viewportHeight;
    const tooltipTop = targetRect
        ? placeBelow ? clamp(targetRect.bottom + 16, 12, Math.max(12, viewportHeight - 310)) : Math.max(12, targetRect.top - 294)
        : Math.max(12, (viewportHeight - 280) / 2);
    const tooltipLeft = targetRect
        ? clamp(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, 12, viewportWidth - tooltipWidth - 12)
        : Math.max(12, (viewportWidth - tooltipWidth) / 2);

    return <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={`Interactive ${roleName} walkthrough`}>
        {targetRect ? <>
            <div className="fixed left-0 top-0 bg-slate-950/75 backdrop-blur-[1px]" style={{ width: '100%', height: targetRect.top }} />
            <div className="fixed left-0 bg-slate-950/75 backdrop-blur-[1px]" style={{ top: targetRect.top, width: targetRect.left, height: targetRect.height }} />
            <div className="fixed right-0 bg-slate-950/75 backdrop-blur-[1px]" style={{ top: targetRect.top, width: viewportWidth - targetRect.right, height: targetRect.height }} />
            <div className="fixed bottom-0 left-0 bg-slate-950/75 backdrop-blur-[1px]" style={{ width: '100%', height: viewportHeight - targetRect.bottom }} />
            <div className="pointer-events-none fixed rounded-xl ring-4 ring-amber-400 ring-offset-2 ring-offset-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.8)] dark:ring-offset-slate-900/80" style={{ top: targetRect.top, left: targetRect.left, width: targetRect.width, height: targetRect.height }} />
            <div className="fixed" aria-hidden="true" style={{ top: targetRect.top, left: targetRect.left, width: targetRect.width, height: targetRect.height }} />
        </> : <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-[1px]" />}

        <div ref={tooltipRef} tabIndex={-1} className="fixed overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-2xl outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" style={{ top: tooltipTop, left: tooltipLeft, width: tooltipWidth }}>
            <div className="h-1.5 bg-gradient-to-r from-red-950 via-red-800 to-amber-400" />
            <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-900 dark:bg-red-950/50 dark:text-red-300"><Compass size={21} /></span>
                    <button type="button" onClick={close} aria-label="Exit walkthrough" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"><X size={18} /></button>
                </div>
                <p className="mt-4 text-sm font-bold text-red-900 dark:text-red-300">{step.eyebrow}</p>
                <h2 className="mt-1 text-xl font-bold tracking-tight">{step.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{step.description}</p>
                <p className="mt-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" />This tour never changes records.</p>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-950/50">
                <span className="text-sm tabular-nums text-slate-500 dark:text-slate-400">{stepIndex + 1} / {steps.length}</span>
                <div className="flex items-center gap-2">
                    {stepIndex > 0 && <button type="button" onClick={() => moveTo(stepIndex - 1)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"><ArrowLeft size={15} />Back</button>}
                    <button type="button" onClick={() => stepIndex === steps.length - 1 ? complete() : moveTo(stepIndex + 1)} className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-red-900 px-3.5 text-sm font-semibold text-white hover:bg-red-950">{stepIndex === steps.length - 1 ? 'Finish' : 'Next'}{stepIndex < steps.length - 1 && <ArrowRight size={15} />}</button>
                </div>
            </div>
        </div>
    </div>;
}
