# WayrApp Technology Stack

## Backend API
- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Express.js with comprehensive middleware stack
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with refresh token rotation
- **Validation**: Zod schemas for input validation
- **Security**: Helmet, CORS, rate limiting, XSS protection, input sanitization
- **Testing**: Jest with separate test database requirement
- **Documentation**: OpenAPI 3.0 with Swagger UI integration

## Frontend Applications

### Content Creator (React Web App)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form with Zod validation
- **Internationalization**: i18next
- **Testing**: Jest with React Testing Library

### Mobile App (React Native)
- **Framework**: React Native with Expo
- **Navigation**: React Navigation
- **UI Components**: React Native Paper
- **Storage**: AsyncStorage
- **Internationalization**: i18next with expo-localization

### Shared Components
- **Language**: TypeScript
- **Purpose**: Shared types, utilities, and design tokens
- **Design System**: Consistent colors (#50A8B1 primary), typography (Lato/Open Sans/Roboto), spacing

## Development Tools
- **Package Manager**: npm with workspaces
- **Linting**: ESLint with TypeScript rules
- **Type Checking**: TypeScript strict mode
- **Database Migrations**: Prisma migrate
- **API Documentation**: TypeDoc + Swagger

## Common Commands

### Development
```bash
# Start all applications
npm run dev:all

# Backend only
npm run dev

# Content creator only
npm run dev --workspace=frontend-creator

# Mobile app only
npm run dev --workspace=frontend-mobile
```

### Building
```bash
# Build all applications
npm run build:all

# Backend production build
npm run build

# Individual workspace builds
npm run build --workspace=frontend-creator
```

### Testing
```bash
# Setup test database (REQUIRED before any tests)
npm run test:db:setup

# Run all backend tests safely
npm run test:backend

# Unit tests only
npm test

# Integration tests with DB setup
npm run test:integration:safe

# Frontend tests
npm run test --workspace=frontend-creator
```

### Database Operations
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Open Prisma Studio
npm run db:studio

# Test database connection
npm run db:test
```

## Environment Configuration
- **Development**: `.env` file with development database
- **Testing**: `.env.test` file with SEPARATE test database (mandatory)
- **Production**: Environment variables via deployment platform

## Deployment
- **Backend**: Vercel serverless functions or traditional Node.js server
- **Frontend**: Static site deployment (Vercel, Netlify)
- **Database**: PostgreSQL (recommended: Neon for development)