import { createContext } from 'react';
import type { UseFeaturesReturn } from '../hooks/useFeatures';

export const FeaturesContext = createContext<UseFeaturesReturn | null>(null);