import Breadcrumbs from '@/Components/Breadcrumbs';
import Sidebar from '@/Components/Sidebar';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { getSidebarModules } from '@/utils/sidebarConfig';
import Select from 'react-select';

interface Item {
    id: number;
    name: string;
    sku: string | null;
    description: string | null;
    unit_of_issue: string | null;
    stock: number;
    status: string;
    rfid_tag: string | null;
    supplier_id: number | null;
    supplier_name: string;
    updated_at?: string;
}

interface PageProps {
    auth: { user: any };
    items: Item[];
    selectedItemId?: string | number | null;
    errors?: Record<string, string>;
}

export default function Index({ auth, items = [], selectedItemId = null }: PageProps) {
    const user = auth.user;
    const [collapsed, setCollapsed] = useState(false);
    
    // Selected item state
    const [selectedItem, setSelectedItem] = useState<Item | null>(() => {
        if (selectedItemId) {
            const found = items.find(i => String(i.id) === String(selectedItemId));
            if (found) return found;
        }
        return items.length > 0 ? items[0] : null;
    });

    // Scanner state
    const [isScannerActive, setIsScannerActive] = useState(true);
    const [scannedRfid, setScannedRfid] = useState<string>('');
    const [lastScanTime, setLastScanTime] = useState<string | null>(null);
    const [manualInput, setManualInput] = useState<string>('');
    const [recentScans, setRecentScans] = useState<{ id: number; code: string; time: string; itemName: string; status: string }[]>([]);

    const inputRef = useRef<HTMLInputElement>(null);
    const modules = getSidebarModules('RFID Scanner');

    // Keep hidden input focused when scanner is active
    useEffect(() => {
        if (!isScannerActive) return;

        const focusInput = () => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        };

        focusInput();

        const handleGlobalClick = (e: MouseEvent) => {
            if (
                !(e.target instanceof HTMLInputElement) &&
                !(e.target instanceof HTMLTextAreaElement) &&
                !(e.target as HTMLElement).closest('.react-select-container')
            ) {
                focusInput();
            }
        };

        document.addEventListener('click', handleGlobalClick);
        return () => document.removeEventListener('click', handleGlobalClick);
    }, [isScannerActive]);

    // Handle scanner keyboard input (terminated by Enter key)
    const handleScanKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const code = e.currentTarget.value.trim();
            if (code) {
                processScanResult(code);
            }
            e.currentTarget.value = '';
        }
    };

    const processScanResult = (code: string) => {
        const cleanCode = code.toUpperCase().trim();
        setScannedRfid(cleanCode);
        setLastScanTime(new Date().toLocaleTimeString());

        // Check if conflict
        const existingItem = items.find(i => i.rfid_tag?.toUpperCase() === cleanCode && i.id !== selectedItem?.id);
        const statusLabel = existingItem ? 'Conflict' : 'Verified';

        setRecentScans(prev => [
            {
                id: Date.now(),
                code: cleanCode,
                time: new Date().toLocaleTimeString(),
                itemName: existingItem ? existingItem.name : selectedItem ? selectedItem.name : 'Unassigned',
                status: statusLabel,
            },
            ...prev.slice(0, 9),
        ]);
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualInput.trim()) {
            processScanResult(manualInput.trim());
            setManualInput('');
        }
    };

    // React-Select Options for items
    const itemOptions = useMemo(() => {
        return items.map(item => ({
            value: item.id,
            label: `${item.name} (${item.sku || 'No Property No'}) ${item.rfid_tag ? `[RFID: ${item.rfid_tag}]` : '[Not Tagged]'}`,
            item: item,
        }));
    }, [items]);

    const selectedOption = useMemo(() => {
        if (!selectedItem) return null;
        return {
            value: selectedItem.id,
            label: `${selectedItem.name} (${selectedItem.sku || 'No Property No'}) ${selectedItem.rfid_tag ? `[RFID: ${selectedItem.rfid_tag}]` : '[Not Tagged]'}`,
            item: selectedItem,
        };
    }, [selectedItem]);

    // Conflict Check: Is the currently scanned RFID already assigned to a DIFFERENT item?
    const conflictItem = useMemo(() => {
        if (!scannedRfid) return null;
        return items.find(
            i => i.rfid_tag && i.rfid_tag.toUpperCase() === scannedRfid.toUpperCase() && i.id !== selectedItem?.id
        );
    }, [scannedRfid, items, selectedItem]);

    // Form submission to assign RFID
    const [processing, setProcessing] = useState(false);

    const handleAssignRfid = () => {
        if (!selectedItem || !scannedRfid || conflictItem) return;

        router.post(
            route('rfid-scanner.assign'),
            {
                item_id: selectedItem.id,
                rfid_tag: scannedRfid,
            },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: () => {
                    // Update local selected item status
                    setSelectedItem(prev => (prev ? { ...prev, rfid_tag: scannedRfid } : null));
                },
            }
        );
    };

    const handleUnassignRfid = () => {
        if (!selectedItem || !selectedItem.rfid_tag) return;

        router.post(
            route('rfid-scanner.unassign'),
            {
                item_id: selectedItem.id,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedItem(prev => (prev ? { ...prev, rfid_tag: null } : null));
                    if (scannedRfid === selectedItem.rfid_tag) {
                        setScannedRfid('');
                    }
                },
            }
        );
    };

    const taggedItemsCount = useMemo(() => items.filter(i => i.rfid_tag).length, [items]);

    return (
        <div className="min-h-screen bg-[#FDFCFB] flex font-sans text-slate-800 relative">
            <Head title="RFID Tagging & Management Console | UCN" />

            <Sidebar
                modules={modules}
                user={user}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed(!collapsed)}
            />

            <main className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? 'ml-20' : 'ml-72'}`}>
                {/* Header */}
                <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b-4 border-[#800000] px-8 py-5 flex items-center justify-between shadow-sm">
                    <div>
                        <div className="mb-1">
                            <Breadcrumbs items={[{ name: 'RFID Scanner', href: '#' }]} />
                        </div>
                        <h2 className="text-2xl lg:text-3xl font-bold text-[#800000] font-serif tracking-tight flex items-center gap-3">
                            <span>RFID Tagging & Management Console</span>
                        </h2>
                    </div>

                    {/* Workflow Stepper Indicator */}
                    <div className="hidden xl:flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl text-xs font-semibold">
                        <span className="text-slate-400">Workflow:</span>
                        <span className="px-2.5 py-1 bg-gray-200 text-gray-700 rounded-lg">1. Create Item</span>
                        <span className="text-slate-300">→</span>
                        <span className="px-2.5 py-1 bg-[#800000] text-white rounded-lg font-bold shadow-sm ring-2 ring-[#800000]/20">2. Scan & Assign RFID</span>
                        <span className="text-slate-300">→</span>
                        <span className="px-2.5 py-1 bg-gray-200 text-gray-700 rounded-lg">3. Receive via RFID</span>
                    </div>
                </header>

                <div className="p-6 lg:p-8 max-w-7xl mx-auto pb-20 space-y-8">
                    {/* Top Status Bar */}
                    <div className="bg-[#800000] rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                                <svg className="w-8 h-8 text-[#FFD700]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold font-serif tracking-wide text-white">Central RFID Pairing Hub</h3>
                                <p className="text-xs text-slate-300">
                                    Assign physical RFID tags to item master records before receiving them into inventory.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2 rounded-2xl text-center">
                                <p className="text-[10px] text-slate-300 uppercase tracking-widest font-bold">Total Items</p>
                                <p className="text-lg font-bold text-white">{items.length}</p>
                            </div>
                            <div className="bg-emerald-500/20 border border-emerald-400/30 px-4 py-2 rounded-2xl text-center">
                                <p className="text-[10px] text-emerald-300 uppercase tracking-widest font-bold">Tagged RFID</p>
                                <p className="text-lg font-bold text-emerald-400">{taggedItemsCount}</p>
                            </div>
                            <div className="bg-amber-500/20 border border-amber-400/30 px-4 py-2 rounded-2xl text-center">
                                <p className="text-[10px] text-amber-300 uppercase tracking-widest font-bold">Untagged</p>
                                <p className="text-lg font-bold text-amber-400">{items.length - taggedItemsCount}</p>
                            </div>
                        </div>
                    </div>

                    {/* Main Grid: Step 1 & Step 2 */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* STEP 1: Select Item & Item Details Card */}
                        <div className="lg:col-span-6 bg-white rounded-3xl p-7 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#800000] text-white font-bold text-sm shadow-md shadow-[#800000]/20">1</span>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 font-serif">Selected Inventory Item</h3>
                                            <p className="text-xs text-slate-500">Pick item record to pair with RFID tag</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => router.visit(route('inventory.index'))}
                                        className="text-xs text-[#800000] hover:text-[#600000] font-semibold flex items-center gap-1 hover:underline"
                                    >
                                        Manage Items →
                                    </button>
                                </div>

                                {/* Select Dropdown */}
                                <div className="mb-6">
                                    <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">
                                        Search & Select Item
                                    </label>
                                    <div className="react-select-container">
                                        <Select
                                            options={itemOptions}
                                            value={selectedOption}
                                            onChange={(option: any) => {
                                                if (option) {
                                                    setSelectedItem(option.item);
                                                }
                                            }}
                                            placeholder="Type item name or property number..."
                                            className="text-sm"
                                            styles={{
                                                control: (provided, state) => ({
                                                    ...provided,
                                                    borderRadius: '0.75rem',
                                                    padding: '2px',
                                                    borderColor: state.isFocused ? '#800000' : '#E2E8F0',
                                                    boxShadow: state.isFocused ? '0 0 0 2px rgba(128, 0, 0, 0.15)' : 'none',
                                                    '&:hover': { borderColor: '#800000' }
                                                })
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Detailed Item Card */}
                                {selectedItem ? (
                                    <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="text-xl font-bold text-slate-900 font-serif mb-1">{selectedItem.name}</h4>
                                                <p className="text-xs text-slate-500 font-mono">
                                                    Property No / SKU: <span className="font-semibold text-slate-700">{selectedItem.sku || 'N/A'}</span>
                                                </p>
                                            </div>

                                            {/* RFID Status Badge */}
                                            {selectedItem.rfid_tag ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                                                    Tagged
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                                    <span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span>
                                                    Not Tagged
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-200/60">
                                            <div className="bg-white p-3 rounded-xl border border-slate-100">
                                                <span className="text-slate-400 block font-medium">Supplier</span>
                                                <span className="font-semibold text-slate-800">{selectedItem.supplier_name || 'N/A'}</span>
                                            </div>
                                            <div className="bg-white p-3 rounded-xl border border-slate-100">
                                                <span className="text-slate-400 block font-medium">Current Stock</span>
                                                <span className="font-semibold text-slate-800">{selectedItem.stock} {selectedItem.unit_of_issue || 'units'}</span>
                                            </div>
                                        </div>

                                        {selectedItem.description && (
                                            <div className="bg-white p-3 rounded-xl border border-slate-100 text-xs">
                                                <span className="text-slate-400 block font-medium mb-0.5">Description</span>
                                                <p className="text-slate-600 line-clamp-2">{selectedItem.description}</p>
                                            </div>
                                        )}

                                        {/* Assigned RFID Info Box */}
                                        <div className="pt-2">
                                            <div className={`p-4 rounded-xl border flex items-center justify-between ${
                                                selectedItem.rfid_tag 
                                                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' 
                                                : 'bg-slate-100/70 border-slate-200 text-slate-500'
                                            }`}>
                                                <div>
                                                    <span className="text-[10px] uppercase font-bold tracking-wider block text-slate-400">Assigned RFID Tag ID</span>
                                                    <span className="font-mono text-base font-extrabold text-[#800000]">
                                                        {selectedItem.rfid_tag || 'None Assigned'}
                                                    </span>
                                                </div>

                                                {selectedItem.rfid_tag && (
                                                    <button
                                                        onClick={handleUnassignRfid}
                                                        className="px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl transition-all shadow-sm"
                                                    >
                                                        Unassign Tag
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <p className="text-slate-400 font-medium text-sm">No items found in inventory master list.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* STEP 2: RFID Scanner & Detection */}
                        <div className="lg:col-span-6 bg-white rounded-3xl p-7 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#800000] text-white font-bold text-sm shadow-md shadow-[#800000]/20">2</span>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 font-serif">RFID Scanner & Tag Detection</h3>
                                            <p className="text-xs text-slate-500">Scan physical sticker or enter tag ID manually</p>
                                        </div>
                                    </div>

                                    {/* Connection Toggle */}
                                    <button
                                        onClick={() => setIsScannerActive(!isScannerActive)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border transition-all ${
                                            isScannerActive
                                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                                            : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${isScannerActive ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`}></span>
                                        {isScannerActive ? 'Scanner Active' : 'Scanner Standby'}
                                    </button>
                                </div>

                                {/* Hidden input to catch scanner keystrokes */}
                                <input
                                    type="text"
                                    ref={inputRef}
                                    onKeyDown={handleScanKeyDown}
                                    className="opacity-0 absolute w-0 h-0 pointer-events-none"
                                    readOnly={!isScannerActive}
                                />

                                {/* Interactive Scanner Surface */}
                                <div className={`relative p-8 rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center text-center min-h-[220px] mb-6 ${
                                    conflictItem
                                    ? 'bg-rose-50 border-rose-300'
                                    : scannedRfid
                                    ? 'bg-amber-50/50 border-[#800000]/40'
                                    : isScannerActive
                                    ? 'bg-gradient-to-b from-red-50/30 to-slate-50 border-[#800000]/30 shadow-inner'
                                    : 'bg-slate-50 border-slate-200'
                                }`}>
                                    {scannedRfid ? (
                                        <div className="space-y-3 animate-in zoom-in-95 duration-200">
                                            <div className="w-14 h-14 bg-[#800000] text-[#FFD700] rounded-full flex items-center justify-center mx-auto shadow-lg shadow-[#800000]/30">
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#800000]">Detected RFID ID</span>
                                                <div className="px-5 py-2 bg-white rounded-xl border border-[#FFD700] shadow-sm inline-block mt-1">
                                                    <p className="font-mono text-2xl font-black text-[#800000] tracking-wider">{scannedRfid}</p>
                                                </div>
                                            </div>
                                            {lastScanTime && (
                                                <p className="text-[10px] text-slate-400 font-medium">Scanned at {lastScanTime}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="w-16 h-16 bg-white rounded-full shadow-md border border-slate-100 flex items-center justify-center mx-auto text-[#800000] group">
                                                <svg className={`w-8 h-8 transition-transform ${isScannerActive ? 'animate-pulse text-[#800000]' : 'text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                                </svg>
                                            </div>
                                            <p className="text-sm font-bold text-slate-700">
                                                {isScannerActive ? 'Ready to Scan RFID Tag...' : 'Scanner Paused'}
                                            </p>
                                            <p className="text-xs text-slate-400 max-w-xs mx-auto">
                                                Hold RFID tag near reader. The unique identifier will be captured automatically.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Manual Tag Entry Box */}
                                <form onSubmit={handleManualSubmit} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={manualInput}
                                        onChange={e => setManualInput(e.target.value)}
                                        placeholder="Or enter tag ID manually (e.g. RFID-8A72F91C)..."
                                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000]"
                                    />
                                    <button
                                        type="submit"
                                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold tracking-wide transition-colors"
                                    >
                                        Detect Tag
                                    </button>
                                </form>
                            </div>

                            {/* CONFLICT WARNING BANNER */}
                            {conflictItem && (
                                <div className="mt-4 p-4 bg-rose-50 border-2 border-rose-200 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                    <svg className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <div className="text-xs text-rose-900">
                                        <p className="font-bold text-sm mb-1 text-rose-700">⚠️ Tag Already Assigned (Conflict Warning)</p>
                                        <p>
                                            RFID Tag <span className="font-mono font-bold">{scannedRfid}</span> is currently assigned to another item:
                                        </p>
                                        <div className="mt-2 p-2.5 bg-white rounded-xl border border-rose-200 font-medium">
                                            <p className="font-bold text-slate-900">{conflictItem.name}</p>
                                            <p className="text-[11px] text-slate-500 font-mono">Property No: {conflictItem.sku || 'N/A'}</p>
                                        </div>
                                        <p className="mt-2 text-[11px] text-rose-700 italic">
                                            Each RFID tag must be unique and can only be paired with one item. Unassign it from that item first to re-use.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* ACTION BUTTON: ASSIGN RFID */}
                            <div className="pt-6 border-t border-slate-100">
                                <button
                                    onClick={handleAssignRfid}
                                    disabled={!selectedItem || !scannedRfid || !!conflictItem || processing}
                                    className={`w-full py-4 px-6 rounded-2xl font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 ${
                                        !selectedItem || !scannedRfid || !!conflictItem || processing
                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                        : 'bg-[#800000] hover:bg-[#600000] text-white shadow-[#800000]/25 hover:shadow-[#800000]/40 hover:-translate-y-0.5'
                                    }`}
                                >
                                    <svg className="w-5 h-5 text-[#FFD700]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                    </svg>
                                    {processing ? 'Saving Relationship...' : 'Assign RFID to Item'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* BOTTOM SECTION: Tagged Items Table & Activity Log */}
                    <div className="bg-white rounded-3xl p-7 shadow-xl shadow-slate-200/50 border border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 font-serif">Tagged Inventory Items & History</h3>
                                <p className="text-xs text-slate-500">Items with saved RFID relationships ready for Receiving</p>
                            </div>

                            <button
                                onClick={() => router.visit(route('inventory.receiving'))}
                                className="px-4 py-2 bg-[#800000] hover:bg-[#600000] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#800000]/20 flex items-center gap-2"
                            >
                                <span>Go to Receiving Page</span>
                                <span>→</span>
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-y border-slate-100">
                                        <th className="py-3.5 px-4">Item Name</th>
                                        <th className="py-3.5 px-4">Property No. (SKU)</th>
                                        <th className="py-3.5 px-4">RFID Tag ID</th>
                                        <th className="py-3.5 px-4">Supplier</th>
                                        <th className="py-3.5 px-4 text-center">RFID Status</th>
                                        <th className="py-3.5 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                                                No items in inventory database yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map(item => (
                                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-3.5 px-4 font-semibold text-slate-900">{item.name}</td>
                                                <td className="py-3.5 px-4 font-mono text-slate-600">{item.sku || 'N/A'}</td>
                                                <td className="py-3.5 px-4 font-mono font-bold text-[#800000]">
                                                    {item.rfid_tag ? (
                                                        <span className="px-2.5 py-1 bg-red-50 border border-red-200 rounded-lg text-[#800000]">
                                                            {item.rfid_tag}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 font-normal italic">None</span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-slate-600">{item.supplier_name || 'N/A'}</td>
                                                <td className="py-3.5 px-4 text-center">
                                                    {item.rfid_tag ? (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                                                            Tagged
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-500">
                                                            Not Tagged
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedItem(item);
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}
                                                        className="px-3 py-1.5 bg-slate-100 hover:bg-[#800000] hover:text-white text-slate-700 text-[11px] font-bold rounded-xl transition-all"
                                                    >
                                                        Select to Tag
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}