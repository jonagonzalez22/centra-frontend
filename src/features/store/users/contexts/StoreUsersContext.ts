import { createContext } from 'react';
import type { UseStoreUsersReturn } from '../hooks/useStoreUsers';

export const StoreUsersContext = createContext<UseStoreUsersReturn | null>(null);
