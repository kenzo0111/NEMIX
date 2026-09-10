import { useState } from 'react';
import { Radio } from 'lucide-react';
import { RFIDConnectionState, RFIDInventoryItem, RFIDWorkflowState } from '../types';
import ScannerConnectionStatus from './Scanner/ScannerConnectionStatus';
import ScannerIdleState from './Scanner/ScannerIdleState';
import ScannerReadyState from './Scanner/ScannerReadyState';
import TagDetectedState from './Scanner/TagDetectedState';
import TagConflictState from './Scanner/TagConflictState';
import ScannerErrorState from './Scanner/ScannerErrorState';
import AssignmentSuccessState from './Scanner/AssignmentSuccessState';
import UnassignmentSuccessState from './Scanner/UnassignmentSuccessState';
import ManualTagEntry from './Scanner/ManualTagEntry';

interface RFIDScannerWorkspaceProps {
    workflowState: RFIDWorkflowState;
    connectionState: RFIDConnectionState;
    isRetryingConnection: boolean;
    inputRef: React.RefObject<HTMLInputElement>;
    onScanKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onAssign: () => void;
    onRescan: () => void;
    onResetScanner: () => void;
    onRetryAssign: () => void;
    onRetryConnection: () => void;
    onManualScan: (tag: string) => void;
    onSelectNextItem: () => void;
    onViewItem: (item: RFIDInventoryItem) => void;
    onSelectConflictItem: (item: RFIDInventoryItem) => void;
}

export default function RFIDScannerWorkspace({
    workflowState,
    connectionState,
    isRetryingConnection,
    inputRef,
    onScanKeyDown,
    onAssign,
    onRescan,
    onResetScanner,
    onRetryAssign,
    onRetryConnection,
    onManualScan,
    onSelectNextItem,
    onViewItem,
    onSelectConflictItem,
}: RFIDScannerWorkspaceProps) {
    const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);

    const handleManualSubmit = (tag: string) => {
        setIsManualEntryOpen(false);
        onManualScan(tag);
    };

    const hasSelectedItem = workflowState.type !== 'idle';

    return (
        <div className="bg-white rounded-xl p-6 shadow-xs border border-gray-200 flex flex-col justify-between min-h-[420px]">
            {/* Hidden hardware scanner keystroke receiver */}
            <input
                type="text"
                ref={inputRef}
                onKeyDown={onScanKeyDown}
                className="opacity-0 absolute w-0 h-0 pointer-events-none"
                readOnly={!hasSelectedItem}
                aria-hidden="true"
                tabIndex={-1}
            />

            {/* Header: Title and Connection Indicator */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-900 border border-red-100/80 flex items-center justify-center shrink-0 shadow-2xs">
                        <Radio className="w-5 h-5 text-red-900" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-semibold text-gray-900 font-serif tracking-tight">
                                RFID Reader Station
                            </h2>
                            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-semibold border border-gray-200/70">
                                Live HID Wedge
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {hasSelectedItem
                                ? 'Armed for input: scan tag via handheld reader or type code'
                                : 'Awaiting item selection from catalog to arm scanner'}
                        </p>
                    </div>
                </div>

                <ScannerConnectionStatus
                    connectionState={connectionState}
                    onRetry={onRetryConnection}
                    isRetrying={isRetryingConnection}
                />
            </div>

            {/* State-driven finite workflow view */}
            <div className="flex-1 flex flex-col justify-center">
                {isManualEntryOpen && hasSelectedItem ? (
                    <ManualTagEntry
                        onSubmit={handleManualSubmit}
                        onCancel={() => setIsManualEntryOpen(false)}
                    />
                ) : (
                    (() => {
                        switch (workflowState.type) {
                            case 'idle':
                                return <ScannerIdleState />;

                            case 'ready':
                                return (
                                    <ScannerReadyState
                                        item={workflowState.item}
                                        onOpenManualEntry={() => setIsManualEntryOpen(true)}
                                    />
                                );

                            case 'detected':
                                return (
                                    <TagDetectedState
                                        item={workflowState.item}
                                        tag={workflowState.tag}
                                        isAssigning={false}
                                        onAssign={onAssign}
                                        onRescan={onRescan}
                                    />
                                );

                            case 'assigning':
                                return (
                                    <TagDetectedState
                                        item={workflowState.item}
                                        tag={workflowState.tag}
                                        isAssigning={true}
                                        onAssign={() => {}}
                                        onRescan={() => {}}
                                    />
                                );

                            case 'conflict':
                                return (
                                    <TagConflictState
                                        tag={workflowState.tag}
                                        conflictItem={workflowState.conflictItem}
                                        onRescan={onRescan}
                                        onViewExistingItem={onSelectConflictItem}
                                    />
                                );

                            case 'error':
                                return (
                                    <ScannerErrorState
                                        message={workflowState.message}
                                        tag={workflowState.tag}
                                        onRetry={onRetryAssign}
                                        onReset={onResetScanner}
                                    />
                                );

                            case 'success':
                                return (
                                    <AssignmentSuccessState
                                        item={workflowState.item}
                                        tag={workflowState.tag}
                                        nextItem={workflowState.nextItem}
                                        onSelectNextItem={onSelectNextItem}
                                        onViewItem={onViewItem}
                                    />
                                );

                            case 'unassigned':
                                return (
                                    <UnassignmentSuccessState
                                        item={workflowState.item}
                                        onScanNewTag={onResetScanner}
                                    />
                                );

                            default:
                                return <ScannerIdleState />;
                        }
                    })()
                )}
            </div>
        </div>
    );
}
