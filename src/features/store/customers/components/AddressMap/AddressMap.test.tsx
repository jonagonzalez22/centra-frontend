import { render, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { AddressMap } from './AddressMap';
import { loadGoogleMaps } from '@/utils/googleMaps';

vi.mock('@/utils/googleMaps', () => ({ loadGoogleMaps: vi.fn() }));

const marker = { setPosition: vi.fn(), setDraggable: vi.fn(), getPosition: vi.fn(() => null) };
const map = { fitBounds: vi.fn(), setCenter: vi.fn(), setZoom: vi.fn() };
const maps = {
    Map: vi.fn(function Map() { return map; }), Marker: vi.fn(function Marker() { return marker; }),
    Size: vi.fn(), Point: vi.fn(), Polyline: vi.fn(), LatLngBounds: vi.fn(), InfoWindow: vi.fn(),
    geometry: { encoding: { decodePath: vi.fn() } }, event: { addListener: vi.fn() },
};

beforeEach(() => { vi.clearAllMocks(); vi.mocked(loadGoogleMaps).mockResolvedValue(maps); });

test('renders Google Maps and a draggable marker in the address form', async () => {
    render(<AddressMap latitude={-32.8895} longitude={-68.8458} onCoordinatesChange={vi.fn()} />);
    await waitFor(() => expect(maps.Map).toHaveBeenCalled());
    expect(maps.Marker).toHaveBeenCalledWith(expect.objectContaining({ draggable: true }));
});

test('keeps the marker non-draggable in read-only mode', async () => {
    render(<AddressMap latitude={-32.8895} longitude={-68.8458} readOnly />);
    await waitFor(() => expect(maps.Marker).toHaveBeenCalled());
    expect(maps.Marker).toHaveBeenCalledWith(expect.objectContaining({ draggable: false }));
});

test('normalizes numeric coordinate strings before creating a marker', async () => {
    render(<AddressMap latitude="-32.9449285" longitude="-68.8407279" readOnly />);

    await waitFor(() => expect(maps.Marker).toHaveBeenCalledWith(expect.objectContaining({
        position: { lat: -32.9449285, lng: -68.8407279 },
    })));
});

test('allows selecting a manual point when there is no marker yet', async () => {
    const onCoordinatesChange = vi.fn();
    let clickHandler: ((event?: unknown) => void) | undefined;
    maps.event.addListener.mockImplementation((_instance, event, handler) => {
        if (event === 'click') clickHandler = handler;
    });

    render(<AddressMap latitude={null} longitude={null} onCoordinatesChange={onCoordinatesChange} />);
    await waitFor(() => expect(clickHandler).toBeDefined());

    clickHandler?.({ latLng: { lat: () => -32.9449285, lng: () => -68.8407279 } });

    expect(onCoordinatesChange).toHaveBeenCalledWith(-32.9449285, -68.8407279);
    expect(maps.Marker).toHaveBeenCalledWith(expect.objectContaining({
        position: { lat: -32.9449285, lng: -68.8407279 },
    }));
});

test.each([
    [null, -68.8],
    [-32.9, null],
    ['', '-68.8'],
    ['not-a-number', '-68.8'],
    [Number.NaN, -68.8],
    [Number.POSITIVE_INFINITY, -68.8],
    [-91, -68.8],
    [-32.9, -181],
])('does not create a marker for invalid coordinates (%p, %p)', async (latitude, longitude) => {
    const { findByText } = render(<AddressMap latitude={latitude} longitude={longitude} readOnly />);

    expect(await findByText('Este domicilio todavía no tiene una ubicación válida.')).toBeInTheDocument();
    expect(maps.Marker).not.toHaveBeenCalled();
    expect(map.setCenter).not.toHaveBeenCalled();
});

test('updates the map and marker when a different saved address is selected', async () => {
    const { rerender } = render(<AddressMap latitude={-32.8895} longitude={-68.8458} readOnly />);
    await waitFor(() => expect(maps.Marker).toHaveBeenCalledWith(expect.objectContaining({ position: { lat: -32.8895, lng: -68.8458 } })));

    rerender(<AddressMap latitude={-32.9449} longitude={-68.8407} readOnly />);

    await waitFor(() => expect(maps.Marker).toHaveBeenCalledWith(expect.objectContaining({ position: { lat: -32.9449, lng: -68.8407 } })));
});

test('shows a fallback when Google Maps fails to load', async () => {
    vi.mocked(loadGoogleMaps).mockRejectedValueOnce(new Error('No se pudo cargar Google Maps.'));

    const { findByText } = render(<AddressMap latitude={-32.8895} longitude={-68.8458} readOnly />);

    expect(await findByText('No se pudo cargar Google Maps.')).toBeInTheDocument();
});
