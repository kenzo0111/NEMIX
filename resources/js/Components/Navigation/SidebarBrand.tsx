import React from 'react';

interface SidebarBrandProps {
    collapsed?: boolean;
    onCloseMobile?: () => void;
    coordinator?: boolean;
}

export default function SidebarBrand({ collapsed = false, onCloseMobile }: SidebarBrandProps) {
    return (
        <div className="p-4 border-b border-red-900/60 relative z-10 flex items-center justify-between min-h-24 shrink-0 gap-3 px-4 overflow-hidden bg-red-950/40 select-none">
            <div className="flex items-center gap-3 min-w-0">
                <div className="shrink-0 flex items-center justify-center">
                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-white/60 bg-[#fffffa] shadow-sm">
                        <img src="/images/supplysync-sidebar-logo.png" className="h-full w-full scale-[1.28] object-contain" alt="SupplySync supply management logo" width={44} height={44} />
                    </div>
                </div>

                <div
                    className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${
                        collapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[200px] opacity-100'
                    }`}
                >
                    <p className="text-lg font-bold text-amber-300 leading-tight font-sans">
                        SupplySync
                    </p>
                    <p className="mt-1 whitespace-nowrap text-[8px] font-normal leading-tight text-red-100/90 md:text-[9px]">
                        Supply and Property Management Office
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
