import { render, screen } from '@testing-library/react';
import { DeliveryDecisionModal } from './DeliveryDecisionModal';

test('shows the informative amount without repeating it in the collect button', () => {
    render(
        <DeliveryDecisionModal
            open
            amountToCollectNow={142500}
            onDeliver={vi.fn()}
            onCollect={vi.fn()}
            onCancel={vi.fn()}
        />
    );

    expect(screen.getByText(/142\.500,00/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cobrar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Cobrar.*142\.500/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entregar sin cobrar' })).toBeInTheDocument();
});
