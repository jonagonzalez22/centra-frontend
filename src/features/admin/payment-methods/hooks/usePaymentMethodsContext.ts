import { useContext } from 'react';
import { PaymentMethodsContext } from '../contexts/PaymentMethodsContext';

export const usePaymentMethodsContext = () => {
    const context = useContext(PaymentMethodsContext);
    if (!context) {
        throw new Error('usePaymentMethodsContext must be used within a PaymentMethodsProvider');
    }
    return context;
};
