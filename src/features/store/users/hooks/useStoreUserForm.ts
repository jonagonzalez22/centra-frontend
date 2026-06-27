import { useState, useCallback } from 'react';
import { message } from 'antd';
import { StoreUsersService } from '../services/storeUsers.service';
import type { CreateStoreUserDto, UpdateStoreUserDto } from '../types/storeUser.types';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

interface UseStoreUserFormReturn {
    loading: boolean;
    createUser: (data: CreateStoreUserDto) => Promise<void>;
    updateUser: (id: number, data: UpdateStoreUserDto) => Promise<void>;
}

interface UseStoreUserFormOptions {
    onSuccess?: () => void;
    onError?: (errors: Record<string, string[]>) => void;
}

export const useStoreUserForm = (options?: UseStoreUserFormOptions): UseStoreUserFormReturn => {
    const { onSuccess, onError } = options ?? {};
    const [loading, setLoading] = useState(false);

    const createUser = useCallback(
        async (data: CreateStoreUserDto) => {
            setLoading(true);
            try {
                await StoreUsersService.create(data);
                message.success('Usuario creado correctamente.');
                onSuccess?.();
            } catch (err) {
                const apiError = err as ApiError;
                if (apiError.errors) {
                    message.error(apiError.message);
                    onError?.(apiError.errors);
                    throw err;
                } else {
                    message.error(apiError.message || 'Error al crear el usuario.');
                }
            } finally {
                setLoading(false);
            }
        },
        [onSuccess, onError]
    );

    const updateUser = useCallback(
        async (id: number, data: UpdateStoreUserDto) => {
            setLoading(true);
            try {
                await StoreUsersService.update(id, data);
                message.success('Usuario actualizado correctamente.');
                onSuccess?.();
            } catch (err) {
                const apiError = err as ApiError;
                if (apiError.errors) {
                    message.error(apiError.message);
                    onError?.(apiError.errors);
                    throw err;
                } else {
                    message.error(apiError.message || 'Error al actualizar el usuario.');
                }
            } finally {
                setLoading(false);
            }
        },
        [onSuccess, onError]
    );

    return { loading, createUser, updateUser };
};
