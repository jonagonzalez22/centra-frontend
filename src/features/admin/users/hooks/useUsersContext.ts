import { useContext } from 'react';
import { UsersContext } from '../contexts/UsersContext';

export const useUsersContext = () => {
    const context = useContext(UsersContext);
    if (!context) {
        throw new Error('useUsersContext must be used within a UsersProvider');
    }
    return context;
};