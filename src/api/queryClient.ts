import { QueryClient } from '@tanstack/react-query';

// A single client is shared by the application and session cleanup routines.
export const queryClient = new QueryClient();
