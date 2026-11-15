import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { StopDetailFooter } from './StopDetailFooter';

const renderFooter = (showExtraSale: boolean, isCompleted = false) =>
    render(
        <StopDetailFooter
            canDeliver={!isCompleted}
            canConfirm={!isCompleted}
            completing={false}
            isCompleted={isCompleted}
            buttonLabel="Entregar todo"
            onPrimaryClick={vi.fn()}
            onFailedDeliveryClick={vi.fn()}
            onExtraSaleClick={vi.fn()}
            showExtraSale={showExtraSale && !isCompleted}
        />
    );

describe('StopDetailFooter extra sale visibility', () => {
    test('shows Venta Extra for an actionable stop with available surplus', () => {
        renderFooter(true);
        expect(screen.getByRole('button', { name: 'Venta Extra' })).toBeInTheDocument();
    });

    test('does not render Venta Extra without available surplus', () => {
        renderFooter(false);
        expect(screen.queryByRole('button', { name: 'Venta Extra' })).not.toBeInTheDocument();
    });

    test('does not render Venta Extra for a resolved stop', () => {
        renderFooter(true, true);
        expect(screen.queryByRole('button', { name: 'Venta Extra' })).not.toBeInTheDocument();
    });

    test('keeps the partial-delivery CTA and failed-delivery action available', () => {
        const onPrimaryClick = vi.fn();
        const onFailedDeliveryClick = vi.fn();

        render(
            <StopDetailFooter
                canDeliver
                canConfirm
                completing={false}
                isCompleted={false}
                buttonLabel="Confirmar entrega parcial"
                onPrimaryClick={onPrimaryClick}
                onFailedDeliveryClick={onFailedDeliveryClick}
                onExtraSaleClick={vi.fn()}
                showExtraSale={false}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Confirmar entrega parcial' }));
        fireEvent.click(screen.getByRole('button', { name: 'No se pudo entregar' }));

        expect(onPrimaryClick).toHaveBeenCalledOnce();
        expect(onFailedDeliveryClick).toHaveBeenCalledOnce();
    });
});
