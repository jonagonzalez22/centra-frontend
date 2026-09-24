import { render, screen } from '@testing-library/react';
import { SaleDetailHistory } from './SaleDetailHistory';

test('shows only the persisted sale creation for a confirmed sale', () => {
    render(
        <SaleDetailHistory
            createdAt="2026-09-23 18:42:00"
            createdBy={{ id: 'user-1', name: 'Rosa Pérez' }}
            history={[]}
        />
    );

    expect(screen.getByText('HISTORIAL')).toBeInTheDocument();
    expect(screen.getByText('Venta realizada')).toBeInTheDocument();
    expect(screen.getByText('23/09/2026 18:42 · Rosa Pérez')).toBeInTheDocument();
    expect(screen.queryByText('Venta cancelada')).not.toBeInTheDocument();
});

test('shows only the creation date when the creation actor is unavailable', () => {
    render(<SaleDetailHistory createdAt="2026-09-23 18:42:00" history={[]} />);

    expect(screen.getByText('23/09/2026 18:42')).toBeInTheDocument();
    expect(screen.queryByText(/·/)).not.toBeInTheDocument();
});

test('shows a cancelled sale event chronologically with friendly reason and optional detail', () => {
    render(
        <SaleDetailHistory
            createdAt="2026-09-23 18:42:00"
            createdBy={{ id: 'user-1', name: 'Rosa Pérez' }}
            history={[
                {
                    id: 'event-1',
                    event_type: 'sale_cancelled',
                    previous_status: 'confirmed',
                    new_status: 'cancelled',
                    reason_code: 'pricing_error',
                    reason_note: 'Importe cargado incorrectamente',
                    user: { id: 'user-2', name: 'Juan Pérez' },
                    created_at: '2026-09-23 20:31:00',
                },
            ]}
        />
    );

    expect(screen.getByText('Venta cancelada')).toBeInTheDocument();
    expect(screen.getByText('Fecha: 23/09/2026 20:31')).toBeInTheDocument();
    expect(screen.getByText('Usuario: Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('Motivo: Error de precio')).toBeInTheDocument();
    expect(screen.getByText('Detalle: Importe cargado incorrectamente')).toBeInTheDocument();

    const entries = screen.getAllByText(/Venta realizada|Venta cancelada/);
    expect(entries.map((entry) => entry.textContent)).toEqual(['Venta realizada', 'Venta cancelada']);
});

test('does not invent cancellation details when a cancelled sale has no event', () => {
    render(
        <SaleDetailHistory
            createdAt="2026-09-23 18:42:00"
            createdBy={{ id: 'user-1', name: 'Rosa Pérez' }}
            history={[]}
        />
    );

    expect(screen.queryByText('Venta cancelada')).not.toBeInTheDocument();
    expect(screen.queryByText('Motivo:')).not.toBeInTheDocument();
});
