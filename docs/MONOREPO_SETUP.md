---
layout: default
title: Monorepo Setup and Development
---

# Monorepo Setup and Development Guide

This guide covers the setup, development, and deployment processes for the WayrApp monorepo structure.

## Overview

WayrApp is organized as an NPM Workspaces monorepo containing multiple applications:

- **Root**: Backend API server (Node.js/Express)
- **frontend-creator**: Content Creator web app (React/Vite)
- **frontend-mobile**: Mobile app (React Native/Expo)
- **frontend-shared**: Shared components and utilities

## Prerequisites

- Node.js 18 or higher
- npm (with NPM Workspaces support)
- PostgreSQL database
- Git

## Initial Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd wayrapp
npm install
```

The `npm install` command will automatically install dependencies for all workspaces.

### 2. Environment Configuration

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# JWT Configuration
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"

# Server Configuration
PORT=3000
NODE_ENV="development"
```

### 3. Database Setup

```bash
npm run db:generate
npm run db:migrate
```

## Development Workflow

### Starting All Applications

```bash
# Start all applications in development mode
npm run dev:all
```

This will start:
- Backend API on `http://localhost:3000`
- Content Creator on `http://localhost:5173`
- Mobile app via Expo development server

### Starting Individual Applications

```bash
# Backend API only
npm run dev

# Content Creator only
npm run dev --workspace=frontend-creator

# Mobile app only
npm run dev --workspace=frontend-mobile
```

### Building Applications

```bash
# Build all applications
npm run build:all

# Build individual applications
npm run build                                    # Backend
npm run build --workspace=frontend-creator      # Creator
npm run build --workspace=frontend-mobile       # Mobile
npm run build --workspace=frontend-shared       # Shared
```

## Testing

### Running Tests

```bash
# Run tests for all applications
npm run test:all

# Run backend tests
npm test

# Run tests for specific workspace
npm run test --workspace=frontend-creator
npm run test --workspace=frontend-mobile
npm run test --workspace=frontend-shared
```

### Test Configuration

Each workspace has its own Jest configuration:

- **Root**: `jest.config.js` - Backend API tests
- **frontend-creator**: `frontend-creator/jest.config.js` - React component tests
- **frontend-mobile**: `frontend-mobile/jest.config.js` - React Native tests
- **frontend-shared**: `frontend-shared/jest.config.js` - Shared component tests

## Dependency Management

### Adding Dependencies

```bash
# Add dependency to root (backend)
npm install package-name

# Add dependency to specific workspace
npm install package-name --workspace=frontend-creator

# Add dev dependency to root (shared across all workspaces)
npm install -D package-name
```

### Dependency Structure

- **Root package.json**: Backend production dependencies + shared dev dependencies
- **Workspace package.json**: Application-specific runtime dependencies
- **frontend-shared**: Peer dependencies for React components

## TypeScript Configuration

### Configuration Hierarchy

```
tsconfig.json (root)           # Base configuration
├── tsconfig.build.json        # Backend build config
├── frontend-creator/tsconfig.json
├── frontend-mobile/tsconfig.json
└── frontend-shared/tsconfig.json
```

### Path Mapping

The monorepo uses TypeScript path mapping for shared code:

```json
{
  "paths": {
    "wayrapp-shared": ["../frontend-shared/dist"]
  }
}
```

## Deployment

### Vercel Deployment

The monorepo is configured for Vercel deployment with `vercel.json`:

```json
{
  "builds": [
    { "src": "src/server.ts", "use": "@vercel/node" },
    { "src": "frontend-creator/package.json", "use": "@vercel/static-build" },
    { "src": "frontend-mobile/package.json", "use": "@vercel/static-build" }
  ]
}
```

Deploy with:

```bash
npm run deploy:vercel
```

### Manual Deployment

```bash
# Build all applications
npm run build:all

# Deploy backend
npm start

# Serve frontend applications
# (frontend-creator/dist and frontend-mobile/web-build)
```

## Workspace Scripts

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev:all` | Start all applications in development |
| `npm run build:all` | Build all applications |
| `npm run test:all` | Run tests for all applications |
| `npm run lint:all` | Lint all applications |
| `npm run format:all` | Format code for all applications |

### Workspace-Specific Scripts

```bash
# Run script in specific workspace
npm run <script> --workspace=<workspace-name>

# Examples
npm run dev --workspace=frontend-creator
npm run test --workspace=frontend-mobile
npm run build --workspace=frontend-shared
```

## Troubleshooting

### Common Issues

1. **TypeScript Errors**
   - Ensure all workspaces are built: `npm run build:all`
   - Check path mappings in tsconfig.json files
   - Verify shared components are properly exported

2. **Dependency Issues**
   - Clear node_modules: `rm -rf node_modules */node_modules`
   - Reinstall: `npm install`
   - Check for version conflicts between workspaces

3. **Build Failures**
   - Ensure frontend-shared is built before other frontends
   - Check for circular dependencies
   - Verify all required environment variables are set

### Development Tips

1. **Hot Reloading**: Changes in frontend-shared require rebuilding for other apps to see changes
2. **Database Changes**: Run `npm run db:generate` after schema changes
3. **New Dependencies**: Add shared dev dependencies to root, runtime dependencies to specific workspaces
4. **Testing**: Use `--stream` flag for better output when running workspace commands

## File Structure Best Practices

```
wayrapp/
├── src/                    # Backend source (Node.js/Express)
├── frontend-creator/       # React web app
│   ├── src/
│   ├── dist/              # Build output
│   └── package.json
├── frontend-mobile/        # React Native app
│   ├── src/
│   ├── web-build/         # Web build output
│   └── package.json
├── frontend-shared/        # Shared code
│   ├── types/
│   ├── utils/
│   ├── dist/              # Build output
│   └── package.json
├── docs/                   # Documentation
├── prisma/                 # Database schema
└── package.json           # Root configuration
```

## Contributing

When contributing to the monorepo:

1. Follow the established workspace structure
2. Add tests for new features in the appropriate workspace
3. Update documentation for API or significant changes
4. Ensure all applications build successfully
5. Test cross-workspace dependencies

For more detailed contribution guidelines, see [CONTRIBUTING.md](../CONTRIBUTING.md).