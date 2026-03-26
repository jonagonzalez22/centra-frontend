import type { Preview } from '@storybook/react-vite';
import { ConfigProvider } from 'antd';
import React from 'react';
import 'antd/dist/reset.css';
import { centraAntdTheme } from '../src/theme/centraAntdTheme';

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
      <ConfigProvider theme={centraAntdTheme}>
        <Story />
      </ConfigProvider>
    ),
  ],
};

export default preview;
