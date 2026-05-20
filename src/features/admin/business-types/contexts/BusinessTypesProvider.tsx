import { type ReactNode } from 'react';
import { BusinessTypesContext } from './BusinessTypesContext';
import type { UseBusinessTypesReturn } from '../hooks/useBusinessTypes';

interface BusinessTypesProviderProps {
    children: ReactNode;
    value: UseBusinessTypesReturn;
}

export const BusinessTypesProvider = ({ children, value }: BusinessTypesProviderProps) => {
    return (
        <BusinessTypesContext.Provider value={value}>
            {children}
        </BusinessTypesContext.Provider>
    );
};