import { createContext, useContext } from 'react';
import type { UseInventoryMovementsReturn } from '../hooks/useInventoryMovements';

export const InventoryMovementsContext = createContext<UseInventoryMovementsReturn | null>(null);

export const useInventoryMovementsContext = (): UseInventoryMovementsReturn => {
    const context = useContext(InventoryMovementsContext);
    if (!context) {
        throw new Error('useInventoryMovementsContext must be used within an InventoryMovementsProvider');
    }
    return context;
};
