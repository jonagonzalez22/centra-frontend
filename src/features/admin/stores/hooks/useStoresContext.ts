import { useContext } from 'react';
import { StoresContext } from '../contexts/StoresContext';

export const useStoresContext = () => {
    const context = useContext(StoresContext);
    if (!context) {
        throw new Error('useStoresContext must be used within a StoresProvider');
    }
    return context;
};