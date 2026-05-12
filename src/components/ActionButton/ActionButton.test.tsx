import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ActionButton from './ActionButton';
import { EyeOutlined, EditOutlined } from '@ant-design/icons';

describe('ActionButton', () => {
    test('renders the icon and label', () => {
        render(<ActionButton icon={<EyeOutlined />} label="Ver" />);

        expect(screen.getByRole('button', { name: /Ver/i })).toBeDefined();
    });

    test('calls action when clicked', async () => {
        const user = userEvent.setup();
        const action = vi.fn();

        render(<ActionButton icon={<EditOutlined />} label="Editar" action={action} />);

        await user.click(screen.getByRole('button', { name: /Editar/i }));

        expect(action).toHaveBeenCalled();
    });

    test('does not call action when disabled', async () => {
        const user = userEvent.setup();
        const action = vi.fn();

        render(
            <ActionButton
                icon={<EditOutlined />}
                label="Editar"
                action={action}
                disabled
            />
        );

        await user.click(screen.getByRole('button', { name: /Editar/i }));

        expect(action).not.toHaveBeenCalled();
    });

    test('renders as link when href is provided', () => {
        render(
            <MemoryRouter>
                <ActionButton icon={<EyeOutlined />} label="Ver" href="/test" />
            </MemoryRouter>
        );

        const link = screen.getByRole('link', { name: /Ver/i });
        expect(link).toBeDefined();
        expect(link).toHaveAttribute('href', '/test');
    });
});