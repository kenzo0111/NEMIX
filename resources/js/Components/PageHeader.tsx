import React from 'react';
import { Menu } from 'lucide-react';
import SystemModeBadge from '@/Components/SystemModeBadge';
import Breadcrumbs from '@/Components/Breadcrumbs';
import ThemeToggle from '@/Components/ThemeToggle';

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: { name: string; href?: string }[];
  actions?: React.ReactNode;
  onToggleSidebar?: () => void;
}

export default function PageHeader({
  title,
  description,
  breadcrumbs = [],
  actions,
  onToggleSidebar,
}: PageHeaderProps) {
  const handleToggleMenu = () => {
    if (onToggleSidebar) {
      onToggleSidebar();
    } else {
      window.dispatchEvent(new CustomEvent('toggle-nemix-mobile-sidebar'));
    }
  };

  return (
    <header className="sticky top-0 z-30 shadow-xs">
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 py-3 flex flex-col xl:flex-row xl:items-center justify-between gap-3 transition-colors">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <button
            type="button"
            onClick={handleToggleMenu}
            className="md:hidden min-h-[40px] min-w-[40px] p-2 -ml-1 text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0 inline-flex items-center justify-center"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0 flex-1">
            {breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} currentPage={title} />}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100 font-sans tracking-tight break-words">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-gray-600 dark:text-slate-400 font-normal leading-relaxed break-words mt-1 max-w-prose">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4 shrink-0 justify-between xl:justify-end">
          <SystemModeBadge />
          <ThemeToggle variant="compact" />
          <div className="text-right hidden xl:block border-l border-gray-200 dark:border-slate-800 pl-4">
            <span className="block text-sm font-bold text-gray-800 dark:text-slate-200 normal-case tracking-normal tabular-nums">
              {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span className="text-sm text-gray-500 dark:text-slate-400 normal-case tracking-normal font-semibold block mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
            </span>
          </div>
          {actions && (
            <div className="flex flex-wrap items-center gap-2 pl-2 border-l border-gray-200 dark:border-slate-800">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
