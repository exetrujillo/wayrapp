import swaggerJSDoc from 'swagger-jsdoc';
import { swaggerSchemas } from './schemas';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WayrApp Backend API',
      version: '1.0.0',
      description: 'Interactive API documentation for WayrApp - Open-source language learning platform backend',
      contact: {
        name: 'WayrApp Team',
        url: 'https://github.com/exetrujillo/wayrapp',
        email: 'contact@wayrapp.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env['NODE_ENV'] === 'production' 
          ? process.env['VERCEL_URL'] ? `https://${process.env['VERCEL_URL']}` : 'https://wayrapp.vercel.app'
          : 'http://localhost:3000',
        description: process.env['NODE_ENV'] === 'production' ? 'Production server' : 'Development server'
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
    ]
  },
  apis: [
    './src/modules/*/routes/*.ts',
    './src/shared/routes/*.ts',
    './src/modules/*/controllers/*.ts'
  ]
};

export const swaggerSpec = swaggerJSDoc(options);