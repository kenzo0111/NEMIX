import React from 'react';

interface SidebarBrandProps {
    collapsed?: boolean;
    onCloseMobile?: () => void;
}

export default function SidebarBrand({ collapsed = false, onCloseMobile }: SidebarBrandProps) {
    return (
        <div className="relative z-10 flex min-h-24 shrink-0 items-center overflow-hidden border-b border-[#7d2020] bg-[radial-gradient(ellipse_at_center,_#570c0c,_#400606)] px-4 py-5 select-none">
            <div className={`flex w-full min-w-0 items-center ${collapsed ? 'gap-0' : 'gap-3'}`}>
                <div className="shrink-0 flex items-center justify-center">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-[10px] bg-[#fffffa]">
                        <img src="/images/supplysync-sidebar-logo.png" className="h-full w-full scale-[1.28] object-contain" alt="SupplySync supply management logo" width={48} height={48} />
                    </div>
                </div>

                <div
                    aria-hidden={collapsed}
                    className={`min-w-0 overflow-hidden transition-all duration-300 ease-in-out ${
                        collapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[200px] flex-1 border-l border-[#874040]/70 pl-3 opacity-100'
                    }`}
                >
                    <p className="w-fit whitespace-nowrap font-sans text-2xl font-semibold leading-tight tracking-tight text-amber-200">
                        SupplySync
                    </p>
                    <p className="mt-1.5 font-sans text-xs font-normal leading-snug text-[#f5efec]">
                        Consumable Supply Management
                    </p>
                </div>
            </div>

            {onCloseMobile && (
                <button
                    type="button"
                    onClick={onCloseMobile}
                    className="absolute right-1 top-1 rounded-lg p-1 text-red-200/70 transition-colors hover:bg-white/10 hover:text-white md:hidden cursor-pointer"
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
