import type { Preview } from '@storybook/react-vite';
import React from 'react';
import 'antd/dist/reset.css';
import '../src/index.css';
import { CentraThemeProvider } from '../src/design-system/centraThemeProvider.tsx';
import { MemoryRouter } from 'react-router-dom';

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
      <MemoryRouter>
        <CentraThemeProvider>
          <Story />
        </CentraThemeProvider>
      </MemoryRouter>
    ),
  ],
  
};

export default preview;
