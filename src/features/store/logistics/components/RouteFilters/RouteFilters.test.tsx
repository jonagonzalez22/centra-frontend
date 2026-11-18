import { act, fireEvent, render, screen } from '@testing-library/react';
import { RouteFilters } from './RouteFilters';

const drivers = [{ id: 'driver-1', name: 'María Gómez', email: 'maria@example.com', is_active: true }];
const renderFilters = (filters = {}) => {
    const onChange = vi.fn(); const onReset = vi.fn();
    render(<RouteFilters filters={filters} drivers={drivers} driversLoading={false} onChange={onChange} onReset={onReset} />);
    return { onChange, onReset };
};

describe('RouteFilters', () => {
    afterEach(() => vi.useRealTimers());

    test('keeps the four primary filters visible while advanced filters stay closed', () => {
        renderFilters();
        expect(screen.getByLabelText('Número de ruta')).toBeInTheDocument();
        expect(screen.getByLabelText('Nombre de ruta')).toBeInTheDocument();
        expect(screen.getByLabelText('Fecha desde')).toBeInTheDocument();
        expect(screen.getByLabelText('Fecha hasta')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Limpiar' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Más filtros (2)' })).toBeInTheDocument();
    });

    test('searches route name with debounce and resets pagination through its parent', () => {
        vi.useFakeTimers(); const { onChange } = renderFilters({ page: 3, sort_dir: 'desc' });
        fireEvent.change(screen.getByLabelText('Nombre de ruta'), { target: { value: ' Godoy ' } });
        act(() => vi.advanceTimersByTime(300));
        expect(onChange).toHaveBeenCalledWith({ page: 3, sort_dir: 'desc', route_name: 'Godoy' });
    });

    test('applies date filters from the primary row', () => {
        vi.useFakeTimers(); const { onChange } = renderFilters({ route_name: 'Godoy' });
        const from = screen.getByLabelText('Fecha desde');
        fireEvent.change(from, { target: { value: '01/11/2026' } });
        fireEvent.keyDown(from, { key: 'Enter' });
        act(() => vi.advanceTimersByTime(300));
        expect(onChange).toHaveBeenCalledWith({ route_name: 'Godoy', from: '2026-11-01' });
    });

    test('opens and closes more filters, then applies secondary values', () => {
        const { onChange } = renderFilters({ route_name: 'Godoy' });
        fireEvent.click(screen.getByRole('button', { name: 'Más filtros (2)' }));
        expect(screen.getByText('Más filtros', { selector: '.ant-drawer-title' })).toBeInTheDocument();
        fireEvent.mouseDown(screen.getByLabelText('Estado'));
        fireEvent.click(screen.getByText('Planificada'));
        fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
        expect(onChange).toHaveBeenCalledWith({ route_name: 'Godoy', driver_id: undefined, status: 'planned' });
        expect(screen.queryByText('Más filtros', { selector: '.ant-drawer-title' })).not.toBeInTheDocument();
    });

    test('shows chips for advanced filters and removes only the selected one', () => {
        const { onChange } = renderFilters({ from: '2026-11-01', driver_id: 'driver-1', status: 'planned' });
        const chips = screen.getByLabelText('Filtros aplicados');
        expect(chips).toHaveTextContent('Fecha'); expect(chips).toHaveTextContent('María Gómez'); expect(chips).toHaveTextContent('Planificada');
        fireEvent.click(chips.querySelector('.ant-tag-close-icon')!);
        expect(onChange).toHaveBeenCalledWith({ from: undefined, driver_id: 'driver-1', status: 'planned', to: undefined });
    });

    test('clears all active filters', () => {
        const { onReset } = renderFilters({ route_number: 'A1', route_name: 'Godoy' });
        fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }));
        expect(onReset).toHaveBeenCalledOnce();
    });
});
