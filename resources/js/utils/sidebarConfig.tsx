import { ReactNode } from 'react';

interface Submodule {
    title: string;
    href: string;
    active?: boolean;
}

interface Module {
    title: string;
    subtitle: string;
    icon: ReactNode;
    href?: string;
    active?: boolean;
    color: string;
    bg: string;
    submodules?: Submodule[];
}

export function getSidebarModules(activeModule?: string, activeSubmodule?: string): Module[] {
    return [
        {
            title: 'Inventory',
            subtitle: 'Management',
            icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>,
            href: '#',
            active: activeModule === 'Inventory',
            color: 'text-blue-300',
            bg: 'bg-blue-900/50',
            submodules: [
                { title: 'Categories', href: route('inventory.categories'), active: activeSubmodule === 'Categories' },
                { title: 'All Items', href: route('inventory.index'), active: activeSubmodule === 'All Items' },
                { title: 'Receiving', href: route('inventory.receiving'), active: activeSubmodule === 'Receiving' },
                { title: 'Issuance', href: route('inventory.issuance'), active: activeSubmodule === 'Issuance' },
            ]
        },
        {
            title: 'Acquisition',
            subtitle: '& POs',
            icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>,
            href: '#',
            active: activeModule === 'Acquisition',
            color: 'text-green-300',
            bg: 'bg-green-900/50',
            submodules: [
                { title: 'Inbound Deliveries', href: route('acquisition.inbound-deliveries'), active: activeSubmodule === 'Inbound Deliveries' },
            ]
        },
        {
            title: 'Suppliers',
            subtitle: 'Database',
            icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>,
            href: '#',
            active: activeModule === 'Suppliers',
            color: 'text-purple-300',
            bg: 'bg-purple-900/50',
            submodules: [
                { title: 'Manage Supplier', href: route('suppliers.index'), active: activeSubmodule === 'Manage Supplier' },
            ]
        },
        {
            title: 'Compliance',
            subtitle: 'Reports',
            icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>,
            href: '#',
            active: activeModule === 'Compliance',
            color: 'text-orange-300',
            bg: 'bg-orange-900/50'
        },
        {
            title: 'Audit Logs',
            subtitle: 'Trails',
            icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>,
            href: '#',
            active: activeModule === 'Audit Logs',
            color: 'text-gray-300',
            bg: 'bg-gray-800/50'
        },
        {
            title: 'Access',
            subtitle: 'Control',
            icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>,
            href: '#',
            active: activeModule === 'Access',
            color: 'text-red-300',
            bg: 'bg-red-900/50'
        },
    ];
}