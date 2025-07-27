/**
 * Design Tokens Utilities for Backend
 * 
 * This module provides utilities to work with the design tokens from the frontend-shared package
 * in the backend context, particularly for generating CSS styles for documentation pages.
 */

// Import design tokens (assuming they're available in the build context)
// For now, we'll define the key tokens we need for the backend documentation

export const designTokens = {
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
    typography: {
        fontFamily: {
            primary: 'Lato, "Open Sans", Roboto, system-ui, sans-serif',
            monospace: 'Consolas, Monaco, "Andale Mono", monospace',
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
        fontWeight: {
            regular: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
        },
    },
    spacing: {
        1: '0.25rem',  // 4px
        2: '0.5rem',   // 8px
        3: '0.75rem',  // 12px
        4: '1rem',     // 16px
        5: '1.25rem',  // 20px
        6: '1.5rem',   // 24px
        8: '2rem',     // 32px
        10: '2.5rem',  // 40px
        12: '3rem',    // 48px
    },
    borderRadius: {
        sm: '0.25rem',    // 4px
        DEFAULT: '0.5rem', // 8px
        lg: '1rem',       // 16px
    },
    shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    },
};

/**
 * Generate CSS custom properties from design tokens
 */
export const generateCSSVariables = (): string => {
    return `
    :root {
      /* Colors */
      --color-primary-50: ${designTokens.colors.primary[50]};
      --color-primary-100: ${designTokens.colors.primary[100]};
      --color-primary-400: ${designTokens.colors.primary[400]};
      --color-primary-500: ${designTokens.colors.primary[500]};
      --color-primary-600: ${designTokens.colors.primary[600]};
      
      --color-secondary-100: ${designTokens.colors.secondary[100]};
      --color-secondary-200: ${designTokens.colors.secondary[200]};
      
      --color-neutral-500: ${designTokens.colors.neutral[500]};
      --color-neutral-900: ${designTokens.colors.neutral[900]};
      
      /* Typography */
      --font-family-primary: ${designTokens.typography.fontFamily.primary};
      --font-size-base: ${designTokens.typography.fontSize.base};
      --font-size-lg: ${designTokens.typography.fontSize.lg};
      --font-size-xl: ${designTokens.typography.fontSize.xl};
      --font-size-4xl: ${designTokens.typography.fontSize['4xl']};
      --font-size-5xl: ${designTokens.typography.fontSize['5xl']};
      
      --font-weight-medium: ${designTokens.typography.fontWeight.medium};
      --font-weight-semibold: ${designTokens.typography.fontWeight.semibold};
      
      /* Spacing */
      --spacing-2: ${designTokens.spacing[2]};
      --spacing-4: ${designTokens.spacing[4]};
      --spacing-5: ${designTokens.spacing[5]};
      --spacing-6: ${designTokens.spacing[6]};
      --spacing-10: ${designTokens.spacing[10]};
      
      /* Border Radius */
      --border-radius-sm: ${designTokens.borderRadius.sm};
      --border-radius-default: ${designTokens.borderRadius.DEFAULT};
      
      /* Shadows */
      --shadow-md: ${designTokens.shadows.md};
      --shadow-lg: ${designTokens.shadows.lg};
    }
  `;
};

/**
 * Get Swagger UI custom CSS using design tokens
 */
export const getSwaggerCustomCSS = (): string => {
    return `
    ${generateCSSVariables()}
    
    .swagger-ui {
      font-family: var(--font-family-primary);
    }
    
    .swagger-ui .topbar { 
      background: linear-gradient(135deg, var(--color-primary-400) 0%, var(--color-primary-500) 100%); 
    }
    
    .swagger-ui .btn.authorize { 
      background-color: var(--color-primary-400); 
      border-color: var(--color-primary-400); 
      border-radius: var(--border-radius-sm);
      font-weight: var(--font-weight-medium);
      transition: all 150ms ease;
    }
    
    .swagger-ui .btn.authorize:hover { 
      background-color: var(--color-primary-500); 
      border-color: var(--color-primary-500); 
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }
    
    .swagger-ui .info .title { 
      color: var(--color-primary-400); 
      font-family: var(--font-family-primary);
      font-weight: var(--font-weight-semibold);
    }
    
    .swagger-ui .scheme-container {
      background: var(--color-secondary-100);
      border-radius: var(--border-radius-default);
    }
    
    .swagger-ui .opblock.opblock-post {
      border-color: var(--color-primary-400);
    }
    
    .swagger-ui .opblock.opblock-post .opblock-summary {
      border-color: var(--color-primary-400);
    }
    
    .swagger-ui .opblock.opblock-get {
      border-color: var(--color-primary-600);
    }
    
    .swagger-ui .opblock.opblock-get .opblock-summary {
      border-color: var(--color-primary-600);
    }
  `;
};