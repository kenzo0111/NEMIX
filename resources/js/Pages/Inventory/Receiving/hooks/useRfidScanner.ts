import { useState, useEffect, useCallback, useRef } from 'react';
import { InventoryItem } from '../types';

interface UseRfidScannerOptions {
    items: InventoryItem[];
    enabled?: boolean;
    onItemMatched?: (item: InventoryItem) => void;
}

interface UseRfidScannerReturn {
    scanInput: string;
    setScanInput: (value: string) => void;
    matchedItem: InventoryItem | null;
    isSearching: boolean;
    errorMessage: string | null;
    lookupTag: (tag: string) => Promise<InventoryItem | null>;
    resetScanner: () => void;
}

/**
 * Reusable Hook for RFID Scanning in Receiving Workflows
 * Supports:
 * - Keyboard-wedge physical scanners (rapid keystrokes followed by Enter)
 * - Authoritative local lookup with backend API fallback (/rfid-scanner/lookup/{tag})
 * - Manual input entry
 */
export function useRfidScanner({
    items,
    enabled = true,
    onItemMatched,
}: UseRfidScannerOptions): UseRfidScannerReturn {
    const [scanInput, setScanInput] = useState<string>('');
    const [matchedItem, setMatchedItem] = useState<InventoryItem | null>(null);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Keyboard wedge buffer for hardware scanners
    const keystrokeBufferRef = useRef<string>('');
    const lastKeystrokeTimeRef = useRef<number>(0);

    const lookupTag = useCallback(
        async (rawTag: string): Promise<InventoryItem | null> => {
            const cleanTag = rawTag.trim().toUpperCase();
            if (!cleanTag) {
                setMatchedItem(null);
                setErrorMessage(null);
                return null;
            }

            setScanInput(cleanTag);
            setIsSearching(true);
            setErrorMessage(null);

            // 1. Fast local match from loaded inventory items
            const localMatch = items.find(
                (item) => item.rfid_tag && item.rfid_tag.trim().toUpperCase() === cleanTag
            );

            if (localMatch) {
                setMatchedItem(localMatch);
                setIsSearching(false);
                if (onItemMatched) {
                    onItemMatched(localMatch);
                }
                return localMatch;
            }

            // 2. Fallback to authoritative backend API lookup
            try {
                const response = await fetch(route('rfid-scanner.lookup', { tag: cleanTag }), {
                    headers: {
                        Accept: 'application/json',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.found && data.item) {
                        const itemData: InventoryItem = {
                            id: data.item.id,
                            name: data.item.name,
                            sku: data.item.sku,
                            rfid_tag: data.item.rfid_tag,
                            supplier_id: data.item.supplier_id,
                            supplier_name: data.item.supplier_name,
                            description: data.item.description,
                            unit_of_issue: data.item.unit_of_issue,
                            stock: data.item.stock,
                        };
                        setMatchedItem(itemData);
                        if (onItemMatched) {
                            onItemMatched(itemData);
                        }
                        return itemData;
                    }
                }

                setMatchedItem(null);
                setErrorMessage(`No inventory item is associated with RFID tag '${cleanTag}'.`);
                return null;
            } catch {
                setMatchedItem(null);
                setErrorMessage(`No inventory item is associated with RFID tag '${cleanTag}'.`);
                return null;
            } finally {
                setIsSearching(false);
            }
        },
        [items, onItemMatched]
    );

    const resetScanner = useCallback(() => {
        setScanInput('');
        setMatchedItem(null);
        setIsSearching(false);
        setErrorMessage(null);
        keystrokeBufferRef.current = '';
    }, []);

    // Hardware Scanner Wedge Listener
    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const activeElement = document.activeElement;
            const isInsideInput =
                activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement;

            // If user is typing in a standard form input other than an RFID scan input, let it through
            if (isInsideInput && (activeElement as HTMLElement).dataset.rfidInput !== 'true') {
                return;
            }

            const now = Date.now();
            const timeDiff = now - lastKeystrokeTimeRef.current;
            lastKeystrokeTimeRef.current = now;

            if (e.key === 'Enter') {
                if (keystrokeBufferRef.current.length >= 3) {
                    e.preventDefault();
                    const tagToLookup = keystrokeBufferRef.current;
                    keystrokeBufferRef.current = '';
                    lookupTag(tagToLookup);
                }
                return;
            }

            // Normal typing speed vs scanner speed (< 50ms per key)
            if (e.key.length === 1) {
                if (timeDiff > 120 && keystrokeBufferRef.current.length > 0) {
                    keystrokeBufferRef.current = '';
                }
                keystrokeBufferRef.current += e.key;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [enabled, lookupTag]);

    return {
        scanInput,
        setScanInput,
        matchedItem,
        isSearching,
        errorMessage,
        lookupTag,
        resetScanner,
    };
}
