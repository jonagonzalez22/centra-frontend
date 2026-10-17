import { act, renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { useProductSearch } from './useProductSearch';
import { usePOSStore } from '../stores/usePOSStore';

const searchProducts = vi.hoisted(() => vi.fn());
const getProductById = vi.hoisted(() => vi.fn());
const searchByBarcode = vi.hoisted(() => vi.fn());

vi.mock('@features/store/products/services/products.service', () => ({
  ProductsService: { searchProducts },
}));

vi.mock('../services/sales.service', () => ({
  SalesService: { getProductById, searchByBarcode },
}));

const product = (overrides: Record<string, unknown> = {}) => ({
  id: 'product-1',
  name: 'Producto disponible',
  sku: 'PRODUCTO-1',
  barcode: '7790000000001',
  price: '100.00',
  stock: '10.0000',
  stock_reserved: '0.0000',
  commercial_available_quantity: '1.0000',
  sale_quantity_step: '1.0000',
  stock_measurement_unit: { symbol: 'u' },
  ...overrides,
});

describe('useProductSearch commercial availability', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    usePOSStore.getState().resetPOS();
    searchProducts.mockReset();
    getProductById.mockReset();
    searchByBarcode.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const search = async (query: string) => {
    const hook = renderHook(() => useProductSearch());
    act(() => hook.result.current.setQuery(query));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    return hook;
  };

  test('shows available normal and associated products, but excludes zero commercial availability', async () => {
    searchProducts.mockResolvedValue([
      product({ id: 'normal-available', name: 'Normal disponible', commercial_available_quantity: '1.0000' }),
      product({ id: 'normal-empty', name: 'Normal sin disponibilidad', commercial_available_quantity: '0.0000' }),
      product({ id: 'associated-available', name: 'Child disponible', stock: '0.0000', commercial_available_quantity: '2.0000' }),
      product({ id: 'reserved-empty', name: 'Reservado', stock: '10.0000', stock_reserved: '10.0000', commercial_available_quantity: '0.0000' }),
    ]);

    const hook = await search('producto');

    expect(hook.result.current.results.map((candidate) => candidate.id))
      .toEqual(['normal-available', 'associated-available']);
  });

  test('applies the same availability filter for name and SKU searches', async () => {
    searchProducts.mockResolvedValue([
      product({ id: 'by-name', name: 'Detergente', commercial_available_quantity: '1.0000' }),
      product({ id: 'by-name-empty', name: 'Detergente sin stock', commercial_available_quantity: '0.0000' }),
    ]);
    const hook = await search('Detergente');
    expect(hook.result.current.results.map((candidate) => candidate.id)).toEqual(['by-name']);

    searchProducts.mockResolvedValue([
      product({ id: 'by-sku', sku: 'DET-001', commercial_available_quantity: '1.0000' }),
      product({ id: 'by-sku-empty', sku: 'DET-002', commercial_available_quantity: '0.0000' }),
    ]);
    act(() => hook.result.current.setQuery('DET-001'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(hook.result.current.results.map((candidate) => candidate.id)).toEqual(['by-sku']);
  });

  test('does not add a barcode match with zero commercial availability', async () => {
    searchByBarcode.mockResolvedValue(product({ commercial_available_quantity: '0.0000' }));
    const hook = await search('7790000000001');

    await act(async () => {
      await hook.result.current.handlePressEnter();
    });

    expect(usePOSStore.getState().items).toEqual([]);
  });

  test('does not add a selected result if its current commercial availability became zero', async () => {
    searchProducts.mockResolvedValue([
      product({ id: 'stale-product', commercial_available_quantity: '1.0000' }),
    ]);
    getProductById.mockResolvedValue(product({ id: 'stale-product', commercial_available_quantity: '0.0000' }));
    const hook = await search('producto');

    await act(async () => {
      await hook.result.current.handleSelect('stale-product');
    });

    expect(usePOSStore.getState().items).toEqual([]);
  });
});
