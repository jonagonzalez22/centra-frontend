import { createContext } from 'react';
import type { UsePlansReturn } from '../hooks/usePlans';

export const PlansContext = createContext<UsePlansReturn | null>(null);
