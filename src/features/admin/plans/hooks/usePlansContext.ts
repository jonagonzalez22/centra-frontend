import { useContext } from 'react';
import { PlansContext } from '../contexts/PlansContext';

export const usePlansContext = () => {
    const context = useContext(PlansContext);
    if (!context) {
        throw new Error('usePlansContext must be used within a PlansProvider');
    }
    return context;
};
