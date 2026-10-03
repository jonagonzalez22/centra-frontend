import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';
import { RouteAdjustmentDrawer } from './RouteAdjustmentDrawer';
import { RoutesService } from '../services/routes.service';

vi.mock('../services/routes.service', () => ({
    RoutesService: { getLoadSheet: vi.fn(), adjustItems: vi.fn() },
}));
vi.mock('@/components/Button', () => ({
    Button: ({ label, action, disabled }: { label: string; action: () => void; disabled?: boolean }) => (
        <button type="button" disabled={disabled} onClick={action}>{label}</button>
    ),
}));

const loadSheet = {
    route_id: 'route-1',
    status: 'loaded',
    operational_date: '2026-10-02',
    total_items: '1.2500',
    by_product: [{
        product_id: 'product-1', product_name: 'Producto a granel', total_planned: '1.2500', total_loaded: '1.2500',
        sale_quantity_step: '0.2500', stock_measurement_unit: { symbol: 'kg' },
    }],
    by_stop: [{
        stop_id: 'stop-1', sequence: 1, order_number: 'P-000001', customer_name: 'Cliente',
        items: [{
            route_stop_item_id: 'item-1', product_id: 'product-1', product_name: 'Producto a granel',
            quantity_planned: '1.2500', quantity_loaded: '1.2500', sale_quantity_step: '0.2500', stock_measurement_unit: { symbol: 'kg' },
        }],
    }],
};

beforeEach(() => {
    vi.mocked(RoutesService.getLoadSheet).mockResolvedValue(loadSheet);
    vi.spyOn(message, 'error').mockImplementation(() => 'message' as never);
});

afterEach(() => vi.restoreAllMocks());

test('restores the last valid quantity after an invalid load adjustment', async () => {
    render(<RouteAdjustmentDrawer open routeId="route-1" onClose={vi.fn()} onSuccess={vi.fn()} />);

    const selector = await screen.findByRole('combobox');
    fireEvent.mouseDown(selector);
    fireEvent.click(await screen.findByText('Producto a granel (1,25 kg)'));

    const input = await screen.findByRole('spinbutton');
    fireEvent.change(input, { target: { value: '1,1' } });
    fireEvent.blur(input);

    await waitFor(() => expect(message.error).toHaveBeenCalledWith('Esta cantidad debe ser múltiplo de 0,25 kg.'));
    expect(screen.getByText('Esta cantidad debe ser múltiplo de 0,25 kg.')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toHaveValue('1,25 kg');
});

test('explains the adjustment maximum instead of silently clipping it', async () => {
    render(<RouteAdjustmentDrawer open routeId="route-1" onClose={vi.fn()} onSuccess={vi.fn()} />);

    const selector = await screen.findByRole('combobox');
    fireEvent.mouseDown(selector);
    fireEvent.click(await screen.findByText('Producto a granel (1,25 kg)'));

    const input = await screen.findByRole('spinbutton');
    fireEvent.change(input, { target: { value: '1,5' } });
    fireEvent.blur(input);

    await waitFor(() => expect(message.error).toHaveBeenCalledWith('Máximo asignable: 1,25 kg.'));
    expect(screen.getByText('Máximo asignable: 1,25 kg.')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toHaveValue('1,25 kg');
});
