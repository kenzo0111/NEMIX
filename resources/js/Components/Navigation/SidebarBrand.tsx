import React from 'react';
import ApplicationLogo from '@/Components/ApplicationLogo';

interface SidebarBrandProps {
    collapsed?: boolean;
    onCloseMobile?: () => void;
}

export default function SidebarBrand({ collapsed = false, onCloseMobile }: SidebarBrandProps) {
    return (
        <div className="p-4 border-b border-red-900/60 relative z-10 flex items-center justify-between h-20 gap-3 px-4 overflow-hidden bg-red-950/40 select-none">
            <div className="flex items-center gap-3 min-w-0">
                <div className="shrink-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white p-1 border border-amber-400/40 shadow-sm flex items-center justify-center">
                        <ApplicationLogo className="w-7 h-7 object-contain" alt="UCN Crest" />
                    </div>
                </div>

                <div
                    className={`whitespace-nowrap flex-1 min-w-0 transition-all duration-300 ease-in-out ${
                        collapsed ? 'max-w-0 opacity-0 pointer-events-none md:hidden' : 'max-w-[200px] opacity-100'
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

            {onCloseMobile && (
                <button
                    type="button"
                    onClick={onCloseMobile}
                    className="md:hidden p-1.5 text-red-200/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer shrink-0"
                    aria-label="Close mobile sidebar"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
    );
}
