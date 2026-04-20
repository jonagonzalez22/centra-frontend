import { CENTRA_TOKENS } from '../../design-system/tokens';

export const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    color: '#fff',
    height: 64,
    paddingInline: 48,
    lineHeight: '64px',
};

export const siderStyle: React.CSSProperties = {
    textAlign: 'center',
    lineHeight: '120px',
    color: '#fff',
    width: 250,
};

export const headerContainerStyle = {
    textAlign: 'center' as const,
    marginBottom: 24,
};

export const avatarStyle = {
    width: 64,
    height: 64,
    borderRadius: '50%',
    backgroundColor: CENTRA_TOKENS.colorPrimary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
};

export const titleStyle = {
    margin: 0,
};

export const subtitleStyle = {
    color: '#666',
    marginTop: 4,
};
