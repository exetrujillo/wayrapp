# WayrApp Backend & Ecosystem

A decentralized & OpenSource language learning platform built with Node.js, Express, TypeScript, React, and React Native. WayrApp mission is to provide a complete ecosystem including a robust backend API, web-based content creator tool, and mobile application for language learning.

## 🏗️ Monorepo Structure

This repository is organized as an NPM Workspaces monorepo containing:

- **Backend API** (root) - Node.js/Express API server
- **Content Creator** (`frontend-creator/`) - React web application for creating educational content
- **Mobile App** (`frontend-mobile/`) - Cross Platform React Native mobile application
- **Shared Components** (`frontend-shared/`) - Frontend shared utilities and components

## 🚀 Features

-**Ready to Deploy Backend** - Node.js/Express API server with PostgreSQL database and Prisma ORM (TODO: Expand to make it DB-Agnostic)
- **📱 Mobile App** - Cross-platform mobile application for learners (TODO)
- **🎨 Content Creator** - Web-based tool for creating and managing educational content
- **📚 Content Management** - Hierarchical course structure (Courses → Levels → Sections → Modules → Lessons → Exercises)
- **🎯 Exercise System** - Multiple exercise types with reusable components
- **🔐 Authentication & Authorization** - JWT-based auth with role-based access control (TODO: implement OAuth)
- **📊 Progress Tracking** - Experience points, streaks, lives, and completion tracking
- **📱 Offline Support** - Packaged content API with versioning and caching
- **🔄 Sync Capabilities** - Offline progress synchronization
- **🎮 Gamification** - Lives system, streaks, and experience points
- **🛡️ Security** - Input validation, rate limiting, and secure headers


## 🏗️ Architecture

### Tech Stack

#### Backend API
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM (TODO: Expand to make it DB-Agnostic)
- **Authentication**: JWT tokens with refresh token rotation (TODO: implement OAuth and MFA)
- **Validation**: Zod schemas
- **Testing**: Jest with comprehensive test coverage (CRITCAL: you need to set a .env.test with test DB)
- **Caching**: In-memory caching with TTL support

#### Frontend Applications
- **Content Creator**: React 18 with TypeScript, Vite, Tailwind CSS
- **Mobile App**: React Native with Expo, TypeScript
- **Shared Components**: TypeScript library with React components and utilities
- **Testing**: Jest with React Testing Library
- **Build Tools**: Vite (Creator), Expo (Mobile), TypeScript compiler (Shared)

