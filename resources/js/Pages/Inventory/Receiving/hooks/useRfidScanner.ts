import { useCallback, useEffect, useRef, useState } from 'react';
import { InventoryItem } from '../types';

export function useRfidScanner(items: InventoryItem[], enabled: boolean) {
    const [scanInput, setScanInput] = useState('');
    const [scannedItems, setScannedItems] = useState<InventoryItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const scannedRef = useRef<InventoryItem[]>([]);
    const pendingTagsRef = useRef<Set<string>>(new Set());
    const generationRef = useRef(0);
    const bufferRef = useRef('');
    const lastKeyRef = useRef(0);

    const resetScanner = useCallback(() => {
        generationRef.current += 1;
        scannedRef.current = [];
        pendingTagsRef.current.clear();
        bufferRef.current = '';
        setScannedItems([]);
        setScanInput('');
        setErrorMessage(null);
        setIsSearching(false);
    }, []);

    const removeItem = useCallback((tag: string) => {
        scannedRef.current = scannedRef.current.filter(item => item.rfid_tag?.toUpperCase() !== tag.toUpperCase());
        setScannedItems(scannedRef.current);
    }, []);

    const lookupTag = useCallback(async (rawTag: string) => {
        const tag = rawTag.trim().toUpperCase();
        setScanInput('');
        if (!tag || !/^[A-Z0-9_-]{1,100}$/.test(tag)) {
            setErrorMessage('Enter a valid RFID tag (letters, numbers, hyphens, or underscores).');
            return;
        }
        if (scannedRef.current.some(item => item.rfid_tag?.trim().toUpperCase() === tag)) {
            setErrorMessage(`RFID tag ${tag} is already in this receipt.`);
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
            } else if (scannedRef.current.some(candidate => candidate.rfid_tag?.trim().toUpperCase() === tag)) {
                setErrorMessage(`RFID tag ${tag} is already in this receipt.`);
            } else {
                scannedRef.current = [...scannedRef.current, item];
                setScannedItems(scannedRef.current);
            }
        } catch (error) {
            if (generation === generationRef.current) setErrorMessage(error instanceof Error ? error.message : 'Tag lookup failed. Please try again.');
        } finally {
            if (generation === generationRef.current) {
                pendingTagsRef.current.delete(tag);
                setIsSearching(pendingTagsRef.current.size > 0);
            }
        }
    }, [items]);

    useEffect(() => {
        if (!enabled) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            const active = document.activeElement;
            if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement) return;
            const now = Date.now();
            if (event.key === 'Enter') {
                if (bufferRef.current.length >= 3) {
                    event.preventDefault();
                    void lookupTag(bufferRef.current);
                }
                bufferRef.current = '';
            } else if (event.key.length === 1) {
                if (now - lastKeyRef.current > 120) bufferRef.current = '';
                bufferRef.current += event.key;
            }
            lastKeyRef.current = now;
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [enabled, lookupTag]);

    return { scanInput, setScanInput, scannedItems, isSearching, errorMessage, lookupTag, removeItem, resetScanner };
}
