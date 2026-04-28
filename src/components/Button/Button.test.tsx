import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import Button from './Button';

describe('Button', () => {
    test('renders the provided label', () => {
        render(<Button label="Click me" action={() => {}} />);

        expect(screen.getByRole('button', { name: /Click me/i })).toBeDefined();
    });

    test('calls action when clicked', async () => {
        const user = userEvent.setup();
        const action = vi.fn();

        render(<Button label="Do it" action={action} />);

        await user.click(screen.getByRole('button', { name: /Do it/i }));

    expect(action).toHaveBeenCalled();
    });

    test('does not call action when disabled', async () => {
        const user = userEvent.setup();
        const action = vi.fn();

        render(<Button label="Nope" action={action} disabled />);

        await user.click(screen.getByRole('button', { name: /Nope/i }));

        expect(action).not.toHaveBeenCalled();
    });

    test('renders an icon when passed', () => {
        render(
            <Button
            label="With Icon"
            action={() => {}}
            icon={<span data-testid="test-icon">I</span>}
            />
        );

        expect(screen.getByTestId('test-icon')).toBeDefined();
    });

    test('applies loading state (AntD adds loading class)', () => {
        const { container } = render(
            <Button label="Loading" action={() => {}} loading />
        );

        // Ant Design adds a loading-related class when loading is true.
        // Assert a loading class exists somewhere in the rendered button subtree.
        const loadingEl = container.querySelector('.ant-btn-loading');

        expect(loadingEl).not.toBeNull();
    });
});