/**
 * WayrApp Design System Tokens
 * 
 * This file contains the core design tokens for the WayrApp frontend suite,
 * including colors, typography, spacing, and component styling rules.
 */

const designTokens = {
  /**
   * Color Palette
   * Primary: Teal (#50A8B1) - Main brand color
   * Secondary: Off-white (#F8F8F8) - Background color
   */
  colors: {
    primary: {
      50: '#E6F7F8',
      100: '#B3E8EB',
      200: '#8AD9DE',
      300: '#6CCAD0',
      400: '#50A8B1', // Main brand color
      500: '#3A8086',
      600: '#2D6469',
      700: '#1F484B',
      800: '#122A2C',
      900: '#060D0E',
    },
    secondary: {
      50: '#FFFFFF',
      100: '#F8F8F8', // Off-white
      200: '#E8E8E8',
      300: '#D0D0D0',
      400: '#B0B0B0',
      500: '#909090',
      600: '#707070',
      700: '#505050',
      800: '#303030',
      900: '#101010',
    },
    neutral: {
      100: '#E0E0E0',
      300: '#B0B0B0',
      500: '#707070',
      700: '#404040',
      900: '#1A1A1A',
    },
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',
    info: '#2196F3',
  },

  /**
   * Typography Scale
   * Font families: Lato, Open Sans, Roboto (in order of preference)
   */
  typography: {
    fontFamily: {
      primary: 'Lato, "Open Sans", Roboto, system-ui, sans-serif',
      monospace: 'Consolas, Monaco, "Andale Mono", monospace',
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
    },
    lineHeight: {
      none: 1,
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },

  /**
   * Spacing System
   * Based on a 4-8px grid
   */
  spacing: {
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
    20: '5rem',    // 80px
    24: '6rem',    // 96px
    32: '8rem',    // 128px
  },

  /**
   * Border Radius
   */
  borderRadius: {
    none: '0',
    sm: '0.25rem',    // 4px
    DEFAULT: '0.5rem', // 8px (component default)
    md: '0.5rem',     // 8px
    lg: '1rem',       // 16px
    xl: '1.5rem',     // 24px
    full: '9999px',
  },

  /**
   * Shadows
   */
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },

  /**
   * Z-index
   */
  zIndex: {
    0: 0,
    10: 10,
    20: 20,
    30: 30,
    40: 40,
    50: 50,
    auto: 'auto',
  },

  /**
   * Component Styling Rules
   */
  components: {
    // Button variants
    button: {
      base: {
        fontWeight: 'semibold',
        borderRadius: 'DEFAULT',
        padding: '2 4',
        transition: 'all 150ms ease',
      },
      variants: {
        primary: {
          backgroundColor: 'primary.400',
          color: 'white',
          hoverBackgroundColor: 'primary.500',
          activeBackgroundColor: 'primary.600',
        },
        secondary: {
          backgroundColor: 'secondary.100',
          color: 'neutral.900',
          hoverBackgroundColor: 'secondary.200',
          activeBackgroundColor: 'secondary.300',
        },
        outline: {
          backgroundColor: 'transparent',
          borderColor: 'primary.400',
          borderWidth: '1px',
          color: 'primary.400',
          hoverBackgroundColor: 'primary.50',
          activeBackgroundColor: 'primary.100',
        },
      },
      sizes: {
        sm: {
          fontSize: 'sm',
          padding: '1 3',
        },
        md: {
          fontSize: 'base',
          padding: '2 4',
        },
        lg: {
          fontSize: 'lg',
          padding: '3 6',
        },
      },
    },
    
    // Input styling
    input: {
      base: {
        borderRadius: 'DEFAULT',
        borderColor: 'secondary.300',
        borderWidth: '1px',
        padding: '2 3',
        fontSize: 'base',
        backgroundColor: 'white',
        transition: 'all 150ms ease',
      },
      states: {
        focus: {
          borderColor: 'primary.400',
          boxShadow: '0 0 0 3px rgba(80, 168, 177, 0.2)',
        },
        error: {
          borderColor: 'error',
        },
        disabled: {
          backgroundColor: 'secondary.100',
          opacity: 0.7,
        },
      },
    },
    
    // Card styling
    card: {
      base: {
        backgroundColor: 'white',
        borderRadius: 'DEFAULT',
        boxShadow: 'md',
        overflow: 'hidden',
      },
      variants: {
        elevated: {
          boxShadow: 'lg',
        },
        outline: {
          borderWidth: '1px',
          borderColor: 'secondary.200',
          boxShadow: 'none',
        },
      },
    },
  },
};

module.exports = designTokens;