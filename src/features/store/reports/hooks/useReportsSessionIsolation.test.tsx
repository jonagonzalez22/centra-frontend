import type { PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { User } from '@/entities/User';
import { queryClient } from '@/api/queryClient';
import { clearPrivateSessionState } from '@/security/clearPrivateSessionState';
import { useAuthStore } from '@/store/useAuthStore.store';
import { ReportsService } from '../services/reports.service';
import { useReportsAnalytics } from './useReportsAnalytics';
import { useReportsSummary } from './useReportsSummary';

vi.mock('../services/reports.service', () => ({
    ReportsService: { getSummary: vi.fn(), getAnalytics: vi.fn() },
}));

const getSummary = vi.mocked(ReportsService.getSummary);
const getAnalytics = vi.mocked(ReportsService.getAnalytics);
const params = { date_from: '2026-11-01', date_to: '2026-11-30' };
const summaryKey = (userId: number, storeId: string) => [
    'reports',
    'summary',
    userId,
    storeId,
    params.date_from,
    params.date_to,
];
const analyticsKey = (userId: number, storeId: string) => [
    'reports',
    'analytics',
    userId,
    storeId,
    params.date_from,
    params.date_to,
];

const user = (id: number, storeId: string): User => ({
    id,
    name: `User ${id}`,
    email: `user-${id}@example.com`,
    // This is the login response shape that previously exposed the key bug.
    store: { id: storeId, name: `Store ${storeId}`, business_type: 'retail' },
    is_active: true,
    roles: ['STORE_USER'],
    permissions: ['reports.view'],
    features: [{ code: 'reports', limit: null }],
});

const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('report hooks session isolation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
        useAuthStore.setState({ isAuthenticated: true, token: 'token', user: user(1, 'store-a') });
    });

    afterEach(() => {
        clearPrivateSessionState();
        useAuthStore.setState({ isAuthenticated: false, token: null, user: null });
    });

    test('uses the normalized store identity in both report query keys', async () => {
        const summary = { owner: 'A' } as never;
        const analytics = { owner: 'A' } as never;
        getSummary.mockResolvedValue(summary);
        getAnalytics.mockResolvedValue(analytics);

        const summaryHook = renderHook(() => useReportsSummary(params), { wrapper });
        const analyticsHook = renderHook(() => useReportsAnalytics(params), { wrapper });

        await waitFor(() => expect(summaryHook.result.current.data).toBe(summary));
        await waitFor(() => expect(analyticsHook.result.current.data).toBe(analytics));

        expect(queryClient.getQueryData(summaryKey(1, 'store-a'))).toBe(summary);
        expect(queryClient.getQueryData(analyticsKey(1, 'store-a'))).toBe(analytics);
    });

    test('clears user A report data before user B in the same store can query', async () => {
        const summaryA = { owner: 'A' } as never;
        const summaryB = { owner: 'B' } as never;
        getSummary.mockResolvedValueOnce(summaryA).mockResolvedValueOnce(summaryB);
        const hook = renderHook(() => useReportsSummary(params), { wrapper });

        await waitFor(() => expect(hook.result.current.data).toBe(summaryA));
        clearPrivateSessionState();
        expect(queryClient.getQueryData(summaryKey(1, 'store-a'))).toBeUndefined();

        act(() => useAuthStore.setState({ user: user(2, 'store-a'), token: 'token-b' }));
        await waitFor(() => expect(hook.result.current.data).toBe(summaryB));
        expect(queryClient.getQueryData(summaryKey(2, 'store-a'))).toBe(summaryB);
    });

    test('does not reuse a cached report when the active store changes', async () => {
        const summaryA = { owner: 'store-a' } as never;
        const summaryB = { owner: 'store-b' } as never;
        getSummary.mockResolvedValueOnce(summaryA).mockResolvedValueOnce(summaryB);
        const hook = renderHook(() => useReportsSummary(params), { wrapper });

        await waitFor(() => expect(hook.result.current.data).toBe(summaryA));
        clearPrivateSessionState();
        act(() => useAuthStore.setState({ user: user(2, 'store-b'), token: 'token-b' }));

        await waitFor(() => expect(hook.result.current.data).toBe(summaryB));
        expect(queryClient.getQueryData(summaryKey(1, 'store-a'))).toBeUndefined();
        expect(queryClient.getQueryData(summaryKey(2, 'store-b'))).toBe(summaryB);
    });

    test('ignores a late user A response after the session becomes user B', async () => {
        let resolveA: ((value: never) => void) | undefined;
        const lateA = new Promise<never>((resolve) => {
            resolveA = resolve;
        });
        const summaryB = { owner: 'B' } as never;
        getSummary.mockReturnValueOnce(lateA).mockResolvedValueOnce(summaryB);
        const hook = renderHook(() => useReportsSummary(params), { wrapper });

        await waitFor(() => expect(getSummary).toHaveBeenCalledTimes(1));
        clearPrivateSessionState();
        act(() => useAuthStore.setState({ user: user(2, 'store-b'), token: 'token-b' }));
        await waitFor(() => expect(hook.result.current.data).toBe(summaryB));

        await act(async () => resolveA?.({ owner: 'late A' } as never));

        expect(hook.result.current.data).toBe(summaryB);
        expect(queryClient.getQueryData(summaryKey(1, 'store-a'))).toBeUndefined();
    });
});
