import { type ReactNode } from 'react';
import { FeaturesContext } from './FeaturesContext';
import type { UseFeaturesReturn } from '../hooks/useFeatures';

interface FeaturesProviderProps {
    children: ReactNode;
    value: UseFeaturesReturn;
}

export const FeaturesProvider = ({ children, value }: FeaturesProviderProps) => {
    return (
        <FeaturesContext.Provider value={value}>
            {children}
        </FeaturesContext.Provider>
    );
};