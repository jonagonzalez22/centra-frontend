import { useState, useCallback, useEffect, useRef } from 'react';
import { message } from 'antd';
import { UsersService } from '../services/users.service';
import type { User } from '@/entities/User';
import type { UsersFilters } from '../types/user.types';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

interface UsersPagination {
    current: number;
    total: number;
    pageSize: number;
}

interface UseUsersReturn {
    users: User[];
    loading: boolean;
    error: string | null;
    pagination: UsersPagination;
    refetch: (filters?: UsersFilters) => void;
    deleteUser: (id: number) => Promise<void>;
}

export const useUsers = (storeId: string): UseUsersReturn => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<UsersPagination>({
        current: 1,
        total: 0,
        pageSize: 15,
    });
    const currentPageRef = useRef(1);

    const fetchUsers = useCallback(async (filters: UsersFilters = {}) => {
        if (!storeId) return;

        try {
            setLoading(true);
            setError(null);
            const response = await UsersService.getUsers({ store_id: storeId, ...filters });
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
        },
        [fetchUsers]
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
    }, [fetchUsers]);

    return { users, loading, error, pagination, refetch, deleteUser };
};