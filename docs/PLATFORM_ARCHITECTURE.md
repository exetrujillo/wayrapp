---
layout: default
title: Platform Architecture
---

# WayrApp Platform Architecture

This document describes the overall architecture of the WayrApp language learning platform, including the monorepo structure, application relationships, and deployment strategy.

## Platform Overview

WayrApp is built as a comprehensive language learning ecosystem consisting of multiple interconnected applications within a single monorepo:

```
WayrApp Platform
├── Backend API (Node.js/Express)
├── Content Creator (React Web App)
├── Mobile App (React Native)
└── Shared Components (TypeScript Library)
```

## Monorepo Architecture

### Repository Structure

```
wayrapp/
├── src/                    # Backend API Source
│   ├── modules/           # Feature modules (auth, users, content, progress)
│   ├── shared/            # Shared backend utilities
│   └── server.ts          # API entry point
├── frontend-creator/       # Content Creator Application
│   ├── src/              # React application source
│   ├── dist/             # Production build output
│   └── package.json      # Creator-specific dependencies
├── frontend-mobile/        # Mobile Application
│   ├── src/              # React Native source
│   ├── web-build/        # Web build output
│   └── package.json      # Mobile-specific dependencies
├── frontend-shared/        # Shared Frontend Library
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── constants.js      # Shared constants
│   ├── dist/             # Compiled library output
│   └── package.json      # Shared library configuration
├── docs/                   # Platform documentation
├── prisma/                 # Database schema and migrations
└── package.json           # Root monorepo configuration
```

### Dependency Management

The monorepo uses NPM Workspaces for dependency management:

- **Root package.json**: Backend production dependencies + shared development dependencies
- **Workspace package.json files**: Application-specific runtime dependencies
- **Hoisting**: Common dependencies are hoisted to the root node_modules
- **Peer Dependencies**: frontend-shared declares React as peer dependencies

## Application Architecture

### Backend API

**Technology Stack:**
- Node.js with TypeScript
- Express.js framework
- PostgreSQL with Prisma ORM
- JWT authentication
- Zod validation

**Key Features:**
- RESTful API design
- Modular architecture (auth, users, content, progress)
- JWT-based authentication with refresh tokens
- Role-based access control
- Offline content packaging
- Comprehensive API documentation

**Endpoints:**
- `/api/auth/*` - Authentication and authorization
- `/api/users/*` - User management
- `/api/content/*` - Course and lesson management
- `/api/progress/*` - Learning progress tracking
- `/api/packaged/*` - Offline content packages

### Content Creator Application

**Technology Stack:**
- React 18 with TypeScript
- Vite build tool
- Tailwind CSS for styling
- Headless UI components
- React Router for navigation

**Key Features:**
- Drag-and-drop course builder
- Exercise creation tools
- Real-time content preview
- Multi-language support
- Responsive design

**Architecture:**
- Component-based React architecture
- Custom hooks for API integration
- Context providers for state management
- Service layer for API communication

### Mobile Application

**Technology Stack:**
- React Native with TypeScript
- Expo development platform
- React Navigation
- React Native Paper (Material Design)
- AsyncStorage for local data

**Key Features:**
- Cross-platform (iOS, Android, Web)
- Offline learning capabilities
- Progress synchronization
- Interactive exercises
- Gamification elements

**Architecture:**
- Screen-based navigation structure
- Redux/Context for state management
- Service layer for API and local storage
- Component library for consistent UI

### Shared Components Library

**Technology Stack:**
- TypeScript
- React (peer dependency)
- Compiled to CommonJS and ES modules

**Contents:**
- Common TypeScript interfaces and types
- Utility functions (validation, formatting, etc.)
- Shared constants and configuration
- API client configurations
- Design system tokens

## Data Flow Architecture

### Content Creation Flow

```
Content Creator → Backend API → Database
                ↓
Mobile App ← Backend API ← Database
```

1. **Content Creation**: Educators use the Content Creator to build courses
2. **API Storage**: Content is stored via Backend API endpoints
3. **Database Persistence**: Course data is stored in PostgreSQL
4. **Content Consumption**: Learners access content through the Mobile App
5. **Progress Tracking**: Learning progress is tracked and synchronized

### Authentication Flow

