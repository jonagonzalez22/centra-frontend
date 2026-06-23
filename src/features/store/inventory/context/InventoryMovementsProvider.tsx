import type { ReactNode } from 'react';
import { InventoryMovementsContext } from './InventoryMovementsContext';
import type { UseInventoryMovementsReturn } from '../hooks/useInventoryMovements';

interface InventoryMovementsProviderProps {
    children: ReactNode;
    value: UseInventoryMovementsReturn;
}

export const InventoryMovementsProvider = ({ children, value }: InventoryMovementsProviderProps) => {
    return (
        <InventoryMovementsContext.Provider value={value}>
            {children}
        </InventoryMovementsContext.Provider>
    );
};
