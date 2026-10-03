import { fireEvent, render, screen } from '@testing-library/react';
import { message } from 'antd';
import { RouteLoadDrawer } from './RouteLoadDrawer';
import { useLoadSheet } from '../hooks/useLoadSheet';

vi.mock('../hooks/useLoadSheet', () => ({ useLoadSheet: vi.fn() }));
vi.mock('@/components/Button', () => ({
    Button: ({ label, action, disabled }: { label: string; action: () => void; disabled?: boolean }) => (
        <button type="button" disabled={disabled} onClick={action}>{label}</button>
    ),
}));

const loadSheet = {
    route_id: 'route-1',
    status: 'planned',
    operational_date: '2026-10-02',
    total_items: '1.2500',
    by_stop: [],
    by_product: [{
        product_id: 'product-1',
        product_name: 'Producto a granel',
        total_planned: '1.2500',
        total_loaded: '1.2500',
        sale_quantity_step: '0.2500',
        stock_measurement_unit: { symbol: 'kg' },
    }],
};

const mockedUseLoadSheet = vi.mocked(useLoadSheet);

beforeEach(() => {
    mockedUseLoadSheet.mockReturnValue({
        loadSheet,
        loading: false,
        bulkLoading: false,
        confirming: false,
        load: vi.fn(),
        bulkLoad: vi.fn(),
        confirmLoad: vi.fn(),
    });
    vi.spyOn(message, 'error').mockImplementation(() => 'message' as never);
});

afterEach(() => vi.restoreAllMocks());

test('restores the last valid decimal loading quantity after an incompatible input', () => {
    render(<RouteLoadDrawer open routeId="route-1" isLoaded={false} onClose={vi.fn()} onSuccess={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '1,1' } });
    fireEvent.blur(input);

    expect(message.error).toHaveBeenCalledWith('Esta cantidad debe ser múltiplo de 0,25 kg.');
    expect(screen.getByText('Esta cantidad debe ser múltiplo de 0,25 kg.')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toHaveValue('1,25 kg');
});

test.each(['1,5', '1,3'])('clamps %s to the planned maximum and explains it', (value) => {
    render(<RouteLoadDrawer open routeId="route-1" isLoaded={false} onClose={vi.fn()} onSuccess={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value } });
    fireEvent.blur(input);

    expect(message.error).toHaveBeenCalledWith('La cantidad no puede superar 1,25 kg.');
    expect(screen.getByText('La cantidad no puede superar 1,25 kg.')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toHaveValue('1,25 kg');
});

test('keeps zero in the existing total-shortage flow without a quantity error', () => {
    render(<RouteLoadDrawer open routeId="route-1" isLoaded={false} onClose={vi.fn()} onSuccess={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '0' } });
    fireEvent.blur(input);

    expect(screen.getByText('Aviso: Cantidad 0 generará un faltante total. Se requiere motivo.')).toBeInTheDocument();
    expect(message.error).not.toHaveBeenCalled();
});

test('accepts a valid quantity without leaving a validation error', () => {
    render(<RouteLoadDrawer open routeId="route-1" isLoaded={false} onClose={vi.fn()} onSuccess={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '1' } });
    fireEvent.blur(input);

    expect(message.error).not.toHaveBeenCalled();
    expect(screen.queryByText('Esta cantidad debe ser múltiplo de 0,25 kg.')).not.toBeInTheDocument();
});

test('keeps decimal quantities as strings in the bulk-load payload', async () => {
    const bulkLoad = vi.fn().mockResolvedValue(undefined);
    mockedUseLoadSheet.mockReturnValue({
        loadSheet,
        loading: false,
        bulkLoading: false,
        confirming: false,
        load: vi.fn(),
        bulkLoad,
        confirmLoad: vi.fn(),
    });
    render(<RouteLoadDrawer open routeId="route-1" isLoaded={false} onClose={vi.fn()} onSuccess={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Todo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Despacho de Carga' }));

    expect(bulkLoad).toHaveBeenCalledWith(expect.objectContaining({
        products: [expect.objectContaining({ quantity_loaded: '1.2500' })],
    }));
});
