import swaggerJSDoc from 'swagger-jsdoc';
import { swaggerSchemas } from './schemas';

/**
 * Base OpenAPI specification without file scanning
 * This ensures the spec works even if file scanning fails in serverless environments
 */
const baseSpec = {
  openapi: '3.0.0',
  info: {
    title: 'WayrApp Backend API',
    version: '1.0.0',
    description: 'Interactive API documentation for WayrApp - Open-source language learning platform backend',
    contact: {
      name: 'WayrApp Team',
      url: 'https://github.com/exetrujillo/wayrapp',
      email: 'exequiel.trujillo@ug.uchile.cl'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: process.env['PUBLIC_API_URL'] || 'https://wayrapp.vercel.app',
      description: "Production Server"
    },
    {
      url: "http://localhost:3000",
      description: "Local Development Server"
    }
  ],
  components: {
    ...swaggerSchemas.components,
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token'
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ],
  paths: {
    // Paths will be automatically generated from @swagger comments in route files
  }
};

/**
 * Generate Swagger specification
 * Falls back to base spec if file scanning fails (e.g., in serverless environments)
 */
function generateSwaggerSpec() {

  try {
    const options: swaggerJSDoc.Options = {
      definition: baseSpec,
      apis: [
        // Scan compiled JavaScript files in production, TypeScript files in development
        process.env['NODE_ENV'] === 'production'
          ? [
            './dist/modules/*/routes/*.js',
            './dist/shared/routes/*.js',
            './dist/modules/*/controllers/*.js'
          ]
          : [
            './src/modules/*/routes/*.ts',
            './src/shared/routes/*.ts',
            './src/modules/*/controllers/*.ts'
          ]
      ].flat()
    };

    return swaggerJSDoc(options);
  } catch (error) {
    console.warn('Failed to generate Swagger spec from files, using base spec:', error);
    return baseSpec;
  }
}

export const swaggerSpec = generateSwaggerSpec();