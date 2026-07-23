import { ConfigProvider } from 'antd';
import esES from 'antd/locale/es_ES';
import type { ReactNode } from 'react';
import { centraTheme } from './theme';

export const CentraThemeProvider = ({ children }: { children: ReactNode }) => {
  return ( 
    <ConfigProvider 
      theme={centraTheme}
      locale={esES}>
        {children}
    </ConfigProvider>
  );
};
