import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { StoresService } from '../services/stores.service';
import { useStores } from './useStores';

vi.mock('../services/stores.service');

const mockedStoresService = vi.mocked(StoresService);

const mockStore = {
    id: '1',
    name: 'Sucursal Centro',
    email: 'centro@centra.com',
    is_active: true,
    inactive_reason: null,
    inactive_at: null,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    business_type: { id: 1, name: 'Ferretería' },
    plan: { id: 'plan-1', name: 'Plan Básico' },
    cuit: '20123456789',
    address: 'Calle 123',
    state: 'Buenos Aires',
    city: 'CABA',
    country: 'Argentina',
    phone: '+541123456789',
    url_logo: null,
};

const mockApiResponse = {
    items: [mockStore],
    total: 1,
    per_page: 15,
    current_page: 1,
    last_page: 1,
};

describe('useStores', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('initializes with default state', () => {
        mockedStoresService.getStores.mockResolvedValue(mockApiResponse);

        const { result } = renderHook(() => useStores());

        expect(result.current.stores).toEqual([]);
        expect(result.current.loading).toBe(true);
        expect(result.current.error).toBeNull();
        expect(result.current.pagination.current).toBe(1);
        expect(result.current.pagination.total).toBe(0);
    });

    test('fetches stores on mount', async () => {
        mockedStoresService.getStores.mockResolvedValue(mockApiResponse);

        const { result } = renderHook(() => useStores());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(mockedStoresService.getStores).toHaveBeenCalledWith({ page: 1 });
        expect(result.current.stores).toEqual(mockApiResponse.items);
        expect(result.current.pagination.total).toBe(1);
    });

    test('updates pagination on fetch', async () => {
        mockedStoresService.getStores.mockResolvedValue({
            ...mockApiResponse,
            total: 50,
            current_page: 2,
        });

        const { result } = renderHook(() => useStores());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.pagination.current).toBe(2);
        expect(result.current.pagination.total).toBe(50);
    });

    test('refetch calls getStores with filters', async () => {
        mockedStoresService.getStores.mockResolvedValue(mockApiResponse);

        const { result } = renderHook(() => useStores());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        result.current.refetch({ name: 'Sucursal', is_active: true });

        await waitFor(() => {
            expect(mockedStoresService.getStores).toHaveBeenCalledWith({
                name: 'Sucursal',
                is_active: true,
                page: 1,
            });
        });
    });

    test('refetch resets to page 1 when called with filters', async () => {
        mockedStoresService.getStores.mockResolvedValue({
            ...mockApiResponse,
            current_page: 2,
        });

        const { result } = renderHook(() => useStores());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        result.current.refetch({ name: 'Test' });

        await waitFor(() => {
            expect(mockedStoresService.getStores).toHaveBeenCalledWith(
                expect.objectContaining({ page: 1 })
            );
        });
    });
});