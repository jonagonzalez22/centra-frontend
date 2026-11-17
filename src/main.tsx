import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'antd/dist/reset.css';
import './index.css';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { CentraThemeProvider } from './design-system/centraThemeProvider.tsx';
import { RouterProvider } from 'react-router-dom';
import { router } from './router/router.tsx';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/queryClient.ts';

dayjs.locale('es');

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <CentraThemeProvider>
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
            </QueryClientProvider>
        </CentraThemeProvider>
    </StrictMode>
);
