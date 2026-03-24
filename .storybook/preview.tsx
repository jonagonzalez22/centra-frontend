import type { Preview } from '@storybook/react-vite';
import { ConfigProvider } from 'antd';
import React from 'react';
import 'antd/dist/reset.css'

const centraTheme = {
  token: {
    colorPrimary: '#093865',
    colorInfo: '#093865',
    colorWarning: '#F88D34',
    borderRadius: 6,
  },
};

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
      <ConfigProvider theme={centraTheme}>
        <Story />
      </ConfigProvider>
    ),
  ],
};

export default preview;