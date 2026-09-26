import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { StopDetailItem, RouteStopStatus } from '../interfaces/driver.interface';
import type { RejectionReason } from '../services/driver.service';
import type { DecimalString } from '@/types/decimal';
import { compareDecimalStrings, minDecimalStrings, normalizeDecimalString, subtractDecimalStrings } from '@/utils/quantity';

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
    originalQty: DecimalString;
    deliveredQty: DecimalString;
    remainingQty: DecimalString;
    releasedQty: DecimalString;
    isComplete: boolean;
    isReduced: boolean;
    isNotLoaded: boolean;
    isConfirmed: boolean;
    hasValidReason: boolean;
    showReasonError: boolean;
    cardState: 'confirmed' | 'reduced' | 'pending' | 'not_loaded';
    canDecrement: boolean;
    canIncrement: boolean;
    canDecrementReleased: boolean;
    canIncrementReleased: boolean;
    selectedReasonSuggestsExtraSale: boolean;
}

export interface UseStopDetailItemsReturn {
    // State snapshots for view
    quantitiesDelivered: Record<string, DecimalString>;
    quantitiesReleased: Record<string, DecimalString>;
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
    setQuantity: (itemId: string, value: DecimalString | number) => void;
    setReleasedQuantity: (itemId: string, value: DecimalString | number) => void;
    toggleConfirm: (itemId: string) => void;
    setRejectionReason: (itemId: string, reasonId: string | undefined) => void;
    markReasonTouched: (itemId: string) => void;
    resetAllItemState: () => void;
}

// ── Hook ────────────────────────────────────────────────────────────────────────

