import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'antd/dist/reset.css';
import './index.css';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { CentraThemeProvider } from './design-system/centraThemeProvider.tsx';
import { RouterProvider } from 'react-router-dom';
import { router } from './router/router.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

dayjs.locale('es');

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <CentraThemeProvider>
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
            </QueryClientProvider>
        </CentraThemeProvider>
    </StrictMode>
);
