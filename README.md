# WayrApp - Language Learning Platform

A comprehensive and decentralized language learning platform built with Node.js, Express, TypeScript, React, and React Native. WayrApp provides a complete ecosystem including a robust backend API, web-based content creator tool, and mobile application for language learning.

## 🏗️ Monorepo Structure

This repository is organized as an NPM Workspaces monorepo containing:

- **Backend API** (root) - Node.js/Express API server
- **Content Creator** (`frontend-creator/`) - React web application for creating educational content
- **Mobile App** (`frontend-mobile/`) - React Native mobile application
- **Shared Components** (`frontend-shared/`) - Shared utilities and components

## 🚀 Features

- **🔐 Authentication & Authorization** - JWT-based auth with role-based access control
- **📚 Content Management** - Hierarchical course structure (Courses → Levels → Sections → Modules → Lessons)
- **🎯 Exercise System** - Multiple exercise types with reusable components
- **📊 Progress Tracking** - Experience points, streaks, lives, and completion tracking
- **📱 Offline Support** - Packaged content API with versioning and caching
- **🎮 Gamification** - Lives system, streaks, and experience points
- **🔄 Sync Capabilities** - Offline progress synchronization
- **🛡️ Security** - Input validation, rate limiting, and secure headers
- **🎨 Content Creator** - Web-based tool for creating and managing educational content
- **📱 Mobile App** - Cross-platform mobile application for learners

## 🏗️ Architecture

### Tech Stack

#### Backend API
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with refresh token rotation
- **Validation**: Zod schemas
- **Testing**: Jest with comprehensive test coverage
- **Caching**: In-memory caching with TTL support

#### Frontend Applications
- **Content Creator**: React 18 with TypeScript, Vite, Tailwind CSS
- **Mobile App**: React Native with Expo, TypeScript
- **Shared Components**: TypeScript library with React components and utilities
- **Testing**: Jest with React Testing Library
- **Build Tools**: Vite (Creator), Expo (Mobile), TypeScript compiler (Shared)

### Monorepo Structure
```
wayrapp/
├── src/                    # Backend API source code
│   ├── modules/           # Feature modules
│   │   ├── auth/         # Authentication & authorization
│   │   ├── users/        # User management
│   │   ├── content/      # Course content management
│   │   └── progress/     # Progress tracking
│   ├── shared/           # Shared utilities and types
│   └── server.ts         # Backend entry point
├── frontend-creator/      # Content Creator Web App
│   ├── src/              # React application source
│   ├── dist/             # Built web application
│   └── package.json      # Creator-specific dependencies
├── frontend-mobile/       # Mobile Application
│   ├── src/              # React Native source
│   ├── web-build/        # Built mobile web version
│   └── package.json      # Mobile-specific dependencies
├── frontend-shared/       # Shared Frontend Code
│   ├── types/            # Shared TypeScript types
│   ├── utils/            # Shared utilities
│   ├── dist/             # Built shared components
│   └── package.json      # Shared dependencies
└── package.json          # Root monorepo configuration
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
- Design system components
- API client configurations

## 📖 Documentation

### 🌐 Live API Documentation
- **[Interactive API Docs](https://exetrujillo.github.io/wayrapp/)** - GitHub Pages hosted documentation
- **API Endpoints** (when server is running):
  - `GET /api/docs` - OpenAPI 3.0 specification
  - `GET /api/docs/overview` - Comprehensive API overview
  - `GET /api/status` - API status and health check

### 🔧 API Documentation Endpoints

When running the server locally, you can access comprehensive API documentation:

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
# Get API information
curl http://localhost:3000/api

# Get comprehensive documentation
curl http://localhost:3000/api/docs

# Check API status
curl http://localhost:3000/api/status

# Health check
curl http://localhost:3000/health
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

5. **Start all applications in development mode**
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
- `npm run test` - Run backend test suite
- `npm run test:watch` - Run backend tests in watch mode
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

```env
# Database
DATABASE_URL="postgresql://username:password@...?sslmode=require"

# JWT Configuration
JWT_SECRET="your-super-secure-jwt-secret-key-here"
JWT_REFRESH_SECRET="your-super-secure-refresh-secret-key-here"

# Server Configuration
PORT=3000
NODE_ENV="development"


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

The monorepo includes comprehensive test coverage across all applications:

```bash
# Run tests for all applications
npm run test:all

# Run backend tests only
npm test

# Run tests for specific workspace
npm run test --workspace=frontend-creator
npm run test --workspace=frontend-mobile
npm run test --workspace=frontend-shared

# Run tests in watch mode
npm run test:watch  # Backend only
npm run test --workspace=frontend-creator -- --watch  # Creator only

# Run tests with coverage
npm run test:coverage  # Backend only
```

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
- **Content Creator**: Deployed as a static site
- **Mobile App**: Deployed as a static web build

```bash
# Deploy to Vercel
npm run deploy:vercel
```

The `vercel.json` configuration handles:
- API routes (`/api/*`) → Backend serverless functions
- Static assets for frontend applications
- Proper build commands for each workspace

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

2. **Migration Failures**
   - Ensure database permissions are correct
   - Check for conflicting schema changes
   - Verify Prisma schema syntax

3. **Authentication Issues**
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