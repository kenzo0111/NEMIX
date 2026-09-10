import { useReducer, useCallback, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { RFIDInventoryItem, RFIDScan, RFIDWorkflowState } from '../types';

declare function route(name: string, params?: any): string;

type WorkflowAction =
    | { type: 'SELECT_ITEM'; item: RFIDInventoryItem | null }
    | { type: 'UPDATE_ITEM'; item: RFIDInventoryItem }
    | { type: 'SCAN_DETECTED'; tag: string; conflictItem?: RFIDInventoryItem | null }
    | { type: 'START_ASSIGNING' }
    | { type: 'ASSIGN_SUCCESS'; item: RFIDInventoryItem; tag: string; nextItem?: RFIDInventoryItem | null }
    | { type: 'UNASSIGN_SUCCESS'; item: RFIDInventoryItem; previousTag: string }
    | { type: 'SET_ERROR'; message: string; tag?: string }
    | { type: 'RETRY_ASSIGN' }
    | { type: 'RESET_SCANNER' };

function workflowReducer(
    state: RFIDWorkflowState,
    action: WorkflowAction
): RFIDWorkflowState {
    switch (action.type) {
        case 'SELECT_ITEM': {
            if (!action.item) {
                return { type: 'idle' };
            }
            return { type: 'ready', item: action.item };
        }

        case 'UPDATE_ITEM': {
            if (state.type === 'idle') return state;
            return { ...state, item: action.item };
        }

        case 'SCAN_DETECTED': {
            if (state.type === 'idle') return state;
            const currentItem = 'item' in state && state.item ? state.item : null;
            if (!currentItem) return state;

            if (action.conflictItem) {
                return {
                    type: 'conflict',
                    item: currentItem,
                    tag: action.tag,
                    conflictItem: action.conflictItem,
                };
            }

            return {
                type: 'detected',
                item: currentItem,
                tag: action.tag,
            };
        }

        case 'START_ASSIGNING': {
            if (state.type !== 'detected') return state;
            return {
                type: 'assigning',
                item: state.item,
                tag: state.tag,
            };
        }

        case 'ASSIGN_SUCCESS': {
            return {
                type: 'success',
                item: action.item,
                tag: action.tag,
                nextItem: action.nextItem,
            };
        }

        case 'UNASSIGN_SUCCESS': {
            return {
                type: 'unassigned',
                item: action.item,
                previousTag: action.previousTag,
            };
        }

        case 'SET_ERROR': {
            const currentItem = 'item' in state ? state.item : null;
            return {
                type: 'error',
                item: currentItem,
                tag: action.tag,
                message: action.message,
            };
        }

        case 'RETRY_ASSIGN': {
            if (state.type === 'error' && state.item && state.tag) {
                return {
                    type: 'detected',
                    item: state.item,
                    tag: state.tag,
                };
            }
            return state;
        }

        case 'RESET_SCANNER': {
            if ('item' in state && state.item) {
                return { type: 'ready', item: state.item };
            }
            return { type: 'idle' };
        }

        default:
            return state;
    }
}

interface UseRfidTaggingWorkflowProps {
    items: RFIDInventoryItem[];
    initialSelectedItem?: RFIDInventoryItem | null;
}

export function useRfidTaggingWorkflow({
    items,
    initialSelectedItem = null,
}: UseRfidTaggingWorkflowProps) {
    const [state, dispatch] = useReducer(
        workflowReducer,
        initialSelectedItem ? { type: 'ready', item: initialSelectedItem } : { type: 'idle' }
    );

    // Keep selected item synchronized when items array changes (e.g. via Inertia visits)
    useEffect(() => {
        if ('item' in state && state.item) {
            const updated = items.find((i) => i.id === state.item?.id);
            if (updated && updated.rfid_tag !== state.item.rfid_tag) {
                dispatch({ type: 'UPDATE_ITEM', item: updated });
            }
        }
    }, [items, state]);

    // Check if a scanned tag is already assigned to a DIFFERENT inventory item
    const findConflict = useCallback(
        (tag: string, currentItemId?: number): RFIDInventoryItem | null => {
            const normalized = tag.toUpperCase().trim();
            return (
                items.find(
                    (i) =>
                        i.rfid_tag &&
                        i.rfid_tag.toUpperCase() === normalized &&
                        i.id !== currentItemId
                ) || null
            );
        },
        [items]
    );

    // Handles scan event from either hardware reader, live feed, or manual entry
    const handleScan = useCallback(
        (scan: RFIDScan) => {
            const currentItem = 'item' in state ? state.item : null;
            if (!currentItem) return;

            const conflict = findConflict(scan.tag, currentItem.id);
            dispatch({
                type: 'SCAN_DETECTED',
                tag: scan.tag,
                conflictItem: conflict,
            });
        },
        [state, findConflict]
    );

    // Selects an inventory item to tag
    const selectItem = useCallback((item: RFIDInventoryItem | null) => {
        dispatch({ type: 'SELECT_ITEM', item });
    }, []);

    // Resets scanner to ready state without changing the selected item
    const resetScanner = useCallback(() => {
        dispatch({ type: 'RESET_SCANNER' });
    }, []);

    // Initiates assignment request
    const assignTag = useCallback(() => {
        if (state.type !== 'detected') return;

        const targetItem = state.item;
        const tagToAssign = state.tag;
        const nextUntagged = items.find((i) => i.id !== targetItem.id && !i.rfid_tag) || null;

        dispatch({ type: 'START_ASSIGNING' });

        router.post(
            route('rfid-scanner.assign'),
            {
                item_id: targetItem.id,
                rfid_tag: tagToAssign,
            },
            {
                preserveScroll: true,
                onSuccess: (page: any) => {
                    if (page?.props?.flash?.error) {
                        dispatch({
                            type: 'SET_ERROR',
                            message: page.props.flash.error,
                            tag: tagToAssign,
                        });
                    } else {
                        const updatedItem: RFIDInventoryItem = {
                            ...targetItem,
                            rfid_tag: tagToAssign,
                        };
                        dispatch({
                            type: 'ASSIGN_SUCCESS',
                            item: updatedItem,
                            tag: tagToAssign,
                            nextItem: nextUntagged,
                        });
                    }
                },
                onError: (errors) => {
                    const message = Object.values(errors).flat().join('\n') || 'Failed to assign RFID tag.';
                    dispatch({
                        type: 'SET_ERROR',
                        message,
                        tag: tagToAssign,
                    });
                },
            }
        );
    }, [state, items]);

    // Unassigns an active RFID tag
    const unassignTag = useCallback(
        (onFinished?: () => void) => {
            const currentItem = 'item' in state ? state.item : null;
            if (!currentItem || !currentItem.rfid_tag) return;

            const previousTag = currentItem.rfid_tag;
            const targetItem = currentItem;

            router.post(
                route('rfid-scanner.unassign'),
                {
                    item_id: targetItem.id,
                },
                {
                    preserveScroll: true,
                    onFinish: () => {
                        if (onFinished) onFinished();
                    },
                    onSuccess: () => {
                        const updatedItem: RFIDInventoryItem = {
                            ...targetItem,
                            rfid_tag: null,
                        };
                        dispatch({
                            type: 'UNASSIGN_SUCCESS',
                            item: updatedItem,
                            previousTag,
                        });
                    },
                    onError: (errors) => {
                        const message = Object.values(errors).flat().join('\n') || 'Failed to unassign RFID tag.';
                        dispatch({
                            type: 'SET_ERROR',
                            message,
                        });
                    },
                }
            );
        },
        [state]
    );

    // Navigates to the next untagged item
    const selectNextUntaggedItem = useCallback(() => {
        const currentItemId = 'item' in state ? state.item?.id : null;
        const nextUntagged = items.find((i) => !i.rfid_tag && i.id !== currentItemId);
        if (nextUntagged) {
            selectItem(nextUntagged);
        }
    }, [items, state, selectItem]);

    const retryAssign = useCallback(() => {
        dispatch({ type: 'RETRY_ASSIGN' });
    }, []);

    return {
        state,
        selectedItem: 'item' in state ? state.item ?? null : null,
        selectItem,
        handleScan,
        assignTag,
        unassignTag,
        resetScanner,
        selectNextUntaggedItem,
        retryAssign,
    };
}
