import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { BusinessTypesTable } from './BusinessTypesTable';
import { BusinessTypesProvider } from '../../contexts/BusinessTypesProvider';
import type { UseBusinessTypesReturn } from '../../hooks/useBusinessTypes';
import type { BusinessType } from '../../types/business-type.types';

const createMockBusinessTypesState = (overrides: Partial<UseBusinessTypesReturn> = {}): UseBusinessTypesReturn => ({
    businessTypes: [],
    loading: false,
    error: null,
    pagination: { current: 1, total: 0, pageSize: 15 },
    refetch: vi.fn(),
    deleteBusinessType: vi.fn().mockResolvedValue(undefined),
    ...overrides,
});

const renderWithProvider = (state: UseBusinessTypesReturn, onEdit: (bt: BusinessType) => void) => {
    return render(
        <MemoryRouter>
            <BusinessTypesProvider value={state}>
                <BusinessTypesTable onEdit={onEdit} />
            </BusinessTypesProvider>
        </MemoryRouter>
    );
};

const mockBusinessType: BusinessType = {
    id: 1,
    name: 'Ferretería',
    description: 'Businesses that sell hardware and tools',
    status: 'active',
    created_at: '2026-04-07T22:00:06.000000Z',
    updated_at: '2026-04-07T22:00:06.000000Z',
};

describe('BusinessTypesTable', () => {
    test('renders business type rows', () => {
        const state = createMockBusinessTypesState({
            businessTypes: [mockBusinessType],
            pagination: { current: 1, total: 1, pageSize: 15 },
        });

        renderWithProvider(state, vi.fn());

        expect(screen.getByText('Ferretería')).toBeInTheDocument();
        expect(screen.getByText('Activo')).toBeInTheDocument();
    });

    test('renders table columns', () => {
        const state = createMockBusinessTypesState();
        renderWithProvider(state, vi.fn());

        expect(screen.getByRole('columnheader', { name: 'Nombre' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Estado' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Acciones' })).toBeInTheDocument();
    });

    test('shows empty text when there are no business types', () => {
        const state = createMockBusinessTypesState({
            businessTypes: [],
            pagination: { current: 1, total: 0, pageSize: 15 },
        });

        renderWithProvider(state, vi.fn());

        expect(screen.getByText('No hay tipos de negocio para mostrar')).toBeInTheDocument();
    });

    test('shows loading state', () => {
        const state = createMockBusinessTypesState({ loading: true });
        const { container } = renderWithProvider(state, vi.fn());

        expect(container.querySelector('.ant-spin')).toBeInTheDocument();
    });

    test('renders inactive status', () => {
        const inactiveType: BusinessType = {
            ...mockBusinessType,
            id: 2,
            name: 'Supermercado',
            status: 'inactive',
        };

        const state = createMockBusinessTypesState({
            businessTypes: [inactiveType],
            pagination: { current: 1, total: 1, pageSize: 15 },
        });

        renderWithProvider(state, vi.fn());

        expect(screen.getByText('Supermercado')).toBeInTheDocument();
        expect(screen.getByText('Inactivo')).toBeInTheDocument();
    });
});