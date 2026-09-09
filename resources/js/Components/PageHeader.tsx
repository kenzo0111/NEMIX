import React from 'react';
import SystemModeBadge from '@/Components/SystemModeBadge';
import Breadcrumbs from '@/Components/Breadcrumbs';

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: { name: string; href?: string }[];
  actions?: React.ReactNode;
}

export default function PageHeader({ title, description, breadcrumbs = [], actions }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-40 shadow-xs">
      <div className="bg-white border-b border-gray-200 px-6 lg:px-8 py-3 flex items-center justify-between">
        <div>
          {breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
          <h2 className="text-lg font-bold text-gray-900 font-serif tracking-tight">{title}</h2>
          {description && (
            <p className="text-xs text-gray-500 font-medium">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <SystemModeBadge />
          <div className="text-right hidden sm:block border-l border-gray-200 pl-4">
            <span className="block text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">
              {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
            </span>
          </div>
          {actions && (
            <div className="flex items-center gap-2.5 pl-2 border-l border-gray-200">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
