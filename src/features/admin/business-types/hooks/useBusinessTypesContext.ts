import { useContext } from 'react';
import { BusinessTypesContext } from '../contexts/BusinessTypesContext';

export const useBusinessTypesContext = () => {
    const context = useContext(BusinessTypesContext);
    if (!context) {
        throw new Error('useBusinessTypesContext must be used within a BusinessTypesProvider');
    }
    return context;
};