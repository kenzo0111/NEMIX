import React from 'react';

interface SidebarSectionProps {
    title: string;
    collapsed?: boolean;
}

export default function SidebarSection({ title, collapsed = false }: SidebarSectionProps) {
    return (
        <div
            className={`px-3 pt-3 pb-1 flex items-center justify-between text-[10px] font-bold text-amber-400/80 uppercase tracking-widest transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap select-none ${
                collapsed ? 'max-h-0 opacity-0 pointer-events-none py-0' : 'max-h-8 opacity-100'
            }`}
        >
            <span>{title}</span>
            <span className="h-[1px] flex-1 bg-red-900/50 ml-2.5"></span>
        </div>
    );
}
