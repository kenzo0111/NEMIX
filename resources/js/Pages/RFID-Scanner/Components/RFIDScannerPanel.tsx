import { useState } from 'react';
import { Item } from './ItemSelector';

export interface AssignedSuccessData {
    item: Item;
    tag: string;
    nextItem?: Item | null;
}

export interface UnassignedSuccessData {
    item: Item;
    tag: string;
}

interface RFIDScannerPanelProps {
    selectedItem: Item | null;
    isScannerActive: boolean;
    cloudSyncActive: boolean;
    scannedRfid: string;
    conflictItem: Item | null;
    isInvalidRfid: boolean;
    processing: boolean;
    apiError: string | null;
    assignedSuccessData: AssignedSuccessData | null;
    unassignedSuccessData: UnassignedSuccessData | null;
    inputRef: React.RefObject<HTMLInputElement>;
    onScanKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onAssign: () => void;
    onResetScanner: () => void;
    onSelectConflictItem: (item: Item) => void;
    onSelectNextItem: () => void;
    onViewItem: (item: Item) => void;
    onManualSubmit: (tag: string) => void;
    onRetryConnection: () => void;
    onClearInvalid: () => void;
    onClearApiError: () => void;
    onScanNewTagAfterUnassign: () => void;
}

export default function RFIDScannerPanel({
    selectedItem,
    isScannerActive,
    cloudSyncActive,
    scannedRfid,
    conflictItem,
    isInvalidRfid,
    processing,
    apiError,
    assignedSuccessData,
    unassignedSuccessData,
    inputRef,
    onScanKeyDown,
    onAssign,
    onResetScanner,
    onSelectConflictItem,
    onSelectNextItem,
    onViewItem,
    onManualSubmit,
    onRetryConnection,
    onClearInvalid,
    onClearApiError,
    onScanNewTagAfterUnassign,
}: RFIDScannerPanelProps) {
    const [isManualMode, setIsManualMode] = useState(false);
    const [manualTagInput, setManualTagInput] = useState('');

    const isConnected = isScannerActive && cloudSyncActive;

    // Derive deterministic scanner state
    const scannerState = (() => {
        if (!selectedItem) return 'waiting-for-item';
        if (processing) return 'processing';
        if (assignedSuccessData) return 'assignment-success';
        if (unassignedSuccessData) return 'unassigned-success';
        if (apiError) return 'api-error';
        if (conflictItem) return 'conflict';
        if (isInvalidRfid) return 'invalid';
        if (scannedRfid) return 'rfid-detected';
        if (isManualMode) return 'manual-entry';
        if (!isConnected) return 'scanner-offline';
        return 'ready-to-scan';
    })();

    const handleManualFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const clean = manualTagInput.trim();
        if (clean) {
            onManualSubmit(clean);
            setManualTagInput('');
            setIsManualMode(false);
        }
    };

    return (
        <div className="bg-white rounded-xl p-6 shadow-xs border border-gray-200 flex flex-col justify-between min-h-[420px]">
            {/* Hidden scanner keyboard input for hardware reader */}
            <input
                type="text"
                ref={inputRef}
                onKeyDown={onScanKeyDown}
                className="opacity-0 absolute w-0 h-0 pointer-events-none"
                readOnly={!isScannerActive || !selectedItem}
                aria-hidden="true"
            />

            {/* Header: Title and Simple Operational Status */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-6">
                <div>
                    <h2 className="text-base font-bold text-gray-900 font-serif tracking-tight">
                        RFID Scanner
                    </h2>
                    <p className="text-xs text-gray-500 font-medium">
                        {selectedItem ? 'Point reader at asset tag or enter manually' : 'Awaiting item selection'}
                    </p>
                </div>

                {/* Operational indicator */}
                {selectedItem && (
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onRetryConnection}
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium border transition-colors cursor-pointer ${
                                isConnected
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                            }`}
                            title={isConnected ? 'Scanner connected' : 'Click to reconnect'}
                        >
                            <span
                                className={`w-2 h-2 rounded-full ${
                                    isConnected ? 'bg-emerald-500' : 'bg-gray-400'
                                }`}
                            />
                            <span>{isConnected ? 'Connected' : 'Offline'}</span>
                        </button>
                    </div>
                )}
            </div>

            {/* STATE RENDERER */}
            <div className="flex-1 flex flex-col justify-center">
                {/* ── STATE A: WAITING FOR ITEM ── */}
                {scannerState === 'waiting-for-item' && (
                    <div className="text-center py-10 px-4 bg-gray-50/60 rounded-xl border border-dashed border-gray-200">
                        <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-bold text-gray-700 font-mono">
                            Waiting for Item
                        </h3>
                        <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                            Please select an inventory item on the left to activate the RFID scanner.
                        </p>
                    </div>
                )}

                {/* ── STATE C: SCANNER OFFLINE ── */}
                {scannerState === 'scanner-offline' && (
                    <div className="text-center py-8 px-4 bg-amber-50/50 rounded-xl border border-amber-200">
                        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636a9 9 0 010 12.728m-2.828-2.828a5 5 0 000-7.072m-4.243 4.243a1 1 0 100-1.414" />
                            </svg>
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-900 mb-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            <span>Scanner Offline</span>
                        </div>
                        <p className="text-xs text-amber-900 max-w-xs mx-auto">
                            The RFID reader is currently unavailable or disconnected.
                        </p>
                        <div className="mt-4 flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={onRetryConnection}
                                className="px-4 py-2 bg-red-950 hover:bg-red-900 text-white text-xs font-mono font-bold rounded-md transition-colors cursor-pointer shadow-2xs"
                            >
                                Retry Connection
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsManualMode(true)}
                                className="px-3 py-2 text-xs font-mono text-gray-700 hover:text-gray-900 underline cursor-pointer"
                            >
                                Enter RFID manually
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STATE N: MANUAL ENTRY ── */}
                {scannerState === 'manual-entry' && (
                    <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 max-w-md mx-auto w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold uppercase text-gray-700 font-mono tracking-wider">
                                Enter RFID Manually
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsManualMode(false)}
                                className="text-xs text-gray-400 hover:text-gray-600 font-mono"
                            >
                                Cancel
                            </button>
                        </div>
                        <form onSubmit={handleManualFormSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-mono text-gray-500 mb-1">
                                    RFID Tag ID
                                </label>
                                <input
                                    type="text"
                                    value={manualTagInput}
                                    onChange={(e) => setManualTagInput(e.target.value)}
                                    placeholder="e.g. RFID-8A72F91C"
                                    autoFocus
                                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-mono placeholder-gray-400 focus:border-red-900 focus:ring-1 focus:ring-red-900 shadow-2xs"
                                />
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsManualMode(false)}
                                    className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-mono font-semibold rounded-md transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!manualTagInput.trim()}
                                    className="px-4 py-2 bg-red-950 hover:bg-red-900 text-white text-xs font-mono font-bold uppercase tracking-wider rounded-md transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                                >
                                    Detect RFID
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* ── STATE F: PROCESSING ── */}
                {scannerState === 'processing' && (
                    <div className="text-center py-10 px-4 bg-gray-50/80 rounded-xl border border-gray-200">
                        <div className="w-12 h-12 rounded-full border-3 border-red-950 border-t-transparent animate-spin mx-auto mb-4" />
                        <h3 className="text-base font-bold text-gray-900 font-mono uppercase tracking-wider">
                            Assigning RFID...
                        </h3>
                        <div className="mt-3 flex items-center justify-center gap-2 font-mono text-xs">
                            <span className="font-bold text-red-950 bg-white px-2.5 py-1 rounded border border-gray-200">
                                {scannedRfid}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="font-semibold text-gray-800">
                                {selectedItem?.name}
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-3 font-medium">
                            Please wait while we register the pairing.
                        </p>
                    </div>
                )}

                {/* ── STATE G: ASSIGNMENT SUCCESS ── */}
                {scannerState === 'assignment-success' && assignedSuccessData && (
                    <div className="text-center py-8 px-6 bg-emerald-50/80 rounded-xl border border-emerald-300">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 border border-emerald-200">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-base font-bold text-emerald-950 font-mono uppercase tracking-wide">
                            ✓ RFID Assigned
                        </h3>
                        <div className="my-3 bg-white p-3 rounded-lg border border-emerald-200 text-left max-w-sm mx-auto">
                            <p className="font-bold text-gray-900 text-xs">{assignedSuccessData.item.name}</p>
                            <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                                Property No: {assignedSuccessData.item.sku || 'N/A'}
                            </p>
                            <p className="text-[11px] text-red-950 font-mono font-bold mt-1">
                                Tag: {assignedSuccessData.tag}
                            </p>
                        </div>
                        <p className="text-xs text-emerald-800 font-medium">
                            {assignedSuccessData.nextItem
                                ? 'Next item is ready.'
                                : 'All inventory items are now tagged!'}
                        </p>
                        <div className="mt-5 flex items-center justify-center gap-3">
                            {assignedSuccessData.nextItem ? (
                                <button
                                    type="button"
                                    onClick={onSelectNextItem}
                                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-mono font-bold uppercase rounded-lg transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                                >
                                    <span>Next Item</span>
                                    <span>→</span>
                                </button>
                            ) : null}
                            <button
                                type="button"
                                onClick={() => onViewItem(assignedSuccessData.item)}
                                className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-mono font-semibold rounded-lg transition-colors cursor-pointer"
                            >
                                View Item
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STATE L: UNASSIGNED SUCCESS ── */}
                {scannerState === 'unassigned-success' && unassignedSuccessData && (
                    <div className="text-center py-8 px-6 bg-emerald-50/70 rounded-xl border border-emerald-300">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 border border-emerald-200">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-base font-bold text-emerald-950 font-mono uppercase">
                            ✓ RFID Unassigned
                        </h3>
                        <div className="my-3 bg-white p-3 rounded-lg border border-emerald-200 text-left max-w-sm mx-auto">
                            <p className="font-bold text-gray-900 text-xs">{unassignedSuccessData.item.name}</p>
                            <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                                Property No: {unassignedSuccessData.item.sku || 'N/A'}
                            </p>
                        </div>
                        <p className="text-xs text-emerald-800 font-medium">
                            The item is ready for a new RFID tag.
                        </p>
                        <div className="mt-5">
                            <button
                                type="button"
                                onClick={onScanNewTagAfterUnassign}
                                className="px-5 py-2.5 bg-red-950 hover:bg-red-900 text-white text-xs font-mono font-bold uppercase rounded-lg transition-colors cursor-pointer shadow-2xs"
                            >
                                Scan New Tag
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STATE O: API / NETWORK ERROR ── */}
                {scannerState === 'api-error' && (
                    <div className="text-center py-8 px-6 bg-red-50/80 rounded-xl border border-red-300">
                        <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto mb-3 border border-red-200">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-base font-bold text-red-900 font-mono uppercase">
                            Assignment Failed
                        </h3>
                        <p className="text-xs text-red-700 mt-1 max-w-sm mx-auto">
                            {apiError || 'The RFID could not be assigned. Your scanned RFID has been kept.'}
                        </p>
                        {scannedRfid && (
                            <div className="mt-3 font-mono text-sm font-bold text-red-950 bg-white px-3 py-1 rounded border border-red-200 inline-block">
                                Tag: {scannedRfid}
                            </div>
                        )}
                        <div className="mt-5 flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={onClearApiError}
                                className="px-5 py-2 bg-red-950 hover:bg-red-900 text-white text-xs font-mono font-bold uppercase rounded-md transition-colors cursor-pointer shadow-2xs"
                            >
                                Try Again
                            </button>
                            <button
                                type="button"
                                onClick={onResetScanner}
                                className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-mono font-semibold rounded-md transition-colors cursor-pointer"
                            >
                                Scan Another Tag
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STATE H: RFID CONFLICT ── */}
                {scannerState === 'conflict' && conflictItem && (
                    <div className="text-center py-8 px-6 bg-red-50/80 rounded-xl border border-red-300">
                        <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto mb-3 border border-red-200">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-bold text-red-900 font-mono uppercase tracking-wide">
                            RFID Already Assigned
                        </h3>
                        <div className="mt-2 font-mono text-base font-bold text-red-950 bg-white px-3 py-1 rounded border border-red-200 inline-block">
                            {scannedRfid}
                        </div>
                        <p className="text-xs text-red-700 mt-2">Currently assigned to:</p>
                        <div className="mt-2 bg-white p-3 rounded-lg border border-red-200 text-left max-w-sm mx-auto">
                            <p className="font-bold text-gray-900 text-xs">{conflictItem.name}</p>
                            <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                                Property No: {conflictItem.sku || 'N/A'}
                            </p>
                        </div>
                        <div className="mt-5 flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={onResetScanner}
                                className="px-4 py-2 bg-red-950 hover:bg-red-900 text-white text-xs font-mono font-bold uppercase rounded-md transition-colors cursor-pointer shadow-2xs"
                            >
                                Scan Another Tag
                            </button>
                            <button
                                type="button"
                                onClick={() => onSelectConflictItem(conflictItem)}
                                className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-mono font-semibold rounded-md transition-colors cursor-pointer"
                            >
                                View Existing Item
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STATE I: INVALID RFID ── */}
                {scannerState === 'invalid' && (
                    <div className="text-center py-8 px-4 bg-amber-50 rounded-xl border border-amber-200">
                        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-bold text-amber-900 font-mono uppercase">
                            RFID Not Recognized
                        </h3>
                        <p className="text-xs text-amber-700 mt-1 max-w-xs mx-auto">
                            The scanned RFID could not be processed or was empty.
                        </p>
                        <div className="mt-4">
                            <button
                                type="button"
                                onClick={onClearInvalid}
                                className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white text-xs font-mono font-bold uppercase rounded-md transition-colors cursor-pointer"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STATE E: RFID DETECTED (VERIFICATION) ── */}
                {scannerState === 'rfid-detected' && (
                    <div className="text-center py-6 px-4 bg-emerald-50/40 rounded-xl border-2 border-emerald-400">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2 border border-emerald-200">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 font-mono block">
                            RFID Detected
                        </span>
                        <div className="my-2 font-mono text-2xl font-bold text-red-950 bg-white px-5 py-2 rounded-lg border border-emerald-300 shadow-xs inline-block">
                            {scannedRfid}
                        </div>
                        <p className="text-xs text-emerald-700 font-medium">
                            ✓ Tag detected successfully
                        </p>
                        <div className="mt-6 space-y-2">
                            <button
                                type="button"
                                onClick={onAssign}
                                className="w-full py-3 px-6 bg-red-950 hover:bg-red-900 text-white rounded-lg font-bold text-xs uppercase tracking-wider font-mono transition-all shadow-md active:translate-y-px cursor-pointer flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Assign RFID</span>
                            </button>
                            <button
                                type="button"
                                onClick={onResetScanner}
                                className="text-xs font-mono text-gray-500 hover:text-gray-800 underline cursor-pointer pt-1"
                            >
                                Scan Another
                            </button>
                        </div>
                    </div>
                )}

                {/* ── STATE B / D: READY TO SCAN ── */}
                {scannerState === 'ready-to-scan' && (
                    <div className="text-center py-10 px-4 bg-gray-50/70 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center">
                        <div className="w-14 h-14 bg-white rounded-full border border-gray-200 shadow-2xs flex items-center justify-center mx-auto text-red-900 mb-3">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-bold text-gray-800 font-mono tracking-wide uppercase">
                            Ready to Scan
                        </h3>
                        <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1">
                            Present RFID tag and pull the trigger on the reader.
                        </p>
                        <div className="w-24 border-t border-gray-200 my-4" />
                        <button
                            type="button"
                            onClick={() => setIsManualMode(true)}
                            className="text-xs text-gray-500 hover:text-gray-800 font-mono font-medium underline cursor-pointer"
                        >
                            Enter RFID manually
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
