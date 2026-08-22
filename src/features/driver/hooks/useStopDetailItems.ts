import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { StopDetailItem, RouteStopStatus } from '../interfaces/driver.interface';
import type { RejectionReason } from '../services/driver.service';

// ── Types ────────────────────────────────────────────────────────────────────────

export interface UseStopDetailItemsOptions {
    stopId: string | undefined;
    items: StopDetailItem[] | undefined;
    rejectionReasons: RejectionReason[];
    stopStatus: RouteStopStatus | undefined;
    completing: boolean;
}

export interface StopItem {
    item: StopDetailItem;
    originalQty: number;
    deliveredQty: number;
    isComplete: boolean;
    isReduced: boolean;
    isNotLoaded: boolean;
    isConfirmed: boolean;
    hasValidReason: boolean;
    showReasonError: boolean;
    cardState: 'confirmed' | 'reduced' | 'pending' | 'not_loaded';
    canDecrement: boolean;
    canIncrement: boolean;
}

export interface UseStopDetailItemsReturn {
    // State snapshots for view
    quantitiesDelivered: Record<string, number>;
    rejectionReasonsByItem: Record<string, string>;
    touchedItemIds: Set<string>;
    touchedReasonIds: Set<string>;
    confirmedIds: Set<string>;
    submitAttempted: boolean;

    // Derived
    progressCount: { completed: number; total: number };
    canConfirm: boolean;
    canDeliver: boolean;
    deliveryState: {
        allFull: boolean;
        hasReductions: boolean;
        missingReasons: boolean;
    };
    isAllReviewed: boolean;
    reasonOptions: Array<{ label: string; value: string }>;

    // Per-item helpers
    getItem: (itemId: string) => StopItem | undefined;

    // Actions
    setQuantity: (itemId: string, value: number) => void;
    toggleConfirm: (itemId: string) => void;
    setRejectionReason: (itemId: string, reasonId: string | undefined) => void;
    markReasonTouched: (itemId: string) => void;
    resetAllItemState: () => void;
}

// ── Hook ────────────────────────────────────────────────────────────────────────

