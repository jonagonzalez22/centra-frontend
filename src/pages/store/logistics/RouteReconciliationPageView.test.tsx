import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { RouteReconciliationPageView } from './RouteReconciliationPageView';
import type { RouteReconciliationSummary } from '@/features/store/logistics/interfaces/reconciliation.interface';

const summary: RouteReconciliationSummary = {
    route_id: '01a0741f-0000-0000-0000-000000000000',
    status: 'awaiting_reconciliation',
    operational_date: '2026-09-08',
    vehicle: 'Camión 1',
    driver: 'Chofer',
    stops: [],
    collection_groups: [],
    totals: { declared_amount: 0, verified_amount: 0, rejected_amount: 0, pending_amount: 0 },
    can_close: false,
};

test('shows the route operational date in the reconciliation header', () => {
    render(
        <MemoryRouter>
            <RouteReconciliationPageView
                summary={summary}
                collectionGroups={[]}
                discrepancies={[]}
                pendingCollectionsCount={0}
                pendingDiscrepanciesCount={1}
                loading={false}
                actionLoading={false}
                routeId={summary.route_id}
                onVerify={vi.fn()}
                onVerifyGroup={vi.fn()}
                onReject={vi.fn()}
                onResolveDiscrepancy={vi.fn()}
                onFinalize={vi.fn()}
                onBack={vi.fn()}
            />
        </MemoryRouter>,
    );

    expect(screen.getByText('Fecha: 08/09/2026')).toBeInTheDocument();
});
