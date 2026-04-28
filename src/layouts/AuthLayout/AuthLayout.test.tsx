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

        expect(container.firstChild).toHaveClass('min-h-screen');
    });
});

test('renders multiple children correctly', () => {
    render(
        <AuthLayout>
            <div>Item 1</div>
            <div>Item 2</div>
        </AuthLayout>
    );

    expect(screen.getByText('Item 1')).toBeDefined();
    expect(screen.getByText('Item 2')).toBeDefined();
});

test('renders antd layout structure', () => {
    const { container } = render(
        <AuthLayout>
            <div>Content</div>
        </AuthLayout>
    );

    expect(container.querySelector('.ant-layout')).toBeInTheDocument();
});

test('renders header when provided', () => {
    render(
        <AuthLayout header={<div>Header</div>}>
            <div>Content</div>
        </AuthLayout>
    );

    expect(screen.getByText('Header')).toBeDefined();
});

test('renders sider when provided', () => {
    render(
        <AuthLayout sider={<div>Sider</div>}>
            <div>Content</div>
        </AuthLayout>
    );

    expect(screen.getByText('Sider')).toBeDefined();
});
