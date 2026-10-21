import React from 'react';

interface SidebarSectionProps {
    title: string;
    collapsed?: boolean;
    coordinator?: boolean;
}

export default function SidebarSection({ title, collapsed = false, coordinator = false }: SidebarSectionProps) {
    return (
        <div
            className={`px-3 pt-3 pb-1 flex items-center justify-between ${coordinator ? 'text-xs font-medium text-amber-300' : 'text-sm font-bold text-amber-400/80'} normal-case tracking-normal transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap select-none ${
                collapsed ? 'max-h-0 opacity-0 pointer-events-none py-0' : 'max-h-8 opacity-100'
            }`}
        >
            <span>{title}</span>
            <span className="h-[1px] flex-1 bg-red-900/50 ml-2.5"></span>
        </div>
    );
}
