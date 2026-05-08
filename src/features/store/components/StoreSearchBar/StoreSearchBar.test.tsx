import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { describe, expect, test, vi } from 'vitest';
import { StoreSearchBar } from './StoreSearchBar';

describe('StoreSearchBar', () => {
    test('renders search controls', () => {
        render(<StoreSearchBar onFilter={vi.fn()} onReset={vi.fn()} />);

        expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
        expect(screen.getAllByText('Estado').length).toBeGreaterThan(0);
        expect(screen.getByRole('button', { name: 'Filtrar' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Limpiar' })).toBeInTheDocument();
    });

    test('calls onFilter when the form is submitted', async () => {
        const user = userEvent.setup();
        const onFilter = vi.fn();

        render(<StoreSearchBar onFilter={onFilter} onReset={vi.fn()} />);

        await user.click(screen.getByRole('button', { name: 'Filtrar' }));

        expect(onFilter).toHaveBeenCalledTimes(1);
    });

    test('calls onReset when the reset button is clicked', async () => {
        const user = userEvent.setup();
        const onReset = vi.fn();

        render(<StoreSearchBar onFilter={vi.fn()} onReset={onReset} />);

        await user.type(screen.getByLabelText('Nombre'), 'Sucursal Centro');
        await user.click(screen.getByRole('button', { name: 'Limpiar' }));

        expect(onReset).toHaveBeenCalledTimes(1);
        expect(screen.getByLabelText('Nombre')).toHaveValue('');
    });
});
