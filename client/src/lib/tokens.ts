/**
 * SevaSetu Design Tokens
 * Centralized design definitions for colors, typography, spacing, radius, and shadows.
 * Provides consistency across the entire service marketplace platform.
 */

export const tokens = {
  colors: {
    brand: {
      primary: '#1E40AF', // Deep Trustworthy Blue
      primaryHover: '#1D4ED8',
      primaryActive: '#1E3A8A',
      primaryLight: '#EFF6FF',
      secondary: '#0F172A', // Slate 900
      secondaryHover: '#1E293B',
      accent: '#D97706', // Warm Amber (Local/Craft touch)
      accentLight: '#FEF3C7',
    },
    neutral: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
      950: '#020617',
    },
    feedback: {
      success: '#059669',
      successLight: '#ECFDF5',
      successBorder: '#A7F3D0',
      warning: '#D97706',
      warningLight: '#FFFBEB',
      warningBorder: '#FDE68A',
      error: '#DC2626',
      errorLight: '#FEF2F2',
      errorBorder: '#FECACA',
      info: '#0284C7',
      infoLight: '#F0F9FF',
      infoBorder: '#BAE6FD',
    },
    surface: {
      background: '#F8FAFC',
      card: '#FFFFFF',
      modal: '#FFFFFF',
      border: '#E2E8F0',
      divider: '#F1F5F9',
    },
    text: {
      primary: '#0F172A',
      secondary: '#475569',
      muted: '#64748B',
      inverse: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
    },
    scale: {
      display: { size: '2.25rem', lineHeight: '2.5rem', weight: '700' }, // 36px
      h1: { size: '1.875rem', lineHeight: '2.25rem', weight: '700' },      // 30px
      h2: { size: '1.5rem', lineHeight: '2rem', weight: '600' },           // 24px
      h3: { size: '1.25rem', lineHeight: '1.75rem', weight: '600' },       // 20px
      h4: { size: '1.125rem', lineHeight: '1.5rem', weight: '600' },        // 18px
      bodyLarge: { size: '1rem', lineHeight: '1.5rem', weight: '400' },     // 16px
      body: { size: '0.875rem', lineHeight: '1.25rem', weight: '400' },     // 14px
      bodySmall: { size: '0.75rem', lineHeight: '1rem', weight: '400' },    // 12px
      caption: { size: '0.6875rem', lineHeight: '0.875rem', weight: '500' }, // 11px
      label: { size: '0.875rem', lineHeight: '1.25rem', weight: '500' },    // 14px
    },
  },
  spacing: {
    pagePadding: 'px-4 sm:px-6 lg:px-8',
    sectionSpacing: 'py-8 sm:py-12',
    cardPadding: 'p-5 sm:p-6',
    componentGap: 'gap-4',
  },
  radius: {
    sm: '0.25rem',   // 4px
    md: '0.375rem',  // 6px
    lg: '0.5rem',    // 8px
    xl: '0.75rem',   // 12px
    full: '9999px',
  },
  shadows: {
    subtle: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    elevated: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    modal: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
} as const;
