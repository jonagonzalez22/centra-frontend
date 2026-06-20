import type { ReactNode } from 'react';
import { ProductsContext } from './ProductsContext';
import type { UseProductsReturn } from '../hooks/useProducts';

interface ProductsProviderProps {
    children: ReactNode;
    value: UseProductsReturn;
}

export const ProductsProvider = ({ children, value }: ProductsProviderProps) => {
    return (
        <ProductsContext.Provider value={value}>
            {children}
        </ProductsContext.Provider>
    );
};
