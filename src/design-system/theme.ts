import { CENTRA_TOKENS } from './tokens';

export const centraTheme = {
  token: {
    colorPrimary: CENTRA_TOKENS.colorPrimary,
    colorSuccess: CENTRA_TOKENS.colorSuccess,
    colorWarning: CENTRA_TOKENS.colorWarning,
    colorError: CENTRA_TOKENS.colorError,
    colorText: CENTRA_TOKENS.colorText,
    colorLink: CENTRA_TOKENS.colorLink,
    borderRadius: CENTRA_TOKENS.borderRadius,
  },

  components: {
    Button: {
      borderRadius: CENTRA_TOKENS.borderRadius,
    },

    Input: {
      activeBorderColor: CENTRA_TOKENS.colorPrimary,
      hoverBorderColor: CENTRA_TOKENS.colorPrimary,
      activeShadow: `0 0 0 2px ${CENTRA_TOKENS.colorPrimary}33`,
      borderColor: CENTRA_TOKENS.colorPrimary,
    },
  },
};
