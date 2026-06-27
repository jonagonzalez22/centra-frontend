import { useState, useCallback, useEffect, useRef } from 'react';
import { message } from 'antd';
import { StoreUsersService } from '../services/storeUsers.service';
import type { User } from '@/entities/User';
import type { StoreUsersFilters, StoreUsersFilterOptions } from '../types/storeUser.types';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

interface StoreUsersPagination {
    current: number;
    total: number;
    pageSize: number;
}

export interface UseStoreUsersReturn {
    users: User[];
    loading: boolean;
    error: string | null;
    pagination: StoreUsersPagination;
    refetch: (filters?: StoreUsersFilters) => void;
    deleteUser: (id: number) => Promise<void>;
    toggleActive: (id: number, isActive: boolean) => Promise<void>;
    filterOptions: StoreUsersFilterOptions | null;
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

export const useStoreUsers = (): UseStoreUsersReturn => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<StoreUsersPagination>({
        current: 1,
        total: 0,
        pageSize: 15,
    });
    const [filterOptions, setFilterOptions] = useState<StoreUsersFilterOptions | null>(null);
    const [filterOptionsLoading, setFilterOptionsLoading] = useState<boolean>(true);
    const currentPageRef = useRef(1);

    const fetchFilterOptions = useCallback(async () => {
        setFilterOptionsLoading(true);
        try {
            const options = await StoreUsersService.getFilterOptions();
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

    const fetchUsers = useCallback(async (filters: StoreUsersFilters = {}) => {
        try {
            setLoading(true);
            setError(null);
            const response = await StoreUsersService.getAll(filters);
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
    }, []);

    const refetch = useCallback(
        (filters?: StoreUsersFilters) => {
            fetchUsers({ page: 1, ...filters });
            fetchFilterOptions();
        },
        [fetchUsers, fetchFilterOptions]
    );

    const deleteUser = useCallback(
        async (id: number) => {
            try {
                await StoreUsersService.delete(id);
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

    const toggleActive = useCallback(
        async (id: number, isActive: boolean) => {
            try {
                await StoreUsersService.update(id, { is_active: !isActive });
                message.success(
                    isActive
                        ? 'Usuario desactivado correctamente.'
                        : 'Usuario activado correctamente.'
                );
                fetchUsers({ page: currentPageRef.current });
            } catch (err) {
                const apiError = err as ApiError;
                message.error(apiError.message || 'Error al cambiar el estado del usuario.');
                throw err;
            }
        },
        [fetchUsers]
    );

    useEffect(() => {
        fetchUsers({ page: 1 });
        fetchFilterOptions();
    }, [fetchUsers, fetchFilterOptions]);

    return {
        users,
        loading,
        error,
        pagination,
        refetch,
        deleteUser,
        toggleActive,
        filterOptions,
        filterOptionsLoading,
    };
};
