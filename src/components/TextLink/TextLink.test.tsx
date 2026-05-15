import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test, vi } from 'vitest';
import TextLink from './TextLink';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        Link: vi.fn(({ to, children, ...props }) => (
            <a href={String(to)} {...props}>{children}</a>
        )),
    };
});

describe('TextLink', () => {
    test('renders a navigation link', () => {
        render(
            <MemoryRouter>
                <TextLink to="/forgot-password">Olvidé contraseña</TextLink>
            </MemoryRouter>
        );

        expect(screen.getByRole('link', { name: /olvidé contraseña/i })).toHaveAttribute(
            'href',
            '/forgot-password'
        );
    });

    test('applies custom className', () => {
        render(
            <MemoryRouter>
                <TextLink to="/forgot-password" className="forgotPasswordLink">
                    Olvidé contraseña
                </TextLink>
            </MemoryRouter>
        );

        expect(screen.getByRole('link', { name: /olvidé contraseña/i })).toHaveClass(
            'forgotPasswordLink'
        );
    });

    test('renders a placeholder link', () => {
        render(
            <MemoryRouter>
                <TextLink to="#">Olvidé contraseña</TextLink>
            </MemoryRouter>
        );

        expect(screen.getByRole('link', { name: /olvidé contraseña/i })).toHaveAttribute(
            'href',
            '#'
        );
    });
});