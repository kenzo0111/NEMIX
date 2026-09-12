import { useState, useMemo, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import Sidebar from '@/Components/Sidebar';
import PageHeader from '@/Components/PageHeader';
import { getSidebarModules } from '@/utils/sidebarConfig';
import { PaginationMeta, RFIDInventoryItem } from './types';
import { useRfidScanner } from './hooks/useRfidScanner';
import { useRfidTaggingWorkflow } from './hooks/useRfidTaggingWorkflow';

import ItemSelector from './Components/ItemSelector';
import SelectedItemSummary from './Components/SelectedItemSummary';
import RFIDScannerWorkspace from './Components/RFIDScannerWorkspace';
import RFIDRecordsTable from './Components/RFIDRecordsTable';
import UnassignRFIDModal from './Components/UnassignRFIDModal';

import {
    Package,
    CheckCircle2,
    Tag,
    Radio,
    Box,
    ArrowRight,
    ExternalLink,
    ShieldCheck,
    Check,
    AlertCircle,
} from 'lucide-react';

declare function route(name: string, params?: any): string;

interface PageProps {
    auth: { user: any };
    items: RFIDInventoryItem[];
    records?: RFIDInventoryItem[];
    recordsPagination?: PaginationMeta | null;
    recordsFilters?: {
        search?: string;
        status?: string;
    };
    selectedItemId?: string | number | null;
    errors?: Record<string, string>;
    flash?: {
        success?: string | null;
        error?: string | null;
    };
}

export default function Index({
    auth,
    items = [],
    records,
    recordsPagination,
    recordsFilters,
    selectedItemId = null,
    flash,
}: PageProps) {
    const user = auth.user;
    const [collapsed, setCollapsed] = useState(false);
    const [isReplacingTag, setIsReplacingTag] = useState(false);
    const [showUnassignModal, setShowUnassignModal] = useState(false);
    const [isCompletionDismissed, setIsCompletionDismissed] = useState(false);

    // Initial item resolution
    const initialItem = useMemo(() => {
        if (selectedItemId) {
            return items.find((i) => String(i.id) === String(selectedItemId)) || null;
        }
        return null;
    }, [items, selectedItemId]);

    // Finite tagging workflow hook
    const {
        state: workflowState,
        selectedItem,
        selectItem,
        handleScan,
        assignTag,
        unassignTag,
        resetScanner,
        selectNextUntaggedItem,
        retryAssign,
    } = useRfidTaggingWorkflow({
        items,
        initialSelectedItem: initialItem,
    });

    // Hardware and live-feed scanner hook
    const isScanningActive = workflowState.type !== 'idle';
    const {
        connectionState,
        isRetrying: isRetryingConnection,
        inputRef,
        handleScanKeyDown,
        processManualScan,
        retryConnection,
    } = useRfidScanner({
        enabled: isScanningActive,
        onScan: (scan) => {
            setIsReplacingTag(false);
            handleScan(scan);
        },
    });

    // Sync selected item if selectedItemId prop changes externally
    useEffect(() => {
        if (selectedItemId) {
            const found = items.find((i) => String(i.id) === String(selectedItemId));
            if (found && found.id !== selectedItem?.id) {
                selectItem(found);
                resetScanner();
            }
        }
    }, [selectedItemId, items, selectedItem, selectItem, resetScanner]);

    const taggedCount = useMemo(() => items.filter((i) => Boolean(i.rfid_tag)).length, [items]);
    const untaggedCount = items.length - taggedCount;
    const taggedPercent = items.length > 0 ? Math.round((taggedCount / items.length) * 100) : 0;

    const allItemsTagged = useMemo(
        () => items.length > 0 && items.every((i) => Boolean(i.rfid_tag)),
        [items]
    );

    const modules = getSidebarModules('RFID Scanner');

    return (
        <div className="min-h-screen bg-gray-100/80 flex font-sans text-gray-900 selection:bg-red-900 selection:text-white">
            <Head title="RFID Scanner | UCN SPMO" />

            {/* Persistent Sidebar */}
            <Sidebar
                modules={modules}
                user={user}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed(!collapsed)}
            />

            <main className={`flex-1 transition-all duration-300 ease-in-out min-w-0 ${collapsed ? 'md:ml-20' : 'md:ml-72'} ml-0`}>
                <PageHeader
                    title="RFID Scanner"
                    description="Assign RFID identification tags to inventory items before receiving."
                    breadcrumbs={[{ name: 'RFID Scanner', href: '#' }]}
                />

                <div className="p-4 sm:p-5 lg:p-6 xl:p-8 space-y-6 max-w-[1500px] mx-auto pb-16 min-w-0 w-full">
                    {/* Optional Flash Notification */}
                    {flash?.success && (
                        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl shadow-2xs">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{flash.success}</span>
                        </div>
                    )}
                    {flash?.error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-900 text-xs rounded-xl shadow-2xs">
                            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                            <span>{flash.error}</span>
                        </div>
                    )}

                    {/* Operational Metric Overview Strip */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                        {/* 1. Total Catalog Items */}
                        <div className="bg-white rounded-xl p-4 border border-gray-200/90 shadow-2xs flex items-center justify-between">
                            <div>
                                <p className="text-[11px] font-medium text-gray-500">Catalog Registry</p>
                                <p className="text-xl font-bold font-mono text-gray-900 mt-1">
                                    {items.length}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5">Total registered items</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-600 border border-gray-100 flex items-center justify-center shrink-0">
                                <Package className="w-5 h-5 text-gray-600" />
                            </div>
                        </div>

                        {/* 2. RFID Tagged Items */}
                        <div className="bg-white rounded-xl p-4 border border-gray-200/90 shadow-2xs flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <p className="text-[11px] font-medium text-gray-500">Tagged & Linked</p>
                                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                                        {taggedPercent}%
                                    </span>
                                </div>
                                <p className="text-xl font-bold font-mono text-emerald-950 mt-1">
                                    {taggedCount}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5">Active transponders</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            </div>
                        </div>

                        {/* 3. Untagged Pending Items */}
                        <div className="bg-white rounded-xl p-4 border border-gray-200/90 shadow-2xs flex items-center justify-between">
                            <div>
                                <p className="text-[11px] font-medium text-gray-500">Pending Tagging</p>
                                <p className="text-xl font-bold font-mono text-amber-950 mt-1">
                                    {untaggedCount}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5">Awaiting physical scan</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center shrink-0">
                                <Tag className="w-5 h-5 text-amber-600" />
                            </div>
                        </div>

                        {/* 4. Hardware Scanner Station */}
                        <div className="bg-white rounded-xl p-4 border border-gray-200/90 shadow-2xs flex items-center justify-between">
                            <div>
                                <p className="text-[11px] font-medium text-gray-500">Hardware Reader</p>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span
                                        className={`w-2 h-2 rounded-full ${
                                            connectionState === 'connected'
                                                ? 'bg-emerald-500'
                                                : connectionState === 'offline'
                                                ? 'bg-gray-400'
                                                : 'bg-amber-500 animate-pulse'
                                        }`}
                                    />
                                    <p className="text-sm font-bold font-mono text-gray-900 capitalize">
                                        {connectionState === 'connected'
                                            ? 'Online'
                                            : connectionState === 'offline'
                                            ? 'Offline'
                                            : connectionState}
                                    </p>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-0.5">USB HID Wedge ready</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-900 border border-red-100/80 flex items-center justify-center shrink-0">
                                <Radio className="w-5 h-5 text-red-900" />
                            </div>
                        </div>
                    </div>

                    {/* Completion State: shown only when all items are tagged and not dismissed */}
                    {allItemsTagged && !selectedItem && !isCompletionDismissed ? (
                        <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-2xs text-center max-w-xl mx-auto space-y-3">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200/80 shadow-2xs">
                                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                            </div>
                            <div>
                                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-medium border border-emerald-200 mb-2">
                                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                    <span>All Inventory Items Tagged</span>
                                </div>
                                <h2 className="text-lg font-semibold text-gray-900 font-serif">
                                    RFID Tagging Complete
                                </h2>
                                <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto leading-relaxed">
                                    All current inventory items have RFID transponders assigned. You may review the records registry or proceed directly to Receiving.
                                </p>
                            </div>
                            <div className="pt-3 flex items-center justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => router.visit(route('inventory.receiving'))}
                                    className="px-4 py-2.5 bg-red-950 hover:bg-red-900 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                                >
                                    <span>Proceed to Receiving</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCompletionDismissed(true)}
                                    className="px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-2xs"
                                >
                                    Review Tag Registry
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Main Two-Column Workflow Workspace */
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">
                            {/* LEFT COLUMN (5 cols): Selected Item and Item Search */}
                            <div className="lg:col-span-5 bg-white rounded-xl p-4 sm:p-6 shadow-2xs border border-gray-200/90 flex flex-col justify-between min-h-[420px] min-w-0">
                                <div>
                                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-9 h-9 rounded-lg bg-red-50 text-red-950 border border-red-100/80 flex items-center justify-center shrink-0 shadow-2xs">
                                                <Box className="w-4 h-4 text-red-950" />
                                            </div>
                                            <div>
                                                <h2 className="text-base font-semibold text-gray-900 font-serif tracking-tight">
                                                    Selected Item
                                                </h2>
                                                <p className="text-xs text-gray-500">
                                                    Select item to pair with an RFID tag
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => router.visit(route('inventory.index'))}
                                            className="inline-flex items-center gap-1 text-xs text-red-900 hover:text-red-950 font-medium hover:underline cursor-pointer"
                                        >
                                            <span>Manage</span>
                                            <ExternalLink className="w-3 h-3" />
                                        </button>
                                    </div>

                                    {/* Searchable Item Selector */}
                                    <div className="mb-4">
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                            Search Item Catalog
                                        </label>
                                        <ItemSelector
                                            items={items}
                                            selectedItem={selectedItem}
                                            onSelectItem={(item) => {
                                                setIsReplacingTag(false);
                                                selectItem(item);
                                                resetScanner();
                                            }}
                                        />
                                    </div>

                                    {/* Selected Item Summary Card */}
                                    <SelectedItemSummary
                                        item={selectedItem}
                                        isReplacingTag={isReplacingTag}
                                        onStartReplaceTag={() => {
                                            setIsReplacingTag(true);
                                            resetScanner();
                                        }}
                                        onPromptUnassign={() => setShowUnassignModal(true)}
                                    />
                                </div>
                            </div>

                            {/* RIGHT COLUMN (7 cols): State-driven RFID Scanner Panel */}
                            <div className="lg:col-span-7">
                                <RFIDScannerWorkspace
                                    workflowState={workflowState}
                                    connectionState={connectionState}
                                    isRetryingConnection={isRetryingConnection}
                                    inputRef={inputRef}
                                    onScanKeyDown={handleScanKeyDown}
                                    onAssign={assignTag}
                                    onRescan={() => {
                                        setIsReplacingTag(false);
                                        resetScanner();
                                    }}
                                    onResetScanner={() => {
                                        setIsReplacingTag(false);
                                        resetScanner();
                                    }}
                                    onRetryAssign={retryAssign}
                                    onRetryConnection={retryConnection}
                                    onManualScan={(tag) => {
                                        setIsReplacingTag(false);
                                        processManualScan(tag);
                                    }}
                                    onSelectNextItem={selectNextUntaggedItem}
                                    onViewItem={(item) => {
                                        selectItem(item);
                                        resetScanner();
                                    }}
                                    onSelectConflictItem={(item) => {
                                        selectItem(item);
                                        resetScanner();
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Secondary RFID Assignment Records Registry (Collapsible) */}
                    <RFIDRecordsTable
                        items={items}
                        records={records}
                        pagination={recordsPagination}
                        filters={recordsFilters}
                        selectedItemId={selectedItem?.id}
                        onSelectItem={(item) => {
                            selectItem(item);
                            setIsCompletionDismissed(true);
                            resetScanner();
                        }}
                    />
                </div>
            </main>

            {/* Unassign RFID Confirmation Modal */}
            <UnassignRFIDModal
                show={showUnassignModal}
                item={selectedItem}
                isProcessing={workflowState.type === 'assigning'}
                onConfirm={() => {
                    unassignTag(() => {
                        setShowUnassignModal(false);
                    });
                }}
                onClose={() => setShowUnassignModal(false)}
            />
        </div>
    );
}