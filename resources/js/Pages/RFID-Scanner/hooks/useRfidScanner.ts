import { useState, useEffect, useRef, useCallback } from 'react';
import { RFIDConnectionState, RFIDScan } from '../types';
import { playScanChime } from '../utils/scannerAudio';

interface UseRfidScannerOptions {
    enabled: boolean;
    onScan: (scan: RFIDScan) => void;
    pollIntervalMs?: number;
    maxConsecutiveFailures?: number;
    selectedDeviceUuid?: string;
    canAcceptScan?: boolean;
}

export function useRfidScanner({
    enabled,
    onScan,
    pollIntervalMs = 1000,
    maxConsecutiveFailures = 10,
    selectedDeviceUuid,
    canAcceptScan = true,
}: UseRfidScannerOptions) {
    const [connectionState, setConnectionState] = useState<RFIDConnectionState>('connecting');
    const [isRetrying, setIsRetrying] = useState(false);
    const [lastScan, setLastScan] = useState<RFIDScan | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);
    const queuedScansRef = useRef<string[]>([]);
    const [pendingScanCount, setPendingScanCount] = useState(0);
    const deliveredRef = useRef(false);
    const consecutiveFailuresRef = useRef<number>(0);
    const onScanCallbackRef = useRef(onScan);

    // Keep callback ref fresh without triggering effects
    useEffect(() => {
        onScanCallbackRef.current = onScan;
    }, [onScan]);

    // Safe scan processor
    const processRawScan = useCallback((rawTag: string) => {
        const cleanTag = rawTag.trim().toUpperCase();
        if (!cleanTag) return;

        const scanObj: RFIDScan = {
            tag: cleanTag,
            timestamp: Date.now(),
        };

        setLastScan(scanObj);
        playScanChime();
        onScanCallbackRef.current(scanObj);
    }, []);

    useEffect(() => {
        if (!canAcceptScan) { deliveredRef.current = false; return; }
        if (deliveredRef.current || !queuedScansRef.current.length) return;
        deliveredRef.current = true;
        const tag = queuedScansRef.current.shift()!;
        setPendingScanCount(queuedScansRef.current.length);
        processRawScan(tag);
    }, [canAcceptScan, pendingScanCount, processRawScan]);

    // Active polling for ESP32 hardware reader live-feed
    useEffect(() => {
        if (!enabled || !selectedDeviceUuid) {
            queuedScansRef.current = [];
            setPendingScanCount(0);
            setConnectionState('offline');
            return;
        }

        const abortController = new AbortController();
        let cursor: number | null = null;
        queuedScansRef.current = [];
        setPendingScanCount(0);
        deliveredRef.current = false;
        let fetching = false;

        const pollLiveFeed = async () => {
            if (fetching || queuedScansRef.current.length >= 200) return;
            fetching = true;

            try {
                const params = new URLSearchParams({ device_uuid: selectedDeviceUuid });
                if (cursor === null) params.set('initialize', '1');
                else params.set('since', String(cursor));
                const response = await fetch(`/rfid-scanner/live-feed?${params}`, {
                    signal: abortController.signal,
                    cache: 'no-store',
                    headers: { Accept: 'application/json' },
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();
                if (abortController.signal.aborted) return;
                consecutiveFailuresRef.current = 0;
                setConnectionState(data.status === 'online' ? 'connected' : 'offline');

                if (cursor === null) cursor = Number(data.latest_event_id ?? 0);
                for (const event of data.events ?? []) {
                    if (queuedScansRef.current.length >= 200) break;
                    queuedScansRef.current.push(event.tag);
                    cursor = Number(event.id);
                }
                setPendingScanCount(queuedScansRef.current.length);
            } catch (err: unknown) {
                if ((err as Error)?.name === 'AbortError') return;

                consecutiveFailuresRef.current += 1;
                if (consecutiveFailuresRef.current >= maxConsecutiveFailures) {
                    setConnectionState('offline');
                } else {
                    setConnectionState('degraded');
                }
            } finally {
                fetching = false;
            }
        };

        // Initial check immediately
        pollLiveFeed();

        const intervalId = setInterval(pollLiveFeed, pollIntervalMs);

        return () => {
            clearInterval(intervalId);
            abortController.abort();
            fetching = false;
        };
    }, [enabled, selectedDeviceUuid, pollIntervalMs, maxConsecutiveFailures]);

    // Real backend probe for connection retry
    const retryConnection = useCallback(async () => {
        setIsRetrying(true);
        setConnectionState('connecting');

        try {
            const response = await fetch(`/rfid-scanner/status?${new URLSearchParams({ device_uuid: selectedDeviceUuid || '' })}`, {
                cache: 'no-store',
                headers: { Accept: 'application/json' },
            });

            if (response.ok) {
                const data = await response.json();
                consecutiveFailuresRef.current = 0;
                setConnectionState(data.status === 'online' ? 'connected' : 'offline');
            } else {
                setConnectionState('offline');
            }
        } catch {
            setConnectionState('offline');
        } finally {
            setIsRetrying(false);
        }
    }, [selectedDeviceUuid]);

    // Hidden input keyboard listener for USB / Bluetooth keyboard-wedge RFID readers
    const handleScanKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const value = e.currentTarget.value;
                e.currentTarget.value = '';
                if (value) {
                    processRawScan(value);
                }
            }
        },
        [processRawScan]
    );

    // Controlled focus management: does NOT steal focus from forms, modals, or inputs
    const focusScannerInput = useCallback(() => {
        if (!enabled) return;

        const activeEl = document.activeElement;
        const isUserInteractingWithForm =
            activeEl instanceof HTMLInputElement ||
            activeEl instanceof HTMLTextAreaElement ||
            activeEl instanceof HTMLSelectElement ||
            activeEl instanceof HTMLButtonElement ||
            activeEl?.closest('.react-select-container') ||
            activeEl?.closest('[role="dialog"]') ||
            activeEl?.closest('[role="menu"]');

        if (!isUserInteractingWithForm && inputRef.current) {
            inputRef.current.focus({ preventScroll: true });
        }
    }, [enabled]);

    useEffect(() => {
        if (!enabled) return;

        focusScannerInput();

        const handleGlobalClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement | null;
            if (!target) return;

            const isInteractive =
                target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement ||
                target instanceof HTMLSelectElement ||
                target instanceof HTMLButtonElement ||
                target.closest('button') ||
                target.closest('a') ||
                target.closest('.react-select-container') ||
                target.closest('[role="dialog"]') ||
                target.closest('[role="menu"]');

            if (!isInteractive) {
                focusScannerInput();
            }
        };

        document.addEventListener('click', handleGlobalClick);
        return () => document.removeEventListener('click', handleGlobalClick);
    }, [enabled, focusScannerInput]);

    return {
        connectionState,
        isRetrying,
        lastScan,
        inputRef,
        handleScanKeyDown,
        processManualScan: processRawScan,
        retryConnection,
        focusScannerInput,
        pendingScanCount,
    };
}
