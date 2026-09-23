import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { User } from '@/entities/User';
import { PermissionDrawer } from './PermissionDrawer';
import { StoreUsersService } from '../../services/storeUsers.service';

vi.mock('../../services/storeUsers.service', () => ({
    StoreUsersService: {
        getPermissionCatalog: vi.fn(),
        getUserPermissions: vi.fn(),
        syncUserPermissions: vi.fn(),
    },
}));

const mockStoreUsersService = vi.mocked(StoreUsersService);

const user: User = {
    id: 24,
    name: 'María López',
    email: 'maria@centra.com',
    store_id: 1,
    store: null,
    roles: ['STORE_USER'],
    is_active: true,
    permissions: [],
    features: [],
};

describe('PermissionDrawer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockStoreUsersService.getPermissionCatalog.mockResolvedValue({
            Pedidos: [
                { name: 'orders.view', label: 'Ver' },
                { name: 'orders.edit', label: 'Editar' },
                { name: 'orders.collect', label: 'Registrar pagos' },
            ],
        });
        mockStoreUsersService.getUserPermissions.mockResolvedValue(['orders.view']);
        mockStoreUsersService.syncUserPermissions.mockResolvedValue();
    });

    test('shows functional labels while preserving permission codes for selection and saving', async () => {
        const onSuccess = vi.fn();
        const view = render(
            <PermissionDrawer open onClose={vi.fn()} onSuccess={onSuccess} user={user} />
        );

        await screen.findByText('Registrar pagos');

        expect(screen.getByText('Pedidos')).toBeInTheDocument();
        expect(screen.getByText('Ver')).toBeInTheDocument();
        expect(screen.getByText('Editar')).toBeInTheDocument();
        expect(screen.queryByText('orders.view')).not.toBeInTheDocument();
        expect(screen.queryByText('orders.edit')).not.toBeInTheDocument();
        expect(screen.queryByText('orders.collect')).not.toBeInTheDocument();

        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes[1]).toBeChecked();
        expect(checkboxes[2]).not.toBeChecked();

        const interaction = userEvent.setup({ delay: null });
        await interaction.click(checkboxes[2]);
        expect(checkboxes[2]).toBeChecked();

        await interaction.click(screen.getByRole('checkbox', { name: 'Seleccionar todo' }));
        expect(checkboxes[3]).toBeChecked();

        await interaction.click(screen.getByRole('button', { name: 'Guardar cambios' }));
        await waitFor(() => {
            expect(mockStoreUsersService.syncUserPermissions).toHaveBeenCalledWith(24, {
                permissions: ['orders.view', 'orders.edit', 'orders.collect'],
            });
        });
        expect(onSuccess).toHaveBeenCalledOnce();

        view.unmount();
        mockStoreUsersService.getUserPermissions.mockResolvedValue([
            'orders.view',
            'orders.edit',
            'orders.collect',
        ]);
        render(<PermissionDrawer open onClose={vi.fn()} onSuccess={onSuccess} user={user} />);

        await waitFor(() => {
            expect(screen.getAllByRole('checkbox')[3]).toBeChecked();
        });
    }, 10000);

    test('shows sales history permissions with user-facing labels', async () => {
        mockStoreUsersService.getPermissionCatalog.mockResolvedValue({
            'Historial de ventas': [
                { name: 'sales_history.view', label: 'Ver historial de ventas' },
                { name: 'sales_history.print', label: 'Reimprimir comprobantes' },
            ],
            Ventas: [{ name: 'sales.cancel', label: 'Cancelar ventas' }],
        });
        mockStoreUsersService.getUserPermissions.mockResolvedValue([]);

        render(<PermissionDrawer open onClose={vi.fn()} onSuccess={vi.fn()} user={user} />);

        expect(await screen.findByText('Ver historial de ventas')).toBeInTheDocument();
        expect(screen.getByText('Reimprimir comprobantes')).toBeInTheDocument();
        expect(screen.getByText('Cancelar ventas')).toBeInTheDocument();
        expect(screen.queryByText('sales_history.view')).not.toBeInTheDocument();
        expect(screen.queryByText('sales_history.print')).not.toBeInTheDocument();
    });
});
