import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DriverRoutesPageView } from './DriverRoutesPageView';

describe('DriverRoutesPageView', () => {
    test('shows the operational empty state when the driver has no active route', () => {
        render(
            <MemoryRouter>
                <DriverRoutesPageView
                    title="Mis Rutas"
                    description="Rutas asignadas para hoy"
                    breadcrumbs={[{ label: 'Conductor' }]}
                    activeRoute={null}
                    loading={false}
                    error={null}
                    onRefresh={vi.fn()}
                    onRoutePress={vi.fn()}
                />
            </MemoryRouter>
        );

        expect(screen.getByText('No tenés rutas activas.')).toBeInTheDocument();
        expect(
            screen.getByText(
                'Cuando tengas una ruta asignada y disponible para repartir, vas a poder consultarla desde acá.'
            )
        ).toBeInTheDocument();
    });
});
