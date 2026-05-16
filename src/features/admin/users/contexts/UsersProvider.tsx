import { type ReactNode } from 'react';
import { UsersContext } from './UsersContext';
import type { UseUsersReturn } from '../hooks/useUsers';

interface UsersProviderProps {
    children: ReactNode;
    value: UseUsersReturn;
}

export const UsersProvider = ({ children, value }: UsersProviderProps) => {
    return (
        <UsersContext.Provider value={value}>
            {children}
        </UsersContext.Provider>
    );
};