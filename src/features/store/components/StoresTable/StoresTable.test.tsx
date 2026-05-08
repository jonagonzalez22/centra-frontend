import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, test } from 'vitest';
import { StoresTable } from './StoresTable';
import type { Store } from '@/features/store/types/store.types';

const stores: Store[] = [
    { id: 1, name: 'Sucursal Centro', email: 'centro@centra.com', status: 'active' },
    { id: 2, name: 'Sucursal Norte', email: null, status: 'inactive' },
];

describe('StoresTable', () => {
    test('renders store rows with formatted status and fallback email', () => {
        render(<StoresTable stores={stores} loading={false} />);

        expect(screen.getByText('Sucursal Centro')).toBeInTheDocument();
        expect(screen.getByText('centro@centra.com')).toBeInTheDocument();
        expect(screen.getByText('Sucursal Norte')).toBeInTheDocument();
        expect(screen.getByText('Sin email')).toBeInTheDocument();
        expect(screen.getByText('Activo')).toBeInTheDocument();
        expect(screen.getByText('Inactivo')).toBeInTheDocument();
    });

    test('renders table columns', () => {
        render(<StoresTable stores={[]} loading={false} />);

        expect(screen.getByRole('columnheader', { name: 'Nombre' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Email' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Estado' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Acciones' })).toBeInTheDocument();
    });

    test('shows empty text when there are no stores', () => {
        render(<StoresTable stores={[]} loading={false} />);

        expect(screen.getByText('No hay tiendas para mostrar')).toBeInTheDocument();
    });

    test('shows loading state', () => {
        const { container } = render(<StoresTable stores={[]} loading={true} />);

        expect(container.querySelector('.ant-spin')).toBeInTheDocument();
    });
});
