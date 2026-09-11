import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CashOverview, CashSessionOpen } from '@/entities/CashSession';
import { CashPageView } from './CashPageView';

const current: CashSessionOpen = {
    id: 'current-1',
    status: 'open',
    business_date: '2026-09-10',
    opening_amount: 20000,
    declared_amount: null,
    opened_at: '2026-09-10 08:00:00',
    submitted_at: null,
    notes: 'Turno mañana',
    declaration_notes: null,
};

const baseOverview: CashOverview = { current: null, stale_open: [], pending_reconciliation: [] };
const baseProps = {
    loading: false,
    error: null,
    overview: baseOverview,
    canOpen: true,
    canSubmit: true,
    canClose: false,
    pending: null,
    pendingLoading: false,
    currentUserId: 1,
    onOpenCash: vi.fn(),
    onSubmitCash: vi.fn(),
    onReconcile: vi.fn(),
    onPendingPageChange: vi.fn(),
    onRetry: vi.fn(),
};

test('shows empty current state and allows opening a new cash session', async () => {
    const user = userEvent.setup();
    render(<CashPageView {...baseProps} />);
    expect(screen.getByText('No hay una caja abierta para la jornada actual.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Abrir caja' }));
    expect(baseProps.onOpenCash).toHaveBeenCalled();
});

test('shows stale cash and still allows opening a current one', () => {
    render(
        <CashPageView
            {...baseProps}
            overview={{
                ...baseOverview,
                stale_open: [{ ...current, id: 'stale', business_date: '2026-09-09' }],
            }}
        />
    );
    expect(screen.getByText(/jornadas anteriores pendientes/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Regularizar caja' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abrir caja' })).toBeInTheDocument();
});

test('current view is blind and submit action follows permission', () => {
    const { rerender } = render(
        <CashPageView {...baseProps} overview={{ ...baseOverview, current }} />
    );
    expect(screen.getByText('Turno mañana')).toBeInTheDocument();
    expect(screen.queryByText(/esperado/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Finalizar turno' })).toBeInTheDocument();
    rerender(
        <CashPageView {...baseProps} canSubmit={false} overview={{ ...baseOverview, current }} />
    );
    expect(screen.queryByRole('button', { name: 'Finalizar turno' })).not.toBeInTheDocument();
});

test('own pending cash is informative and never offers reconciliation', () => {
    render(
        <CashPageView
            {...baseProps}
            overview={{
                ...baseOverview,
                pending_reconciliation: [
                    {
                        ...current,
                        status: 'pending_reconciliation',
                        declared_amount: 49500,
                        submitted_at: '2026-09-10 18:00:00',
                    },
                ],
            }}
        />
    );
    expect(screen.getByText('Declarado: $ 49.500')).toBeInTheDocument();
    expect(screen.getByText('Pendiente de control')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Realizar arqueo' })).not.toBeInTheDocument();
});

test('supervisor section is permission gated and prevents own reconciliation', () => {
    const pending = {
        items: [
            {
                id: 'p1',
                status: 'pending_reconciliation' as const,
                business_date: '2026-09-10',
                opened_at: '2026-09-10 08:00:00',
                submitted_at: '2026-09-10 18:00:00',
                declared_amount: 100,
                declaration_notes: null,
                cashier: { id: '1', name: 'Juan' },
            },
            {
                id: 'p2',
                status: 'pending_reconciliation' as const,
                business_date: '2026-09-10',
                opened_at: '2026-09-10 09:00:00',
                submitted_at: '2026-09-10 19:00:00',
                declared_amount: 200,
                declaration_notes: null,
                cashier: { id: '2', name: 'Sabrina' },
            },
        ],
        total: 2,
        per_page: 10,
        current_page: 1,
        last_page: 1,
    };
    const { rerender } = render(<CashPageView {...baseProps} pending={pending} />);
    expect(screen.queryByText('Pendientes de arqueo de la tienda')).not.toBeInTheDocument();
    rerender(<CashPageView {...baseProps} canClose pending={pending} />);
    expect(screen.getByText('Pendientes de arqueo de la tienda')).toBeInTheDocument();
    expect(screen.getByText('Tu caja')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Realizar arqueo' })).toHaveClass('ant-btn-default');
});

test('an API error is not rendered as an empty cash state', () => {
    render(<CashPageView {...baseProps} overview={null} error="Servidor no disponible" />);
    expect(screen.getByText('No se pudo cargar Gestión de caja')).toBeInTheDocument();
    expect(
        screen.queryByText('No hay una caja abierta para la jornada actual.')
    ).not.toBeInTheDocument();
});
