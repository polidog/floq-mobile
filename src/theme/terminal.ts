export const terminalTheme = {
  colors: {
    background: '#0d1117',
    surface: '#161b22',
    border: '#30363d',
    primary: '#58a6ff',
    success: '#3fb950',
    warning: '#d29922',
    error: '#f85149',
    text: '#c9d1d9',
    textMuted: '#8b949e',
    textDim: '#484f58',
    cursor: '#58a6ff',
    selection: '#264f78',
  },
  fonts: {
    mono: 'JetBrainsMono_400Regular',
    monoBold: 'JetBrainsMono_700Bold',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
  },
  borderRadius: {
    sm: 2,
    md: 4,
    lg: 8,
  },
} as const;

export type TerminalTheme = typeof terminalTheme;
