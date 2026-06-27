import { type ReactNode } from 'react';
import { StoreUsersContext } from './StoreUsersContext';
import type { UseStoreUsersReturn } from '../hooks/useStoreUsers';

interface StoreUsersProviderProps {
    children: ReactNode;
    value: UseStoreUsersReturn;
}

export const StoreUsersProvider = ({ children, value }: StoreUsersProviderProps) => {
    return (
        <StoreUsersContext.Provider value={value}>
            {children}
        </StoreUsersContext.Provider>
    );
};
