import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { AuthLayout } from './AuthLayout';

describe('AuthLayout', () => {
    test('renders children', () => {
        render(
        <AuthLayout>
            <div>Test Content</div>
        </AuthLayout>
        );

    expect(screen.getByText('Test Content')).toBeDefined();
    });

    test('applies full height layout', () => {
        const { container } = render(
            <AuthLayout>
                <div>Content</div>
            </AuthLayout>
        );

    expect(container.firstChild).toHaveStyle('min-height: 100vh');
    });
});