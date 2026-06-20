import { createContext, useContext } from 'react';
import type { UseProductsReturn } from '../hooks/useProducts';

export const ProductsContext = createContext<UseProductsReturn | null>(null);

export const useProductsContext = (): UseProductsReturn => {
    const context = useContext(ProductsContext);
    if (!context) {
        throw new Error('useProductsContext must be used within a ProductsProvider');
    }
    return context;
};
