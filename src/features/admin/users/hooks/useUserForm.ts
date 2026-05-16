import { useState, useCallback } from 'react';
import { message } from 'antd';
import { UsersService } from '../services/users.service';
import type { CreateUserDto, UpdateUserDto } from '../types/user.types';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

interface UseUserFormReturn {
    loading: boolean;
    createUser: (data: CreateUserDto) => Promise<void>;
    updateUser: (id: number, data: UpdateUserDto) => Promise<void>;
}

interface UseUserFormOptions {
    onSuccess?: () => void;
    onError?: (errors: Record<string, string[]>) => void;
}

export const useUserForm = (options?: UseUserFormOptions): UseUserFormReturn => {
    const { onSuccess, onError } = options ?? {};
    const [loading, setLoading] = useState(false);

    const createUser = useCallback(
        async (data: CreateUserDto) => {
            setLoading(true);
            try {
                await UsersService.create(data);
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
        async (id: number, data: UpdateUserDto) => {
            setLoading(true);
            try {
                await UsersService.update(id, data);
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