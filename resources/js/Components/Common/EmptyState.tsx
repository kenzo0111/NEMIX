import React, { ReactNode } from 'react';
import { Inbox, SearchX } from 'lucide-react';

interface EmptyStateProps {
    title?: string;
    description?: string;
    icon?: ReactNode;
    action?: ReactNode;
    isSearch?: boolean;
}

export default function EmptyState({
    title,
    description,
    icon,
    action,
    isSearch = false,
}: EmptyStateProps) {
    const defaultIcon = isSearch ? (
        <SearchX className="w-8 h-8 text-gray-400" />
    ) : (
        <Inbox className="w-8 h-8 text-gray-400" />
    );

    const defaultTitle = isSearch
        ? 'No matching records found'
        : 'No records available';

    const defaultDescription = isSearch
        ? 'Try adjusting your search terms or filter criteria.'
        : 'No entries have been recorded yet in this official registry.';

    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="p-3 bg-gray-100 rounded-full border border-gray-200 mb-3 text-gray-500">
                {icon || defaultIcon}
            </div>
            <h4 className="text-sm font-bold text-gray-900 font-sans tracking-tight">
                {title || defaultTitle}
            </h4>
            <p className="text-xs text-gray-500 mt-1 max-w-md font-medium">
                {description || defaultDescription}
            </p>
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
