import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { CollectionsTable } from './CollectionsTable';
import type { RouteReconciliationCollectionGroup } from '../interfaces/reconciliation.interface';

const group: RouteReconciliationCollectionGroup = {
    store_payment_method_id: 'cash-store-method',
    payment_method_name: 'Efectivo',
    collection_count: 2,
    total_amount: 20000,
    declared_count: 1,
    declared_amount: 18000,
    verified_count: 0,
    verified_amount: 0,
    rejected_count: 1,
    rejected_amount: 2000,
    status: 'partial',
    has_pending_collections: true,
    collections: [
        { id: 'c1', commercial_operation_id: 'o1', store_payment_method_id: 'cash-store-method', order_number: 'P-1', customer_name: 'Ana con un nombre especialmente largo', amount: 18000, status: 'declared', payment_method: 'Efectivo', reference: 'TRANSFERENCIA-CON-REFERENCIA-MUY-LARGA', notes: null, declared_by: 'Chofer', declared_at: '2026-09-08 10:00:00', verified_at: null, verified_by: null, rejection_reason: null, operation_payment_id: null, stop_id: 's1' },
        { id: 'c2', commercial_operation_id: 'o2', store_payment_method_id: 'cash-store-method', order_number: 'P-2', customer_name: 'Luis', amount: 2000, status: 'rejected', payment_method: 'Efectivo', reference: null, notes: null, declared_by: 'Chofer', declared_at: '2026-09-08 10:01:00', verified_at: '2026-09-08 11:00:00', verified_by: 'Admin', rejection_reason: 'Incorrecto', operation_payment_id: null, stop_id: 's2' },
    ],
};

test('shows one grouped row and opens its individual collection detail', async () => {
    const user = userEvent.setup();
    render(<CollectionsTable groups={[group]} loading={false} actionLoading={false} onVerify={vi.fn()} onVerifyGroup={vi.fn()} onReject={vi.fn()} readOnly={false} />);

    expect(screen.getAllByText('Efectivo')).toHaveLength(1);
    expect(screen.queryByText('P-1')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /rechazar efectivo/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ver detalle de Efectivo' }));
    expect(await screen.findByText('P-1')).toBeInTheDocument();
    expect(screen.getByText('P-2')).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Detalle' })).not.toBeInTheDocument();
    expect(screen.getByText('Declarado por: Chofer')).toBeInTheDocument();
    expect(screen.getByText('Fecha: 08/09/2026')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Referencia' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Fecha' })).toBeInTheDocument();
    expect(screen.getByText('TRANSFERENCIA-CON-REFERENCIA-MUY-LARGA')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Verificar cobro' })).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Rechazar cobro' })).toBeInTheDocument();

    const drawer = screen.getByRole('dialog', { name: 'Efectivo' });
    const detailTable = drawer.querySelector('.ant-table-content');
    expect(detailTable).toHaveStyle({ overflowX: 'auto' });
    expect(drawer.closest('.ant-drawer-content-wrapper')).toHaveStyle({ width: 'min(720px, 100vw)' });
});

test('does not present one declarant as common when the group has several', async () => {
    const user = userEvent.setup();
    const mixedDeclarants = {
        ...group,
        collections: [group.collections[0], { ...group.collections[1], declared_by: 'Otro chofer' }],
    };

    render(<CollectionsTable groups={[mixedDeclarants]} loading={false} actionLoading={false} onVerify={vi.fn()} onVerifyGroup={vi.fn()} onReject={vi.fn()} readOnly={false} />);
    await user.click(screen.getByRole('button', { name: 'Ver detalle de Efectivo' }));

    expect(await screen.findByText('Declarado por: Múltiples declarantes')).toBeInTheDocument();
    expect(screen.queryByText('Declarado por: Chofer')).not.toBeInTheDocument();
});
