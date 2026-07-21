import { useState, useEffect, useRef } from 'react';
import { CustomersService } from '@features/store/customers/services/customers.service';
import type { Customer } from '@features/store/customers/types/customer.types';

export function useCustomerSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await CustomersService.getAll({
          search: query,
          status: 'active',
          per_page: 20,
        });
        setResults(response.items);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  return { query, setQuery, results, loading };
}
