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
  ],
  paths: {
    '/api/v1/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user',
        description: 'Creates a new user account with email, password, and optional profile information',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'firstName', 'lastName'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'user@example.com'
                  },
                  password: {
                    type: 'string',
                    minLength: 8,
                    example: 'SecurePassword123!'
                  },
                  firstName: {
                    type: 'string',
                    example: 'John'
                  },
                  lastName: {
                    type: 'string',
                    example: 'Doe'
                  },
                  role: {
                    type: 'string',
                    enum: ['student', 'teacher', 'admin'],
                    default: 'student'
                  }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'User successfully registered',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'User registered successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                        tokens: { $ref: '#/components/schemas/AuthTokens' }
                      }
                    }
                  }
                }
              }
            }
          },
          400: { description: 'Invalid input data' },
          409: { description: 'User already exists' },
          429: { description: 'Too many registration attempts' }
        }
      }
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'User login',
        description: 'Authenticates user with email and password, returns JWT tokens',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'user@example.com'
                  },
                  password: {
                    type: 'string',
                    example: 'SecurePassword123!'
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Login successful' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                        tokens: { $ref: '#/components/schemas/AuthTokens' }
                      }
                    }
                  }
                }
              }
            }
          },
          400: { description: 'Invalid credentials' },
          429: { description: 'Too many login attempts' }
        }
      }
    },
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        description: 'Returns the health status of the API',
        responses: {
          200: {
            description: 'API is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'OK' },
                    timestamp: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/status': {
      get: {
        tags: ['System'],
        summary: 'API status',
        description: 'Returns detailed API status information',
        responses: {
          200: {
            description: 'API status information',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'API is running' },
                    data: {
                      type: 'object',
                      properties: {
                        version: { type: 'string', example: '1.0.0' },
                        environment: { type: 'string', example: 'production' },
                        uptime: { type: 'number', example: 12345 }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
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
      apis: process.env['NODE_ENV'] === 'production'
        ? [] // Don't scan files in production, use base spec
        : [
          './src/modules/*/routes/*.ts',
          './src/shared/routes/*.ts',
          './src/modules/*/controllers/*.ts'
        ]
    };

    return swaggerJSDoc(options);
  } catch (error) {
    console.warn('Failed to generate Swagger spec from files, using base spec:', error);
    return baseSpec;
  }
}

export const swaggerSpec = generateSwaggerSpec();