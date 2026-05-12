import { createContext } from 'react';
import type { UseStoresReturn } from '../hooks/useStores';

export const StoresContext = createContext<UseStoresReturn | null>(null);