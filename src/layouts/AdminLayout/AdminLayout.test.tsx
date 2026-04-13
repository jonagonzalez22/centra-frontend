import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { AdminLayout } from './AdminLayout';

describe('AdminLayout', () => {
    test('renders children content', () => {
        render(
            <AdminLayout>
                <div>Main Content</div>
            </AdminLayout>
        );

        expect(screen.getByText('Main Content')).toBeDefined();
    });

    test('renders header when provided', () => {
        render(
            <AdminLayout header={<div>Header Test</div>}>
                <div>Content</div>
            </AdminLayout>
        );

        expect(screen.getByText('Header Test')).toBeDefined();
    });

    test('renders sider when provided', () => {
        render(
            <AdminLayout sider={<div>Sider Test</div>}>
                <div>Content</div>
            </AdminLayout>
        );

        expect(screen.getByText('Sider Test')).toBeDefined();
    });

    test('does not break when header and sider are not provided', () => {
        render(
            <AdminLayout>
                <div>Only Content</div>
            </AdminLayout>
        );

        expect(screen.getByText('Only Content')).toBeDefined();
    });

    test('applies layout styles', () => {
        const { container } = render(
            <AdminLayout>
                <div>Styled</div>
            </AdminLayout>
        );

        expect(container.firstChild).toHaveStyle('min-height: 100vh');
    });
});

test('does not render header if not provided', () => {
    render(
        <AdminLayout>
            <div>Content</div>
        </AdminLayout>
    );

    expect(screen.queryByText('Header Test')).toBeNull();
});

test('does not render sider if not provided', () => {
    render(
        <AdminLayout>
            <div>Content</div>
        </AdminLayout>
    );

    expect(screen.queryByText('Sider Test')).toBeNull();
});

test('renders multiple children correctly', () => {
    render(
        <AdminLayout>
            <div>Item 1</div>
            <div>Item 2</div>
        </AdminLayout>
    );

    expect(screen.getByText('Item 1')).toBeDefined();
    expect(screen.getByText('Item 2')).toBeDefined();
});

test('renders antd layout structure', () => {
    const { container } = render(
        <AdminLayout>
            <div>Content</div>
        </AdminLayout>
    );

    expect(container.querySelector('.ant-layout')).toBeInTheDocument();
});
