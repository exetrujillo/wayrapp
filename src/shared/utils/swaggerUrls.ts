/**
 * Swagger UI URL utilities
 * 
 * This module provides consistent URLs for Swagger UI resources across the application.
 * It ensures that the same version is used in both CSP configuration and HTML templates.
 */

import { SWAGGER_UI_VERSION, SWAGGER_UI_CDN } from '@/shared/middleware/security';

/**
 * Generate Swagger UI resource URLs
 */
export const swaggerUrls = {
  css: `${SWAGGER_UI_CDN}swagger-ui.css`,
  bundleJs: `${SWAGGER_UI_CDN}swagger-ui-bundle.js`,
  standaloneJs: `${SWAGGER_UI_CDN}swagger-ui-standalone-preset.js`,
  favicon: `${SWAGGER_UI_CDN}favicon-32x32.png`,
  version: SWAGGER_UI_VERSION,
  cdn: SWAGGER_UI_CDN
};

/**
 * Generate HTML script and link tags for Swagger UI
 */
export const generateSwaggerTags = () => ({
  cssLink: `<link rel="stylesheet" type="text/css" href="${swaggerUrls.css}" />`,
  faviconLink: `<link rel="icon" type="image/png" href="${swaggerUrls.favicon}" sizes="32x32" />`,
  bundleScript: `<script src="${swaggerUrls.bundleJs}"></script>`,
  standaloneScript: `<script src="${swaggerUrls.standaloneJs}"></script>`
});