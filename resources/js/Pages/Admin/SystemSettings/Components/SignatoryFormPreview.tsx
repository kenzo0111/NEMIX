import React, { useEffect, useRef, useState } from 'react';
import { Eye, Maximize2, Minimize2 } from 'lucide-react';

interface SignatoryFormPreviewProps {
    form: 'RIS' | 'RSMI' | 'RPCI' | 'MOR';
    landscape?: boolean;
    children: React.ReactNode;
}

export default function SignatoryFormPreview({
    form,
    landscape = false,
    children,
}: SignatoryFormPreviewProps) {
    const viewportRef = useRef<HTMLDivElement>(null);
    const paperRef = useRef<HTMLDivElement>(null);
    const [actualSize, setActualSize] = useState(false);
    const [dimensions, setDimensions] = useState({ scale: 1, height: 0 });
    const pageWidth = landscape ? 1123 : 794;

    useEffect(() => {
        const viewport = viewportRef.current;
        const paper = paperRef.current;
        if (!viewport || !paper) return;

        const updateDimensions = () => {
            const scale = actualSize ? 1 : Math.min(viewport.clientWidth / pageWidth, 1);
            const height = paper.offsetHeight;
            setDimensions((previous) =>
                previous.scale === scale && previous.height === height
                    ? previous
                    : { scale, height }
            );
        };

        updateDimensions();
        const observer = new ResizeObserver(updateDimensions);
        observer.observe(viewport);
        observer.observe(paper);
        return () => observer.disconnect();
    }, [actualSize, pageWidth]);

    return (
        <section
            aria-label={`Live ${form} Form Preview`}
            className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-950"
        >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
                <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                    <Eye className="h-4 w-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                    Live {form} Form Preview
                </h4>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Live preview
                </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3">
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    Sample form. Changes appear immediately; save settings to apply.
                </p>
                <button
                    type="button"
                    aria-pressed={actualSize}
                    onClick={() => setActualSize((previous) => !previous)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                    {actualSize ? <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" /> : <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />}
                    {actualSize ? 'Fit to width' : 'Actual size'}
                </button>
            </div>

            <div className="overflow-x-auto p-3 sm:p-4" tabIndex={0} aria-label={`${form} preview document`}>
                <div ref={viewportRef}>
                    <div
                        className="relative mx-auto"
                        style={{ width: pageWidth * dimensions.scale, height: dimensions.height * dimensions.scale }}
                    >
                        <div
                            ref={paperRef}
                            className="absolute left-0 top-0 origin-top-left rounded-sm border border-slate-300 bg-white p-[8mm] text-black shadow-sm"
                            style={{ width: pageWidth, transform: `scale(${dimensions.scale})` }}
                        >
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
