import type { Preview } from '@storybook/react-vite';
import { ConfigProvider } from 'antd';
import React from 'react';
import 'antd/dist/reset.css';
import { CentraThemeProvider } from '../src/design-system/centraThemeProvider.tsx';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      test: 'todo',
    },
  },

  decorators: [
    (Story) => (
      <CentraThemeProvider>
        <Story />
      </CentraThemeProvider>
    ),
  ],
};

export default preview;
