import { useState, useCallback, useMemo } from 'react';
import { message } from 'antd';
import { DriverService } from '../services/driver.service';
import type { SurplusProduct } from '../interfaces/driver.interface';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

export interface UseExtraSaleReturn {
    surplusProducts: SurplusProduct[];
    loadingSurplus: boolean;
    submitting: boolean;
    selectedQuantities: Record<string, number>;
    searchQuery: string;
    filteredProducts: SurplusProduct[];
    summary: {
        totalUnits: number;
        totalProducts: number;
        totalAmount: number;
    };
    isValid: boolean;
    loadSurplus: (routeId: string) => Promise<void>;
    setQuantity: (productId: string, quantity: number) => void;
    changeQuantity: (productId: string, delta: number) => void;
    setSearchQuery: (query: string) => void;
    submitExtraSale: (stopId: string) => Promise<void>;
    resetSelections: () => void;
}

export const useExtraSale = (): UseExtraSaleReturn => {
    const [surplusProducts, setSurplusProducts] = useState<SurplusProduct[]>([]);
    const [loadingSurplus, setLoadingSurplus] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
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

    const setQuantity = useCallback((productId: string, quantity: number) => {
        setSelectedQuantities((prev) => {
            const product = surplusProducts.find((p) => p.product_id === productId);
            const max = product?.available_quantity ?? 0;
            const clamped = Math.max(0, Math.min(quantity, max));
            if (clamped === 0) {
                const next = { ...prev };
                delete next[productId];
                return next;
            }
            return { ...prev, [productId]: clamped };
        });
    }, [surplusProducts]);

    const changeQuantity = useCallback((productId: string, delta: number) => {
        setSelectedQuantities((prev) => {
            const current = prev[productId] ?? 0;
            const product = surplusProducts.find((p) => p.product_id === productId);
            const max = product?.available_quantity ?? 0;
            const next = current + delta;
            const clamped = Math.max(0, Math.min(next, max));
            if (clamped === 0) {
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
            if (qty <= 0) continue;
            totalUnits += qty;
            totalProducts += 1;
            const product = surplusProducts.find((p) => p.product_id === productId);
            if (product) {
                totalAmount += qty * product.unit_price;
            }
        }
        return { totalUnits, totalProducts, totalAmount };
    }, [selectedQuantities, surplusProducts]);

    const isValid = summary.totalUnits > 0;

    const submitExtraSale = useCallback(async (stopId: string) => {
        if (!isValid) return;
        const items = Object.entries(selectedQuantities)
            .filter(([, qty]) => qty > 0)
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
