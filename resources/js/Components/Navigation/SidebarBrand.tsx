import React from 'react';
import ApplicationLogo from '@/Components/ApplicationLogo';

interface SidebarBrandProps {
    collapsed?: boolean;
}

export default function SidebarBrand({ collapsed = false }: SidebarBrandProps) {
    return (
        <div className="p-4 border-b border-red-900/60 relative z-10 flex items-center h-20 gap-3 px-4 overflow-hidden bg-red-950/40 select-none">
            <div className="shrink-0 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-white p-1 border border-amber-400/40 shadow-sm flex items-center justify-center">
                    <ApplicationLogo className="w-7 h-7 object-contain" alt="UCN Crest" />
                </div>
            </div>

            <div
                className={`whitespace-nowrap flex-1 min-w-0 transition-all duration-300 ease-in-out ${
                    collapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[200px] opacity-100'
                }`}
            >
                <h1 className="font-bold tracking-wider text-sm text-white leading-tight font-serif">
                    UCN SPMO
                </h1>
                <p className="text-[10px] text-amber-400/90 font-medium uppercase tracking-widest leading-tight truncate">
                    Supply & Property Management
                </p>
            </div>
        </div>
    );
}
