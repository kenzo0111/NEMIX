import { useState, useEffect, useRef, useCallback } from 'react';
import { RFIDConnectionState, RFIDScan } from '../types';
import { playScanChime } from '../utils/scannerAudio';

interface UseRfidScannerOptions {
    enabled: boolean;
    onScan: (scan: RFIDScan) => void;
    pollIntervalMs?: number;
    maxConsecutiveFailures?: number;
}

export function useRfidScanner({
    enabled,
    onScan,
    pollIntervalMs = 1500,
    maxConsecutiveFailures = 3,
}: UseRfidScannerOptions) {
    const [connectionState, setConnectionState] = useState<RFIDConnectionState>('connecting');
    const [isRetrying, setIsRetrying] = useState(false);
    const [lastScan, setLastScan] = useState<RFIDScan | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);
    const lastScanTimestampRef = useRef<number>(0);
    const consecutiveFailuresRef = useRef<number>(0);
    const isFetchingRef = useRef<boolean>(false);
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

    // Active polling for ESP32 hardware reader live-feed
    useEffect(() => {
        if (!enabled) return;

        const abortController = new AbortController();

        const pollLiveFeed = async () => {
            if (isFetchingRef.current) return;
            isFetchingRef.current = true;

            try {
                const response = await fetch('/rfid-scanner/live-feed', {
                    signal: abortController.signal,
                    headers: { Accept: 'application/json' },
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();
                consecutiveFailuresRef.current = 0;
                setConnectionState('connected');

                // Inspect incoming scan event from hardware
                if (data?.scan?.tag && data?.scan?.timestamp) {
                    const scanTs = Number(data.scan.timestamp);
                    if (lastScanTimestampRef.current === 0) {
                        lastScanTimestampRef.current = scanTs;
                    } else if (scanTs > lastScanTimestampRef.current) {
                        lastScanTimestampRef.current = scanTs;
                        processRawScan(data.scan.tag);
                    }
                }
            } catch (err: unknown) {
                if ((err as Error)?.name === 'AbortError') return;

                consecutiveFailuresRef.current += 1;
                if (consecutiveFailuresRef.current >= maxConsecutiveFailures) {
                    setConnectionState('offline');
                } else {
                    setConnectionState('degraded');
                }
            } finally {
                isFetchingRef.current = false;
            }
        };

        // Initial check immediately
        pollLiveFeed();

        const intervalId = setInterval(pollLiveFeed, pollIntervalMs);

        return () => {
            clearInterval(intervalId);
            abortController.abort();
            isFetchingRef.current = false;
        };
    }, [enabled, pollIntervalMs, maxConsecutiveFailures, processRawScan]);

    // Real backend probe for connection retry
    const retryConnection = useCallback(async () => {
        setIsRetrying(true);
        setConnectionState('connecting');

        try {
            const response = await fetch('/rfid-scanner/status', {
                headers: { Accept: 'application/json' },
            });

            if (response.ok) {
                consecutiveFailuresRef.current = 0;
                setConnectionState('connected');
            } else {
                setConnectionState('offline');
            }
        } catch {
            setConnectionState('offline');
        } finally {
            setIsRetrying(false);
        }
    }, []);

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
    };
}
