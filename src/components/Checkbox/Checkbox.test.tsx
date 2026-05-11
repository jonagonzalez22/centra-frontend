import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import Checkbox from './Checkbox';

describe('Checkbox', () => {
    test('renders the provided label', () => {
        render(<Checkbox>Recordarme</Checkbox>);

        expect(screen.getByRole('checkbox', { name: /recordarme/i })).toBeInTheDocument();
    });

    test('calls onChange when toggled', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        render(<Checkbox onChange={onChange}>Recordarme</Checkbox>);

        await user.click(screen.getByRole('checkbox', { name: /recordarme/i }));

        expect(onChange).toHaveBeenCalled();
    });

    test('supports checked state', () => {
        render(<Checkbox checked>Recordarme</Checkbox>);

        expect(screen.getByRole('checkbox', { name: /recordarme/i })).toBeChecked();
    });
});
