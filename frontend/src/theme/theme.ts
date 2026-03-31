import { createTheme, alpha } from '@mui/material/styles';

// GitHub color palette
const githubColors = {
  // Canvas colors
  canvasDefault: '#0d1117',
  canvasSubtle: '#161b22',
  canvasInset: '#010409',
  
  // Border
  borderDefault: '#30363d',
  borderMuted: '#21262d',
  
  // Text
  textPrimary: '#e6edf3',
  textSecondary: '#8b949e',
  textTertiary: '#6e7681',
  textLink: '#58a6ff',
  
  // Accent
  accentEmphasis: '#1f6feb',
  accentFg: '#58a6ff',
  accentDark: '#1158c7',
  accentMuted: 'rgba(56,139,253,0.4)',
  accentSubtle: 'rgba(56,139,253,0.15)',
  
  // Success
  successEmphasis: '#238636',
  successFg: '#3fb950',
  
  // Danger
  dangerEmphasis: '#da3633',
  dangerFg: '#f85149',
  
  // Warning
  warningEmphasis: '#9e6a03',
  warningFg: '#d29922',
  
  // Done
  doneFg: '#a371f7',
  doneLight: '#bd8bfb',
  doneDark: '#8957e5',
};

const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: githubColors.accentEmphasis, light: githubColors.accentFg, dark: githubColors.accentDark, contrastText: '#fff' },
    secondary: { main: githubColors.doneFg, light: githubColors.doneLight, dark: githubColors.doneDark },
    background: { default: githubColors.canvasDefault, paper: githubColors.canvasSubtle },
    text: { primary: githubColors.textPrimary, secondary: githubColors.textSecondary },
    error: { main: githubColors.dangerFg, dark: githubColors.dangerEmphasis },
    warning: { main: githubColors.warningFg, dark: githubColors.warningEmphasis },
    success: { main: githubColors.successFg, dark: githubColors.successEmphasis },
    info: { main: githubColors.accentFg },
    divider: githubColors.borderDefault,
  },
  typography: {
    fontFamily,
    h1: { fontSize: '2rem', fontWeight: 600, lineHeight: 1.25, letterSpacing: '-0.025em' },
    h2: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.25 },
    h3: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.25 },
    h4: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.5 },
    h5: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.5 },
    h6: { fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.5 },
    body1: { fontSize: '0.875rem', lineHeight: 1.5 },
    body2: { fontSize: '0.75rem', lineHeight: 1.5 },
    button: { textTransform: 'none' as const, fontWeight: 500 },
  },
  shape: { borderRadius: 6 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': { width: '8px', height: '8px' },
          '&::-webkit-scrollbar-track': { background: githubColors.canvasDefault },
          '&::-webkit-scrollbar-thumb': { background: githubColors.borderDefault, borderRadius: '4px' },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 500, borderRadius: 6, padding: '5px 16px', fontSize: '0.875rem', transition: 'all 0.2s ease' },
        contained: { boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
        containedPrimary: {
          backgroundColor: githubColors.successEmphasis,
          '&:hover': { backgroundColor: '#2ea043' },
        },
        outlined: {
          borderColor: githubColors.borderDefault,
          color: githubColors.textPrimary,
          '&:hover': { backgroundColor: githubColors.canvasSubtle, borderColor: githubColors.textSecondary },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 6, border: `1px solid ${githubColors.borderDefault}`, boxShadow: 'none', backgroundColor: githubColors.canvasSubtle },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none', borderRadius: 6 },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: githubColors.canvasDefault,
            borderRadius: 6,
            fontSize: '0.875rem',
            '& fieldset': { borderColor: githubColors.borderDefault },
            '&:hover fieldset': { borderColor: githubColors.textSecondary },
            '&.Mui-focused fieldset': { borderColor: githubColors.accentFg, borderWidth: 2 },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundColor: githubColors.canvasSubtle, borderBottom: `1px solid ${githubColors.borderDefault}`, boxShadow: 'none' },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundColor: githubColors.canvasSubtle, borderRight: `1px solid ${githubColors.borderDefault}` },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: '2em', fontSize: '0.75rem', height: 24 },
        outlined: { borderColor: githubColors.borderDefault },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: githubColors.borderDefault },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: { borderRadius: 6, '&:hover': { backgroundColor: alpha(githubColors.textPrimary, 0.04) }, '&.Mui-selected': { backgroundColor: alpha(githubColors.accentFg, 0.15), '&:hover': { backgroundColor: alpha(githubColors.accentFg, 0.2) } } },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: { borderRadius: '50%', border: `2px solid ${githubColors.borderDefault}` },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 400, '&.Mui-selected': { fontWeight: 600 } },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: githubColors.canvasInset, border: `1px solid ${githubColors.borderDefault}`, color: githubColors.textPrimary, fontSize: '0.75rem' },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 6 },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 3, backgroundColor: githubColors.borderMuted },
      },
    },
  },
});

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0969da', light: '#218bff', dark: '#0550ae' },
    secondary: { main: '#8250df', light: '#a475f9', dark: '#6639ba' },
    background: { default: '#ffffff', paper: '#f6f8fa' },
    text: { primary: '#1f2328', secondary: '#656d76' },
    error: { main: '#cf222e' },
    warning: { main: '#9a6700' },
    success: { main: '#1a7f37' },
    info: { main: '#0969da' },
    divider: '#d0d7de',
  },
  typography: {
    fontFamily,
    button: { textTransform: 'none' as const },
  },
  shape: { borderRadius: 6 },
});

export { githubColors };
