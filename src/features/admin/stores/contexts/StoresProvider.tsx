import { type ReactNode } from 'react';
import { StoresContext } from './StoresContext';
import type { UseStoresReturn } from '../hooks/useStores';

interface StoresProviderProps {
    children: ReactNode;
    value: UseStoresReturn;
}

export const StoresProvider = ({ children, value }: StoresProviderProps) => {
    return (
        <StoresContext.Provider value={value}>
            {children}
        </StoresContext.Provider>
    );
};