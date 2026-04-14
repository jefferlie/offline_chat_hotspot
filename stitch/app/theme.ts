export const colors = {
  surface: '#f8f9fa',
  'surface-container-low': '#f3f4f5',
  'surface-container-high': '#e7e8e9',
  'surface-container-highest': '#e1e3e4',
  'surface-container-lowest': '#ffffff',
  'surface-dim': '#d9dadb',
  onSurface: '#191c1d',
  'on-surface': '#191c1d',
  'on-surface-variant': '#414755',
  primary: '#0058bc',
  'primary-container': '#0070eb',
  'on-primary': '#ffffff',
  'on-primary-container': '#fefcff',
  'surface-tint': '#005bc1',
  secondary: '#405e96',
  'secondary-container': '#a1befd',
  onSecondary: '#ffffff',
  'on-secondary-container': '#2d4c83',
  tertiary: '#9e3d00',
  'tertiary-container': '#c64f00',
  onTertiary: '#ffffff',
  'on-tertiary-container': '#fffbff',
  outline: '#717786',
  'outline-variant': '#c1c6d7',
  error: '#ba1a1a',
  'error-container': '#ffdad6',
  onError: '#ffffff',
  'on-error': '#ffffff',
  'on-error-container': '#93000a',
  inverseSurface: '#2e3132',
  inversePrimary: '#adc6ff',
  background: '#f8f9fa',
  onBackground: '#191c1d',
  emerald: '#10b981',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 16,
  lg: 24,
  full: 9999,
};

export const typography = {
  headline: {
    fontFamily: 'System',
    fontWeight: '700' as const,
  },
  body: {
    fontFamily: 'System',
    fontWeight: '400' as const,
  },
  label: {
    fontFamily: 'System',
    fontWeight: '500' as const,
  },
};

export const shadows = {
  ambient: {
    shadowColor: '#0058bc',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 8,
  },
  primary: {
    shadowColor: '#0058bc',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
};