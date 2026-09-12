import React from 'react';
import { Menu } from 'lucide-react';
import SystemModeBadge from '@/Components/SystemModeBadge';
import Breadcrumbs from '@/Components/Breadcrumbs';

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
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <button
            type="button"
            onClick={handleToggleMenu}
            className="md:hidden p-1.5 -ml-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer shrink-0 mt-0.5"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0 flex-1">
            {breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
            <h2 className="text-base sm:text-lg font-bold text-gray-900 font-serif tracking-tight break-words">
              {title}
            </h2>
            {description && (
              <p className="text-xs text-gray-500 font-medium break-words mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4 shrink-0 justify-between md:justify-end">
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
            <div className="flex flex-wrap items-center gap-2 pl-2 border-l border-gray-200">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
