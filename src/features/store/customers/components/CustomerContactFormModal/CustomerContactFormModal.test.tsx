import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { CustomerContactFormModal } from './CustomerContactFormModal';

vi.mock('@/components/Modal/Modal', () => ({
    default: ({ children, footer }: { children: ReactNode; footer: ReactNode }) => (
        <div>
            {children}
            {footer}
        </div>
    ),
}));

vi.mock('@/components/Button', () => ({
    Button: ({
        label,
        action,
        htmlType,
    }: {
        label: string;
        action?: () => void;
        htmlType?: 'button' | 'submit';
    }) => (
        <button type={htmlType ?? 'button'} onClick={action}>
            {label}
        </button>
    ),
}));

const renderModal = (onCreate = vi.fn().mockResolvedValue(undefined)) => {
    render(
        <CustomerContactFormModal
            open
            onClose={vi.fn()}
            onSuccess={vi.fn()}
            onCreate={onCreate}
            onUpdate={vi.fn()}
        />
    );

    return onCreate;
};

test('shows the alternate contact-method guidance', () => {
    renderModal();

    expect(
        screen.getByText('Completá al menos un medio de contacto: email o teléfono.')
    ).toBeInTheDocument();
});

test('allows creating a contact with only a phone', async () => {
    const onCreate = renderModal();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Nombre'), 'María García');
    await user.type(screen.getByLabelText('Teléfono'), '+54 11 1234-5678');
    await user.click(screen.getByRole('button', { name: 'Crear' }));

    await waitFor(() =>
        expect(onCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'María García',
                email: null,
                phone: '+54 11 1234-5678',
            })
        )
    );
});