export const useStopDetailItems = (options: UseStopDetailItemsOptions): UseStopDetailItemsReturn => {
    const { items, rejectionReasons, stopStatus, completing } = options;

    // ── State ──────────────────────────────────────────────────────────────
    const [quantitiesDelivered, setQuantitiesDelivered] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {};
        if (items) {
            items.forEach((item) => {
                // quantity_loaded = 0 items stay at 0 (not loaded in depot — never editable)
                initial[item.id] = item.quantity_loaded;
            });
        }
        return initial;
    });

    const [rejectionReasonsByItem, setRejectionReasonsByItem] = useState<Record<string, string>>({});
    const [touchedItemIds, setTouchedItemIds] = useState<Set<string>>(new Set());
    const [touchedReasonIds, setTouchedReasonIds] = useState<Set<string>>(new Set());
    const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
    const [submitAttempted, setSubmitAttempted] = useState(false);

    // Track previous item IDs for reset on stop change
    const prevItemIdsRef = useRef<Set<string>>(new Set());

    // ── Effects ────────────────────────────────────────────────────────────

    // Sync quantities when items change (new stop loaded)
    useEffect(() => {
        if (!items) return;
        setQuantitiesDelivered((prev) => {
            const next = { ...prev };
            let hasNewItems = false;
            items.forEach((item) => {
                if (!(item.id in next)) {
                    // quantity_loaded = 0 items stay at 0 (not loaded in depot — never editable)
                    next[item.id] = item.quantity_loaded;
                    hasNewItems = true;
                }
            });
            return hasNewItems ? next : prev;
        });
    }, [items]);

    // Reset all item state when the set of items changes (navigating between stops)
    useEffect(() => {
        if (!items) return;
        const currentItemIds = new Set(items.map((item) => item.id));
        const idsChanged =
            currentItemIds.size !== prevItemIdsRef.current.size ||
            [...currentItemIds].some((id) => !prevItemIdsRef.current.has(id));

        if (idsChanged) {
            prevItemIdsRef.current = currentItemIds;
            // Skip on initial mount (prev set is empty)
            if (prevItemIdsRef.current.size > 0) {
                setConfirmedIds(new Set());
                setRejectionReasonsByItem({});
                setTouchedItemIds(new Set());
                setTouchedReasonIds(new Set());
                setSubmitAttempted(false);
            }
        }
    }, [items]);

    // ── Derived values ─────────────────────────────────────────────────────

    const reasonOptions = useMemo(
        () => rejectionReasons.map((r) => ({ label: r.label, value: r.id })),
        [rejectionReasons]
    );

    const deliveryState = useMemo(() => {
        if (!items) return { allFull: true, hasReductions: false, missingReasons: false };
        let hasReductions = false;
        let missingReasons = false;

        items.forEach((item) => {
            // quantity_loaded = 0 items are "not loaded" — not a reduction, no reason needed
            if (item.quantity_loaded === 0) return;

            const delivered = quantitiesDelivered[item.id] ?? item.quantity_loaded;
            if (delivered < item.quantity_loaded) {
                hasReductions = true;
                if (!rejectionReasonsByItem[item.id]) {
                    missingReasons = true;
                }
            }
        });

        return { allFull: !hasReductions, hasReductions, missingReasons };
    }, [items, quantitiesDelivered, rejectionReasonsByItem]);

    const progressCount = useMemo(() => {
        if (!items) return { completed: 0, total: 0 };
        const total = items.length;
        let completed = 0;

        items.forEach((item) => {
            // quantity_loaded = 0 items auto-count as "reviewed" — no action needed
            if (item.quantity_loaded === 0) {
                completed++;
                return;
            }

            const delivered = quantitiesDelivered[item.id] ?? item.quantity_loaded;
            const isComplete = delivered === item.quantity_loaded;
            const isReduced = delivered < item.quantity_loaded;
            const hasValidReason =
                isReduced &&
                !!rejectionReasonsByItem[item.id] &&
                reasonOptions.some((r) => r.value === rejectionReasonsByItem[item.id]);

            if ((isComplete && confirmedIds.has(item.id)) || (isReduced && hasValidReason)) {
                completed++;
            }
        });

        return { completed, total };
    }, [items, quantitiesDelivered, rejectionReasonsByItem, reasonOptions, confirmedIds]);

    const canConfirm = useMemo(() => {
        if (!items || items.length === 0) return false;
        for (const item of items) {
            // quantity_loaded = 0 items are always valid — "not loaded", not our problem
            if (item.quantity_loaded === 0) continue;

            const delivered = quantitiesDelivered[item.id] ?? item.quantity_loaded;
            const isComplete = delivered === item.quantity_loaded;
            const isReduced = delivered < item.quantity_loaded;

            if (isComplete && !confirmedIds.has(item.id)) return false;
            if (isReduced && !rejectionReasonsByItem[item.id]) return false;
        }
        return true;
    }, [items, quantitiesDelivered, rejectionReasonsByItem, confirmedIds]);

    const canDeliver = !(stopStatus === 'completed' || stopStatus === 'failed' || stopStatus === 'cancelled' || completing);

    const isAllReviewed = progressCount.completed === progressCount.total && progressCount.total > 0;

    // ── Per-item helpers ───────────────────────────────────────────────────

    const getItem = useCallback(
        (itemId: string): StopItem | undefined => {
            if (!items) return undefined;
            const item = items.find((i) => i.id === itemId);
            if (!item) return undefined;

            const isNotLoaded = item.quantity_loaded === 0;
            const originalQty = item.quantity_loaded > 0 ? item.quantity_loaded : item.quantity_planned;
            const deliveredQty = isNotLoaded ? 0 : (quantitiesDelivered[itemId] ?? originalQty);
            const isReduced = !isNotLoaded && deliveredQty < originalQty;
            const isComplete = !isNotLoaded && deliveredQty === originalQty;
            const isConfirmed = confirmedIds.has(itemId);
            const hasValidReason =
                isReduced &&
                !!rejectionReasonsByItem[itemId] &&
                reasonOptions.some((r) => r.value === rejectionReasonsByItem[itemId]);
            const showReasonError =
                isReduced && (submitAttempted || touchedReasonIds.has(itemId)) && !rejectionReasonsByItem[itemId];

            let cardState: 'confirmed' | 'reduced' | 'pending' | 'not_loaded' = 'pending';
            if (isNotLoaded) {
                cardState = 'not_loaded';
            } else if (isReduced) {
                cardState = 'reduced';
            } else if (isComplete && isConfirmed) {
                cardState = 'confirmed';
            } else if (isComplete) {
                cardState = 'pending';
            }

            // quantity_loaded = 0 items are never editable
            const canDecrement = canDeliver && !isNotLoaded && deliveredQty > 0;
            const canIncrement = canDeliver && !isNotLoaded && deliveredQty < originalQty;

            return {
                item,
                originalQty,
                deliveredQty,
                isComplete,
                isReduced,
                isNotLoaded,
                isConfirmed,
                hasValidReason,
                showReasonError,
                cardState,
                canDecrement,
                canIncrement,
            };
        },
        [items, quantitiesDelivered, rejectionReasonsByItem, confirmedIds, reasonOptions, submitAttempted, touchedReasonIds, canDeliver]
    );

    // ── Actions ────────────────────────────────────────────────────────────

    const setQuantity = useCallback((itemId: string, value: number) => {
        // quantity_loaded = 0 items are never editable
        if (items?.find((i) => i.id === itemId)?.quantity_loaded === 0) return;

        // Reset confirmation when quantity changes
        setConfirmedIds((prev) => {
            const next = new Set(prev);
            next.delete(itemId);
            return next;
        });
        setTouchedItemIds((prev) => new Set([...prev, itemId]));
        setQuantitiesDelivered((prev) => ({
            ...prev,
            [itemId]: value,
        }));
    }, [items]);

    const toggleConfirm = useCallback(
        (itemId: string) => {
            if (!items) return;
            const item = items.find((i) => i.id === itemId);
            if (!item) return;
            // quantity_loaded = 0 items are not loaded — no check applies
            if (item.quantity_loaded === 0) return;
            const delivered = quantitiesDelivered[itemId] ?? item.quantity_loaded;
            if (delivered < item.quantity_loaded) return; // only for complete items

            setConfirmedIds((prev) => {
                const next = new Set(prev);
                if (next.has(itemId)) {
                    next.delete(itemId);
                } else {
                    next.add(itemId);
                }
                return next;
            });
        },
        [items, quantitiesDelivered]
    );

    const setRejectionReason = useCallback((itemId: string, reasonId: string | undefined) => {
        setTouchedReasonIds((prev) => new Set([...prev, itemId]));
        setRejectionReasonsByItem((prev) => {
            const next = { ...prev };
            if (reasonId) {
                next[itemId] = reasonId;
            } else {
                delete next[itemId];
            }
            return next;
        });
    }, []);

    const markReasonTouched = useCallback((itemId: string) => {
        setTouchedReasonIds((prev) => new Set([...prev, itemId]));
    }, []);

    const resetAllItemState = useCallback(() => {
        setConfirmedIds(new Set());
        setRejectionReasonsByItem({});
        setTouchedItemIds(new Set());
        setTouchedReasonIds(new Set());
        setSubmitAttempted(false);
    }, []);

    return {
        quantitiesDelivered,
        rejectionReasonsByItem,
        touchedItemIds,
        touchedReasonIds,
        confirmedIds,
        submitAttempted,
        progressCount,
        canConfirm,
        canDeliver,
        deliveryState,
        isAllReviewed,
        reasonOptions,
        getItem,
        setQuantity,
        toggleConfirm,
        setRejectionReason,
        markReasonTouched,
        resetAllItemState,
    };
};
