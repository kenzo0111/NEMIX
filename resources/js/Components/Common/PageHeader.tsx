import React, { ReactNode } from 'react';
import Breadcrumbs from '@/Components/Breadcrumbs';

interface BreadcrumbItem {
    name: string;
    href?: string;
}

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    breadcrumbs?: BreadcrumbItem[];
    actions?: ReactNode;
    badges?: ReactNode;
    showDate?: boolean;
}

export default function PageHeader({
    title,
    subtitle,
    breadcrumbs,
    actions,
    badges,
    showDate = true,
}: PageHeaderProps) {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
    const formattedDay = today.toLocaleDateString('en-US', { weekday: 'long' });

    return (
        <div className="bg-white border-b border-gray-200 px-6 lg:px-8 py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    {breadcrumbs && breadcrumbs.length > 0 && (
                        <div className="mb-1">
                            <Breadcrumbs items={breadcrumbs} />
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl lg:text-2xl font-bold text-gray-900 font-serif tracking-tight">
                            {title}
                        </h2>
                        {badges && <div className="flex items-center gap-2">{badges}</div>}
                    </div>
                    {subtitle && (
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                            {subtitle}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    {actions && <div className="flex items-center gap-2.5">{actions}</div>}

                    {showDate && (
                        <div className="text-right hidden sm:block border-l border-gray-200 pl-4 py-0.5">
                            <span className="block text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">
                                {formattedDate}
                            </span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block">
                                {formattedDay}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
