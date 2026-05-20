import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { BusinessTypesPageView } from './BusinessTypesPageView';
import { BusinessTypesProvider } from '@/features/admin/business-types/contexts/BusinessTypesProvider';
import type { UseBusinessTypesReturn } from '@/features/admin/business-types/hooks/useBusinessTypes';
import type { BusinessType } from '@/features/admin/business-types/types/business-type.types';

const createMockState = (overrides: Partial<UseBusinessTypesReturn> = {}): UseBusinessTypesReturn => ({
    businessTypes: [],
    loading: false,
    error: null,
    pagination: { current: 1, total: 0, pageSize: 15 },
    refetch: vi.fn(),
    deleteBusinessType: vi.fn().mockResolvedValue(undefined),
    ...overrides,
});

const renderWithProvider = (ui: React.ReactElement) => {
    return render(
        <MemoryRouter>
            <BusinessTypesProvider value={createMockState()}>{ui}</BusinessTypesProvider>
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

describe('BusinessTypesPage', () => {
    test('renders the page header and breadcrumb', () => {
        renderWithProvider(
            <BusinessTypesPageView
                title="Tipos de Negocio"
                description="Administra los tipos de negocio del sistema"
                breadcrumbs={[
                    { label: 'Admin', path: '/admin/dashboard' },
                    { label: 'Configuraciones', path: '/admin/configuraciones/tipos-de-negocio' },
                    { label: 'Tipos de Negocio' },
                ]}
                error={null}
                onEdit={vi.fn()}
                onCreate={vi.fn()}
            />
        );

        expect(screen.getByRole('heading', { name: /tipos de negocio/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /admin/i })).toBeInTheDocument();
        expect(screen.getByText('Configuraciones')).toBeInTheDocument();
    });

    test('renders the provided page navigation', () => {
        renderWithProvider(
            <BusinessTypesPageView
                title="Reporte de Tipos"
                description="Reporte de tipos de negocio"
                breadcrumbs={[{ label: 'Admin', path: '/admin/dashboard' }, { label: 'Reportes' }]}
                error={null}
                onEdit={vi.fn()}
                onCreate={vi.fn()}
            />
        );

        expect(screen.getByRole('heading', { name: /reporte de tipos/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /admin/i })).toHaveAttribute('href', '/admin/dashboard');
        expect(screen.getByText('Reportes')).toBeInTheDocument();
    });

    test('renders error message when business types fail to load', () => {
        renderWithProvider(
            <BusinessTypesPageView
                title="Tipos de Negocio"
                description="Administra los tipos de negocio del sistema"
                breadcrumbs={[{ label: 'Admin', path: '/admin/dashboard' }, { label: 'Tipos de Negocio' }]}
                error="Error al cargar los tipos de negocio"
                onEdit={vi.fn()}
                onCreate={vi.fn()}
            />
        );

        expect(screen.getByText('Error al cargar los tipos de negocio')).toBeInTheDocument();
    });

    test('shows create button', () => {
        renderWithProvider(
            <BusinessTypesPageView
                title="Tipos de Negocio"
                description="Administra los tipos de negocio del sistema"
                breadcrumbs={[{ label: 'Admin', path: '/admin/dashboard' }, { label: 'Tipos de Negocio' }]}
                error={null}
                onEdit={vi.fn()}
                onCreate={vi.fn()}
            />
        );

        expect(screen.getByRole('button', { name: /nuevo tipo de negocio/i })).toBeInTheDocument();
    });

    test('renders business type rows from context', () => {
        const state = createMockState({
            businessTypes: [mockBusinessType],
            pagination: { current: 1, total: 1, pageSize: 15 },
        });

        render(
            <MemoryRouter>
                <BusinessTypesProvider value={state}>
                    <BusinessTypesPageView
                        title="Tipos de Negocio"
                        description="Administra los tipos de negocio del sistema"
                        breadcrumbs={[{ label: 'Admin', path: '/admin/dashboard' }, { label: 'Tipos de Negocio' }]}
                        error={null}
                        onEdit={vi.fn()}
                        onCreate={vi.fn()}
                    />
                </BusinessTypesProvider>
            </MemoryRouter>
        );

        expect(screen.getByText('Ferretería')).toBeInTheDocument();
    });
});