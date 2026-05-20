import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { BusinessTypeSearchBar } from './BusinessTypeSearchBar';
import { BusinessTypesProvider } from '../../contexts/BusinessTypesProvider';
import type { UseBusinessTypesReturn } from '../../hooks/useBusinessTypes';

const createMockState = (overrides: Partial<UseBusinessTypesReturn> = {}): UseBusinessTypesReturn => ({
    businessTypes: [],
    loading: false,
    error: null,
    pagination: { current: 1, total: 0, pageSize: 15 },
    refetch: vi.fn(),
    deleteBusinessType: vi.fn().mockResolvedValue(undefined),
    ...overrides,
});

const renderWithProvider = (state: UseBusinessTypesReturn) => {
    return render(
        <MemoryRouter>
            <BusinessTypesProvider value={state}>
                <BusinessTypeSearchBar />
            </BusinessTypesProvider>
        </MemoryRouter>
    );
};

describe('BusinessTypeSearchBar', () => {
    test('renders all filter controls', () => {
        const state = createMockState();
        renderWithProvider(state);

        expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
        expect(screen.getByText('Estado')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Limpiar' })).toBeInTheDocument();
    });

    test('calls refetch with filters after 400ms debounce when typing', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });

        const user = userEvent.setup();
        const refetch = vi.fn();
        const state = createMockState({ refetch });

        renderWithProvider(state);

        await user.type(screen.getByLabelText('Nombre'), 'Ferretería');
        await vi.advanceTimersByTimeAsync(400);

        expect(refetch).toHaveBeenCalledTimes(1);
        expect(refetch).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'Ferretería',
            })
        );

        vi.useRealTimers();
    });

    test('debounces multiple rapid keystrokes into a single refetch call', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });

        const user = userEvent.setup();
        const refetch = vi.fn();
        const state = createMockState({ refetch });

        renderWithProvider(state);

        await user.type(screen.getByLabelText('Nombre'), 'Test');
        await vi.advanceTimersByTimeAsync(300);

        expect(refetch).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(100);

        expect(refetch).toHaveBeenCalledTimes(1);

        vi.useRealTimers();
    });

    test('calls refetch with empty filters after debounce when clearing filter', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });

        const user = userEvent.setup();
        const refetch = vi.fn();
        const state = createMockState({ refetch });

        renderWithProvider(state);

        await user.type(screen.getByLabelText('Nombre'), 'Fer');
        await vi.advanceTimersByTimeAsync(400);
        refetch.mockClear();

        await user.clear(screen.getByLabelText('Nombre'));
        await vi.advanceTimersByTimeAsync(400);

        expect(refetch).toHaveBeenCalledTimes(1);
        expect(refetch).toHaveBeenCalledWith({});

        vi.useRealTimers();
    });

    test('calls refetch with empty filters when reset button is clicked', async () => {
        const user = userEvent.setup();
        const refetch = vi.fn();
        const state = createMockState({ refetch });

        renderWithProvider(state);

        await user.type(screen.getByLabelText('Nombre'), 'Ferretería');
        await user.click(screen.getByRole('button', { name: 'Limpiar' }));

        expect(refetch).toHaveBeenCalledWith({});
    });

    test('disables all controls when loading is true', () => {
        const state = createMockState({ loading: true });

        renderWithProvider(state);

        expect(screen.getByRole('button', { name: 'Limpiar' })).toBeDisabled();
    });

    test('disables limpiar button when no filters are active', () => {
        const state = createMockState();

        renderWithProvider(state);

        expect(screen.getByRole('button', { name: 'Limpiar' })).toBeDisabled();
    });

    test('enables limpiar button when name filter is filled', async () => {
        const user = userEvent.setup();
        const state = createMockState();

        renderWithProvider(state);

        await user.type(screen.getByLabelText('Nombre'), 'Test');

        expect(screen.getByRole('button', { name: 'Limpiar' })).toBeEnabled();
    });
});