import { createContext } from 'react';
import type { UseBusinessTypesReturn } from '../hooks/useBusinessTypes';

export const BusinessTypesContext = createContext<UseBusinessTypesReturn | null>(null);