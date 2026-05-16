import { createContext } from 'react';
import type { UseUsersReturn } from '../hooks/useUsers';

export const UsersContext = createContext<UseUsersReturn | null>(null);