import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'antd/dist/reset.css';
import App from './App.tsx';
import './index.css';
import { CentraThemeProvider } from './design-system/centraThemeProvider.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CentraThemeProvider>
      <App />
    </CentraThemeProvider>
  </StrictMode>,
);
