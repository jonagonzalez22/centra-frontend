import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StoreUserForm } from './StoreUserForm';

describe('StoreUserForm', () => {
    test('shows friendly labels and submits the internal role value', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn().mockResolvedValue(undefined);

        render(
            <StoreUserForm
                loading={false}
                isEditing={true}
                onSubmit={onSubmit}
                roleOptions={[
                    { label: 'Empleado', value: 'STORE_USER' },
                    { label: 'Repartidor', value: 'STORE_DRIVER' },
                ]}
            />
        );

        await user.type(screen.getByLabelText('Nombre'), 'Juan Pérez');
        await user.type(screen.getByLabelText('Email'), 'juan@centra.com');
        await user.click(screen.getByLabelText('Rol'));
        expect(await screen.findByText('Empleado')).toBeInTheDocument();
        expect(screen.getByText('Repartidor')).toBeInTheDocument();

        await user.click(screen.getByText('Repartidor'));
        fireEvent.submit(screen.getByLabelText('Email').closest('form')!);

        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledWith(
                expect.objectContaining({ role: 'STORE_DRIVER' })
            );
        });
    });
});