### Monorepo Structure
```txt
wayrapp/
├── src/                        # Backend API source code
│   ├── __tests__/              # Integration tests
│   │   └── integration/        # Cross-module integration tests
│   ├── modules/                # Feature modules (domain-driven design)
│   │   ├── users/              # User management & authentication
│   │   │   ├── controllers/    # HTTP request handlers
│   │   │   ├── services/       # Business logic
│   │   │   ├── repositories/   # Data access layer
│   │   │   ├── routes/         # Route definitions
│   │   │   ├── types/          # Module-specific types
│   │   │   └── __tests__/      # Module unit tests
│   │   ├── content/            # Course content management
│   │   │   ├── controllers/    # Content CRUD operations
│   │   │   ├── services/       # Content business logic
│   │   │   ├── repositories/   # Content data access
│   │   │   ├── routes/         # Content API routes
│   │   │   ├── schemas/        # Content validation schemas
│   │   │   ├── types/          # Content type definitions
│   │   │   └── __tests__/      # Content module tests
│   │   └── progress/           # Progress tracking & gamification
│   │       ├── controllers/    # Progress API handlers
│   │       ├── services/       # Progress calculations
│   │       ├── repositories/   # Progress data persistence
│   │       ├── routes/         # Progress API routes
│   │       ├── types/          # Progress type definitions
│   │       └── __tests__/      # Progress module tests
│   ├── shared/                 # Shared utilities and infrastructure
│   │   ├── database/           # Database connection & utilities
│   │   ├── middleware/         # Express middleware (auth, validation, etc.)
│   │   ├── schemas/            # Zod validation schemas
│   │   ├── utils/              # Utility functions & helpers
│   │   ├── types/              # Shared TypeScript types
│   │   ├── routes/             # Shared routes (health checks)
│   │   └── test/               # Test utilities & setup
│   │       ├── factories/      # Test data factories
│   │       ├── fixtures/       # Test fixtures
│   │       ├── utils/          # Test helper functions
│   │       ├── setup.ts        # Global test configuration
│   │       └── testDb.ts       # Test database utilities
│   ├── types/                  # Global type definitions
│   ├── app.ts                  # Express app configuration
│   ├── server.ts               # Server entry point
│   └── testInfo.ts             # Testing documentation & metadata
├── frontend-creator/           # Content Creator Web App (React + Vite)
│   ├── src/                    # React application source
│   ├── dist/                   # Built web application
│   ├── public/                 # Static assets
│   ├── scripts/                # Build scripts
│   ├── package.json            # Creator-specific dependencies
│   ├── vite.config.ts          # Vite configuration
│   └── tailwind.config.js      # Tailwind CSS configuration
├── frontend-mobile/            # Mobile Application (React Native + Expo)
│   ├── src/                    # React Native source
│   ├── assets/                 # Mobile app assets
│   ├── dist/                   # Built mobile application
│   ├── app.json                # Expo configuration
│   └── package.json            # Mobile-specific dependencies
├── frontend-shared/            # Shared Frontend Code
│   ├── types/                  # Shared TypeScript types
│   ├── utils/                  # Shared utility functions
│   ├── dist/                   # Built shared components
│   ├── __mocks__/              # Jest mocks for shared code
│   └── package.json            # Shared dependencies
├── prisma/                     # Database schema & migrations
│   ├── migrations/             # Database migration files
│   └── schema.prisma           # Prisma database schema
├── scripts/                    # Build & deployment scripts
│   ├── setup-test-db.js        # Test database setup script
│   └── check-test-config.js    # Test configuration validator
├── docs/                       # Generated backend & ecosystem documentation
├── logs/                       # Application logs
├── .env.example                # Environment template
├── .env.test.example           # Test environment template
├── jest.config.js              # Unit tests configuration
├── jest.integration.config.js  # Integration tests configuration
├── tsconfig.json               # TypeScript configuration
├── typedoc.json                # Documentation generation config
└── package.json                # Root monorepo configuration
```

## 📱 Applications

### Backend API
The core API server providing authentication, content management, and progress tracking services.

**Key Features:**
- RESTful API with comprehensive documentation
- JWT-based authentication with refresh tokens
- Hierarchical content structure management
- Progress tracking and gamification
- Offline content packaging

**Access:** `http://localhost:3000` (development)

### Content Creator (`frontend-creator/`)
Web-based application for educators and content creators to build language learning courses.

**Key Features:**
- Drag-and-drop course builder
- Exercise creation tools
- Content preview and testing
- Multi-language support
- Real-time collaboration features

**Access:** `http://localhost:5173` (development)

### Mobile App (`frontend-mobile/`)
Cross-platform mobile application for learners to access courses and track progress.

**Key Features:**
- Offline learning capabilities
- Progress synchronization
- Interactive exercises
- Gamification elements
- Multi-platform support (iOS, Android, Web)

**Access:** Expo development server (see mobile app documentation)

### Shared Components (`frontend-shared/`)
Common utilities, types, and components shared between frontend applications.

**Includes:**
- TypeScript type definitions
- Utility functions
- **Design system tokens** - Consistent colors, typography, spacing, and styling rules
- Design system components
- API client configurations

**Design System:**
- **Primary Color**: #50A8B1 (Teal) - Used throughout all applications and documentation
- **Typography**: Lato, Open Sans, Roboto font stack
- **Consistent spacing, shadows, and border radius** across all interfaces
- **Shared between frontend apps and backend documentation** for unified branding

## 📖 Documentation

### 🌐 Live Documentation

**Two complementary documentation systems:**

