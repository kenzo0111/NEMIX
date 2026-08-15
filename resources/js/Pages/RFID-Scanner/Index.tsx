import SystemModeBadge from '@/Components/SystemModeBadge';
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
        <div className="min-h-screen bg-gray-100/80 flex font-sans text-gray-900 selection:bg-red-900 selection:text-white">
            <Head title="RFID Tagging & Management Console | UCN" />

            <Sidebar
                modules={modules}
                user={user}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed(!collapsed)}
            />

            <main className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? 'ml-20' : 'ml-72'}`}>
                {/* Merged Sticky Institutional Header */}
                <header className="sticky top-0 z-40 shadow-xs">
                    {/* Top Institutional Bar */}
                    <div className="bg-red-950 text-red-100 text-[11px] px-6 lg:px-8 py-1.5 flex items-center justify-between border-b border-red-900 font-medium tracking-wide">
                        <div className="flex items-center gap-3">
                            <span className="font-bold tracking-wider uppercase text-amber-300">Supply & Property Management Office (SPMO)</span>
                            <span className="hidden md:inline text-red-400">|</span>
                            <span className="hidden md:inline text-red-200/80">University Enterprise Administrative System</span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-mono text-red-300">
                            <SystemModeBadge />
                            <span>•</span>
                            <span>ACCESS LEVEL: AUTHORIZED PERSONNEL</span>
                        </div>
                    </div>

                    {/* Main Header Content */}
                    <div className="bg-white border-b border-gray-200 px-6 lg:px-8 py-4 flex items-center justify-between">
                        <div>
                            <div className="mb-1">
                                <Breadcrumbs items={[{ name: 'RFID Scanner', href: '#' }]} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 font-serif tracking-tight">RFID Tagging & Management Console</h2>
                            <p className="text-xs text-gray-500 font-medium">Official Tagging, Serial Pairing & Master Asset Control Hub</p>
                        </div>
                        <div className="flex items-center gap-6">
                            {/* Workflow Stepper Indicator */}
                            <div className="hidden xl:flex items-center gap-2 bg-gray-50 border border-gray-200 px-3.5 py-1.5 rounded-md text-xs font-medium">
                                <span className="text-gray-400 font-mono text-[11px]">Workflow:</span>
                                <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded font-mono text-[10px] font-semibold">1. Create Item</span>
                                <span className="text-gray-300">→</span>
                                <span className="px-2 py-0.5 bg-red-950 text-amber-300 rounded font-mono font-bold text-[10px] shadow-xs">2. Scan & Assign RFID</span>
                                <span className="text-gray-300">→</span>
                                <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded font-mono text-[10px] font-semibold">3. Receive via RFID</span>
                            </div>
                            <div className="text-right hidden sm:block border-l border-gray-200 pl-6">
                                <span className="block text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">
                                    {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block mt-0.5">
                                    {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto pb-16">
                    {/* Top Status Bar / Institutional Banner */}
                    <div className="bg-red-950 text-white rounded-xl border border-red-900 border-l-4 border-l-amber-400 p-6 lg:p-7 shadow-xs relative overflow-hidden">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
                            <div className="max-w-3xl space-y-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-red-900/90 border border-red-800 text-[11px] font-bold text-amber-300 uppercase tracking-wider font-mono">
                                    <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                    </svg>
                                    Central RFID Pairing Hub
                                </div>
                                <h1 className="text-2xl font-bold font-serif tracking-tight text-white">
                                    Official RFID Asset Pairing Console
                                </h1>
                                <p className="text-red-100/90 text-xs font-medium leading-relaxed">
                                    Assign physical RFID tags to item master records before receiving them into inventory.
                                </p>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <div className="bg-red-900/80 border border-red-800 px-4 py-2.5 rounded-lg text-center">
                                    <p className="text-[10px] text-red-200 uppercase tracking-widest font-mono font-bold">Total Items</p>
                                    <p className="text-lg font-bold text-white font-mono">{items.length}</p>
                                </div>
                                <div className="bg-emerald-950/80 border border-emerald-800/80 px-4 py-2.5 rounded-lg text-center">
                                    <p className="text-[10px] text-emerald-300 uppercase tracking-widest font-mono font-bold">Tagged RFID</p>
                                    <p className="text-lg font-bold text-emerald-400 font-mono">{taggedItemsCount}</p>
                                </div>
                                <div className="bg-amber-950/80 border border-amber-800/80 px-4 py-2.5 rounded-lg text-center">
                                    <p className="text-[10px] text-amber-300 uppercase tracking-widest font-mono font-bold">Untagged</p>
                                    <p className="text-lg font-bold text-amber-400 font-mono">{items.length - taggedItemsCount}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Grid: Step 1 & Step 2 */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* STEP 1: Select Item & Item Details Card */}
                        <div className="lg:col-span-6 bg-white rounded-xl p-6 shadow-xs border border-gray-200/80 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-200/80">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center justify-center w-7 h-7 rounded-md bg-red-950 text-amber-300 font-mono font-bold text-xs">1</span>
                                        <div>
                                            <h3 className="text-base font-bold text-gray-900 font-serif tracking-tight">Selected Inventory Item</h3>
                                            <p className="text-xs text-gray-500 font-medium">Pick item record to pair with RFID tag</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => router.visit(route('inventory.index'))}
                                        className="text-xs text-red-900 hover:text-red-950 font-semibold font-mono flex items-center gap-1 hover:underline"
                                    >
                                        Manage Items →
                                    </button>
                                </div>

                                {/* Select Dropdown */}
                                <div className="mb-5">
                                    <label className="block text-xs font-bold uppercase text-gray-600 tracking-wider mb-2 font-mono">
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
                                            className="text-xs"
                                            styles={{
                                                control: (provided, state) => ({
                                                    ...provided,
                                                    borderRadius: '0.375rem',
                                                    borderColor: state.isFocused ? '#7f1d1d' : '#d1d5db',
                                                    borderWidth: '1px',
                                                    padding: '1px 2px',
                                                    boxShadow: state.isFocused ? '0 0 0 1px #7f1d1d' : 'none',
                                                    fontSize: '0.8125rem',
                                                    fontWeight: '600',
                                                    backgroundColor: '#ffffff',
                                                    '&:hover': { borderColor: '#7f1d1d' },
                                                }),
                                                option: (provided: any, state: any) => ({
                                                    ...provided,
                                                    backgroundColor: state.isSelected ? '#7f1d1d' : state.isFocused ? '#fef2f2' : '#ffffff',
                                                    color: state.isSelected ? '#ffffff' : '#111827',
                                                    padding: '7px 12px',
                                                    fontSize: '0.8125rem',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                }),
                                                singleValue: (provided: any) => ({ ...provided, color: '#111827' }),
                                                menu: (provided: any) => ({
                                                    ...provided,
                                                    borderRadius: '0.375rem',
                                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                                    border: '1px solid #e5e7eb',
                                                    zIndex: 50,
                                                }),
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Detailed Item Card */}
                                {selectedItem ? (
                                    <div className="bg-gray-50/80 rounded-lg p-5 border border-gray-200/80 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="text-lg font-bold text-gray-900 font-serif mb-0.5">{selectedItem.name}</h4>
                                                <p className="text-xs text-gray-500 font-mono">
                                                    Property No / SKU: <span className="font-bold text-gray-800">{selectedItem.sku || 'N/A'}</span>
                                                </p>
                                            </div>

                                            {/* RFID Status Badge */}
                                            {selectedItem.rfid_tag ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                                                    Tagged
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
                                                    Not Tagged
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-gray-200/60">
                                            <div className="bg-white p-3 rounded border border-gray-200/80">
                                                <span className="text-gray-400 block font-mono text-[10px] uppercase">Supplier</span>
                                                <span className="font-semibold text-gray-800">{selectedItem.supplier_name || 'N/A'}</span>
                                            </div>
                                            <div className="bg-white p-3 rounded border border-gray-200/80">
                                                <span className="text-gray-400 block font-mono text-[10px] uppercase">Current Stock</span>
                                                <span className="font-semibold text-gray-800 font-mono">{selectedItem.stock} {selectedItem.unit_of_issue || 'units'}</span>
                                            </div>
                                        </div>

                                        {selectedItem.description && (
                                            <div className="bg-white p-3 rounded border border-gray-200/80 text-xs">
                                                <span className="text-gray-400 block font-mono text-[10px] uppercase mb-0.5">Description</span>
                                                <p className="text-gray-600 line-clamp-2">{selectedItem.description}</p>
                                            </div>
                                        )}

                                        {/* Assigned RFID Info Box */}
                                        <div className="pt-1">
                                            <div className={`p-4 rounded-lg border flex items-center justify-between ${selectedItem.rfid_tag
                                                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                                                    : 'bg-gray-100/70 border-gray-200 text-gray-500'
                                                }`}>
                                                <div>
                                                    <span className="text-[10px] uppercase font-bold tracking-wider block text-gray-400 font-mono">Assigned RFID Tag ID</span>
                                                    <span className="font-mono text-base font-bold text-red-950">
                                                        {selectedItem.rfid_tag || 'None Assigned'}
                                                    </span>
                                                </div>

                                                {selectedItem.rfid_tag && (
                                                    <button
                                                        onClick={handleUnassignRfid}
                                                        className="px-3 py-1 bg-white border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold rounded transition-colors shadow-xs font-mono uppercase"
                                                    >
                                                        Unassign Tag
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                        <p className="text-gray-400 font-medium text-xs">No items found in inventory master list.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* STEP 2: RFID Scanner & Detection */}
                        <div className="lg:col-span-6 bg-white rounded-xl p-6 shadow-xs border border-gray-200/80 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-200/80">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center justify-center w-7 h-7 rounded-md bg-red-950 text-amber-300 font-mono font-bold text-xs">2</span>
                                        <div>
                                            <h3 className="text-base font-bold text-gray-900 font-serif tracking-tight">RFID Scanner & Tag Detection</h3>
                                            <p className="text-xs text-gray-500 font-medium">Scan physical sticker or enter tag ID manually</p>
                                        </div>
                                    </div>

                                    {/* Connection Toggle */}
                                    <button
                                        onClick={() => setIsScannerActive(!isScannerActive)}
                                        className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 border transition-all ${isScannerActive
                                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                                                : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${isScannerActive ? 'bg-emerald-500 animate-ping' : 'bg-gray-400'}`}></span>
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
                                <div className={`relative p-8 rounded-lg border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center text-center min-h-[220px] mb-5 ${conflictItem
                                        ? 'bg-red-50/70 border-red-300'
                                        : scannedRfid
                                            ? 'bg-amber-50/50 border-amber-300'
                                            : isScannerActive
                                                ? 'bg-gradient-to-b from-red-50/30 to-gray-50 border-red-900/30 shadow-inner'
                                                : 'bg-gray-50 border-gray-300'
                                    }`}>
                                    {scannedRfid ? (
                                        <div className="space-y-3 animate-in zoom-in-95 duration-200">
                                            <div className="w-14 h-14 bg-red-950 text-amber-300 rounded-full flex items-center justify-center mx-auto shadow-md">
                                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-red-950 font-mono">Detected RFID ID</span>
                                                <div className="px-5 py-2 bg-white rounded-md border border-amber-400 shadow-xs inline-block mt-1">
                                                    <p className="font-mono text-xl font-bold text-red-950 tracking-wider">{scannedRfid}</p>
                                                </div>
                                            </div>
                                            {lastScanTime && (
                                                <p className="text-[10px] text-gray-400 font-mono">Scanned at {lastScanTime}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="w-14 h-14 bg-white rounded-full shadow-xs border border-gray-200 flex items-center justify-center mx-auto text-red-950">
                                                <svg className={`w-7 h-7 transition-transform ${isScannerActive ? 'animate-pulse text-red-900' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                                </svg>
                                            </div>
                                            <p className="text-xs font-bold text-gray-700 font-mono">
                                                {isScannerActive ? 'Ready to Scan RFID Tag...' : 'Scanner Paused'}
                                            </p>
                                            <p className="text-xs text-gray-400 max-w-xs mx-auto font-medium">
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
                                        className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-md text-xs font-mono placeholder-gray-400 focus:border-red-900 focus:ring-1 focus:ring-red-900 shadow-xs"
                                    />
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-md text-xs font-mono font-bold tracking-wider uppercase transition-colors"
                                    >
                                        Detect Tag
                                    </button>
                                </form>
                            </div>

                            {/* CONFLICT WARNING BANNER */}
                            {conflictItem && (
                                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-in fade-in">
                                    <svg className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <div className="text-xs text-red-900">
                                        <p className="font-bold text-xs mb-1 text-red-800 font-mono uppercase">⚠️ Tag Already Assigned (Conflict Warning)</p>
                                        <p>
                                            RFID Tag <span className="font-mono font-bold">{scannedRfid}</span> is currently assigned to another item:
                                        </p>
                                        <div className="mt-2 p-2.5 bg-white rounded border border-red-200 font-medium">
                                            <p className="font-bold text-gray-900">{conflictItem.name}</p>
                                            <p className="text-[11px] text-gray-500 font-mono">Property No: {conflictItem.sku || 'N/A'}</p>
                                        </div>
                                        <p className="mt-2 text-[11px] text-red-800 italic">
                                            Each RFID tag must be unique and can only be paired with one item. Unassign it from that item first to re-use.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* ACTION BUTTON: ASSIGN RFID */}
                            <div className="pt-5 border-t border-gray-200/80 mt-4">
                                <button
                                    onClick={handleAssignRfid}
                                    disabled={!selectedItem || !scannedRfid || !!conflictItem || processing}
                                    className={`w-full py-3 px-6 rounded-md font-bold text-xs uppercase tracking-wider font-mono transition-all shadow-xs flex items-center justify-center gap-2 ${!selectedItem || !scannedRfid || !!conflictItem || processing
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                            : 'bg-red-950 hover:bg-red-900 text-white shadow-xs'
                                        }`}
                                >
                                    <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                    </svg>
                                    {processing ? 'Saving Relationship...' : 'Assign RFID to Item'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* BOTTOM SECTION: Tagged Items Table & Activity Log */}
                    <div className="bg-white rounded-xl shadow-xs border border-gray-200/80 overflow-hidden">
                        <div className="px-6 lg:px-8 py-5 border-b border-gray-200/80 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50">
                            <div>
                                <h3 className="text-base font-bold text-gray-900 font-serif tracking-tight">Tagged Inventory Items & History</h3>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">Items with saved RFID relationships ready for Receiving</p>
                            </div>

                            <button
                                onClick={() => router.visit(route('inventory.receiving'))}
                                className="bg-red-950 hover:bg-red-900 text-white font-bold py-2 px-4 rounded-md shadow-xs transition-all text-xs flex items-center justify-center gap-2 whitespace-nowrap uppercase font-mono tracking-wider"
                            >
                                <span>Go to Receiving Page</span>
                                <span>→</span>
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs divide-y divide-gray-200">
                                <thead>
                                    <tr className="bg-gray-50/80 text-gray-700 font-bold uppercase tracking-wider font-mono text-[11px] border-b border-gray-200">
                                        <th className="py-3.5 px-6">Item Name</th>
                                        <th className="py-3.5 px-6">Property No. (SKU)</th>
                                        <th className="py-3.5 px-6">RFID Tag ID</th>
                                        <th className="py-3.5 px-6">Supplier</th>
                                        <th className="py-3.5 px-6 text-center">RFID Status</th>
                                        <th className="py-3.5 px-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-8 text-center text-gray-500 italic">
                                                No items in inventory database yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map(item => (
                                            <tr key={item.id} className="hover:bg-red-50/30 transition-colors border-b border-gray-100 last:border-0">
                                                <td className="py-4 px-6 font-bold text-gray-900 text-sm">{item.name}</td>
                                                <td className="py-4 px-6 font-mono text-gray-600">{item.sku || 'N/A'}</td>
                                                <td className="py-4 px-6 font-mono font-bold text-red-950">
                                                    {item.rfid_tag ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950/10 text-red-950 border border-red-950/20">
                                                            🏷️ {item.rfid_tag}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 font-normal italic">None</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-gray-600 font-medium">{item.supplier_name || 'N/A'}</td>
                                                <td className="py-4 px-6 text-center">
                                                    {item.rfid_tag ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                                                            Tagged
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                                                            Not Tagged
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedItem(item);
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}
                                                        className="px-3 py-1.5 bg-gray-100 hover:bg-red-950 hover:text-white text-gray-700 text-xs font-mono font-semibold rounded transition-colors"
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