import { act, renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { useCustomerSearch } from './useCustomerSearch';

const getAll = vi.hoisted(() => vi.fn());

vi.mock('@features/store/customers/services/customers.service', () => ({
    CustomersService: { getAll },
}));

describe('useCustomerSearch', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        getAll.mockResolvedValue({
            items: [],
            total: 0,
            per_page: 20,
            current_page: 1,
            last_page: 1,
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        getAll.mockReset();
    });

    test('requests active customers with identity search after the existing debounce', async () => {
        const { result } = renderHook(() => useCustomerSearch());

        act(() => result.current.setQuery('Fernando'));
        await act(async () => {
            await vi.advanceTimersByTimeAsync(300);
        });

        expect(getAll).toHaveBeenCalledWith({
            search: 'Fernando',
            search_mode: 'identity',
            status: 'active',
            per_page: 20,
        });
    });
});
