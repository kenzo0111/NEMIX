import Breadcrumbs from '@/Components/Breadcrumbs';
import Sidebar from '@/Components/Sidebar';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { getSidebarModules } from '@/utils/sidebarConfig';

export default function Index({ auth }: { auth: any }) {
    const user = auth.user;
    const [collapsed, setCollapsed] = useState(false);
    const [showModal, setShowModal] = useState(true);
    
    // Scanner State
    const [lastScan, setLastScan] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [logs, setLogs] = useState<{ id: number, code: string, time: string, status: string }[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const modules = getSidebarModules('RFID Scanner');

    // Keep focus on the hidden input to capture scanner input
    useEffect(() => {
        const focusInput = () => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        };
        
        focusInput();
        
        const handleGlobalClick = (e: MouseEvent) => {
            if (!(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
                focusInput();
            }
        };

        document.addEventListener('click', handleGlobalClick);
        return () => document.removeEventListener('click', handleGlobalClick);
    }, []);

    const handleScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const code = e.currentTarget.value.trim();
            if (code) {
                processScan(code);
            }
            e.currentTarget.value = ''; 
        }
    };

    const processScan = (code: string) => {
        setIsScanning(true);
        setLastScan(code);
        
        setTimeout(() => {
            setLogs(prev => [
                {
                    id: Date.now(),
                    code: code,
                    time: new Date().toLocaleTimeString(),
                    status: 'Verified'
                },
                ...prev
            ].slice(0, 10));
            setIsScanning(false);
        }, 600);
    };

    return (
        // UCN Background: Warm gray/cream to be easy on the eyes
        <div className="min-h-screen bg-[#FDFCFB] flex font-sans text-slate-800 relative">
            <Head title="RFID Scanner | UCN" />

            {/* Locked Feature Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/75 backdrop-blur-md p-4 transition-all duration-300">
                    <div className="bg-white rounded-[2rem] p-10 max-w-lg w-full shadow-2xl border border-slate-100 transform -translate-y-4 animate-in fade-in slide-in-from-bottom-8 duration-500">
                        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-[#FFF5F5] mb-6 ring-8 ring-[#FFF5F5]/50">
                            <svg className="h-10 w-10 text-[#800000]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-center text-[#800000] font-serif mb-4 tracking-tight">Access Restricted</h2>
                        <div className="p-4 bg-slate-50 rounded-2xl mb-8 border border-slate-100">
                            <p className="text-center text-slate-600 font-medium text-lg leading-relaxed">
                                PLEASE PASS <span className="text-[#800000] font-bold">CAPSTONE 1</span> FIRST TO PROCEED TO THIS FEATURE.
                            </p>
                        </div>
                        <div className="flex flex-col space-y-3">
                            <button 
                                onClick={() => router.visit('/dashboard')} 
                                className="w-full py-3 px-4 bg-[#800000] hover:bg-[#600000] text-white rounded-xl font-bold tracking-wide transition-all shadow-lg shadow-[#800000]/20 hover:shadow-[#800000]/40 hover:-translate-y-0.5"
                            >
                                Return to Dashboard
                            </button>
                            <button 
                                onClick={() => setShowModal(false)}
                                className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl font-bold tracking-wide transition-colors"
                            >
                                Dismiss Warning (Preview Mode)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Sidebar
                modules={modules}
                user={user}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed(!collapsed)}
            />

            <main className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? 'ml-20' : 'ml-72'}`}>
                {/* Header with UCN Maroon Border Accent */}
                <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b-4 border-[#800000] px-8 py-6 flex items-center justify-between shadow-sm">
                    <div>
                        <div className="mb-1">
                            <Breadcrumbs items={[{ name: 'RFID Scanner', href: '#' }]} />
                        </div>
                        <h2 className="text-3xl font-bold text-[#800000] font-serif tracking-tight">
                            RFID <span className="text-[#B22222]">Attendance System</span>
                        </h2>
                    </div>
                </header>

                <div className="p-8 max-w-7xl mx-auto pb-20">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* Main Scanner Section */}
                        <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-xl shadow-maroon-900/5 border border-slate-100 overflow-hidden p-10 flex flex-col">
                            <div className="mb-8">
                                <h3 className="text-2xl font-bold text-slate-900 font-serif mb-2">Ready to Scan</h3>
                                <p className="text-slate-500 font-medium">
                                    Position the RFID tag near the reader. The system is currently active.
                                </p>
                            </div>
                            
                            <input 
                                type="text" 
                                ref={inputRef}
                                onKeyDown={handleScan}
                                className="opacity-0 absolute w-0 h-0"
                                autoFocus
                            />
                            
                            <div className={`flex flex-col flex-1 items-center justify-center min-h-[350px] border-4 border-dashed rounded-[2rem] transition-all duration-500 ${
                                isScanning 
                                ? 'border-[#FFD700] bg-[#FFFBEB] scale-[1.01]' 
                                : lastScan 
                                ? 'border-[#800000] bg-[#FFF5F5]' 
                                : 'border-slate-200 bg-slate-50'
                            }`}>
                                {isScanning ? (
                                    <>
                                        <div className="relative flex items-center justify-center mb-6">
                                            <div className="absolute animate-ping h-20 w-20 rounded-full bg-[#FFD700] opacity-20"></div>
                                            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#800000]"></div>
                                        </div>
                                        <p className="text-[#800000] font-bold text-lg uppercase tracking-widest font-sans">Processing Data...</p>
                                    </>
                                ) : lastScan ? (
                                    <div className="text-center animate-in fade-in zoom-in duration-300">
                                        <div className="h-20 w-20 bg-[#800000] rounded-full flex items-center justify-center mx-auto mb-6 text-[#FFD700] shadow-lg">
                                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                                            </svg>
                                        </div>
                                        <p className="text-[#800000] font-bold text-2xl mb-2 font-serif">Identity Verified</p>
                                        <div className="px-6 py-2 bg-white border border-[#FFD700] rounded-full inline-block">
                                            <p className="text-[#800000] font-mono text-xl font-bold">{lastScan}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center group">
                                        <div className="mb-6 p-6 bg-white rounded-full shadow-inner inline-block transition-transform group-hover:scale-110 duration-300">
                                            <svg className="w-20 h-20 text-slate-300 group-hover:text-[#FFD700] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                            </svg>
                                        </div>
                                        <p className="text-slate-400 font-bold tracking-widest uppercase text-sm">System Standing By</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Scans Sidebar */}
                        <div className="bg-white rounded-[2rem] shadow-xl shadow-maroon-900/5 border border-slate-100 overflow-hidden flex flex-col h-[600px]">
                            <div className="p-6 border-b border-slate-100 bg-[#800000] text-white">
                                <h3 className="font-bold text-lg font-serif tracking-wide flex items-center">
                                    <span className="w-2 h-2 bg-[#FFD700] rounded-full mr-3 animate-pulse"></span>
                                    Recent Activity
                                </h3>
                            </div>
                            <div className="p-2 overflow-y-auto flex-1 bg-slate-50/30">
                                {logs.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-sm font-medium text-slate-400 italic">
                                        No entries recorded yet
                                    </div>
                                ) : (
                                    <ul className="space-y-2 p-2">
                                        {logs.map((log) => (
                                            <li key={log.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-[#FFD700] transition-all">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-mono text-sm font-black text-[#800000]">{log.code}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{log.time}</p>
                                                    </div>
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#FFFBEB] text-[#800000] border border-[#FFD700]">
                                                        {log.status}
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}