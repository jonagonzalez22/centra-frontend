import { CENTRA_COLORS } from './centraBrand';

/** Tema Ant Design alineado a la marca CENTRA (ConfigProvider). */
export const centraAntdTheme = {
  token: {
    colorPrimary: CENTRA_COLORS.primary,
    colorInfo: CENTRA_COLORS.primary,
    colorWarning: CENTRA_COLORS.secondary,
    borderRadius: 6,
  },
} as const;
