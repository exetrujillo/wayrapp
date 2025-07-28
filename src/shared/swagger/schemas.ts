/**
 * Swagger/OpenAPI Schema Definitions for WayrApp API
 * 
 * This module contains reusable schema definitions for the OpenAPI specification.
 * These schemas are used throughout the API documentation to ensure consistency
 * and reduce duplication in the Swagger documentation.
 */

export const swaggerSchemas = {
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com'
          },
          username: {
            type: 'string',
            example: 'learner123'
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
            example: 'student'
          },
          isActive: {
            type: 'boolean',
            example: true
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-07-20T12:34:56.789Z'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-07-20T12:34:56.789Z'
          }
        }
      },
      AuthTokens: {
        type: 'object',
        properties: {
          accessToken: {
            type: 'string',
            description: 'JWT access token (expires in 15 minutes)',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
          },
          refreshToken: {
            type: 'string',
            description: 'JWT refresh token (expires in 7 days)',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
          }
        }
      },
      Course: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          title: {
            type: 'string',
            example: 'Spanish for Beginners'
          },
          description: {
            type: 'string',
            example: 'Learn Spanish from scratch with interactive lessons'
          },
          language: {
            type: 'string',
            example: 'Spanish'
          },
          difficulty: {
            type: 'string',
            enum: ['beginner', 'intermediate', 'advanced'],
            example: 'beginner'
          },
          isPublished: {
            type: 'boolean',
            example: true
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            example: 'Operation completed successfully'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2023-07-20T12:34:56.789Z'
          },
          data: {
            type: 'object',
            description: 'Response data (varies by endpoint)'
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          message: {
            type: 'string',
            example: 'An error occurred'
          },
          error: {
            type: 'string',
            example: 'Detailed error message'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2023-07-20T12:34:56.789Z'
          }
        }
      },
      ValidationError: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          message: {
            type: 'string',
            example: 'Validation failed'
          },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: {
                  type: 'string',
                  example: 'email'
                },
                message: {
                  type: 'string',
                  example: 'Invalid email format'
                }
              }
            }
          },
          timestamp: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          message: {
            type: 'string',
            example: 'An error occurred'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2023-07-20T12:34:56.789Z'
          }
        }
      }
    }
  }
};