#### 📚 Complete Technical Documentation (GitHub Pages)
- **[Backend & Ecosystem Docs](https://exetrujillo.github.io/wayrapp/)** - Complete technical documentation, architecture, and guides
- **[Testing Guide](https://exetrujillo.github.io/wayrapp/modules/TestInfo.html)** - Comprehensive testing setup and best practices
- **Generated from code** - TypeDoc automatically generates from source code comments

#### 🔍 Interactive API Documentation (Vercel Deployment)
- **Live API testing interface** - Test endpoints directly in your browser
- **Always up-to-date** - Reflects the current deployed API
- **Styled with WayrApp design tokens** - Consistent branding
- **Interactive API Documentation** (when server is running):
  - `GET /swagger` - **Interactive Swagger UI** - Test API endpoints directly in your browser (styled with WayrApp design tokens)
  - `GET /api-docs` - Alternative Swagger UI interface  
  - `GET /api/swagger.json` - OpenAPI 3.0 specification (JSON) - **Serverless-optimized with fallback**
  - `GET /api/docs/overview` - Comprehensive API overview
  - `GET /api/status` - API status and health check

### 🔧 Backend API Documentation Endpoints

When running the server locally, you can access comprehensive backend API documentation:

| Endpoint | Description |
|----------|-------------|
| `/api/docs` | OpenAPI 3.0 specification (Swagger compatible) |
| `/api/docs/overview` | API overview with usage patterns |
| `/api/docs/authentication` | Authentication endpoints and security |
| `/api/docs/users` | User management operations |
| `/api/docs/content` | Content hierarchy management |
| `/api/docs/lessons-exercises` | Lesson and exercise management |
| `/api/docs/progress` | Progress tracking and gamification |
| `/api/docs/packaged-content` | Offline support implementation |
| `/api/docs/database-setup` | Database setup instructions |

### 📱 API Usage Examples

```bash
# Interactive API Documentation (open in browser)
open http://localhost:3000/swagger

# Get OpenAPI specification
curl http://localhost:3000/api/swagger.json

# Get API information
curl http://localhost:3000/api

# Check API status
curl http://localhost:3000/api/status

# Health check
curl http://localhost:3000/health

# Test authentication endpoint
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database for the example (we recommend [Neon](https://neon.tech/))
- npm (NPM Workspaces support required)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/exetrujillo/wayrapp.git
   cd wayrapp
   ```

2. **Install all dependencies** (installs for all workspaces)
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database URL and other configurations
   ```

4. **Set up the database**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. **Set up test environment** (for running tests safely)
   ```bash
   cp .env.example .env.test
   # Edit .env.test with a SEPARATE test database URL
   npm run test:db:setup
   ```

6. **Start all applications in development mode**
   ```bash
   npm run dev:all
   ```

   Or start individual applications:
   ```bash
   # Backend API only
   npm run dev
   
   # Content Creator only
   npm run dev --workspace=frontend-creator
   
   # Mobile app only
   npm run dev --workspace=frontend-mobile
   ```

### Available Scripts

#### Monorepo-wide Scripts
- `npm run build:all` - Build all applications
- `npm run dev:all` - Start all applications in development mode
- `npm run test:all` - Run tests for all applications
- `npm run lint:all` - Lint all applications
- `npm run format:all` - Format code for all applications

#### Backend API Scripts
- `npm run dev` - Start backend development server with hot reload
- `npm run build` - Build backend for production
- `npm run start` - Start backend production server
- `npm run test` - Run backend unit tests
- `npm run test:integration` - Run integration tests (requires test DB setup)
- `npm run test:integration:safe` - Setup test DB and run integration tests safely
- `npm run test:backend` - Run all backend tests (unit + integration)
- `npm run test:watch` - Run backend tests in watch mode
- `npm run test:db:setup` - Setup test database schema
- `npm run test:db:check` - Verify test/production database separation
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:test` - Test database connection

#### Frontend Scripts (run with --workspace flag)
- `npm run dev --workspace=frontend-creator` - Start content creator in development
- `npm run build --workspace=frontend-creator` - Build content creator for production
- `npm run dev --workspace=frontend-mobile` - Start mobile app in development
- `npm run build --workspace=frontend-mobile` - Build mobile app for production

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Database
DATABASE_URL="postgresql://username:password@...?sslmode=require"

# JWT Configuration
JWT_SECRET="your-super-secure-jwt-secret-key-here"
JWT_REFRESH_SECRET="your-super-secure-refresh-secret-key-here"

# Server Configuration
PORT=3000
NODE_ENV="development"
```

### Test Environment Configuration

**CRITICAL**: Create a separate `.env.test` file for testing to prevent data loss:

```bash
# Test Environment Configuration
NODE_ENV="test"

# Test Database Configuration - MUST BE SEPARATE FROM PRODUCTION
DATABASE_URL="postgresql://username:password@...test_database?sslmode=require"

# JWT Configuration (same as dev for testing)
JWT_SECRET="your-super-secure-jwt-secret-key-here"
JWT_REFRESH_SECRET="your-super-secure-refresh-secret-key-here"

# Server Configuration
PORT=3001

# Logging (minimal for tests)
LOG_LEVEL="error"

# Security (faster for tests)
BCRYPT_ROUNDS=4
```

**⚠️ WARNING**: Never use the same database for testing and production. Tests will delete all data during cleanup.

### Vercel Configuration

The `vercel.json` file is configured to handle both API and documentation routing:

```json
{
  "rewrites": [
    { "source": "/swagger", "destination": "/swagger.html" },
    { "source": "/docs", "destination": "/docs-redirect.html" },
    { "source": "/api/(.*)", "destination": "/api" }
  ]
}
```

**Important**: Uses `rewrites` instead of `routes` to avoid Vercel configuration conflicts.

### TypeScript Configuration for Vercel

The project includes a specific TypeScript configuration for Vercel deployment:

- `tsconfig.vercel.json` - Optimized for serverless deployment
- Excludes project references that don't exist in Vercel
- Uses CommonJS modules for Node.js compatibility
- Disables source maps and declarations for faster builds

```bash
# Local development build
npm run build

# Vercel deployment build
npm run build:vercel

# Verify Vercel build requirements
npm run verify:vercel
```

### Database Schema

The application uses a hierarchical content structure:

```
Course
├── Level (A1, A2, B1, etc.)
│   └── Section (Topics within a level)
│       └── Module (Learning units)
│           └── Lesson (Individual lessons)
│               └── Exercise (Practice activities)
```

## 🧪 Testing

The monorepo includes comprehensive test coverage across all applications with **separate test databases** to ensure production data safety.

### Test Database Setup

**IMPORTANT**: Tests use a separate test database to prevent data loss. 

**ARCHITECTURAL DECISION**: All tests (unit and integration) require a test database configuration. This is intentional to enforce security and prevent accidental data loss.

Before running any tests:

1. **Create a test database** (separate from production)
2. **Configure test environment**:
   ```bash
   cp .env.example .env.test
   # Edit .env.test with your TEST database URL
   ```
3. **Verify test configuration**:
   ```bash
   npm run test:db:check  # Ensures test/production databases are separate
   ```
4. **Setup test database**:
   ```bash
   npm run test:db:setup  # Initializes test database schema
   ```

### Running Tests

```bash
# Run tests for all applications
npm run test:all

# Backend tests
npm test                           # Unit tests only
npm run test:integration:safe      # Integration tests (with DB setup)
npm run test:backend              # All backend tests (unit + integration)

# Run tests for specific workspace
npm run test --workspace=frontend-creator
npm run test --workspace=frontend-mobile
npm run test --workspace=frontend-shared

# Run tests in watch mode
npm run test:watch  # Backend unit tests only
npm run test --workspace=frontend-creator -- --watch  # Creator only

# Run tests with coverage
npm run test:coverage  # Backend only
```

### Test Types

- **Unit Tests** (`.test.ts`): Fast, isolated tests that don't require database
- **Integration Tests** (`.integration.test.ts`): Full API tests using separate test database
- **Component Tests** (`.test.tsx`): Frontend component tests

### Test Database Safety

The testing system includes multiple safety measures:
- ✅ **Mandatory test database** - All tests require separate test database
- ✅ **Automatic validation** ensures test/production databases are different
- ✅ **Safe test commands** that setup test DB before running tests
- ✅ **Database isolation** with complete cleanup after each test
- ✅ **Team consistency** - Enforces proper setup across all developers

Test files are located alongside source files with `.test.ts` or `.test.tsx` extensions.

## 🚀 Deployment

### Production Build

```bash
# Build all applications
npm run build:all

# Start backend in production
npm start
```

### Vercel Deployment

The monorepo is configured for deployment on Vercel with the following setup:

- **Backend API**: Deployed as Vercel Serverless Functions
- **Interactive Documentation**: Static HTML files with API integration
- **Content Creator**: Deployed as a static site
- **Mobile App**: Deployed as a static web build

```bash
# Deploy to Vercel
npm run deploy:vercel
```

The `vercel.json` configuration handles:
- **API routes** (`/api/*`) → Backend serverless functions (`api/index.js`)
- **Documentation routes**:
  - `/swagger` → Interactive Swagger UI (`swagger.html`)
  - `/docs` → Documentation disambiguation page (`docs-redirect.html`)
  - `/` → Main landing page (`index.html`)
- **CORS headers** for API endpoints
- **Build optimization** with `.vercelignore` for faster deployments

**Key files for Vercel deployment:**
- `tsconfig.vercel.json` - TypeScript config optimized for serverless
- `api/index.js` - Serverless function handler
- `.vercelignore` - Excludes unnecessary files from deployment

### Docker Support

```dockerfile
# Multi-stage Dockerfile for monorepo
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY frontend-*/package.json ./frontend-*/
RUN npm ci
COPY . .
RUN npm run build:all

FROM node:18-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/frontend-creator/dist ./frontend-creator/dist
COPY --from=builder /app/frontend-mobile/web-build ./frontend-mobile/web-build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
RUN npm ci --only=production && npx prisma generate
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Use conventional commit messages
- Ensure all tests pass before submitting PR
- Update documentation for API changes

## 📝 API Overview

The API follows RESTful conventions with consistent response formats:

```json
{
  "success": true,
  "timestamp": "2023-07-20T12:34:56.789Z",
  "data": {
    // Response data here
  }
}
```

### Authentication

Most endpoints require JWT authentication:

```bash
Authorization: Bearer <your-jwt-token>
```

### Rate Limiting

API endpoints are rate-limited to prevent abuse:
- Authentication endpoints: 5 requests per minute
- General endpoints: 100 requests per minute

## 🔒 Security Features

- **Password Security**: bcrypt hashing with salt rounds
- **JWT Security**: Access tokens (15min) + Refresh tokens (7 days)
- **Input Validation**: Zod schema validation on all endpoints
- **Rate Limiting**: Configurable rate limits per endpoint
- **CORS Protection**: Configurable CORS policies
- **Security Headers**: Helmet.js for secure HTTP headers
- **Content Security Policy**: Restrictive CSP with specific allowances for Swagger UI (unpkg.com/swagger-ui-dist@5.9.0/)
- **Test Database Isolation**: Mandatory separate test database prevents production data loss

## 📊 Monitoring & Logging

- **Request Logging**: Morgan middleware for HTTP request logging
- **Error Tracking**: Comprehensive error handling and logging
- **Health Checks**: `/health` endpoint for monitoring
- **Performance Metrics**: Response time tracking

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify DATABASE_URL is correct
   - Ensure database is accessible
   - Check SSL configuration

2. **Test Database Issues**
   - Ensure `.env.test` exists with separate test database URL
   - Run `npm run test:db:check` to verify database separation
   - Run `npm run test:db:setup` to initialize test database
   - Never use production database for testing

3. **Migration Failures**
   - Ensure database permissions are correct
   - Check for conflicting schema changes
   - Verify Prisma schema syntax

4. **Test Failures**
   - Check if test database is properly configured
   - Ensure test database schema is up to date
   - Verify no rate limiting issues (tests include rate limit handling)

5. **Authentication Issues**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Ensure proper Authorization header format

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Exequiel Trujillo** - Initial work and architecture

## 🙏 Acknowledgments

- Built with modern Node.js and TypeScript best practices
- Inspired by language learning platforms
- Uses industry-standard security practices and patterns