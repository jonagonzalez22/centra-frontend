import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import type { Customer } from '@/features/store/customers/types/customer.types';
import { CustomerShowPageView } from './CustomerShowPageView';

vi.mock('@/components/Tabs', () => ({
    Tabs: ({ items }: { items: Array<{ key: string; label: string }> }) => (
        <div>{items.map((item) => <span key={item.key}>{item.label}</span>)}</div>
    ),
}));

vi.mock('@/features/store/customers/components/CustomerInfoForm', () => ({
    CustomerInfoForm: () => <div>Información del cliente</div>,
}));

vi.mock('@/features/store/customers/components/CustomerContactsTab', () => ({
    CustomerContactsTab: () => <div>Contactos del cliente</div>,
}));

vi.mock('@/features/store/customers/components/AddressesTab', () => ({
    AddressesTab: () => <div>Domicilios del cliente</div>,
}));

const customer = {
    id: 'customer-1',
    customer_code: 'C-001',
    display_name: 'Cliente de prueba',
    first_name: null,
    last_name: null,
    company_name: null,
    document_type: { id: 'document-type-1', code: 'DNI', name: 'DNI' },
    document_number: '12345678',
    status: 'active',
    has_location: false,
    blocked_at: null,
    notes: null,
    created_by: null,
    updated_by: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
} satisfies Customer;

const renderPage = (canViewAddresses: boolean, canViewContacts: boolean) => render(
    <MemoryRouter>
        <CustomerShowPageView
            customer={customer}
            form={{} as never}
            loading={false}
            documentTypeOptions={[]}
            documentTypesLoading={false}
            breadcrumbs={[{ label: 'Clientes', path: '/store/customers' }, { label: customer.display_name }]}
            onSubmit={vi.fn()}
            onBack={vi.fn()}
            canEdit={false}
            canViewAddresses={canViewAddresses}
            canViewContacts={canViewContacts}
        />
    </MemoryRouter>,
);

test('does not expose address or contact tabs without their read permissions', () => {
    renderPage(false, false);

    expect(screen.getByText('Información General')).toBeInTheDocument();
    expect(screen.queryByText('Domicilios')).not.toBeInTheDocument();
    expect(screen.queryByText('Contactos')).not.toBeInTheDocument();
});

test('exposes only the nested resources the user may read', () => {
    renderPage(true, false);

    expect(screen.getByText('Domicilios')).toBeInTheDocument();
    expect(screen.queryByText('Contactos')).not.toBeInTheDocument();
});
