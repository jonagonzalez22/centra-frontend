import { act, fireEvent, render, screen } from '@testing-library/react';
import { VehicleFilters } from './VehicleFilters';

const renderFilters = (filters = {}) => {
    const onChange = vi.fn();
    const onReset = vi.fn();
    render(
        <VehicleFilters
            filters={filters}
            types={['auto', 'camioneta']}
            onChange={onChange}
            onReset={onReset}
        />
    );
    return { onChange, onReset };
};

describe('VehicleFilters', () => {
    afterEach(() => vi.useRealTimers());

    test('searches automatically after a 400ms debounce', () => {
        vi.useFakeTimers();
        const { onChange } = renderFilters({ page: 3, type: 'camioneta' });
        fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: ' VW ' } });

        act(() => vi.advanceTimersByTime(399));
        expect(onChange).not.toHaveBeenCalled();
        act(() => vi.advanceTimersByTime(1));
        expect(onChange).toHaveBeenCalledWith({
            search: 'VW',
            type: 'camioneta',
            is_active: undefined,
        });
    });

    test('keeps the three filters visible and clears them together', () => {
        const { onReset } = renderFilters({ search: 'VW', type: 'camioneta', is_active: false });
        expect(screen.getByLabelText('Buscar')).toBeInTheDocument();
        expect(screen.getByLabelText('Tipo')).toBeInTheDocument();
        expect(screen.getByLabelText('Estado')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Limpiar' })).toBeEnabled();

        fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }));
        expect(onReset).toHaveBeenCalledOnce();
    });
});
