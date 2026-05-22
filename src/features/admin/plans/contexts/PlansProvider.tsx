import { type ReactNode } from 'react';
import { PlansContext } from './PlansContext';
import type { UsePlansReturn } from '../hooks/usePlans';

interface PlansProviderProps {
    children: ReactNode;
    value: UsePlansReturn;
}

export const PlansProvider = ({ children, value }: PlansProviderProps) => {
    return <PlansContext.Provider value={value}>{children}</PlansContext.Provider>;
};
