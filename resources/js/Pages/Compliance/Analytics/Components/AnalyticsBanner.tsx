import React from 'react';
import { Building2, CalendarDays, ChartNoAxesCombined, PackageCheck } from 'lucide-react';

interface AnalyticsBannerProps {
    startDate: string | number;
    endDate: string | number;
    department?: string | number;
}

export default function AnalyticsBanner({ startDate, endDate, department }: AnalyticsBannerProps) {
    return (
        <section
            aria-label="Supply analytics overview"
            className="rounded-lg border border-red-900 border-l-4 border-l-amber-500 bg-red-950 p-4 text-white shadow-xs sm:p-5 lg:p-6"
        >
            <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
                <div className="flex min-w-0 flex-col items-start gap-3.5 sm:flex-row sm:items-center sm:gap-4 xl:flex-1">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-red-800 bg-red-900/90 text-amber-300 shadow-xs sm:h-14 sm:w-14">
                        <ChartNoAxesCombined size={26} aria-hidden="true" />
                    </div>
                    <div className="min-w-0 space-y-1">
                        <span className="inline-flex rounded border border-red-800 bg-red-900/80 px-2.5 py-0.5 text-sm font-semibold text-amber-300">
                            Supply &amp; Property Management Office
                        </span>
                        <h2 className="break-words text-2xl font-bold tracking-tight text-white sm:text-3xl">
                            Supply demand overview
                        </h2>
                        <p className="max-w-2xl text-sm font-normal leading-relaxed text-red-200/90">
                            Understand office demand, track confirmed releases, and plan university supply needs.
                        </p>
                    </div>
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-2 self-start xl:max-w-[360px] xl:self-auto">
                    <span className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-red-800 bg-red-900/60 px-3 py-1.5 text-sm text-red-100">
                        <Building2 size={14} className="shrink-0 text-amber-300" aria-hidden="true" />
                        <span className="break-words font-semibold text-amber-300">
                            {department || 'University-wide'}
                        </span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-red-800 bg-red-900/60 px-3 py-1.5 text-sm text-red-100">
                        <PackageCheck size={14} className="shrink-0 text-emerald-300" aria-hidden="true" />
                        <span>Confirmed releases</span>
                    </span>
                    <span className="inline-flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-1 rounded-md border border-red-800 bg-red-900/60 px-3 py-1.5 text-sm text-red-100">
                        <CalendarDays size={14} className="shrink-0 text-amber-300" aria-hidden="true" />
                        <span className="text-red-200">Period:</span>
                        <span className="font-semibold tabular-nums">{startDate}</span>
                        <span className="text-red-200/80">to</span>
                        <span className="font-semibold tabular-nums">{endDate}</span>
                    </span>
                </div>
            </div>
        </section>
    );
}
