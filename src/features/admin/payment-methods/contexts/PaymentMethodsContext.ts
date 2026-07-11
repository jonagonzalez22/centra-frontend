import { createContext } from 'react';
import type { UsePaymentMethodsReturn } from '../hooks/usePaymentMethods';

export const PaymentMethodsContext = createContext<UsePaymentMethodsReturn | null>(null);
