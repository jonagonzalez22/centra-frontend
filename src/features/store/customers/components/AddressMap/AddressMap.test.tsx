import { render } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { AddressMap } from './AddressMap';

const marker = {
    addTo: vi.fn(),
    on: vi.fn(),
    setLatLng: vi.fn(),
    dragging: { disable: vi.fn(), enable: vi.fn() },
};
marker.addTo.mockReturnValue(marker);

const map = {
    setView: vi.fn(),
    invalidateSize: vi.fn(),
    remove: vi.fn(),
};

vi.mock('leaflet', () => ({
    default: {
        icon: vi.fn(),
        map: vi.fn(() => map),
        marker: vi.fn(() => marker),
        tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
    },
}));

test('uses a non-draggable marker and no coordinate callback in read-only mode', () => {
    const onCoordinatesChange = vi.fn();
    render(
        <AddressMap
            latitude={-32.8895}
            longitude={-68.8458}
            readOnly
            onCoordinatesChange={onCoordinatesChange}
        />
    );

    expect(marker.on).not.toHaveBeenCalled();
    expect(marker.dragging.disable).not.toHaveBeenCalled();
});

test('keeps the editable marker behavior for the address form', () => {
    const onCoordinatesChange = vi.fn();
    render(
        <AddressMap
            latitude={-32.8895}
            longitude={-68.8458}
            onCoordinatesChange={onCoordinatesChange}
        />
    );

    expect(marker.on).toHaveBeenCalledWith('dragend', expect.any(Function));
});

beforeEach(() => {
    vi.clearAllMocks();
    marker.addTo.mockReturnValue(marker);
});
