import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'antd/dist/reset.css';
import './index.css';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { CentraThemeProvider } from './design-system/centraThemeProvider.tsx';
import { RouterProvider } from 'react-router-dom';
import { router } from './router/router.tsx';

dayjs.locale('es');

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <CentraThemeProvider>
            <RouterProvider router={router} />
        </CentraThemeProvider>
    </StrictMode>
);
