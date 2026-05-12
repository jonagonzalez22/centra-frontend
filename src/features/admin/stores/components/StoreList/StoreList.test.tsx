import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { StoreList } from './StoreList';
import { useStores } from '../../hooks/useStores';

vi.mock('../../hooks/useStores');

const mockedUseStores = vi.mocked(useStores);

const mockPagination = {
    current: 1,
    total: 0,
    pageSize: 15,
};

describe('StoreList', () => {
    test('renders "Loading stores..." while fetching data', () => {
        mockedUseStores.mockReturnValue({
            stores: [],
            loading: true,
            error: null,
            pagination: mockPagination,
            refetch: vi.fn(),
        });

        render(<StoreList />);

        expect(screen.getByText(/Cargando tiendas.../i)).toBeInTheDocument();
    });

    test('renders the store list when stores are available', () => {
        mockedUseStores.mockReturnValue({
            stores: [
                {
                    id: '1',
                    name: 'Tienda 1',
                    email: 'tienda1@example.com',
                    is_active: true,
                    inactive_reason: null,
                    inactive_at: null,
                    created_at: '2024-01-15T10:00:00Z',
                    updated_at: '2024-01-15T10:00:00Z',
                    business_type: null,
                    plan: null,
                },
                {
                    id: '2',
                    name: 'Tienda 2',
                    email: 'tienda2@example.com',
                    is_active: false,
                    inactive_reason: 'Renovación pendiente',
                    inactive_at: '2024-02-20T15:30:00Z',
                    created_at: '2024-01-10T08:00:00Z',
                    updated_at: '2024-02-20T15:30:00Z',
                    business_type: null,
                    plan: null,
                },
            ],
            loading: false,
            error: null,
            pagination: { ...mockPagination, total: 2 },
            refetch: vi.fn(),
        });

        render(<StoreList />);

        expect(screen.getByText('Listado de Tiendas (MVP)')).toBeInTheDocument();
        expect(screen.getByText('Tienda 1')).toBeInTheDocument();
        expect(screen.getByText('tienda1@example.com')).toBeInTheDocument();
        expect(screen.getByText('Tienda 2')).toBeInTheDocument();
        expect(screen.getByText('tienda2@example.com')).toBeInTheDocument();
    });

    test('renders "No stores registered yet." when the list is empty', () => {
        mockedUseStores.mockReturnValue({
            stores: [],
            loading: false,
            error: null,
            pagination: mockPagination,
            refetch: vi.fn(),
        });

        render(<StoreList />);

        expect(screen.getByText(/No hay tiendas registradas aún./i)).toBeInTheDocument();
    });
});