import { render, screen } from '@testing-library/react';
import { StopDetailCard } from './StopDetailCard';
import type { StopDetailCardProps } from './StopDetailCard';

const baseProps: StopDetailCardProps = {
    item: {
        id: 'item-1',
        route_stop_item_id: 'item-1',
        product_id: 'product-1',
        product_name: 'Pintura Látex',
        sku: 'P-1',
        quantity_planned: 5,
        quantity_loaded: 5,
        quantity_delivered: 0,
        quantity_released_for_extra_sale: 0,
        unit_price: 100,
        is_extra: false,
        notes: null,
    },
    data: {
        item: {} as never,
        originalQty: 5,
        deliveredQty: 5,
        remainingQty: 0,
        releasedQty: 0,
        isComplete: true,
        isReduced: false,
        isNotLoaded: false,
        isConfirmed: false,
        hasValidReason: false,
        showReasonError: false,
        cardState: 'pending',
        canDecrement: true,
        canIncrement: false,
        canDecrementReleased: false,
        canIncrementReleased: false,
        selectedReasonSuggestsExtraSale: false,
    },
    reasonOptions: [
        { id: 'safe', code: 'customer_absent', label: 'Cliente ausente', suggest_extra_sale: true },
    ],
    canDeliver: true,
    onSetQuantity: vi.fn(),
    onSetReleasedQuantity: vi.fn(),
    onToggleConfirm: vi.fn(),
    onSetRejectionReason: vi.fn(),
    onMarkReasonTouched: vi.fn(),
};

test('does not show extra-sale availability for a full delivery', () => {
    render(<StopDetailCard {...baseProps} />);

    expect(screen.queryByText('Disponible para Venta Extra')).not.toBeInTheDocument();
});

test('shows the reason for a reduction but hides availability until a reason is selected', () => {
    render(
        <StopDetailCard
            {...baseProps}
            data={{
                ...baseProps.data,
                deliveredQty: 3,
                remainingQty: 2,
                isComplete: false,
                isReduced: true,
                cardState: 'reduced',
            }}
        />
    );

    expect(screen.getByText('No entregado: 2')).toBeInTheDocument();
    expect(screen.getByText('Motivo del rechazo')).toBeInTheDocument();
    expect(screen.queryByText('Disponible para Venta Extra')).not.toBeInTheDocument();
});

test('shows the inline availability stepper after selecting a reason', () => {
    render(
        <StopDetailCard
            {...baseProps}
            rejectionReasonId="safe"
            data={{
                ...baseProps.data,
                deliveredQty: 3,
                remainingQty: 2,
                releasedQty: 1,
                isComplete: false,
                isReduced: true,
                cardState: 'reduced',
                canDecrementReleased: true,
                canIncrementReleased: true,
                selectedReasonSuggestsExtraSale: true,
            }}
        />
    );

    expect(screen.getByText('Disponible para Venta Extra')).toBeInTheDocument();
    expect(screen.getByText(/Máximo: 2/)).toBeInTheDocument();
    expect(screen.getByLabelText('Reducir disponibilidad de Pintura Látex')).toBeEnabled();
    expect(screen.getByLabelText('Aumentar disponibilidad de Pintura Látex')).toBeEnabled();
});
