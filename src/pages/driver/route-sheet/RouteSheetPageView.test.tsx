import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RouteSheetPageView } from './RouteSheetPageView';
import type { RouteStopsItem } from '@/features/driver/interfaces/driver.interface';

const stop = (deliveryReference: string | null): RouteStopsItem => ({
    id: 'stop-1',
    sequence: 1,
    status: 'pending',
    delivery_reference: deliveryReference,
    customer: { name: 'Cliente de prueba', phone: null },
    address: {
        street: 'Av. Siempre Viva 742',
        locality: 'Mendoza',
        latitude: null,
        longitude: null,
        notes: null,
    },
    notification_window_start: '09:20',
    notification_window_end: '10:20',
    order: { total: 5000, paid_amount: 3000, pending_amount: 2000 },
});

const renderPage = (
    deliveryReference: string | null,
    onStopPress = vi.fn(),
    overrides: Partial<RouteStopsItem> = {}
) =>
    render(
        <MemoryRouter>
            <RouteSheetPageView
                title="Hoja de ruta"
                breadcrumbs={[]}
                stops={[{ ...stop(deliveryReference), ...overrides }]}
                loading={false}
                error={null}
                onRefresh={vi.fn()}
                onStopPress={onStopPress}
            />
        </MemoryRouter>
    );

describe('RouteSheetPageView stop cards', () => {
    test('shows the customer, delivery address, reference, schedule and balance compactly', () => {
        renderPage('Casa de color marrón con blanco.');

        expect(screen.getByText('Cliente de prueba')).toBeInTheDocument();
        expect(screen.getByText('Av. Siempre Viva 742, Mendoza')).toBeInTheDocument();
        expect(screen.getByText('Casa de color marrón con blanco.')).toBeInTheDocument();
        expect(screen.queryByText('Referencia para la entrega')).not.toBeInTheDocument();
        expect(screen.getByText('09:20 hs – 10:20 hs')).toBeInTheDocument();
        expect(screen.getByText('Saldo:')).toBeInTheDocument();
        expect(screen.getByText(/2\.000/)).toBeInTheDocument();
    });

    test('does not leave an empty reference block when the address has none', () => {
        renderPage(null);

        expect(screen.queryByText('Referencia para la entrega')).not.toBeInTheDocument();
    });

    test('renders the complete long reference without truncation inside the responsive card', () => {
        const longReference = 'Acceso por el portón lateral. '.repeat(20);
        renderPage(longReference);

        const text = document.querySelector('.routeSheetStopReferenceText');
        expect(text?.textContent).toBe(longReference);
        expect(text).toHaveClass('routeSheetStopReferenceText');
    });

    test('preserves every manual line break in a multi-line delivery reference', () => {
        const reference = 'Portón lateral\nCasa al fondo\nTimbre junto a la ventana';
        renderPage(reference);

        expect(document.querySelector('.routeSheetStopReferenceText')?.textContent).toBe(reference);
    });

    test('renders long unbroken words without removing delivery instructions', () => {
        const reference = `Código:${'A'.repeat(120)}`;
        renderPage(reference);

        expect(screen.getByText(reference)).toBeInTheDocument();
    });

    test('opens the stop detail from the card using mouse and keyboard', async () => {
        const onStopPress = vi.fn();
        const user = userEvent.setup();
        renderPage(null, onStopPress);

        const card = screen.getByRole('button', {
            name: 'Ver detalle de la parada 1 de Cliente de prueba',
        });
        await user.click(card);
        await user.keyboard('{Enter}');

        expect(onStopPress).toHaveBeenCalledTimes(2);
        expect(onStopPress).toHaveBeenCalledWith('stop-1');
    });

    test('keeps Maps as an independent accessible action', async () => {
        const onStopPress = vi.fn();
        const user = userEvent.setup();
        renderPage(null, onStopPress, {
            address: { ...stop(null).address!, latitude: -32.889, longitude: -68.845 },
        });

        const maps = screen.getByRole('link', { name: 'Maps' });
        expect(maps).toHaveAttribute(
            'href',
            'https://www.google.com/maps/dir/?api=1&destination=-32.889,-68.845'
        );
        await user.click(maps);
        expect(onStopPress).not.toHaveBeenCalled();
    });

    test('shows three independent footer actions for a valid customer phone', async () => {
        const onStopPress = vi.fn();
        const user = userEvent.setup();
        renderPage(null, onStopPress, {
            customer: { name: 'Cliente de prueba', phone: '+54 9 261 555-1234' },
        });

        const maps = screen.getByRole('link', { name: 'Maps' });
        const whatsapp = screen.getByRole('link', { name: 'Contactar por WhatsApp' });
        const phone = screen.getByRole('link', { name: 'Llamar al cliente' });

        expect(whatsapp).toHaveAttribute('href', 'https://wa.me/5492615551234');
        expect(phone).toHaveAttribute('href', 'tel:+54 9 261 555-1234');
        expect(maps.parentElement).toHaveClass('routeSheetStopCardFooter--3-actions');

        await user.click(whatsapp);
        await user.click(phone);
        expect(onStopPress).not.toHaveBeenCalled();
    });

    test('only shows Maps when the customer contact phone is absent or invalid', () => {
        const { rerender } = renderPage(null, vi.fn(), {
            customer: { name: 'Cliente de prueba', phone: null },
        });

        expect(screen.getByRole('link', { name: 'Maps' }).parentElement).toHaveClass(
            'routeSheetStopCardFooter--1-actions'
        );
        expect(screen.queryByRole('link', { name: 'Contactar por WhatsApp' })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Llamar al cliente' })).not.toBeInTheDocument();

        rerender(
            <MemoryRouter>
                <RouteSheetPageView
                    title="Hoja de ruta"
                    breadcrumbs={[]}
                    stops={[
                        {
                            ...stop(null),
                            customer: { name: 'Cliente de prueba', phone: '---' },
                        },
                    ]}
                    loading={false}
                    error={null}
                    onRefresh={vi.fn()}
                    onStopPress={vi.fn()}
                />
            </MemoryRouter>
        );

        expect(screen.queryByRole('link', { name: 'Contactar por WhatsApp' })).not.toBeInTheDocument();
    });

    test('visually emphasizes a positive balance but not a zero balance', () => {
        const { rerender } = renderPage(null);
        expect(document.querySelector('.routeSheetStopBalance')).toHaveClass(
            'routeSheetStopBalance--pending'
        );

        rerender(
            <MemoryRouter>
                <RouteSheetPageView
                    title="Hoja de ruta"
                    breadcrumbs={[]}
                    stops={[{ ...stop(null), order: { total: 5000, paid_amount: 5000, pending_amount: 0 } }]}
                    loading={false}
                    error={null}
                    onRefresh={vi.fn()}
                    onStopPress={vi.fn()}
                />
            </MemoryRouter>
        );

        expect(screen.getByText('Pedido pagado').closest('.routeSheetStopBalance')).toHaveClass(
            'routeSheetStopBalance--paid'
        );
    });

    test('keeps completed stops identifiable with their visual sequence state', async () => {
        const user = userEvent.setup();
        renderPage(null, vi.fn(), { status: 'completed', sequence: 12 });
        await user.click(screen.getByRole('tab', { name: 'Completados (1)' }));

        expect(screen.getByText('✓').closest('.routeSheetStopSequence')).toHaveClass(
            'sequenceCompleted'
        );
    });
});
