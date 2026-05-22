import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PlansTable } from './PlansTable';
import { PlansProvider } from '@/features/admin/plans/contexts/PlansProvider';
import type { UsePlansReturn } from '@/features/admin/plans/hooks/usePlans';
import type { Plan } from '@/features/admin/plans/types/plan.types';

const createMockPlansState = (overrides: Partial<UsePlansReturn> = {}): UsePlansReturn => ({
    plans: [],
    loading: false,
    error: null,
    pagination: { current: 1, total: 0, pageSize: 15 },
    refetch: vi.fn(),
    ...overrides,
});

const renderWithProvider = (
    plansState: UsePlansReturn,
    props: {
        onEdit?: (plan: Plan) => void;
        onManageFeatures?: (plan: Plan) => void;
        onDelete?: (plan: Plan) => void;
    } = {}
) => {
    return render(
        <MemoryRouter>
            <PlansProvider value={plansState}>
                <PlansTable
                    onEdit={props.onEdit ?? vi.fn()}
                    onManageFeatures={props.onManageFeatures ?? vi.fn()}
                    onDelete={props.onDelete ?? vi.fn()}
                />
            </PlansProvider>
        </MemoryRouter>
    );
};

describe('PlansTable', () => {
    test('renders plan rows', () => {
        const mockPlan: Plan = {
            id: '1',
            name: 'Plan Básico',
            description: 'Plan de entrada',
            price: 9900,
            billing_cycle: 'monthly',
            is_trial: false,
            is_active: true,
            features: [],
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
        };

        const plansState = createMockPlansState({
            plans: [mockPlan],
            pagination: { current: 1, total: 1, pageSize: 15 },
        });

        renderWithProvider(plansState);

        expect(screen.getByText('Plan Básico')).toBeInTheDocument();
        expect(screen.getByText('Activo')).toBeInTheDocument();
    });

    test('renders table columns', () => {
        const plansState = createMockPlansState();
        renderWithProvider(plansState);

        expect(screen.getByRole('columnheader', { name: 'Nombre' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Precio' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Estado' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Acciones' })).toBeInTheDocument();
    });

    test('shows empty text when there are no plans', () => {
        const plansState = createMockPlansState({
            plans: [],
            pagination: { current: 1, total: 0, pageSize: 15 },
        });

        renderWithProvider(plansState);

        expect(screen.getByText('No hay planes para mostrar')).toBeInTheDocument();
    });

    test('shows loading state', () => {
        const plansState = createMockPlansState({ loading: true });
        const { container } = renderWithProvider(plansState);

        expect(container.querySelector('.ant-spin')).toBeInTheDocument();
    });

    test('renders inactive status tag', () => {
        const mockPlan: Plan = {
            id: '4',
            name: 'Plan Inactivo',
            description: 'Plan desactivado',
            price: 5000,
            billing_cycle: 'monthly',
            is_trial: false,
            is_active: false,
            features: [],
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-01-15T10:00:00Z',
        };

        const plansState = createMockPlansState({
            plans: [mockPlan],
            pagination: { current: 1, total: 1, pageSize: 15 },
        });

        renderWithProvider(plansState);

        expect(screen.getByText('Inactivo')).toBeInTheDocument();
    });
});
