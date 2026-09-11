import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';
import { AddressesTab } from './AddressesTab';
import { useCustomerAddresses } from '../../hooks/useCustomerAddresses';
import type { CustomerAddress } from '../../types/customerAddress.types';

vi.mock('../../hooks/useCustomerAddresses', () => ({ useCustomerAddresses: vi.fn() }));
vi.mock('@/components/auth/CanDo', () => ({ CanDo: () => null }));
vi.mock('../AddressFormDrawer', () => ({ AddressFormDrawer: () => null }));
vi.mock('../AddressLocationModal', () => ({
    AddressLocationModal: ({ open, address, onClose }: { open: boolean; address: CustomerAddress | null; onClose: () => void }) =>
        open ? (
            <div role="dialog">
                <span>{address?.street}</span>
                <button onClick={onClose}>Cerrar ubicación</button>
            </div>
        ) : null,
}));

const mockedUseCustomerAddresses = vi.mocked(useCustomerAddresses);

const address: CustomerAddress = {
    id: 'address-1',
    customer_id: 'customer-1',
    street: 'San Martín',
    number: '123',
    floor: null,
    apartment: null,
    postal_code: null,
    locality: null,
    observations: null,
    type: 'delivery',
    latitude: -32.8895,
    longitude: -68.8458,
    is_main: true,
    created_at: '2026-09-10 12:00:00',
    updated_at: '2026-09-10 12:00:00',
};

beforeEach(() => {
    mockedUseCustomerAddresses.mockReturnValue({
        addresses: [address],
        loading: false,
        refetch: vi.fn(),
        createAddress: vi.fn(),
        updateAddress: vi.fn(),
        deleteAddress: vi.fn(),
    });
});

test('shows view location without requiring the edit permission and opens the modal', () => {
    render(<AddressesTab customerId="customer-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Ver ubicación' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveTextContent('San Martín');

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar ubicación' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test.each([
    ['latitude', { latitude: null }],
    ['longitude', { longitude: null }],
])('does not show view location when %s is missing', (_field, coordinates) => {
    mockedUseCustomerAddresses.mockReturnValue({
        addresses: [{ ...address, ...coordinates }],
        loading: false,
        refetch: vi.fn(),
        createAddress: vi.fn(),
        updateAddress: vi.fn(),
        deleteAddress: vi.fn(),
    });

    render(<AddressesTab customerId="customer-1" />);

    expect(screen.queryByRole('button', { name: 'Ver ubicación' })).not.toBeInTheDocument();
});
