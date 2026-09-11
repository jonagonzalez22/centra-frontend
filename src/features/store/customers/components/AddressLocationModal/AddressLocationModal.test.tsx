import { render, screen } from '@testing-library/react';
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

test('shows address details and a read-only map using the saved coordinates', () => {
    render(<AddressLocationModal open address={address} onClose={vi.fn()} />);

    expect(screen.getByText('Ubicación del domicilio')).toBeInTheDocument();
    expect(screen.getByText('San Martín 123, Piso 2, Depto B')).toBeInTheDocument();
    expect(screen.getByText('Mendoza, Mendoza')).toBeInTheDocument();
    expect(screen.getByTestId('address-map')).toHaveAttribute('data-latitude', '-32.8895');
    expect(screen.getByTestId('address-map')).toHaveAttribute('data-longitude', '-68.8458');
    expect(screen.getByTestId('address-map')).toHaveAttribute('data-read-only', 'true');
});

test('does not render without complete coordinates', () => {
    render(<AddressLocationModal open address={{ ...address, latitude: null }} onClose={vi.fn()} />);

    expect(screen.queryByText('Ubicación del domicilio')).not.toBeInTheDocument();
});

test('uses the newly selected address after closing and opening again', () => {
    const { rerender } = render(<AddressLocationModal open address={address} onClose={vi.fn()} />);
    expect(screen.getByTestId('address-map')).toHaveAttribute('data-latitude', '-32.8895');

    rerender(<AddressLocationModal open={false} address={address} onClose={vi.fn()} />);
    rerender(
        <AddressLocationModal
            open
            address={{ ...address, street: 'Las Heras', latitude: -32.9, longitude: -68.9 }}
            onClose={vi.fn()}
        />
    );

    expect(screen.getByText('Las Heras 123, Piso 2, Depto B')).toBeInTheDocument();
    expect(screen.getByTestId('address-map')).toHaveAttribute('data-latitude', '-32.9');
    expect(screen.getByTestId('address-map')).toHaveAttribute('data-longitude', '-68.9');
});