```
Client App → Backend API → JWT Validation → Protected Resources
     ↓            ↓
Refresh Token → Token Refresh → New Access Token
```

1. **Login**: User authenticates via any client application
2. **Token Issuance**: Backend issues access token (15min) + refresh token (7 days)
3. **API Access**: Client includes access token in API requests
4. **Token Refresh**: Client automatically refreshes expired access tokens
5. **Logout**: Tokens are invalidated on logout

## Deployment Architecture

### Vercel Deployment

The platform is deployed on Vercel with the following configuration:

```json
{
  "builds": [
    { "src": "src/server.ts", "use": "@vercel/node" },
    { "src": "frontend-creator/package.json", "use": "@vercel/static-build" },
    { "src": "frontend-mobile/package.json", "use": "@vercel/static-build" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/src/server.ts" },
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/src/server.ts" }
  ]
}
```

**Deployment Strategy:**
- **Backend API**: Deployed as Vercel Serverless Functions
- **Content Creator**: Deployed as static site from `frontend-creator/dist`
- **Mobile App**: Web version deployed as static site from `frontend-mobile/web-build`
- **Database**: PostgreSQL hosted on Neon with connection pooling

### Environment Configuration

```env
# Production Environment Variables
DATABASE_URL="postgresql://..."
JWT_SECRET="production-secret"
JWT_REFRESH_SECRET="production-refresh-secret"
NODE_ENV="production"
```

## Development Workflow

### Local Development

```bash
# Start all applications
npm run dev:all

# Individual applications
npm run dev                                    # Backend API
npm run dev --workspace=frontend-creator      # Content Creator
npm run dev --workspace=frontend-mobile       # Mobile App
```

### Build Process

```bash
# Build all applications
npm run build:all

# Individual builds
npm run build                                    # Backend API
npm run build --workspace=frontend-creator      # Content Creator
npm run build --workspace=frontend-mobile       # Mobile App
npm run build --workspace=frontend-shared       # Shared Library
```

### Testing Strategy

```bash
# Run all tests
npm run test:all

# Individual test suites
npm test                                         # Backend API tests
npm run test --workspace=frontend-creator       # Creator tests
npm run test --workspace=frontend-mobile        # Mobile tests
npm run test --workspace=frontend-shared        # Shared library tests
```

## Security Architecture

### API Security

- **Authentication**: JWT tokens with refresh token rotation
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Zod schema validation on all endpoints
- **Rate Limiting**: Configurable limits per endpoint type
- **CORS Protection**: Configurable CORS policies
- **Security Headers**: Helmet.js for HTTP security headers

### Data Security

- **Password Hashing**: bcrypt with configurable salt rounds
- **SQL Injection Prevention**: Prisma ORM with parameterized queries
- **XSS Protection**: Input sanitization and output encoding
- **CSRF Protection**: SameSite cookie configuration

## Scalability Considerations

### Current Architecture

- **Monorepo**: Single repository for easier development and deployment
- **Serverless**: Vercel Functions for automatic scaling
- **Database**: Connection pooling for efficient database usage
- **CDN**: Static assets served via Vercel's global CDN

### Future Scalability

- **Microservices**: Modular backend can be split into separate services
- **Database Sharding**: Content and user data can be separated
- **Caching**: Redis caching layer for frequently accessed data
- **Load Balancing**: Multiple API instances behind load balancer

## Monitoring and Observability

### Current Implementation

- **Logging**: Winston logger with structured logging
- **Error Tracking**: Comprehensive error handling and logging
- **Health Checks**: `/health` endpoint for monitoring
- **Performance**: Response time tracking

### Future Enhancements

- **APM**: Application Performance Monitoring integration
- **Metrics**: Custom metrics for business logic
- **Alerting**: Automated alerts for critical issues
- **Tracing**: Distributed tracing for request flows

## Integration Points

### External Services

- **Database**: Neon PostgreSQL
- **Deployment**: Vercel platform
- **Version Control**: Git with GitHub
- **Package Registry**: npm registry

### API Integrations

- **RESTful APIs**: Standard HTTP REST endpoints
- **WebSocket**: Future real-time features
- **GraphQL**: Potential future API layer
- **Mobile APIs**: React Native specific integrations

This architecture provides a solid foundation for the WayrApp platform while maintaining flexibility for future growth and enhancements.