export const useStopDetailItems = (
    options: UseStopDetailItemsOptions
): UseStopDetailItemsReturn => {
    const { items, rejectionReasons, stopStatus, completing } = options;

    // ── State ──────────────────────────────────────────────────────────────
    const [quantitiesDelivered, setQuantitiesDelivered] = useState<Record<string, DecimalString>>(() => {
        const initial: Record<string, DecimalString> = {};
        if (items) {
            items.forEach((item) => {
                // quantity_loaded = 0 items stay at 0 (not loaded in depot — never editable)
                initial[item.id] = item.quantity_loaded;
            });
        }
        return initial;
    });

    const [rejectionReasonsByItem, setRejectionReasonsByItem] = useState<Record<string, string>>(
        {}
    );
    const [quantitiesReleased, setQuantitiesReleased] = useState<Record<string, DecimalString>>({});
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
                setQuantitiesReleased({});
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
            if (compareDecimalStrings(item.quantity_loaded, '0.0000') === 0) return;

            const delivered = quantitiesDelivered[item.id] ?? item.quantity_loaded;
            if (compareDecimalStrings(delivered, item.quantity_loaded) < 0) {
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
            if (compareDecimalStrings(item.quantity_loaded, '0.0000') === 0) {
                completed++;
                return;
            }

            const delivered = quantitiesDelivered[item.id] ?? item.quantity_loaded;
            const isComplete = compareDecimalStrings(delivered, item.quantity_loaded) === 0;
            const isReduced = compareDecimalStrings(delivered, item.quantity_loaded) < 0;
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
            if (compareDecimalStrings(item.quantity_loaded, '0.0000') === 0) continue;

            const delivered = quantitiesDelivered[item.id] ?? item.quantity_loaded;
            const isComplete = compareDecimalStrings(delivered, item.quantity_loaded) === 0;
            const isReduced = compareDecimalStrings(delivered, item.quantity_loaded) < 0;

            if (isComplete && !confirmedIds.has(item.id)) return false;
            if (isReduced && !rejectionReasonsByItem[item.id]) return false;
        }
        return true;
    }, [items, quantitiesDelivered, rejectionReasonsByItem, confirmedIds]);

    const canDeliver = !(
        stopStatus === 'completed' ||
        stopStatus === 'failed' ||
        stopStatus === 'cancelled' ||
        completing
    );

    const isAllReviewed =
        progressCount.completed === progressCount.total && progressCount.total > 0;

    // ── Per-item helpers ───────────────────────────────────────────────────

    const getItem = useCallback(
        (itemId: string): StopItem | undefined => {
            if (!items) return undefined;
            const item = items.find((i) => i.id === itemId);
            if (!item) return undefined;

            const isNotLoaded = compareDecimalStrings(item.quantity_loaded, '0.0000') === 0;
            const originalQty =
                compareDecimalStrings(item.quantity_loaded, '0.0000') > 0 ? item.quantity_loaded : item.quantity_planned;
            const deliveredQty = isNotLoaded ? '0.0000' : (quantitiesDelivered[itemId] ?? originalQty);
            const isReduced = !isNotLoaded && compareDecimalStrings(deliveredQty, originalQty) < 0;
            const remainingQty = compareDecimalStrings(originalQty, deliveredQty) > 0 ? subtractDecimalStrings(originalQty, deliveredQty) : '0.0000';
            const releasedQty = minDecimalStrings(quantitiesReleased[itemId] ?? '0.0000', remainingQty);
            const isComplete = !isNotLoaded && compareDecimalStrings(deliveredQty, originalQty) === 0;
            const isConfirmed = confirmedIds.has(itemId);
            const hasValidReason =
                isReduced &&
                !!rejectionReasonsByItem[itemId] &&
                reasonOptions.some((r) => r.value === rejectionReasonsByItem[itemId]);
            const showReasonError =
                isReduced &&
                (submitAttempted || touchedReasonIds.has(itemId)) &&
                !rejectionReasonsByItem[itemId];

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
            const canDecrement = canDeliver && !isNotLoaded && compareDecimalStrings(deliveredQty, '0.0000') > 0;
            const canIncrement = canDeliver && !isNotLoaded && compareDecimalStrings(deliveredQty, originalQty) < 0;
            const canDecrementReleased = canDeliver && isReduced && compareDecimalStrings(releasedQty, '0.0000') > 0;
            const canIncrementReleased = canDeliver && isReduced && compareDecimalStrings(releasedQty, remainingQty) < 0;
            const selectedReason = rejectionReasons.find(
                (reason) => reason.id === rejectionReasonsByItem[itemId]
            );

            return {
                item,
                originalQty,
                deliveredQty,
                remainingQty,
                releasedQty,
                isComplete,
                isReduced,
                isNotLoaded,
                isConfirmed,
                hasValidReason,
                showReasonError,
                cardState,
                canDecrement,
                canIncrement,
                canDecrementReleased,
                canIncrementReleased,
                selectedReasonSuggestsExtraSale: selectedReason?.suggest_extra_sale ?? false,
            };
        },
        [
            items,
            quantitiesDelivered,
            quantitiesReleased,
            rejectionReasonsByItem,
            confirmedIds,
            reasonOptions,
            rejectionReasons,
            submitAttempted,
            touchedReasonIds,
            canDeliver,
        ]
    );

    // ── Actions ────────────────────────────────────────────────────────────

    const setQuantity = useCallback(
        (itemId: string, value: DecimalString | number) => {
            const normalizedValue = normalizeDecimalString(value);
            // quantity_loaded = 0 items are never editable
            if (items && compareDecimalStrings(items.find((i) => i.id === itemId)?.quantity_loaded ?? '0.0000', '0.0000') === 0) return;

            // Reset confirmation when quantity changes
            setConfirmedIds((prev) => {
                const next = new Set(prev);
                next.delete(itemId);
                return next;
            });
            setTouchedItemIds((prev) => new Set([...prev, itemId]));
            setQuantitiesDelivered((prev) => ({
                ...prev,
                [itemId]: normalizedValue,
            }));
            const item = items?.find((candidate) => candidate.id === itemId);
            if (item) {
                const remaining = compareDecimalStrings(item.quantity_loaded, normalizedValue) > 0
                    ? subtractDecimalStrings(item.quantity_loaded, normalizedValue)
                    : '0.0000';
                setQuantitiesReleased((prev) => ({
                    ...prev,
                    [itemId]: minDecimalStrings(prev[itemId] ?? '0.0000', remaining),
                }));
            }
        },
        [items]
    );

    const setReleasedQuantity = useCallback(
        (itemId: string, value: DecimalString | number) => {
            const item = items?.find((candidate) => candidate.id === itemId);
            if (!item) return;
            const delivered = quantitiesDelivered[itemId] ?? item.quantity_loaded;
            const remaining = compareDecimalStrings(item.quantity_loaded, delivered) > 0
                ? subtractDecimalStrings(item.quantity_loaded, delivered)
                : '0.0000';
            setQuantitiesReleased((prev) => ({
                ...prev,
                [itemId]: minDecimalStrings(
                    compareDecimalStrings(normalizeDecimalString(value), '0.0000') < 0 ? '0.0000' : normalizeDecimalString(value),
                    remaining
                ),
            }));
        },
        [items, quantitiesDelivered]
    );

    const toggleConfirm = useCallback(
        (itemId: string) => {
            if (!items) return;
            const item = items.find((i) => i.id === itemId);
            if (!item) return;
            // quantity_loaded = 0 items are not loaded — no check applies
            if (compareDecimalStrings(item.quantity_loaded, '0.0000') === 0) return;
            const delivered = quantitiesDelivered[itemId] ?? item.quantity_loaded;
            if (compareDecimalStrings(delivered, item.quantity_loaded) < 0) return; // only for complete items

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

    const setRejectionReason = useCallback(
        (itemId: string, reasonId: string | undefined) => {
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
            const item = items?.find((candidate) => candidate.id === itemId);
            const reason = rejectionReasons.find((candidate) => candidate.id === reasonId);
            const delivered = item ? (quantitiesDelivered[itemId] ?? item.quantity_loaded) : '0.0000';
            const remaining = item && compareDecimalStrings(item.quantity_loaded, delivered) > 0
                ? subtractDecimalStrings(item.quantity_loaded, delivered)
                : '0.0000';
            setQuantitiesReleased((prev) => ({
                ...prev,
                [itemId]: reason?.suggest_extra_sale ? remaining : '0.0000',
            }));
        },
        [items, quantitiesDelivered, rejectionReasons]
    );

    const markReasonTouched = useCallback((itemId: string) => {
        setTouchedReasonIds((prev) => new Set([...prev, itemId]));
    }, []);

    const resetAllItemState = useCallback(() => {
        setConfirmedIds(new Set());
        setRejectionReasonsByItem({});
        setQuantitiesReleased({});
        setTouchedItemIds(new Set());
        setTouchedReasonIds(new Set());
        setSubmitAttempted(false);
    }, []);

    return {
        quantitiesDelivered,
        quantitiesReleased,
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
        setReleasedQuantity,
        toggleConfirm,
        setRejectionReason,
        markReasonTouched,
        resetAllItemState,
    };
};
