import { CatalogService } from '@/features/shared/catalogs/services/catalogService';
import type { DocumentTypeOption } from '../types/documentTypes.types';

export const DocumentTypesService = {
    getAll: async (): Promise<DocumentTypeOption[]> => {
        return CatalogService.get<DocumentTypeOption>('document-types');
    },
};
