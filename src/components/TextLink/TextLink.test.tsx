import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test } from 'vitest';
import TextLink from './TextLink';

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
