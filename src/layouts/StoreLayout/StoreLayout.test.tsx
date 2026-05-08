import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { StoreLayout } from './StoreLayout';
import { MemoryRouter } from 'react-router-dom';

describe('StoreLayout', () => {
    const renderWithRouter = (ui: React.ReactElement) => {
        return render(<MemoryRouter>{ui}</MemoryRouter>);
    };

    test('renders children', () => {
        renderWithRouter(
            <StoreLayout>
                <div>Store Content</div>
            </StoreLayout>
        );

        expect(screen.getByText('Store Content')).toBeDefined();
    });

    test('renders correctly with only children', () => {
        renderWithRouter(
            <StoreLayout>
                <div>Only Content</div>
            </StoreLayout>
        );

        expect(screen.getByText('Only Content')).toBeDefined();
    });

    test('applies layout class', () => {
        const { container } = renderWithRouter(
            <StoreLayout>
                <div>Styled</div>
            </StoreLayout>
        );

        expect(container.firstChild).toHaveClass('storeLayout');
    });

    test('renders multiple children correctly', () => {
        renderWithRouter(
            <StoreLayout>
                <div>Item 1</div>
                <div>Item 2</div>
            </StoreLayout>
        );

        expect(screen.getByText('Item 1')).toBeDefined();
        expect(screen.getByText('Item 2')).toBeDefined();
    });

    test('renders antd layout structure', () => {
        const { container } = renderWithRouter(
            <StoreLayout>
                <div>Content</div>
            </StoreLayout>
        );

        expect(container.querySelector('.ant-layout')).toBeInTheDocument();
    });
});
