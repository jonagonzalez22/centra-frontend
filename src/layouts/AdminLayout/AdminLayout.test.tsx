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
});


