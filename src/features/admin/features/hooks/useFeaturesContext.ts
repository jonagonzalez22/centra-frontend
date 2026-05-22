import { useContext } from 'react';
import { FeaturesContext } from '../contexts/FeaturesContext';

export const useFeaturesContext = () => {
    const context = useContext(FeaturesContext);
    if (!context) {
        throw new Error('useFeaturesContext must be used within a FeaturesProvider');
    }
    return context;
};