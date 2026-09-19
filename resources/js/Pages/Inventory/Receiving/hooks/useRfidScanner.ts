import { useCallback, useEffect, useRef, useState } from 'react';
import { InventoryItem } from '../types';
import { playScanChime } from '@/Pages/RFID-Scanner/utils/scannerAudio';

export interface UseRfidScannerOptions {
    items: InventoryItem[];
    enabled: boolean;
    isSubmitting?: boolean;
    selectedDeviceUuid?: string;
    selectedStation?: string;
}

export function useRfidScanner({
    items,
    enabled,
    isSubmitting = false,
    selectedDeviceUuid,
    selectedStation,
}: UseRfidScannerOptions) {
    const [scanInput, setScanInput] = useState('');
    const [scannedItems, setScannedItems] = useState<InventoryItem[]>([]);
    const [queuedItems, setQueuedItems] = useState<InventoryItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'offline'>('connecting');
    const [scanFeedback, setScanFeedback] = useState('Ready for keyboard, manual, or hardware scans.');

    const scannedRef = useRef<InventoryItem[]>([]);
    const queuedRef = useRef<InventoryItem[]>([]);
    const isSubmittingRef = useRef(isSubmitting);
    useEffect(() => { isSubmittingRef.current = isSubmitting; }, [isSubmitting]);

    const pendingTagsRef = useRef<Set<string>>(new Set());
    const acceptingRef = useRef(false);
    const generationRef = useRef(0);
    const cursorRef = useRef<number | null>(null);

    // Keyboard buffer refs for hardware wedge scanner
    const bufferRef = useRef('');
    const lastKeyRef = useRef(0);
    const wedgeBufferRef = useRef('');
    const wedgeLastKeyRef = useRef(0);
    const wedgeInitialInputValueRef = useRef<string>('');
    const wedgeActiveInputRef = useRef<HTMLInputElement | null>(null);

    const resetScanner = useCallback(() => {
        acceptingRef.current = false;
        generationRef.current += 1;
        scannedRef.current = [];
        queuedRef.current = [];
        pendingTagsRef.current.clear();
        bufferRef.current = '';
        cursorRef.current = null;
        setScannedItems([]);
        setQueuedItems([]);
        setScanInput('');
        setErrorMessage(null);
        setScanFeedback('Ready for keyboard, manual, or hardware scans.');
        setIsSearching(false);
    }, []);

    const beginSubmission = useCallback(() => { isSubmittingRef.current = true; }, []);
    const cancelSubmission = useCallback(() => { isSubmittingRef.current = false; }, []);
    const finishSubmission = useCallback(() => {
        isSubmittingRef.current = false;
        const carried = queuedRef.current.length > 0 || pendingTagsRef.current.size > 0;
        scannedRef.current = [...queuedRef.current];
        queuedRef.current = [];
        setScannedItems([...scannedRef.current]);
        setQueuedItems([]);
        setScanInput('');
        setErrorMessage(null);
        return carried;
    }, []);

    const clearQueuedItems = useCallback(() => {
        queuedRef.current = [];
        setQueuedItems([]);
    }, []);

    const removeItem = useCallback((tag: string) => {
        scannedRef.current = scannedRef.current.filter(item => item.rfid_tag?.toUpperCase() !== tag.toUpperCase());
        setScannedItems([...scannedRef.current]);
        queuedRef.current = queuedRef.current.filter(item => item.rfid_tag?.toUpperCase() !== tag.toUpperCase());
        setQueuedItems([...queuedRef.current]);
    }, []);

    const lookupTag = useCallback(async (rawTag: string, clearInput = true) => {
        if (!acceptingRef.current) return;
        const tag = rawTag.trim().toUpperCase();
        if (clearInput) setScanInput('');
        if (!tag || !/^[A-Z0-9_-]{1,100}$/.test(tag)) {
            setErrorMessage('Enter a valid RFID tag (letters, numbers, hyphens, or underscores).');
            setScanFeedback('Invalid tag.');
            return;
        }

        // Check if already in active scanned items or in queued items
        if (scannedRef.current.some(item => item.rfid_tag?.trim().toUpperCase() === tag)) {
            setErrorMessage(`RFID tag ${tag} is already in this receipt.`);
            setScanFeedback(`${tag} was already added.`);
            return;
        }

        if (queuedRef.current.some(item => item.rfid_tag?.trim().toUpperCase() === tag)) {
            setErrorMessage(`RFID tag ${tag} is already queued for the next session.`);
            setScanFeedback(`${tag} is already queued.`);
            return;
        }

        // Enforce 100-item bulk limit before submission
        if (!isSubmittingRef.current && scannedRef.current.length >= 100) {
            setErrorMessage('Maximum batch limit of 100 items reached. Submit this batch before scanning more items.');
            setScanFeedback('100-item limit reached.');
            return;
        }

        if (pendingTagsRef.current.has(tag)) {
            setErrorMessage(`RFID tag ${tag} is already being looked up.`);
            return;
        }

        pendingTagsRef.current.add(tag);
        const generation = generationRef.current;
        setIsSearching(true);
        setErrorMessage(null);

        try {
            let item = items.find(candidate => candidate.rfid_tag?.trim().toUpperCase() === tag);
            if (!item) {
                const response = await fetch(route('rfid-scanner.lookup', { tag }), { headers: { Accept: 'application/json' } });
                if (response.ok) {
                    const data = await response.json();
                    if (data.found && data.item) item = data.item as InventoryItem;
                } else if (response.status !== 404) {
                    throw new Error('Tag lookup failed. Please try again.');
                }
            }

            if (generation !== generationRef.current) return;

            if (!item?.rfid_tag) {
                setErrorMessage(`No inventory item is associated with RFID tag ${tag}.`);
                setScanFeedback(`${tag} was not found.`);
            } else if (scannedRef.current.some(candidate => candidate.rfid_tag?.trim().toUpperCase() === tag)) {
                setErrorMessage(`RFID tag ${tag} is already in this receipt.`);
            } else if (queuedRef.current.some(candidate => candidate.rfid_tag?.trim().toUpperCase() === tag)) {
                setErrorMessage(`RFID tag ${tag} is already queued for the next session.`);
            } else {
                playScanChime();

                if (isSubmittingRef.current) {
                    // Item scanned during submission: queue for the next session
                    queuedRef.current = [...queuedRef.current, item];
                    setQueuedItems([...queuedRef.current]);
                    setScanFeedback(`Scan ${tag} received during submission — queued for next session: ${item.name}.`);
                } else {
                    scannedRef.current = [...scannedRef.current, item];
                    setScannedItems([...scannedRef.current]);
                    setScanFeedback(`${tag} added: ${item.name}.`);
                }
            }
        } catch (error) {
            if (generation === generationRef.current) {
                setErrorMessage(error instanceof Error ? error.message : 'Tag lookup failed. Please try again.');
            }
        } finally {
            if (generation === generationRef.current) {
                pendingTagsRef.current.delete(tag);
                setIsSearching(pendingTagsRef.current.size > 0);
            }
        }
    }, [items]);

    // Live Feed polling with device/station scoping and server session cursor
    useEffect(() => {
        acceptingRef.current = enabled;
        if (!enabled || !selectedDeviceUuid) {
            setConnectionState('offline');
            return;
        }
        const controller = new AbortController();
        let busy = false;
        cursorRef.current = null;
        setConnectionState('connecting');

        const poll = async () => {
            if (busy) return;
            busy = true;
            try {
                const params: Record<string, string | number> = {
                    device_uuid: selectedDeviceUuid,
                };
                if (cursorRef.current === null) params.initialize = 1;
                else params.since = cursorRef.current;
                if (selectedStation) {
                    params.station = selectedStation;
                }

                const response = await fetch(route('rfid-scanner.live-feed', params), {
                    signal: controller.signal,
                    cache: 'no-store',
                    headers: { Accept: 'application/json' },
                });

                if (!response.ok) throw new Error(`Live feed returned ${response.status}`);
                const data = await response.json();
                if (controller.signal.aborted) return;

                setConnectionState('connected');

                // The first response arms this device from a server cursor. Earlier events are not replayed.
                const incomingLatestId = Number(data.latest_event_id ?? 0);
                const currentCursor = cursorRef.current ?? 0;

                // Process incoming events from server
                for (const event of data.events ?? []) {
                    cursorRef.current = Math.max(cursorRef.current ?? 0, Number(event.id));
                    void lookupTag(event.tag, false);
                }

                cursorRef.current = Math.max(cursorRef.current ?? 0, currentCursor, incomingLatestId);
            } catch (error) {
                if (!controller.signal.aborted) setConnectionState('offline');
            } finally {
                busy = false;
            }
        };

        void poll();
        const timer = window.setInterval(poll, 1000);
        return () => {
            controller.abort();
            window.clearInterval(timer);
        };
    }, [enabled, selectedDeviceUuid, selectedStation, lookupTag]);

    // Keyboard-wedge listener that remains usable while staff edit cost, supplier, or date fields
    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            const active = document.activeElement;
            const now = Date.now();

            // If focused on the primary RFID input, let its native input & Enter handler work
            if (active instanceof HTMLInputElement && active.getAttribute('data-rfid-input') === 'true') {
                return;
            }

            const isInputOrSelect =
                active instanceof HTMLInputElement ||
                active instanceof HTMLTextAreaElement ||
                active instanceof HTMLSelectElement;

            if (isInputOrSelect) {
                // Focus is inside a cost input, date input, or supplier select
                // Hardware wedge scanners send characters in rapid succession (< 60ms apart) ending with Enter
                if (event.key === 'Enter') {
                    if (wedgeBufferRef.current.length >= 3) {
                        event.preventDefault();
                        const tag = wedgeBufferRef.current;
                        wedgeBufferRef.current = '';

                        // If the wedge typed into an input, restore the original value
                        if (wedgeActiveInputRef.current && active === wedgeActiveInputRef.current) {
                            wedgeActiveInputRef.current.value = wedgeInitialInputValueRef.current;
                            // Trigger React input change event if needed
                            const ev = new Event('input', { bubbles: true });
                            wedgeActiveInputRef.current.dispatchEvent(ev);
                        }

                        void lookupTag(tag);
                    }
                    wedgeBufferRef.current = '';
                    wedgeActiveInputRef.current = null;
                } else if (event.key.length === 1) {
                    const elapsed = now - wedgeLastKeyRef.current;
                    if (elapsed > 65) {
                        // Human typing or start of new burst
                        wedgeBufferRef.current = event.key;
                        if (active instanceof HTMLInputElement) {
                            wedgeInitialInputValueRef.current = active.value;
                            wedgeActiveInputRef.current = active;
                        }
                    } else {
                        // High-speed scanner wedge keystroke
                        wedgeBufferRef.current += event.key;
                    }
                    wedgeLastKeyRef.current = now;
                }
                return;
            }

            // Normal modal surface (no input focused): collect keystrokes
            if (event.key === 'Enter') {
                if (bufferRef.current.length >= 3) {
                    event.preventDefault();
                    void lookupTag(bufferRef.current);
                }
                bufferRef.current = '';
            } else if (event.key.length === 1) {
                if (now - lastKeyRef.current > 120) bufferRef.current = '';
                bufferRef.current += event.key;
                lastKeyRef.current = now;
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [enabled, lookupTag]);

    return {
        scanInput,
        setScanInput,
        scannedItems,
        queuedItems,
        beginSubmission,
        finishSubmission,
        cancelSubmission,
        isSearching,
        errorMessage,
        connectionState,
        scanFeedback,
        lookupTag,
        removeItem,
        resetScanner,
        clearQueuedItems,
    };
}
