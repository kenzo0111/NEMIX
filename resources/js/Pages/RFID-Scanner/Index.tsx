import Sidebar from '@/Components/Sidebar';
import Modal from '@/Components/Modal';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { getSidebarModules } from '@/utils/sidebarConfig';
import PageHeader from '@/Components/Common/PageHeader';
import ItemSelector, { Item } from './Components/ItemSelector';
import SelectedItemCard from './Components/SelectedItemCard';
import RFIDScannerPanel, { AssignedSuccessData, UnassignedSuccessData } from './Components/RFIDScannerPanel';
import RFIDInventoryTable from './Components/RFIDInventoryTable';

interface PageProps {
    auth: { user: any };
    items: Item[];
    selectedItemId?: string | number | null;
    errors?: Record<string, string>;
    flash?: {
        success?: string | null;
        error?: string | null;
        warning?: string | null;
        status?: string | null;
    };
}

export default function Index({ auth, items = [], selectedItemId = null, flash }: PageProps) {
    const user = auth.user;
    const [collapsed, setCollapsed] = useState(false);

    // Initial item selection: only select if explicit selectedItemId prop passed, otherwise null (State A)
    const [selectedItem, setSelectedItem] = useState<Item | null>(() => {
        if (selectedItemId) {
            const found = items.find(i => String(i.id) === String(selectedItemId));
            if (found) return found;
        }
        return null;
    });

    const hasUntaggedItems = useMemo(() => items.some(i => !i.rfid_tag), [items]);
    const allItemsTagged = useMemo(() => items.length > 0 && items.every(i => Boolean(i.rfid_tag)), [items]);
    const [isCompletionDismissed, setIsCompletionDismissed] = useState(false);

    // Scanner state
    const [isScannerActive, setIsScannerActive] = useState(true);
    const [cloudSyncActive, setCloudSyncActive] = useState<boolean>(true);
    const [scannedRfid, setScannedRfid] = useState<string>('');
    const [isInvalidRfid, setIsInvalidRfid] = useState<boolean>(false);
    const [isReplacingTag, setIsReplacingTag] = useState<boolean>(false);

    // Workflow state data
    const [processing, setProcessing] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [assignedSuccessData, setAssignedSuccessData] = useState<AssignedSuccessData | null>(null);
    const [unassignedSuccessData, setUnassignedSuccessData] = useState<UnassignedSuccessData | null>(null);

    // State K: Unassign confirmation modal
    const [showUnassignConfirm, setShowUnassignConfirm] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const lastHardwareScanTimestamp = useRef<number>(0);
    const modules = getSidebarModules('RFID Scanner');

    // Reset scanner inputs and clear focal state
    const resetScanner = () => {
        setScannedRfid('');
        setIsInvalidRfid(false);
        setApiError(null);
        setAssignedSuccessData(null);
        setUnassignedSuccessData(null);
        setIsReplacingTag(false);
        if (inputRef.current) {
            inputRef.current.value = '';
            if (isScannerActive) {
                inputRef.current.focus();
            }
        }
    };

    // Synchronize selected item when items list updates from backend
    useEffect(() => {
        if (selectedItem) {
            const updated = items.find(i => i.id === selectedItem.id);
            if (updated) {
                setSelectedItem(updated);
            }
        }
    }, [items]);

    // Synchronize selected item if selectedItemId prop changes
    useEffect(() => {
        if (selectedItemId) {
            const found = items.find(i => String(i.id) === String(selectedItemId));
            if (found) {
                setSelectedItem(found);
                resetScanner();
            }
        }
    }, [selectedItemId, items]);

    // Audio chime upon successful scan
    const playScanChime = () => {
        try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
        } catch (e) {
            // Audio context gesture policy
        }
    };

    // Live Cloud Feed: Poll for wireless scans from the ESP32 handheld reader (1200ms)
    useEffect(() => {
        if (!isScannerActive) return;

        const checkLiveFeed = async () => {
            if (typeof document !== 'undefined' && document.hidden) return;
            try {
                const response = await fetch('/rfid-scanner/live-feed');
                if (!response.ok) return;
                const data = await response.json();
                setCloudSyncActive(true);

                if (data?.scan?.timestamp) {
                    if (lastHardwareScanTimestamp.current === 0) {
                        lastHardwareScanTimestamp.current = data.scan.timestamp;
                    } else if (data.scan.timestamp > lastHardwareScanTimestamp.current) {
                        lastHardwareScanTimestamp.current = data.scan.timestamp;
                        playScanChime();
                        processScanResult(data.scan.tag);
                    }
                }
            } catch (e) {
                // Ignore transient network errors
            }
        };

        checkLiveFeed();
        const interval = setInterval(checkLiveFeed, 1200);
        return () => clearInterval(interval);
    }, [isScannerActive, selectedItem]);

    // Keep hidden input focused when scanner is active
    useEffect(() => {
        if (!isScannerActive || !selectedItem) return;

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
    }, [isScannerActive, selectedItem]);

    // Process scanner keystrokes ending in Enter
    const handleScanKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const code = e.currentTarget.value.trim();
            if (code) {
                playScanChime();
                processScanResult(code);
            } else {
                setIsInvalidRfid(true);
            }
            e.currentTarget.value = '';
        }
    };

    const processScanResult = (code: string) => {
        const cleanCode = code.toUpperCase().trim();
        if (!cleanCode) {
            setIsInvalidRfid(true);
            return;
        }
        setIsInvalidRfid(false);
        setApiError(null);
        setAssignedSuccessData(null);
        setUnassignedSuccessData(null);
        setScannedRfid(cleanCode);
    };

    const handleManualSubmit = (code: string) => {
        if (code.trim()) {
            playScanChime();
            processScanResult(code.trim());
        } else {
            setIsInvalidRfid(true);
        }
    };

    // Conflict Check: Is the scanned tag already assigned to a DIFFERENT item?
    const conflictItem = useMemo(() => {
        if (!scannedRfid) return null;
        return (
            items.find(
                i => i.rfid_tag && i.rfid_tag.toUpperCase() === scannedRfid.toUpperCase() && i.id !== selectedItem?.id
            ) || null
        );
    }, [scannedRfid, items, selectedItem]);

    // Assign RFID Action (State E -> State F -> State G)
    const handleAssignRfid = () => {
        if (!selectedItem || !scannedRfid || conflictItem || processing) return;

        const targetItem = selectedItem;
        const assignedTag = scannedRfid;
        const nextUntagged = items.find(i => i.id !== targetItem.id && !i.rfid_tag) || null;

        router.post(
            route('rfid-scanner.assign'),
            {
                item_id: targetItem.id,
                rfid_tag: assignedTag,
            },
            {
                preserveScroll: true,
                onStart: () => {
                    setProcessing(true);
                    setApiError(null);
                },
                onFinish: () => setProcessing(false),
                onSuccess: (page: any) => {
                    if (page?.props?.flash?.error) {
                        setApiError(page.props.flash.error);
                    } else {
                        // Set assignment success state
                        setAssignedSuccessData({
                            item: { ...targetItem, rfid_tag: assignedTag },
                            tag: assignedTag,
                            nextItem: nextUntagged,
                        });
                        setScannedRfid('');
                        setIsReplacingTag(false);
                    }
                },
                onError: (errors: any) => {
                    const errorMessages = Object.values(errors).flat().join('\n');
                    setApiError(
                        errorMessages || 'Failed to assign RFID tag. Please verify that the tag is valid.'
                    );
                },
            }
        );
    };

    // Unassign RFID Action (State J -> State K -> State L)
    const executeUnassignRfid = () => {
        if (!selectedItem || !selectedItem.rfid_tag || processing) return;

        const targetItem = selectedItem;
        const unassignedTag = selectedItem.rfid_tag;

        router.post(
            route('rfid-scanner.unassign'),
            {
                item_id: targetItem.id,
            },
            {
                preserveScroll: true,
                onStart: () => {
                    setProcessing(true);
                    setShowUnassignConfirm(false);
                },
                onFinish: () => setProcessing(false),
                onSuccess: (page: any) => {
                    const updated = { ...targetItem, rfid_tag: null };
                    setSelectedItem(updated);
                    setUnassignedSuccessData({
                        item: updated,
                        tag: unassignedTag,
                    });
                    setScannedRfid('');
                    setIsReplacingTag(false);
                },
                onError: (errors: any) => {
                    const errorMessages = Object.values(errors).flat().join('\n');
                    setApiError(errorMessages || 'Failed to unassign RFID tag.');
                },
            }
        );
    };

    const taggedItemsCount = useMemo(() => items.filter(i => i.rfid_tag).length, [items]);
    const untaggedCount = Math.max(0, items.length - taggedItemsCount);
    const progressPercent = items.length > 0 ? Math.round((taggedItemsCount / items.length) * 100) : 100;

    const handleSelectNextUntagged = () => {
        const next = items.find(i => !i.rfid_tag && i.id !== selectedItem?.id);
        if (next) {
            setSelectedItem(next);
            resetScanner();
        }
    };

    return (
        <div className="min-h-screen bg-gray-100/80 flex font-sans text-gray-900 selection:bg-red-900 selection:text-white">
            <Head title="RFID Tagging | UCN SPMO" />

            {/* Persistent Sidebar */}
            <Sidebar
                modules={modules}
                user={user}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed(!collapsed)}
            />

            <main className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? 'ml-20' : 'ml-72'}`}>
                {/* Unified Sticky Header — Same as Dashboard */}
                <PageHeader
                    title="RFID Tagging"
                    subtitle="Assign RFID tags to inventory items before receiving."
                    breadcrumbs={[{ name: 'RFID Scanner', href: '#' }]}
                    actions={
                        <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                                <span className="text-xs font-bold text-gray-800 font-mono">
                                    {taggedItemsCount} of {items.length} tagged
                                </span>
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                                    untaggedCount === 0 
                                        ? 'bg-emerald-100 text-emerald-800' 
                                        : 'bg-amber-100 text-amber-800'
                                }`}>
                                    {untaggedCount === 0 ? 'All Tagged' : `${untaggedCount} remaining`}
                                </span>
                            </div>
                            <div className="w-32 sm:w-40 bg-gray-200 rounded-full h-1.5 mt-1 overflow-hidden ml-auto">
                                <div
                                    className="bg-red-900 h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>
                    }
                >
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                        <span className="text-gray-500 font-medium">Workflow:</span> Select item → Scan tag → Assign
                    </p>
                </PageHeader>

                <div className="p-6 lg:p-8 space-y-6 max-w-[1500px] mx-auto pb-16">
                    {/* ── STATE M: ALL ITEMS TAGGED (COMPLETION STATE) ── */}
                    {allItemsTagged && !selectedItem && !isCompletionDismissed ? (
                        <div className="bg-white rounded-xl p-10 border border-emerald-200 shadow-xs text-center max-w-2xl mx-auto space-y-4">
                            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-xs">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <span className="text-xs font-bold uppercase font-mono tracking-widest text-emerald-800">
                                    All Items Tagged
                                </span>
                                <h2 className="text-xl font-bold text-gray-900 font-serif mt-1">
                                    ✓ RFID tagging is complete.
                                </h2>
                                <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                                    All inventory items currently have active RFID tags assigned. You may review records or proceed to receiving.
                                </p>
                            </div>
                            <div className="pt-2 flex items-center justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => router.visit(route('inventory.receiving'))}
                                    className="px-5 py-2.5 bg-red-950 hover:bg-red-900 text-white text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-xs"
                                >
                                    View Receiving →
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCompletionDismissed(true)}
                                    className="px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-mono font-semibold rounded-lg transition-colors cursor-pointer"
                                >
                                    Manage / Replace Tags
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* PRIMARY FINITE WORKFLOW WORKSPACE */
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* LEFT COLUMN (5 cols): Item Selection & Details */}
                            <div className="lg:col-span-5 bg-white rounded-xl p-6 shadow-xs border border-gray-200 flex flex-col justify-between min-h-[420px]">
                                <div>
                                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                                        <div>
                                            <h2 className="text-base font-bold text-gray-900 font-serif tracking-tight">
                                                Item to Tag
                                            </h2>
                                            <p className="text-xs text-gray-500 font-medium">
                                                Pick item to pair with RFID tag
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => router.visit(route('inventory.index'))}
                                            className="text-xs text-red-900 hover:text-red-950 font-semibold font-mono hover:underline cursor-pointer"
                                        >
                                            Manage Items →
                                        </button>
                                    </div>

                                    {/* Clean Search & Select */}
                                    <div className="mb-4">
                                        <label className="block text-xs font-bold uppercase text-gray-600 tracking-wider mb-2 font-mono">
                                            Search Item
                                        </label>
                                        <ItemSelector
                                            items={items}
                                            selectedItem={selectedItem}
                                            onSelectItem={(item) => {
                                                setSelectedItem(item);
                                                resetScanner();
                                            }}
                                        />
                                    </div>

                                    {/* State A / B / J Item Card */}
                                    <SelectedItemCard
                                        item={selectedItem}
                                        isReplacingTag={isReplacingTag}
                                        processing={processing}
                                        onStartReplaceTag={() => {
                                            setIsReplacingTag(true);
                                            setScannedRfid('');
                                            setAssignedSuccessData(null);
                                            setUnassignedSuccessData(null);
                                            setApiError(null);
                                            if (inputRef.current) inputRef.current.focus();
                                        }}
                                        onPromptUnassign={() => setShowUnassignConfirm(true)}
                                        onSelectNextUntagged={handleSelectNextUntagged}
                                        hasUntaggedItems={hasUntaggedItems}
                                    />
                                </div>
                            </div>

                            {/* RIGHT COLUMN (7 cols): State-driven RFID Scanner Panel */}
                            <div className="lg:col-span-7">
                                <RFIDScannerPanel
                                    selectedItem={selectedItem}
                                    isScannerActive={isScannerActive}
                                    cloudSyncActive={cloudSyncActive}
                                    scannedRfid={scannedRfid}
                                    conflictItem={conflictItem}
                                    isInvalidRfid={isInvalidRfid}
                                    processing={processing}
                                    apiError={apiError}
                                    assignedSuccessData={assignedSuccessData}
                                    unassignedSuccessData={unassignedSuccessData}
                                    inputRef={inputRef}
                                    onScanKeyDown={handleScanKeyDown}
                                    onAssign={handleAssignRfid}
                                    onResetScanner={resetScanner}
                                    onSelectConflictItem={(item) => {
                                        setSelectedItem(item);
                                        resetScanner();
                                    }}
                                    onSelectNextItem={() => {
                                        if (assignedSuccessData?.nextItem) {
                                            setSelectedItem(assignedSuccessData.nextItem);
                                            resetScanner();
                                        } else {
                                            setSelectedItem(null);
                                            resetScanner();
                                        }
                                    }}
                                    onViewItem={(item) => {
                                        setSelectedItem(item);
                                        resetScanner();
                                    }}
                                    onManualSubmit={handleManualSubmit}
                                    onRetryConnection={() => {
                                        setIsScannerActive(true);
                                        setCloudSyncActive(true);
                                    }}
                                    onClearInvalid={() => setIsInvalidRfid(false)}
                                    onClearApiError={() => setApiError(null)}
                                    onScanNewTagAfterUnassign={() => {
                                        setUnassignedSuccessData(null);
                                        resetScanner();
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Secondary Inventory Records Table */}
                    <RFIDInventoryTable
                        items={items}
                        selectedItemId={selectedItem?.id}
                        onSelectItem={(item) => {
                            setSelectedItem(item);
                            setIsCompletionDismissed(true);
                            resetScanner();
                        }}
                    />
                </div>
            </main>

            {/* ── STATE K: UNASSIGN CONFIRMATION MODAL ── */}
            <Modal show={showUnassignConfirm} onClose={() => setShowUnassignConfirm(false)} maxWidth="sm">
                <div className="relative bg-white rounded-2xl shadow-xl w-full overflow-hidden border border-slate-200 text-center">
                    <div className="h-1.5 w-full bg-red-800" />
                    <div className="p-6">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-50 text-red-700 mb-3 border border-red-100">
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-1 font-serif">
                            Unassign RFID?
                        </h3>
                        <p className="text-xs text-gray-600 mb-5 leading-relaxed">
                            Remove tag <strong className="font-mono text-red-950">{selectedItem?.rfid_tag}</strong> from{' '}
                            <strong>{selectedItem?.name}</strong>?
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setShowUnassignConfirm(false)}
                                className="flex-1 py-2.5 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-mono font-bold uppercase rounded-lg transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={executeUnassignRfid}
                                disabled={processing}
                                className="flex-1 py-2.5 px-4 bg-red-800 hover:bg-red-700 text-white text-xs font-mono font-bold uppercase rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                            >
                                {processing ? 'Unassigning...' : 'Unassign RFID'}
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}