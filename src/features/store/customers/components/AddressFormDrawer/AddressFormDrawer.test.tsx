import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { forwardRef, useEffect } from 'react';
import { vi } from 'vitest';
import { AddressFormDrawer } from './AddressFormDrawer';
import api from '@/api/api.config';

vi.mock('@/api/api.config', () => ({ default: { get: vi.fn() } }));

vi.mock('@/components/Drawer', () => ({
    Drawer: ({ open, children, footer }: { open: boolean; children: React.ReactNode; footer: React.ReactNode }) => open ? (
        <div>
            <div className="ant-drawer-body">{children}</div>
            {footer}
        </div>
    ) : null,
}));

vi.mock('@/components/Button', () => ({
    Button: ({ label, action, disabled, loading }: { label?: string; action?: () => void; disabled?: boolean; loading?: boolean }) => (
        <button type="button" onClick={action} disabled={disabled || loading}>{label}</button>
    ),
}));

vi.mock('../AddressMap', () => ({
    AddressMap: forwardRef(({ onCoordinatesChange }: { onCoordinatesChange?: (lat: number, lng: number) => void }, ref) => {
        void ref;
        return <button type="button" onClick={() => onCoordinatesChange?.(-32.9449285, -68.8407279)}>Elegir punto</button>;
    }),
}));

vi.mock('antd', async (importOriginal) => {
    const actual = await importOriginal<typeof import('antd')>();

    return {
        ...actual,
        Modal: ({ open, title, children, footer, onCancel, afterOpenChange }: { open: boolean; title: string; children: React.ReactNode; footer: React.ReactNode; onCancel: () => void; afterOpenChange?: (visible: boolean) => void }) => {
            useEffect(() => {
                afterOpenChange?.(open);
            }, [afterOpenChange, open]);

            return open ? (
                <div role="dialog" aria-label={title}>
                    <h2>{title}</h2>
                    <button type="button" aria-label="Cerrar modal" onClick={onCancel}>×</button>
                    {children}
                    {footer}
                </div>
            ) : null;
        },
    };
});

const onCreate = vi.fn().mockResolvedValue(undefined);

const renderDrawer = () => render(
    <AddressFormDrawer
        open
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        addresses={[]}
        onCreate={onCreate}
        onUpdate={vi.fn()}
    />
);

const selectOption = async (index: number, label: string) => {
    fireEvent.mouseDown(screen.getAllByRole('combobox')[index].parentElement!);
    fireEvent.click(await screen.findByText(label));
};

const completeDeliveryForm = async () => {
    fireEvent.change(screen.getByLabelText('Calle'), { target: { value: 'Portugal' } });
    fireEvent.change(screen.getByLabelText('Altura'), { target: { value: '1570' } });
    await selectOption(0, 'Mendoza');
    await selectOption(1, 'Godoy Cruz');
    await selectOption(2, 'Entrega');
};

const completeOtherForm = async () => {
    fireEvent.change(screen.getByLabelText('Calle'), { target: { value: 'Portugal' } });
    fireEvent.change(screen.getByLabelText('Altura'), { target: { value: '1570' } });
    await selectOption(0, 'Mendoza');
    await selectOption(1, 'Godoy Cruz');
    await selectOption(2, 'Otro');
};

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockImplementation((url: string) => Promise.resolve({
        data: {
            data: {
                items: url.includes('provinces')
                    && !url.includes('localities')
                    ? [{ id: 'province-1', name: 'Mendoza' }]
                    : [{ id: 'locality-1', name: 'Godoy Cruz' }],
            },
        },
    }));
    HTMLElement.prototype.scrollTo = vi.fn();
});

test('shows confirmation before saving a delivery address without coordinates', async () => {
    renderDrawer();
    await completeDeliveryForm();

    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));

    expect(await screen.findByRole('dialog', { name: '¿Querés confirmar la ubicación?' })).toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();
});

test('does not open location confirmation while required form fields are invalid', async () => {
    renderDrawer();

    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));

    expect(await screen.findByText('La calle es obligatoria.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: '¿Querés confirmar la ubicación?' })).not.toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();
});

