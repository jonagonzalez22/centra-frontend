import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { StoreList } from './StoreList';
import { useStores } from '../../hooks/useStores';

vi.mock('../hooks/useStores');

const mockedUseStores = vi.mocked(useStores);

describe('StoreList', () => {
    test('renders "Loading stores..." while fetching data', () => {
    mockedUseStores.mockReturnValue({
        stores: [],
        loading: true,
        error: null,
        refetch: vi.fn(),
    });

    render(<StoreList />);

    expect(screen.getByText(/Cargando tiendas.../i)).toBeInTheDocument();
});

    test('renders the store list when stores are available', () => {
    mockedUseStores.mockReturnValue({
        stores: [
        { id: 1, name: 'Tienda 1', email: 'tienda1@example.com', status: 'active' },
        { id: 2, name: 'Tienda 2', email: 'tienda2@example.com', status: 'inactive' },
        ],
        loading: false,
        error: null,
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
        refetch: vi.fn(),
    });

    render(<StoreList />);

    expect(screen.getByText(/No hay tiendas registradas aún./i)).toBeInTheDocument();
    });
});