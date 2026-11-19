import { act, render, screen } from '@testing-library/react';
import type { DeliveryRoute } from '@/features/store/logistics/interfaces/route.interface';
import { RoutesService } from '@/features/store/logistics/services/routes.service';
import { loadGoogleMaps } from '@/utils/googleMaps';
import { RouteMapModal } from './RouteMapModal';

vi.mock('@/components/Modal/Modal', () => ({
    default: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
        open ? <div>{children}</div> : null,
}));
vi.mock('@/features/store/logistics/services/routes.service', () => ({
    RoutesService: { getMapGeometry: vi.fn() },
}));
vi.mock('@/utils/googleMaps', () => ({ loadGoogleMaps: vi.fn() }));

const route = (stops: DeliveryRoute['stops'] = []): DeliveryRoute =>
    ({
        id: 'route-1',
        store_id: 'store-1',
        route_name: null,
        operational_date: '2026-11-19',
        status: 'planned',
        observations: null,
        created_by: 'user-1',
        planned_at: null,
        departure_time: '08:00:00',
        unload_time_minutes_snapshot: 15,
        loaded_at: null,
        loaded_by: null,
        dispatched_at: null,
        dispatched_by: null,
        processed_at: null,
        processed_by: null,
        requires_recalculation: false,
        vehicle: null,
        driver: null,
        stops,
        operational_stops_count: stops.length,
        created_at: '2026-11-19 08:00:00',
        updated_at: '2026-11-19 08:00:00',
    }) as DeliveryRoute;

const activeStop = {
    id: 'stop-1',
    sequence: 1,
    status: 'pending',
    estimated_arrival_at: null,
    order: {
        operation_number: 'P-000001',
        customer: { name: 'Cliente', document: '', phone: null },
        address: { street: 'Calle', number: '1', latitude: -34.6, longitude: -58.4, locality: null },
    },
} as DeliveryRoute['stops'][number];

describe('RouteMapModal', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.mocked(RoutesService.getMapGeometry).mockReset();
        vi.mocked(loadGoogleMaps).mockReset();
    });

    afterEach(() => vi.useRealTimers());

    it('informa cuando la ruta no tiene paradas activas sin llamar a Google', () => {
        render(<RouteMapModal open route={route()} onClose={vi.fn()} />);

        expect(screen.getByText('La ruta no tiene paradas activas para mostrar.')).toBeInTheDocument();
        expect(RoutesService.getMapGeometry).not.toHaveBeenCalled();
    });

    it('muestra un error y permite reintentar cuando la geometría temporal no puede obtenerse', async () => {
        vi.mocked(RoutesService.getMapGeometry).mockRejectedValue(new Error('Proveedor no disponible'));
        render(<RouteMapModal open route={route([activeStop])} onClose={vi.fn()} />);

        await act(async () => {
            vi.advanceTimersByTime(400);
            await Promise.resolve();
            await Promise.resolve();
        });

        expect(screen.getByText('No se pudo mostrar el recorrido')).toBeInTheDocument();
        expect(screen.getByText('Proveedor no disponible')).toBeInTheDocument();

        await act(async () => {
            screen.getByRole('button', { name: 'Reintentar' }).click();
            await Promise.resolve();
        });

        expect(RoutesService.getMapGeometry).toHaveBeenCalledTimes(2);
    });

    it('cancela la solicitud de geometría al cerrar el modal', async () => {
        let requestSignal: AbortSignal | undefined;
        vi.mocked(RoutesService.getMapGeometry).mockImplementation((_id, signal) => {
            requestSignal = signal;
            return new Promise(() => {});
        });
        const { rerender } = render(<RouteMapModal open route={route([activeStop])} onClose={vi.fn()} />);

        await act(async () => {
            vi.advanceTimersByTime(400);
            await Promise.resolve();
        });
        expect(requestSignal?.aborted).toBe(false);

        rerender(<RouteMapModal open={false} route={route([activeStop])} onClose={vi.fn()} />);
        expect(requestSignal?.aborted).toBe(true);
    });

    it('muestra un único marcador de tienda con ícono y descripción de salida y regreso', async () => {
        const marker = vi.fn(function Marker(_options: Record<string, unknown>) {});
        const infoWindow = vi.fn(function InfoWindow(_options: Record<string, unknown>) {
            return { open: (_openOptions: Record<string, unknown>) => {} };
        });
        const size = vi.fn(function Size() {});
        const point = vi.fn(function Point() {});
        const map = vi.fn(function Map() {
            return { fitBounds: vi.fn() };
        });
        const bounds = { extend: vi.fn(), isEmpty: vi.fn(() => false) };
        vi.mocked(RoutesService.getMapGeometry).mockResolvedValue({ encoded_polyline: 'polyline' });
        vi.mocked(loadGoogleMaps).mockResolvedValue({
            Map: map,
            Marker: marker,
            Size: size,
            Point: point,
            Polyline: vi.fn(function Polyline() {}),
            LatLngBounds: vi.fn(function LatLngBounds() {
                return bounds;
            }),
            InfoWindow: infoWindow,
            geometry: { encoding: { decodePath: vi.fn(() => [{ lat: -34.6, lng: -58.4 }]) } },
            event: { addListener: vi.fn() },
        });

        render(<RouteMapModal open route={route([activeStop])} onClose={vi.fn()} />);

        await act(async () => {
            vi.advanceTimersByTime(400);
            await Promise.resolve();
        });
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
        });

        expect(marker).toHaveBeenCalledTimes(2);
        const storeMarkerOptions = marker.mock.calls[0]?.[0];
        if (!storeMarkerOptions) throw new Error('No se creó el marcador de tienda.');
        expect(storeMarkerOptions).toMatchObject({
            title: 'Tienda — Salida y regreso',
            position: { lat: -34.6, lng: -58.4 },
        });
        expect(storeMarkerOptions).not.toHaveProperty('label');
        expect((storeMarkerOptions.icon as { url: string }).url).toMatch(/^data:image\/svg\+xml/);
        expect(size).toHaveBeenCalledWith(44, 44);
        expect(point).toHaveBeenCalledWith(22, 22);
        expect(infoWindow).toHaveBeenCalledWith({ content: 'Tienda — Salida y regreso' });
    });
});
