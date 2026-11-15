import { fireEvent, render, screen } from '@testing-library/react';
import { StopDetailCard } from './StopDetailCard';
import type { StopDetailCardProps } from './StopDetailCard';

const baseProps: StopDetailCardProps = {
    item: {
        id: 'item-1',
        route_stop_item_id: 'item-1',
        product_id: 'product-1',
        product_name: 'Pintura Látex',
        sku: 'P-1',
        quantity_planned: '5.0000', quantity_loaded: '5.0000', quantity_delivered: '0.0000', quantity_released_for_extra_sale: '0.0000',
        unit_price: 100,
        stock_measurement_unit: { symbol: 'kg' },
        is_extra: false,
        notes: null,
    },
    data: {
        item: {} as never,
        originalQty: '5.0000', deliveredQty: '5.0000', remainingQty: '0.0000', releasedQty: '0.0000',
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
    const { container } = render(<StopDetailCard {...baseProps} />);

    expect(screen.queryByText('Disponible para Venta Extra')).not.toBeInTheDocument();
    expect(screen.getByText('Unidad: kg')).toBeInTheDocument();
    expect(screen.getByText('5/5')).toBeInTheDocument();

    const card = container.querySelector('.stopDetailCard')!;
    const productIndex = Array.from(card.children).findIndex((child) =>
        child.classList.contains('stopDetailCardDetail')
    );
    const stepperIndex = Array.from(card.children).findIndex((child) =>
        child.classList.contains('stopDetailCardStepper')
    );

    expect(productIndex).toBeLessThan(stepperIndex);
    expect(card.querySelector('.stopDetailCardReason')).not.toBeInTheDocument();
});

test('shows the reason for a reduction but hides availability until a reason is selected', () => {
    render(
        <StopDetailCard
            {...baseProps}
            data={{
                ...baseProps.data,
                deliveredQty: '3.0000', remainingQty: '2.0000',
                isComplete: false,
                isReduced: true,
                cardState: 'reduced',
            }}
        />
    );

    expect(screen.getByText('2 unidades no entregadas')).toBeInTheDocument();
    expect(screen.getByText('Motivo')).toBeInTheDocument();
    expect(screen.getByLabelText('Motivo del rechazo')).toBeInTheDocument();
    expect(screen.queryByText('Disponible para Venta Extra')).not.toBeInTheDocument();
});

test('shows the inline availability stepper after selecting a reason', () => {
    const onSetReleasedQuantity = vi.fn();
    const longReason = 'Mercadería rechazada por el cliente durante la entrega';

    const { container } = render(
        <StopDetailCard
            {...baseProps}
            reasonOptions={[{ id: 'safe', code: 'customer_rejected', label: longReason, suggest_extra_sale: true }]}
            rejectionReasonId="safe"
            onSetReleasedQuantity={onSetReleasedQuantity}
            data={{
                ...baseProps.data,
                originalQty: '2.0000', deliveredQty: '1.0000', remainingQty: '1.0000', releasedQty: '1.0000',
                isComplete: false,
                isReduced: true,
                cardState: 'reduced',
                canDecrementReleased: true,
                canIncrementReleased: false,
                selectedReasonSuggestsExtraSale: true,
            }}
        />
    );

    expect(screen.getByText('Disponible para Venta Extra')).toBeInTheDocument();
    expect(screen.getByText('1/2')).toBeInTheDocument();
    expect(screen.getByText('1 unidad no entregada')).toBeInTheDocument();
    expect(screen.getByText(/Máximo: 1/)).toBeInTheDocument();
    expect(screen.getByText(longReason)).toBeInTheDocument();
    const decrementButton = screen.getByLabelText('Reducir disponibilidad de Pintura Látex');
    expect(decrementButton).toBeEnabled();

    fireEvent.click(decrementButton);
    expect(onSetReleasedQuantity).toHaveBeenCalledWith('item-1', '0.0000');

    const card = container.querySelector('.stopDetailCard')!;
    const cardChildren = Array.from(card.children);
    const productIndex = cardChildren.findIndex((child) =>
        child.classList.contains('stopDetailCardDetail')
    );
    const deliveredStepperIndex = cardChildren.findIndex((child) =>
        child.classList.contains('stopDetailCardStepper')
    );
    const exceptionIndex = cardChildren.findIndex((child) =>
        child.classList.contains('stopDetailCardReason')
    );
    const exception = card.children[exceptionIndex];
    const exceptionChildren = Array.from(exception.children);
    const undeliveredIndex = exceptionChildren.findIndex((child) =>
        child.classList.contains('stopDetailRemaining')
    );
    const reasonLabelIndex = exceptionChildren.findIndex((child) =>
        child.classList.contains('stopDetailReasonLabel')
    );
    const extraSaleIndex = exceptionChildren.findIndex((child) =>
        child.classList.contains('stopDetailExtraSaleRelease')
    );

    expect(productIndex).toBeLessThan(deliveredStepperIndex);
    expect(deliveredStepperIndex).toBeLessThan(exceptionIndex);
    expect(undeliveredIndex).toBeLessThan(reasonLabelIndex);
    expect(reasonLabelIndex).toBeLessThan(extraSaleIndex);
    expect(extraSaleIndex).toBe(exceptionChildren.length - 1);
});
