import { useState, useEffect } from 'react';
import { message } from 'antd';
import { DocumentTypesService } from '../services/documentTypes.service';
import type { DocumentTypeOption } from '../types/documentTypes.types';
import type { ApiError } from '@/interfaces/ApiErrors.interface';

interface UseDocumentTypesReturn {
    documentTypes: DocumentTypeOption[];
    loading: boolean;
}

export const useDocumentTypes = (): UseDocumentTypesReturn => {
    const [documentTypes, setDocumentTypes] = useState<DocumentTypeOption[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchDocumentTypes = async () => {
            try {
                setLoading(true);
                const data = await DocumentTypesService.getAll();
                setDocumentTypes(data);
            } catch (err) {
                const apiError = err as ApiError;
                message.error(apiError.message || 'Error al cargar los tipos de documento.');
            } finally {
                setLoading(false);
            }
        };

        fetchDocumentTypes();
    }, []);

    return { documentTypes, loading };
};
