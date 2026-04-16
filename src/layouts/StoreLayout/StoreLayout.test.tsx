import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { StoreLayout } from './StoreLayout';

describe('StoreLayout', () => {
    test('renders children', () => {
        render(
        <StoreLayout>
            <div>Store Content</div>
        </StoreLayout>
        );

    expect(screen.getByText('Store Content')).toBeDefined();
    });

    test('renders correctly with only children', () => {
        render(
        <StoreLayout>
            <div>Only Content</div>
        </StoreLayout>
        );

        expect(screen.getByText('Only Content')).toBeDefined();
    });

    test('applies min height style', () => {
        const { container } = render(
        <StoreLayout>
            <div>Styled</div>
        </StoreLayout>
    );

        expect(container.firstChild).toHaveStyle('min-height: 100vh');
    });

    test('renders multiple children correctly', () => {
        render(
            <StoreLayout>
                <div>Item 1</div>
                <div>Item 2</div>
            </StoreLayout>
        );

    expect(screen.getByText('Item 1')).toBeDefined();
    expect(screen.getByText('Item 2')).toBeDefined();
    });

    test('renders antd layout structure', () => {
        const { container } = render(
            <StoreLayout>
                <div>Content</div>
            </StoreLayout>
        );

    expect(container.querySelector('.ant-layout')).toBeInTheDocument();
    });
});