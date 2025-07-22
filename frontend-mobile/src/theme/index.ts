import { MD3LightTheme } from 'react-native-paper';
import colors from './colors';
import typography from './typography';

/**
 * WayrApp Mobile theme configuration for React Native Paper
 */
export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryLight,
    secondary: colors.secondary,
    secondaryContainer: colors.secondaryDark,
    surface: colors.surface,
    surfaceVariant: colors.neutral[100],
    onSurface: colors.neutral[900],
    onSurfaceVariant: colors.neutral[500],
    error: colors.error,
    onError: colors.background,
    background: colors.background,
  },
  fonts: {
    ...MD3LightTheme.fonts,
    default: {
      fontFamily: typography.fontFamily.regular,
    },
    medium: {
      fontFamily: typography.fontFamily.medium,
    },
    bold: {
      fontFamily: typography.fontFamily.bold,
    },
    light: {
      fontFamily: typography.fontFamily.light,
    },
  },
};

export default theme;