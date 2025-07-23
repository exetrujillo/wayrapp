import { MD3LightTheme, configureFonts } from 'react-native-paper';
import colors from './colors';
import typography from './typography';

/**
 * Configure fonts for React Native Paper
 */
const fontConfig = {
  web: {
    regular: {
      fontFamily: typography.fontFamily.regular,
      fontWeight: 'normal' as const,
    },
    medium: {
      fontFamily: typography.fontFamily.medium,
      fontWeight: '500' as const,
    },
    light: {
      fontFamily: typography.fontFamily.light,
      fontWeight: '300' as const,
    },
    thin: {
      fontFamily: typography.fontFamily.light,
      fontWeight: '100' as const,
    },
  },
  ios: {
    regular: {
      fontFamily: typography.fontFamily.regular,
      fontWeight: 'normal' as const,
    },
    medium: {
      fontFamily: typography.fontFamily.medium,
      fontWeight: '500' as const,
    },
    light: {
      fontFamily: typography.fontFamily.light,
      fontWeight: '300' as const,
    },
    thin: {
      fontFamily: typography.fontFamily.light,
      fontWeight: '100' as const,
    },
  },
  android: {
    regular: {
      fontFamily: typography.fontFamily.regular,
      fontWeight: 'normal' as const,
    },
    medium: {
      fontFamily: typography.fontFamily.medium,
      fontWeight: '500' as const,
    },
    light: {
      fontFamily: typography.fontFamily.light,
      fontWeight: '300' as const,
    },
    thin: {
      fontFamily: typography.fontFamily.light,
      fontWeight: '100' as const,
    },
  },
};

/**
 * WayrApp Mobile theme configuration for React Native Paper
 * Implements the design system colors and typography
 */
export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryLight,
    onPrimary: '#FFFFFF',
    onPrimaryContainer: colors.primaryDark,
    secondary: colors.secondary,
    secondaryContainer: colors.secondaryDark,
    onSecondary: colors.neutral[900],
    onSecondaryContainer: colors.neutral[700],
    tertiary: colors.neutral[500],
    tertiaryContainer: colors.neutral[100],
    onTertiary: '#FFFFFF',
    onTertiaryContainer: colors.neutral[900],
    surface: colors.surface,
    surfaceVariant: colors.neutral[100],
    onSurface: colors.neutral[900],
    onSurfaceVariant: colors.neutral[500],
    outline: colors.neutral[300],
    outlineVariant: colors.neutral[100],
    error: colors.error,
    onError: '#FFFFFF',
    errorContainer: '#FFEBEE',
    onErrorContainer: '#B71C1C',
    background: colors.background,
    onBackground: colors.neutral[900],
    shadow: colors.neutral[900],
    scrim: colors.neutral[900],
    inverseSurface: colors.neutral[900],
    inverseOnSurface: colors.background,
    inversePrimary: colors.primaryLight,
    elevation: {
      level0: 'transparent',
      level1: '#F5F5F5',
      level2: '#F0F0F0',
      level3: '#EBEBEB',
      level4: '#E8E8E8',
      level5: '#E5E5E5',
    },
  },
  fonts: configureFonts({ config: fontConfig }),
  roundness: 8, // 8px border radius for components
};

export default theme;