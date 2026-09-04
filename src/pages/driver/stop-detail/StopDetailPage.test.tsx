import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import { StopDetailPage } from './StopDetailPage';

const { refreshAvailability, refreshStop } = vi.hoisted(() => ({
    refreshAvailability: vi.fn(),
    refreshStop: vi.fn(),
}));

vi.mock('react-router-dom', () => ({ useParams: () => ({ stopId: 'stop-1' }) }));
vi.mock('@/features/driver/hooks/useStopDetail', () => ({
    useStopDetail: () => ({
        stop: {
            id: 'stop-1',
            route_id: 'route-1',
            status: 'pending',
            items: [],
        },
        loading: false,
        error: null,
        refresh: refreshStop,
        completing: false,
        completeStop: vi.fn(),
    }),
}));
vi.mock('@/features/driver/hooks/useAvailableSurplus', () => ({
    useAvailableSurplus: () => ({
        surplus: [],
        loading: false,
        error: null,
        hasAvailableSurplus: true,
        refresh: refreshAvailability,
    }),
}));
vi.mock('@/features/driver/services/driver.service', () => ({
    DriverService: { getRejectionReasons: vi.fn().mockResolvedValue([]) },
}));
vi.mock('./StopDetailPageView', () => ({ StopDetailPageView: () => null }));
vi.mock('@/features/driver/components/ExtraSaleWrapper', () => ({
    ExtraSaleWrapper: ({ onSuccess }: { onSuccess: () => void }) => (
        <button onClick={onSuccess}>Simular Venta Extra exitosa</button>
    ),
}));
vi.mock('@/features/driver/components/DeliveryDecisionModal', () => ({
    DeliveryDecisionModal: () => null,
}));
vi.mock('@/features/driver/components/StopPaymentModal', () => ({ StopPaymentModal: () => null }));
vi.mock('@/features/driver/components/FailedDeliveryModal', () => ({
    FailedDeliveryModal: () => null,
}));

beforeEach(() => vi.clearAllMocks());

test('refreshes stop and surplus visibility after a successful extra sale', async () => {
    render(<StopDetailPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Simular Venta Extra exitosa' }));

    expect(refreshStop).toHaveBeenCalledOnce();
    expect(refreshAvailability).toHaveBeenCalledOnce();
});
