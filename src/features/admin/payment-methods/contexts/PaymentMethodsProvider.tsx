import { type ReactNode } from 'react';
import { PaymentMethodsContext } from './PaymentMethodsContext';
import type { UsePaymentMethodsReturn } from '../hooks/usePaymentMethods';

interface PaymentMethodsProviderProps {
    children: ReactNode;
    value: UsePaymentMethodsReturn;
}

export const PaymentMethodsProvider = ({ children, value }: PaymentMethodsProviderProps) => {
    return (
        <PaymentMethodsContext.Provider value={value}>
            {children}
        </PaymentMethodsContext.Provider>
    );
};
