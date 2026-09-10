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

            <main className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? 'ml-20' : 'ml-72'}`}>
                <PageHeader
                    title="RFID Scanner"
                    description="Assign RFID identification tags to inventory items before receiving."
                    breadcrumbs={[{ name: 'RFID Scanner', href: '#' }]}
                />

                <div className="p-6 lg:p-8 space-y-6 max-w-[1500px] mx-auto pb-16">
                    {/* Completion State: shown only when all items are tagged and not dismissed */}
                    {allItemsTagged && !selectedItem && !isCompletionDismissed ? (
                        <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-xs text-center max-w-xl mx-auto space-y-3">
                            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-100">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 font-serif">
                                    RFID Tagging Complete
                                </h2>
                                <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                                    All current inventory items have RFID tags assigned. You may review records or proceed to receiving.
                                </p>
                            </div>
                            <div className="pt-2 flex items-center justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => router.visit(route('inventory.receiving'))}
                                    className="px-4 py-2 bg-red-950 hover:bg-red-900 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-2xs"
                                >
                                    Proceed to Receiving →
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCompletionDismissed(true)}
                                    className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                                >
                                    Manage RFID Tags
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Main Two-Column Workflow Workspace */
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* LEFT COLUMN (5 cols): Selected Item and Item Search */}
                            <div className="lg:col-span-5 bg-white rounded-xl p-6 shadow-xs border border-gray-200 flex flex-col justify-between min-h-[420px]">
                                <div>
                                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                                        <div>
                                            <h2 className="text-base font-semibold text-gray-900 font-serif tracking-tight">
                                                Selected Item
                                            </h2>
                                            <p className="text-xs text-gray-500">
                                                Select inventory item to associate with an RFID tag
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => router.visit(route('inventory.index'))}
                                            className="text-xs text-red-900 hover:text-red-950 font-medium hover:underline cursor-pointer"
                                        >
                                            Manage Items →
                                        </button>
                                    </div>

                                    {/* Searchable Item Selector */}
                                    <div className="mb-4">
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                            Search Item
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