import { useState, useEffect, useRef, useCallback } from 'react';
import { message } from 'antd';
import { CommercialProductsService } from '@features/store/orders/services/commercial-products.service';
import { SalesService } from '../services/sales.service';
import { usePOSStore } from '../stores/usePOSStore';
import type { ProductSearchItem } from '../interfaces/product-search.interface';
import { isPositiveDecimal } from '@/utils/quantity';
import { getCurrentSessionGeneration, isCurrentSession } from '@/security/sessionContext';

export function useProductSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchingFull, setSearchingFull] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const addItem = usePOSStore((s) => s.addItem);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      setShowDropdown(false);
      setActiveIndex(-1);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const sessionGeneration = getCurrentSessionGeneration();
      setLoading(true);
      setActiveIndex(-1);
      try {
        const products = await CommercialProductsService.search({ q: query });
        if (!isCurrentSession(sessionGeneration)) return;
        setResults(products
          .filter((product) => isPositiveDecimal(product.commercial_available_quantity))
          .map((product) => ({ ...product, sku: product.sku ?? '' })));
        setShowDropdown(true);
      } catch {
        if (!isCurrentSession(sessionGeneration)) return;
        setResults([]);
        setShowDropdown(true);
      } finally {
        if (isCurrentSession(sessionGeneration)) setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const addProductToCart = useCallback(
    async (productId: string) => {
      const sessionGeneration = getCurrentSessionGeneration();
      setSearchingFull(true);
      try {
        const product = await SalesService.getProductById(productId);
        if (!isCurrentSession(sessionGeneration)) return;
        if (!isPositiveDecimal(product.commercial_available_quantity)) {
          message.error('Producto sin stock disponible.');
          return;
        }
        addItem({
          id: product.id,
          name: product.name,
          sku: product.sku ?? '',
          barcode: product.barcode,
          price: Number(product.price),
          commercial_available_quantity: product.commercial_available_quantity,
          sale_quantity_step: product.sale_quantity_step,
          stock_measurement_unit_symbol: product.stock_measurement_unit?.symbol ?? null,
        });
      } catch {
        if (!isCurrentSession(sessionGeneration)) return;
        message.error('Error al obtener el producto.');
      } finally {
        if (isCurrentSession(sessionGeneration)) setSearchingFull(false);
      }
    },
    [addItem]
  );

  const tryBarcodeLookup = useCallback(
    async (code: string) => {
      const sessionGeneration = getCurrentSessionGeneration();
      setSearchingFull(true);
      try {
        const product = await SalesService.searchByBarcode(code);
        if (!isCurrentSession(sessionGeneration)) return false;
        if (!product) {
          message.error('Producto no encontrado.');
          return false;
        }
        if (!isPositiveDecimal(product.commercial_available_quantity)) {
          message.error('Producto sin stock disponible.');
          return false;
        }
        addItem({
          id: product.id,
          name: product.name,
          sku: product.sku ?? '',
          barcode: product.barcode,
          price: Number(product.price),
          commercial_available_quantity: product.commercial_available_quantity,
          sale_quantity_step: product.sale_quantity_step,
          stock_measurement_unit_symbol: product.stock_measurement_unit?.symbol ?? null,
        });
        setQuery('');
        setResults([]);
        setShowDropdown(false);
        setActiveIndex(-1);
        return true;
      } catch {
        if (!isCurrentSession(sessionGeneration)) return false;
        message.error('Error al buscar código de barras.');
        return false;
      } finally {
        if (isCurrentSession(sessionGeneration)) setSearchingFull(false);
      }
    },
    [addItem]
  );

  const handleSelect = useCallback(
    async (productId: string) => {
      setQuery('');
      setResults([]);
      setShowDropdown(false);
      setActiveIndex(-1);
      await addProductToCart(productId);
    },
    [addProductToCart]
  );

  const handlePressEnter = useCallback(async () => {
    if (showDropdown && activeIndex >= 0 && activeIndex < results.length) {
      await handleSelect(results[activeIndex].id);
      return;
    }

    const code = query.trim();
    if (!code) return;

    if (code.length >= 8 && /^\d+$/.test(code)) {
      await tryBarcodeLookup(code);
    } else if (results.length > 0) {
      await handleSelect(results[0].id);
    }
  }, [showDropdown, activeIndex, results, query, tryBarcodeLookup, handleSelect]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showDropdown || results.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowDropdown(false);
        setActiveIndex(-1);
      }
    },
    [showDropdown, results.length]
  );

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const handleFocus = useCallback(() => {
    if (results.length > 0) setShowDropdown(true);
  }, [results.length]);

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      setShowDropdown(false);
      setActiveIndex(-1);
    }, 200);
  }, []);

  return {
    query,
    setQuery,
    results,
    loading,
    searchingFull,
    showDropdown,
    setShowDropdown,
    activeIndex,
    setActiveIndex,
    handleInputChange,
    handlePressEnter,
    handleKeyDown,
    handleFocus,
    handleBlur,
    handleSelect,
  };
}
