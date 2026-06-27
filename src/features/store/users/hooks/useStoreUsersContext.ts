import { useContext } from 'react';
import { StoreUsersContext } from '../contexts/StoreUsersContext';

export const useStoreUsersContext = () => {
    const context = useContext(StoreUsersContext);
    if (!context) {
        throw new Error('useStoreUsersContext must be used within a StoreUsersProvider');
    }
    return context;
};
