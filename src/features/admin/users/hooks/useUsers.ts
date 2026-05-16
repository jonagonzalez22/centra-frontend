import { useState, useCallback, useEffect, useRef } from 'react';
import { message } from 'antd';
import { UsersService } from '../services/users.service';
import type { User } from '@/entities/User';
import type { UsersFilters, UsersFilterOptions } from '../types/user.types';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

interface UsersPagination {
    current: number;
    total: number;
    pageSize: number;
}

export interface UseUsersReturn {
    users: User[];
    loading: boolean;
    error: string | null;
    pagination: UsersPagination;
    refetch: (filters?: UsersFilters) => void;
    deleteUser: (id: number) => Promise<void>;
    filterOptions: UsersFilterOptions | null;
    filterOptionsLoading: boolean;
}

const getErrorMessage = (err: unknown, fallback: string): string => {
    if (err && typeof err === 'object') {
        if ('message' in err && typeof (err as { message: unknown }).message === 'string') {
            return (err as { message: string }).message;
        }
        if ('data' in err && (err as { data?: { message?: string } }).data?.message) {
            return (err as { data: { message: string } }).data.message;
        }
    }
    return fallback;
};

export const useUsers = (storeId?: string): UseUsersReturn => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<UsersPagination>({
        current: 1,
        total: 0,
        pageSize: 15,
    });
    const [filterOptions, setFilterOptions] = useState<UsersFilterOptions | null>(null);
    const [filterOptionsLoading, setFilterOptionsLoading] = useState<boolean>(true);
    const currentPageRef = useRef(1);

    const fetchFilterOptions = useCallback(async () => {
        setFilterOptionsLoading(true);
        try {
            const options = await UsersService.getFilterOptions();
            setFilterOptions(options);
        } catch (err) {
            const apiError = err as ApiError;
            const errorMessage = getErrorMessage(apiError, 'Error al cargar opciones de filtro');
            setError(errorMessage);
            message.error(errorMessage);
        } finally {
            setFilterOptionsLoading(false);
        }
    }, []);

    const fetchUsers = useCallback(async (filters: UsersFilters = {}) => {
        try {
            setLoading(true);
            setError(null);
            const apiFilters = storeId ? { store_id: storeId, ...filters } : filters;
            const response = await UsersService.getUsers(apiFilters);
            setUsers(response.items);
            currentPageRef.current = response.current_page;
            setPagination((prev) => ({
                ...prev,
                current: response.current_page,
                total: response.total,
            }));
        } catch (err) {
            const apiError = err as ApiError;
            const errorMessage = apiError.message || 'Error al cargar los usuarios.';
            setError(errorMessage);
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [storeId]);

    const refetch = useCallback(
        (filters?: UsersFilters) => {
            fetchUsers({ page: 1, ...filters });
            fetchFilterOptions();
        },
        [fetchUsers, fetchFilterOptions]
    );

    const deleteUser = useCallback(
        async (id: number) => {
            try {
                await UsersService.delete(id);
                message.success('Usuario eliminado correctamente.');
                fetchUsers({ page: currentPageRef.current });
            } catch (err) {
                const apiError = err as ApiError;
                message.error(apiError.message || 'Error al eliminar el usuario.');
                throw err;
            }
        },
        [fetchUsers]
    );

    useEffect(() => {
        fetchUsers({ page: 1 });
        fetchFilterOptions();
    }, [fetchUsers, fetchFilterOptions]);

    return { users, loading, error, pagination, refetch, deleteUser, filterOptions, filterOptionsLoading };
};