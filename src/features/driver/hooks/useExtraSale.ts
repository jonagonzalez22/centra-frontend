import { useState, useCallback, useMemo } from 'react';
import { message } from 'antd';
import { DriverService } from '../services/driver.service';
import type { SurplusProduct } from '../interfaces/driver.interface';
import type { ApiError } from '@/interfaces/ApiErrors.interface';
import type { DecimalString } from '@/types/decimal';
import {
    addDecimalStrings,
    compareDecimalStrings,
    isPositiveDecimal,
    minDecimalStrings,
    normalizeDecimalString,
} from '@/utils/quantity';

export interface UseExtraSaleReturn {
    surplusProducts: SurplusProduct[];
    loadingSurplus: boolean;
    submitting: boolean;
    selectedQuantities: Record<string, DecimalString>;
    searchQuery: string;
    filteredProducts: SurplusProduct[];
    summary: {
        totalUnits: number;
        totalProducts: number;
        totalAmount: number;
    };
    isValid: boolean;
    loadSurplus: (routeId: string) => Promise<void>;
    setQuantity: (productId: string, quantity: DecimalString) => void;
    changeQuantity: (productId: string, delta: number) => void;
    setSearchQuery: (query: string) => void;
    submitExtraSale: (stopId: string) => Promise<void>;
    resetSelections: () => void;
}

export const useExtraSale = (): UseExtraSaleReturn => {
    const [surplusProducts, setSurplusProducts] = useState<SurplusProduct[]>([]);
    const [loadingSurplus, setLoadingSurplus] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedQuantities, setSelectedQuantities] = useState<Record<string, DecimalString>>({});
    const [searchQuery, setSearchQuery] = useState('');

    const loadSurplus = useCallback(async (routeId: string) => {
        try {
            setLoadingSurplus(true);
            const products = await DriverService.getAvailableSurplus(routeId);
            setSurplusProducts(products);
            setSelectedQuantities({});
            setSearchQuery('');
        } catch (err) {
            const apiError = err as ApiError;
            message.error(apiError.message || 'Error al cargar productos disponibles.');
        } finally {
            setLoadingSurplus(false);
        }
    }, []);

    const setQuantity = useCallback((productId: string, quantity: DecimalString) => {
        setSelectedQuantities((prev) => {
            const product = surplusProducts.find((p) => p.product_id === productId);
            const max = product?.available_quantity ?? '0.0000';
            const normalized = normalizeDecimalString(quantity);
            const clamped = minDecimalStrings(normalized, max);
            if (!isPositiveDecimal(clamped)) {
                const next = { ...prev };
                delete next[productId];
                return next;
            }
            return { ...prev, [productId]: clamped };
        });
    }, [surplusProducts]);

    const changeQuantity = useCallback((productId: string, delta: number) => {
        setSelectedQuantities((prev) => {
            const current = prev[productId] ?? '0.0000';
            const product = surplusProducts.find((p) => p.product_id === productId);
            const max = product?.available_quantity ?? '0.0000';
            const next = addDecimalStrings(current, String(delta));
            const clamped = minDecimalStrings(
                compareDecimalStrings(next, '0.0000') < 0 ? '0.0000' : next,
                max
            );
            if (!isPositiveDecimal(clamped)) {
                const result = { ...prev };
                delete result[productId];
                return result;
            }
            return { ...prev, [productId]: clamped };
        });
    }, [surplusProducts]);

    const filteredProducts = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return surplusProducts;
        return surplusProducts.filter(
            (p) =>
                p.product_name.toLowerCase().includes(q) ||
                p.sku.toLowerCase().includes(q)
        );
    }, [surplusProducts, searchQuery]);

    const summary = useMemo(() => {
        let totalUnits = 0;
        let totalProducts = 0;
        let totalAmount = 0;
        for (const [productId, qty] of Object.entries(selectedQuantities)) {
            if (!isPositiveDecimal(qty)) continue;
            totalUnits += Number(qty);
            totalProducts += 1;
            const product = surplusProducts.find((p) => p.product_id === productId);
            if (product) {
                // Sólo preview monetario: el backend recalcula el total autoritativo.
                totalAmount += Number(qty) * product.unit_price;
            }
        }
        return { totalUnits, totalProducts, totalAmount };
    }, [selectedQuantities, surplusProducts]);

    const isValid = summary.totalUnits > 0;

    const submitExtraSale = useCallback(async (stopId: string) => {
        if (!isValid) return;
        const items = Object.entries(selectedQuantities)
            .filter(([, qty]) => isPositiveDecimal(qty))
            .map(([product_id, quantity]) => ({ product_id, quantity }));

        try {
            setSubmitting(true);
            await DriverService.addExtraSale(stopId, { items });
            message.success('Venta extra agregada correctamente.');
            setSelectedQuantities({});
            setSearchQuery('');
        } catch (err) {
            const apiError = err as ApiError;
            message.error(apiError.message || 'Error al registrar la venta extra.');
            throw err;
        } finally {
            setSubmitting(false);
        }
    }, [isValid, selectedQuantities]);

    const resetSelections = useCallback(() => {
        setSelectedQuantities({});
        setSearchQuery('');
    }, []);

    return {
        surplusProducts,
        loadingSurplus,
        submitting,
        selectedQuantities,
        searchQuery,
        filteredProducts,
        summary,
        isValid,
        loadSurplus,
        setQuantity,
        changeQuantity,
        setSearchQuery,
        submitExtraSale,
        resetSelections,
    };
};
