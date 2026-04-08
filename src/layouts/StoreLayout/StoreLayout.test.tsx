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

    test('renders header when provided', () => {
    render(
        <StoreLayout header={<div>Header</div>}>
            <div>Content</div>
        </StoreLayout>
        );

        expect(screen.getByText('Header')).toBeDefined();
    });

    test('renders sider when provided', () => {
        render(
        <StoreLayout sider={<div>Sider</div>}>
            <div>Content</div>
        </StoreLayout>
        );

        expect(screen.getByText('Sider')).toBeDefined();
    });

    test('works without optional props', () => {
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
});