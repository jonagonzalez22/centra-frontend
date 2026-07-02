import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { CustomerContactsService } from '../services/customerContacts.service';
import type { CustomerContact, CreateCustomerContactDto, UpdateCustomerContactDto } from '../types/customerContact.types';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

interface UseCustomerContactsReturn {
    contacts: CustomerContact[];
    loading: boolean;
    refetch: () => void;
    createContact: (dto: CreateCustomerContactDto) => Promise<void>;
    updateContact: (id: string, dto: UpdateCustomerContactDto) => Promise<void>;
    deleteContact: (id: string) => Promise<void>;
}

export const useCustomerContacts = (
    customerId: string | undefined
): UseCustomerContactsReturn => {
    const [contacts, setContacts] = useState<CustomerContact[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchContacts = useCallback(async () => {
        if (!customerId) return;
        setLoading(true);
        try {
            const data = await CustomerContactsService.getAll(customerId);
            setContacts(data);
        } catch (err) {
            const apiError = err as ApiError;
            message.error(apiError.message || 'Error al cargar los contactos.');
        } finally {
            setLoading(false);
        }
    }, [customerId]);

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    const createContact = useCallback(
        async (dto: CreateCustomerContactDto) => {
            if (!customerId) return;
            try {
                await CustomerContactsService.create(customerId, dto);
                message.success('Contacto creado correctamente.');
                fetchContacts();
            } catch (err) {
                const apiError = err as ApiError;
                if (apiError.errors) {
                    message.error(apiError.message);
                    throw err;
                }
                message.error(apiError.message || 'Error al crear el contacto.');
                throw err;
            }
        },
        [customerId, fetchContacts]
    );

    const updateContact = useCallback(
        async (id: string, dto: UpdateCustomerContactDto) => {
            if (!customerId) return;
            try {
                await CustomerContactsService.update(customerId, id, dto);
                message.success('Contacto actualizado correctamente.');
                fetchContacts();
            } catch (err) {
                const apiError = err as ApiError;
                if (apiError.errors) {
                    message.error(apiError.message);
                    throw err;
                }
                message.error(apiError.message || 'Error al actualizar el contacto.');
                throw err;
            }
        },
        [customerId, fetchContacts]
    );

    const deleteContact = useCallback(
        async (id: string) => {
            if (!customerId) return;
            try {
                await CustomerContactsService.delete(customerId, id);
                message.success('Contacto eliminado correctamente.');
                fetchContacts();
            } catch (err) {
                const apiError = err as ApiError;
                message.error(apiError.message || 'Error al eliminar el contacto.');
                throw err;
            }
        },
        [customerId, fetchContacts]
    );

    return { contacts, loading, refetch: fetchContacts, createContact, updateContact, deleteContact };
};
