import useAuthorization from '@/Hooks/useAuthorization';
import { router, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, CheckCircle2, Compass, Info, ShieldCheck, X } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    buildSystemAdminWalkthrough,
    readSystemAdminTourProgress,
    saveSystemAdminTourProgress,
    SYSTEM_ADMIN_DAILY_CHECKLIST,
    SYSTEM_ADMIN_TOUR_CHAPTERS,
    SYSTEM_ADMIN_TOUR_START_EVENT,
    systemAdminTourDestinationMatches,
    systemAdminTourPanelPosition,
    systemAdminTourStorageKey,
    type TourRect,
} from './systemAdminWalkthrough';

export default function SystemAdminWalkthroughGuide() {
    const { can, isSystemAdmin, user } = useAuthorization();
    const { url } = usePage();
    const storageKey = systemAdminTourStorageKey(user?.id ?? 'current-session');
    const steps = useMemo(() => buildSystemAdminWalkthrough(
        isSystemAdmin,
        can,
        name => route().has(name),
        (name, params) => route(name, params),
    ), [can, isSystemAdmin]);
    const [active, setActive] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const [targetRect, setTargetRect] = useState<TourRect | null>(null);
    const [targetStatus, setTargetStatus] = useState<'finding' | 'ready' | 'unavailable'>('finding');
    const [openingScreen, setOpeningScreen] = useState(false);
    const [panelHeight, setPanelHeight] = useState(640);
    const [viewport, setViewport] = useState(() => ({
        width: typeof window === 'undefined' ? 1280 : window.innerWidth,
        height: typeof window === 'undefined' ? 720 : window.innerHeight,
    }));
    const overlayRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const restoredKeyRef = useRef<string | null>(null);

    const saveProgress = useCallback((stepId: string | null) => {
        try {
            saveSystemAdminTourProgress(window.sessionStorage, storageKey, stepId);
        } catch {
            // Some privacy settings block access to the storage object itself.
        }
    }, [storageKey]);

    const close = useCallback(() => {
        saveProgress(null);
        setActive(false);
        setCompleted(false);
        setTargetRect(null);
    }, [saveProgress]);

    const complete = useCallback(() => {
        saveProgress(null);
        setCompleted(true);
        setTargetRect(null);
    }, [saveProgress]);

    const openScreen = useCallback((href: string) => {
        setOpeningScreen(true);
        router.visit(href, {
            method: 'get',
            preserveState: false,
            preserveScroll: false,
            onFinish: () => setOpeningScreen(false),
            onError: () => setTargetStatus('unavailable'),
            onCancel: () => setTargetStatus('unavailable'),
        });
    }, []);

    const moveTo = useCallback((index: number) => {
        if (!isSystemAdmin || steps.length === 0) return;
        const next = Math.min(steps.length - 1, Math.max(0, index));
        const step = steps[next];
        saveProgress(step.id);
        setStepIndex(next);
        setCompleted(false);
        setActive(true);
        setTargetRect(null);
        setTargetStatus('finding');
        if (!systemAdminTourDestinationMatches(step.href, window.location.href)) openScreen(step.href);
    }, [isSystemAdmin, openScreen, saveProgress, steps]);

    const start = useCallback(() => moveTo(0), [moveTo]);

    useEffect(() => {
        if (!isSystemAdmin || steps.length === 0) {
            setActive(false);
            return;
        }
        if (restoredKeyRef.current !== storageKey) {
            setActive(false);
            setCompleted(false);
            restoredKeyRef.current = storageKey;
        }
        try {
            const savedIndex = readSystemAdminTourProgress(window.sessionStorage, storageKey, steps);
            if (savedIndex !== null) {
                setStepIndex(savedIndex);
                setActive(true);
                setCompleted(false);
            }
        } catch {
            // Continue without persistence when the browser blocks session storage.
        }
        window.addEventListener(SYSTEM_ADMIN_TOUR_START_EVENT, start);
        return () => window.removeEventListener(SYSTEM_ADMIN_TOUR_START_EVENT, start);
    }, [isSystemAdmin, start, steps, storageKey]);

    useEffect(() => {
        if (!active || completed || !steps[stepIndex]) return;
        const step = steps[stepIndex];
        setTargetRect(null);
        if (!systemAdminTourDestinationMatches(step.href, window.location.href)) {
            setTargetStatus('unavailable');
            return;
        }

        setTargetStatus('finding');
        let cancelled = false;
        let retryTimer: number | undefined;
        let animationFrame = 0;
        let targetObserver: ResizeObserver | undefined;
        const measure = () => {
            if (cancelled) return;
            const target = document.querySelector<HTMLElement>(step.selector);
            if (!target) {
                setTargetRect(null);
                setTargetStatus('unavailable');
                return;
            }
            const rect = target.getBoundingClientRect();
            const top = Math.max(0, rect.top - 8);
            const left = Math.max(0, rect.left - 8);
            const right = Math.min(window.innerWidth, rect.right + 8);
            const bottom = Math.min(window.innerHeight, rect.bottom + 8);
            if (right <= left || bottom <= top) {
                setTargetRect(null);
                return;
            }
            setTargetRect({ top, left, right, bottom, width: right - left, height: bottom - top });
            setTargetStatus('ready');
        };
        const locate = (attempt = 0) => {
            if (cancelled) return;
            const target = document.querySelector<HTMLElement>(step.selector);
            if (!target) {
                if (attempt < 15) retryTimer = window.setTimeout(() => locate(attempt + 1), 150);
                else setTargetStatus('unavailable');
                return;
            }
            target.scrollIntoView({
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
                block: 'center',
                inline: 'nearest',
            });
            if (typeof ResizeObserver !== 'undefined') {
                targetObserver = new ResizeObserver(measure);
                targetObserver.observe(target);
            }
            measure();
        };
        const scheduleMeasure = () => {
            window.cancelAnimationFrame(animationFrame);
            animationFrame = window.requestAnimationFrame(measure);
        };
        const initialTimer = window.setTimeout(() => locate(), 180);
        window.addEventListener('scroll', scheduleMeasure, true);
        window.addEventListener('resize', scheduleMeasure);
        return () => {
            cancelled = true;
            window.clearTimeout(initialTimer);
            window.clearTimeout(retryTimer);
            window.cancelAnimationFrame(animationFrame);
            targetObserver?.disconnect();
            window.removeEventListener('scroll', scheduleMeasure, true);
            window.removeEventListener('resize', scheduleMeasure);
        };
    }, [active, completed, stepIndex, steps, url]);

    useEffect(() => {
        if (!active) return;
        const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
        resize();
        const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => {
            if (panelRef.current) setPanelHeight(panelRef.current.getBoundingClientRect().height);
        });
        if (panelRef.current) observer?.observe(panelRef.current);
        window.addEventListener('resize', resize);
        return () => {
            observer?.disconnect();
            window.removeEventListener('resize', resize);
        };
    }, [active, completed]);

    useEffect(() => {
        if (!active || !isSystemAdmin) return;
        const previousFocus = document.activeElement instanceof HTMLElement && document.activeElement !== document.body
            ? document.activeElement : null;
        const background = [...document.body.children]
            .filter((element): element is HTMLElement => element instanceof HTMLElement && element !== overlayRef.current)
            .map(element => ({ element, wasInert: element.inert }));
        background.forEach(({ element }) => { element.inert = true; });
        return () => {
            background.forEach(({ element, wasInert }) => { element.inert = wasInert; });
            const fallback = document.querySelector<HTMLElement>('[data-tour="system-admin-guide-start"]')
                ?? document.getElementById('workspace-content');
            (previousFocus?.isConnected ? previousFocus : fallback)?.focus({ preventScroll: true });
        };
    }, [active, isSystemAdmin]);

    useEffect(() => {
        if (!active) return;
        panelRef.current?.focus({ preventScroll: true });
        if (contentRef.current) contentRef.current.scrollTop = 0;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                close();
                return;
            }
            if (event.key === 'Tab') {
                const controls = panelRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), select, a[href]');
                if (!controls?.length) return;
                const first = controls[0];
                const last = controls[controls.length - 1];
                const focused = document.activeElement;
                if (event.shiftKey && (focused === first || focused === panelRef.current)) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && (focused === last || focused === panelRef.current)) {
                    event.preventDefault();
                    first.focus();
                }
                return;
            }
            if (completed || event.altKey || event.ctrlKey || event.metaKey
                || (event.target instanceof HTMLElement && event.target.closest('select, input, textarea'))) return;
            if (event.key === 'ArrowRight') {
                event.preventDefault();
                if (stepIndex === steps.length - 1) complete();
                else moveTo(stepIndex + 1);
            }
            if (event.key === 'ArrowLeft' && stepIndex > 0) {
                event.preventDefault();
                moveTo(stepIndex - 1);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [active, close, complete, completed, moveTo, stepIndex, steps.length]);

    if (!active || !isSystemAdmin || !steps[stepIndex] || typeof document === 'undefined') return null;

    const step = steps[stepIndex];
    const position = systemAdminTourPanelPosition(completed ? null : targetRect, viewport.width, viewport.height, panelHeight);
    const progress = completed ? 100 : ((stepIndex + 1) / steps.length) * 100;
    const button = 'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40';

    return createPortal(<div ref={overlayRef} className="fixed inset-0 z-[80] print:hidden" role="dialog" aria-modal="true" aria-labelledby="system-admin-tour-title" aria-describedby="system-admin-tour-description">
        {!completed && targetRect ? <>
            <div aria-hidden="true" className="fixed left-0 top-0 bg-slate-950/75" style={{ width: '100%', height: targetRect.top }} />
            <div aria-hidden="true" className="fixed left-0 bg-slate-950/75" style={{ top: targetRect.top, width: targetRect.left, height: targetRect.height }} />
            <div aria-hidden="true" className="fixed right-0 bg-slate-950/75" style={{ top: targetRect.top, width: viewport.width - targetRect.right, height: targetRect.height }} />
            <div aria-hidden="true" className="fixed bottom-0 left-0 bg-slate-950/75" style={{ width: '100%', height: viewport.height - targetRect.bottom }} />
            <div aria-hidden="true" className="pointer-events-none fixed rounded-xl ring-4 ring-amber-400 ring-offset-2 ring-offset-white/80 dark:ring-offset-slate-900/80" style={{ top: targetRect.top, left: targetRect.left, width: targetRect.width, height: targetRect.height }} />
            <div aria-hidden="true" className="fixed" style={{ top: targetRect.top, left: targetRect.left, width: targetRect.width, height: targetRect.height }} />
        </> : <div aria-hidden="true" className="fixed inset-0 bg-slate-950/75 backdrop-blur-[1px]" />}

        <div ref={panelRef} tabIndex={-1} className="fixed flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" style={{ ...position, maxHeight: 'calc(100dvh - 24px)' }}>
            <div className="h-1.5 shrink-0 bg-gradient-to-r from-red-950 via-red-800 to-amber-400" />
            <div className="shrink-0 border-b border-slate-200 p-4 dark:border-slate-800 sm:px-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${completed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-red-50 text-red-900 dark:bg-red-950/50 dark:text-red-300'}`}>{completed ? <CheckCircle2 size={23} aria-hidden="true" /> : <Compass size={23} aria-hidden="true" />}</span>
                        <div><p className="text-sm font-bold">System Admin walkthrough</p><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{completed ? 'Your daily administration checklist' : `${step.chapter} · Step ${stepIndex + 1} of ${steps.length}`}</p></div>
                    </div>
                    <button type="button" onClick={close} aria-label="Exit System Admin walkthrough" className={`${button} min-h-8 px-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800`}><X size={19} aria-hidden="true" /></button>
                </div>
                {!completed && <div className="mt-3">
                    <label htmlFor="system-admin-tour-topic" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Jump to a topic</label>
                    <select id="system-admin-tour-topic" value={step.id} onChange={event => moveTo(steps.findIndex(item => item.id === event.target.value))} className="w-full min-w-0 rounded-lg border-slate-300 bg-white py-2 pl-3 pr-8 text-sm text-slate-800 focus:border-red-800 focus:ring-red-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                        {SYSTEM_ADMIN_TOUR_CHAPTERS.map(chapter => <optgroup key={chapter} label={chapter}>{steps.filter(item => item.chapter === chapter).map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</optgroup>)}
                    </select>
                </div>}
            </div>

            <div role="progressbar" aria-label="Walkthrough progress" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={completed ? steps.length : stepIndex + 1} className="h-1 shrink-0 bg-slate-100 dark:bg-slate-800"><div className="h-full bg-amber-500 transition-[width] motion-reduce:transition-none" style={{ width: `${progress}%` }} /></div>

            <div ref={contentRef} className="min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5">
                {completed ? <>
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Walkthrough complete</p>
                    <h2 id="system-admin-tour-title" className="mt-1 text-2xl font-bold tracking-tight">Keep the system ready for daily work</h2>
                    <p id="system-admin-tour-description" className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">Use this checklist at the start and end of your administration session. You can return to any topic from the Walkthrough Guide button on your System Admin dashboard.</p>
                    <ul className="mt-4 space-y-3">{SYSTEM_ADMIN_DAILY_CHECKLIST.map(item => <li key={item} className="flex items-start gap-2.5 text-sm leading-6"><CheckCircle2 size={17} className="mt-1 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" /><span>{item}</span></li>)}</ul>
                </> : <>
                    <h2 id="system-admin-tour-title" className="text-xl font-bold tracking-tight">{step.title}</h2>
                    <p id="system-admin-tour-description" className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{step.description}</p>
                    {targetStatus !== 'ready' && <div role="status" className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {openingScreen ? 'Opening the walkthrough screen…' : targetStatus === 'finding' ? 'Finding the highlighted area…' : <><p>The highlighted area is unavailable on this screen. You can still read the instructions, reopen the screen, or continue to another topic.</p><button type="button" onClick={() => openScreen(step.href)} className="mt-2 font-semibold text-red-900 underline underline-offset-2 dark:text-red-300">Open this screen</button></>}
                    </div>}
                    <p className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">How to use this screen</p>
                    <ol className="mt-3 space-y-3">{step.instructions.map((instruction, index) => <li key={instruction} className="flex items-start gap-3 text-sm leading-6"><span aria-hidden="true" className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{index + 1}</span><span>{instruction}</span></li>)}</ol>
                    <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 dark:border-emerald-900 dark:bg-emerald-950/30"><p className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300"><CheckCircle2 size={16} aria-hidden="true" />Expected result</p><p className="mt-1.5 text-sm leading-6 text-emerald-950 dark:text-emerald-100">{step.outcome}</p></div>
                    {step.tip && <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 dark:border-amber-900 dark:bg-amber-950/30"><p className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300"><Info size={16} aria-hidden="true" />Keep in mind</p><p className="mt-1.5 text-sm leading-6 text-amber-950 dark:text-amber-100">{step.tip}</p></div>}
                    <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500 dark:text-slate-400"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />This tour never changes records. Exit the guide to perform the task.</p>
                </>}
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/50 sm:px-5">
                {completed ? <>
                    <button type="button" onClick={start} className={`${button} border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200`}>Review guide</button>
                    <button type="button" onClick={() => { close(); router.visit(route('dashboard')); }} className={`${button} bg-red-900 text-white hover:bg-red-950`}>Go to Dashboard<ArrowRight size={16} aria-hidden="true" /></button>
                </> : <>
                    <button type="button" onClick={close} className={`${button} px-1 text-slate-600 hover:text-red-900 dark:text-slate-300 dark:hover:text-white`}>Exit guide</button>
                    <div className="flex gap-2">
                        <button type="button" disabled={stepIndex === 0} onClick={() => moveTo(stepIndex - 1)} className={`${button} border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200`}><ArrowLeft size={15} aria-hidden="true" />Back</button>
                        <button type="button" onClick={() => stepIndex === steps.length - 1 ? complete() : moveTo(stepIndex + 1)} className={`${button} bg-red-900 text-white hover:bg-red-950`}>{stepIndex === steps.length - 1 ? 'Finish' : 'Next'}{stepIndex < steps.length - 1 && <ArrowRight size={15} aria-hidden="true" />}</button>
                    </div>
                </>}
            </div>
        </div>
    </div>, document.body);
}
