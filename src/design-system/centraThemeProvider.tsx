import { ConfigProvider } from 'antd';
import type { ReactNode } from 'react';
import { centraTheme } from './theme';

export const CentraThemeProvider = ({ children }: { children: ReactNode }) => {
  return ( 
    <ConfigProvider 
      theme={centraTheme}>
        {children}
    </ConfigProvider>
  );
};
