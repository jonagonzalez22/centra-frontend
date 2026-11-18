import { beforeEach, expect, test, vi } from 'vitest';
import api from '@/api/api.config';
import { DriverService } from './driver.service';

vi.mock('@/api/api.config', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

const mockApi = api as unknown as {
    get: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
    vi.clearAllMocks();
});

test('treats the documented active-route 404 as an empty state', async () => {
    mockApi.get.mockRejectedValue({
        status: 404,
        message: 'No se encontró una ruta activa para este conductor.',
    });

    await expect(DriverService.getActiveRoute()).resolves.toBeNull();
});

test.each([401, 403, 500])('keeps HTTP %s as a real error', async (status) => {
    const error = { status, message: `Error ${status}` };
    mockApi.get.mockRejectedValue(error);

    await expect(DriverService.getActiveRoute()).rejects.toBe(error);
});

test('shares concurrent active-route requests', async () => {
    let resolveRequest: (value: unknown) => void;
    mockApi.get.mockReturnValue(
        new Promise((resolve) => {
            resolveRequest = resolve;
        }) as ReturnType<typeof api.get>
    );

    const firstRequest = DriverService.getActiveRoute();
    const secondRequest = DriverService.getActiveRoute();

    expect(mockApi.get).toHaveBeenCalledOnce();

    resolveRequest!({ data: { status: 'success', data: { route: { id: 'route-1' } } } });

    await expect(firstRequest).resolves.toEqual({ route: { id: 'route-1' } });
    await expect(secondRequest).resolves.toEqual({ route: { id: 'route-1' } });
});