test('keeps the form open and scrolls to the location section for review', async () => {
    renderDrawer();
    await completeDeliveryForm();
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));
    await screen.findByRole('dialog', { name: '¿Querés confirmar la ubicación?' });

    fireEvent.click(screen.getByRole('button', { name: 'Ir al mapa y confirmar' }));

    expect(screen.queryByRole('dialog', { name: '¿Querés confirmar la ubicación?' })).not.toBeInTheDocument();
    await waitFor(() => expect(HTMLElement.prototype.scrollTo).toHaveBeenCalled());
    expect(onCreate).not.toHaveBeenCalled();
});

test('saves an unconfirmed delivery address only after explicit secondary action', async () => {
    const onSuccess = vi.fn();
    render(
        <AddressFormDrawer open onClose={vi.fn()} onSuccess={onSuccess} addresses={[]} onCreate={onCreate} onUpdate={vi.fn()} />
    );
    await completeDeliveryForm();
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));
    await screen.findByRole('dialog', { name: '¿Querés confirmar la ubicación?' });

    fireEvent.click(screen.getByRole('button', { name: 'Guardar sin confirmar' }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({
        confirm_location: false,
        latitude: null,
        longitude: null,
    })));
    expect(onSuccess).toHaveBeenCalledOnce();
});

test('prevents duplicate unconfirmed saves while the request is pending', async () => {
    let resolveCreate: (() => void) | undefined;
    onCreate.mockImplementationOnce(() => new Promise<void>((resolve) => { resolveCreate = resolve; }));
    renderDrawer();
    await completeDeliveryForm();
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));
    await screen.findByRole('dialog', { name: '¿Querés confirmar la ubicación?' });

    const saveWithoutConfirmation = screen.getByRole('button', { name: 'Guardar sin confirmar' });
    fireEvent.click(saveWithoutConfirmation);
    fireEvent.click(saveWithoutConfirmation);

    expect(onCreate).toHaveBeenCalledTimes(1);
    resolveCreate?.();
});

test('saves directly after the user confirms a selected point', async () => {
    renderDrawer();
    await completeDeliveryForm();
    fireEvent.click(screen.getByRole('button', { name: 'Elegir punto' }));
    expect(screen.getByText('Ubicación pendiente de confirmación')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Confirmar este punto de entrega' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar este punto de entrega' }));
    expect(screen.getByText('Ubicación lista para entregas')).toBeInTheDocument();
    expect(screen.getByText('El punto de entrega está verificado. Guardá el domicilio para conservar los cambios.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({
        confirm_location: true,
        latitude: -32.9449285,
        longitude: -68.8407279,
    })));
    expect(screen.queryByRole('dialog', { name: '¿Querés confirmar la ubicación?' })).not.toBeInTheDocument();
});

test('uses neutral location messages for another address type', async () => {
    renderDrawer();
    await completeOtherForm();

    expect(screen.getByText('Ubicación del domicilio')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Elegir punto' }));

    expect(screen.getByText('Ubicación pendiente de confirmación')).toBeInTheDocument();
    expect(screen.getByText('Verificá que el marcador coincida con la dirección del domicilio. Podés moverlo para ajustarlo.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar ubicación' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirmar este punto de entrega' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar ubicación' }));

    expect(screen.getByText('Ubicación confirmada')).toBeInTheDocument();
    expect(screen.getByText('El punto del domicilio está verificado. Guardá el domicilio para conservar los cambios.')).toBeInTheDocument();
    expect(screen.queryByText('Ubicación lista para entregas')).not.toBeInTheDocument();
});

test('updates location wording when the address type changes', async () => {
    renderDrawer();
    await completeDeliveryForm();
    fireEvent.click(screen.getByRole('button', { name: 'Elegir punto' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Confirmar este punto de entrega' })).toBeInTheDocument());

    await selectOption(2, 'Otro');

    await waitFor(() => expect(screen.getByText('Ubicación del domicilio')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Confirmar ubicación' })).toBeInTheDocument();
});

test('does not offer confirmation before a point has been selected', async () => {
    renderDrawer();

    expect(screen.getByText('Seleccioná un punto en el mapa, buscá una dirección o pegá una ubicación para poder confirmarla.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirmar este punto de entrega' })).not.toBeInTheDocument();
});

test('cancels the decision without submitting or clearing form values', async () => {
    renderDrawer();
    await completeDeliveryForm();
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));
    await screen.findByRole('dialog', { name: '¿Querés confirmar la ubicación?' });

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar modal' }));

    expect(onCreate).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Calle')).toHaveValue('Portugal');
});
