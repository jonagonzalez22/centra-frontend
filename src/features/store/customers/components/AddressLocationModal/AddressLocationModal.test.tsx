import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { AddressLocationModal } from './AddressLocationModal';
import type { CustomerAddress } from '../../types/customerAddress.types';

vi.mock('../AddressMap/AddressMap', () => ({
    AddressMap: (props: { latitude: number; longitude: number; readOnly?: boolean }) => (
        <div
            data-testid="address-map"
            data-latitude={props.latitude}
            data-longitude={props.longitude}
            data-read-only={String(props.readOnly)}
        />
    ),
}));

vi.mock('../AddressMap/coordinates', () => ({
    toMapCoordinates: (latitude: unknown, longitude: unknown) => {
        const lat = typeof latitude === 'string' && latitude.trim() !== '' ? Number(latitude) : latitude;
        const lng = typeof longitude === 'string' && longitude.trim() !== '' ? Number(longitude) : longitude;
        if (typeof lat !== 'number' || typeof lng !== 'number'
            || !Number.isFinite(lat) || !Number.isFinite(lng)
            || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return null;
        }

        return { lat, lng };
    },
}));

vi.mock('@/components/Modal/Modal', () => ({
    default: ({
        open,
        children,
        title,
        afterOpenChange,
        onClose,
    }: {
        open: boolean;
        children: React.ReactNode;
        title: string;
        afterOpenChange?: (visible: boolean) => void;
        onClose: () => void;
    }) => (
        <div>
            <h2>{title}</h2>
            {open && (
                <>
                    <button type="button" onClick={() => afterOpenChange?.(true)}>
                        Modal visible
                    </button>
                    <button type="button" onClick={onClose}>
                        Cerrar modal
                    </button>
                </>
            )}
            {children}
        </div>
    ),
}));

const address: CustomerAddress = {
    id: 'address-1',
    customer_id: 'customer-1',
    street: 'San Martín',
    number: '123',
    floor: '2',
    apartment: 'B',
    postal_code: null,
    locality: {
        id: 'locality-1',
        name: 'Mendoza',
        province: { id: 'province-1', name: 'Mendoza' },
    },
    observations: null,
    type: 'delivery',
    latitude: -32.8895,
    longitude: -68.8458,
    is_main: true,
    created_at: '2026-09-10 12:00:00',
    updated_at: '2026-09-10 12:00:00',
};

const markModalVisible = () => fireEvent.click(screen.getByRole('button', { name: 'Modal visible' }));

test('initializes the read-only map only after the modal is visible', () => {
    render(<AddressLocationModal open address={address} onClose={vi.fn()} />);

    expect(screen.getByText('Ubicación del domicilio')).toBeInTheDocument();
    expect(screen.getByText('San Martín 123, Piso 2, Depto B')).toBeInTheDocument();
    expect(screen.getByText('Mendoza, Mendoza')).toBeInTheDocument();
    expect(screen.queryByTestId('address-map')).not.toBeInTheDocument();

    markModalVisible();

    expect(screen.getByTestId('address-map')).toHaveAttribute('data-latitude', '-32.8895');
    expect(screen.getByTestId('address-map')).toHaveAttribute('data-longitude', '-68.8458');
    expect(screen.getByTestId('address-map')).toHaveAttribute('data-read-only', 'true');
});

test('shows an actionable message without valid coordinates', () => {
    render(<AddressLocationModal open address={{ ...address, latitude: null }} onClose={vi.fn()} />);

    expect(screen.getByText('Ubicación del domicilio')).toBeInTheDocument();
    expect(screen.getByText(/todavía no tiene una ubicación válida/i)).toBeInTheDocument();
    expect(screen.queryByTestId('address-map')).not.toBeInTheDocument();
});

test('does not mount a map for coordinate strings that are not finite', () => {
    render(
        <AddressLocationModal
            open
            address={{ ...address, latitude: 'not-a-number' as unknown as number }}
            onClose={vi.fn()}
        />
    );

    expect(screen.getByText(/todavía no tiene una ubicación válida/i)).toBeInTheDocument();
    expect(screen.queryByTestId('address-map')).not.toBeInTheDocument();
});

test('normalizes numeric coordinate strings before passing them to the read-only map', () => {
    render(
        <AddressLocationModal
            open
            address={{ ...address, latitude: '-32.9449285' as unknown as number, longitude: '-68.8407279' as unknown as number }}
            onClose={vi.fn()}
        />
    );

    markModalVisible();

    expect(screen.getByTestId('address-map')).toHaveAttribute('data-latitude', '-32.9449285');
    expect(screen.getByTestId('address-map')).toHaveAttribute('data-longitude', '-68.8407279');
});

test('uses the newly selected address after closing and opening again', () => {
    const { rerender } = render(<AddressLocationModal open address={address} onClose={vi.fn()} />);
    markModalVisible();
    expect(screen.getByTestId('address-map')).toHaveAttribute('data-latitude', '-32.8895');

    rerender(<AddressLocationModal open={false} address={address} onClose={vi.fn()} />);
    rerender(
        <AddressLocationModal
            open
            address={{ ...address, street: 'Las Heras', latitude: -32.9, longitude: -68.9 }}
            onClose={vi.fn()}
        />
    );

    markModalVisible();

    expect(screen.getByText('Las Heras 123, Piso 2, Depto B')).toBeInTheDocument();
    expect(screen.getByTestId('address-map')).toHaveAttribute('data-latitude', '-32.9');
    expect(screen.getByTestId('address-map')).toHaveAttribute('data-longitude', '-68.9');
});

test('resets map initialization when the same address is closed and reopened', () => {
    const onClose = vi.fn();
    const { rerender } = render(<AddressLocationModal open address={address} onClose={onClose} />);
    markModalVisible();
    expect(screen.getByTestId('address-map')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar modal' }));
    expect(onClose).toHaveBeenCalledOnce();

    rerender(<AddressLocationModal open={false} address={address} onClose={onClose} />);
    rerender(<AddressLocationModal open address={address} onClose={onClose} />);

    expect(screen.queryByTestId('address-map')).not.toBeInTheDocument();
    markModalVisible();
    expect(screen.getByTestId('address-map')).toBeInTheDocument();
});
