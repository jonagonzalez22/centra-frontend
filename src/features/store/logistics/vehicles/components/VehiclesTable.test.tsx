import { render, screen, within } from '@testing-library/react';
import { VehiclesTable } from './VehiclesTable';
import type { Vehicle } from '../interfaces/vehicle.interface';

vi.mock('@/components/auth/CanDo', () => ({
    CanDo: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const vehicle: Vehicle = {
    id: 'vehicle-1',
    name: 'Peugeot Partner Furgón',
    plate: 'VW-1234',
    type: 'camioneta',
    capacity_kg: 700,
    is_active: true,
    inactivation_reason: null,
    inactivation_notes: null,
    created_at: '',
    updated_at: '',
};

describe('VehiclesTable', () => {
    test('keeps the desktop table and renders the equivalent mobile card actions', () => {
        render(
            <VehiclesTable
                items={[vehicle]}
                loading={false}
                current={1}
                pageSize={15}
                total={1}
                onPageChange={vi.fn()}
                onEdit={vi.fn()}
                onDeactivate={vi.fn()}
                onActivate={vi.fn()}
                onDelete={vi.fn()}
            />
        );

        expect(document.querySelector('.vehiclesTableDesktop')).toHaveTextContent('Vehículo');
        const mobile = screen.getByTestId('vehicles-mobile-list');
        const card = within(mobile).getByRole('article');
        expect(card).toHaveTextContent('Peugeot Partner Furgón');
        expect(card).toHaveTextContent('VW-1234');
        expect(card).toHaveTextContent('Camioneta');
        expect(card).toHaveTextContent('700 kg');
        expect(within(card).getByRole('button', { name: 'Editar' })).toBeInTheDocument();
        expect(within(card).getByRole('button', { name: 'Desactivar' })).toBeInTheDocument();
        expect(within(card).getByRole('button', { name: 'Eliminar' })).toBeInTheDocument();
    });
});
