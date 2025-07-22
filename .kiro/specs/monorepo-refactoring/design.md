# Design Document: Monorepo Refactoring

## Overview

This document outlines the definitive design for refactoring the current project structure into a robust NPM Workspaces monorepo. The current structure has the backend application code at the root of the repository, with frontend applications residing in sub-directories. The refactoring will establish a proper monorepo structure that ensures seamless dependency management, build processes, and error-free deployment on Vercel.

## Architecture

The refactored architecture will follow the NPM Workspaces monorepo pattern, with the following key components:

1. **Monorepo Root**: The existing backend's `package.json` at the root of the repository will serve as the monorepo root, containing workspace configurations, global development dependencies, and backend production dependencies.

2. **Backend Application**: The backend application code will remain at the root level, with its production dependencies maintained in the root `package.json`.

3. **Frontend Workspaces**: The frontend applications (`frontend-creator`, `frontend-mobile`, `frontend-shared`) will be maintained as separate workspaces within the monorepo.

4. **Shared Code**: The `frontend-shared` workspace will contain shared code, utilities, and components that can be used by both frontend applications.

5. **Dependency Management**: Development dependencies will be centralized at the root level, while runtime dependencies will be declared in their respective workspace `package.json` files.

6. **TypeScript Configuration**: TypeScript will be configured with a root `tsconfig.json` that defines common settings, with workspace-specific configurations extending from the root.

7. **Testing Framework**: Jest will be used as the unified testing framework across all workspaces.

8. **Vercel Deployment**: The deployment configuration will be updated to support deploying all applications from the monorepo.

## Components and Interfaces

### 1. Root Package.json (Existing Backend's package.json)

The existing backend's `package.json` at the root will be modified to serve as the monorepo root:

```json
{
  "name": "wayrapp",
  "version": "1.0.0",
  "description": "WayrApp - Open-source language learning platform",
  "private": true,
  "workspaces": [
    "frontend-creator",
    "frontend-mobile",
    "frontend-shared"
  ],
  "main": "dist/server.js",
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "build:all": "npm run build --workspaces --stream",
    "start": "node dist/server.js",
    "dev": "ts-node-dev --respawn --transpile-only -r tsconfig-paths/register src/server.ts",
    "dev:all": "npm run dev --workspaces --stream",
    "postinstall": "prisma generate",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathIgnorePatterns=integration",
    "test:integration": "jest --config jest.integration.config.js",
    "test:integration:watch": "jest --config jest.integration.config.js --watch",
    "test:integration:coverage": "jest --config jest.integration.config.js --coverage",
    "test:backend": "npm run test:unit && npm run test:integration",
    "test:all": "npm run test --workspaces --stream",
    "format": "prettier --write \"src/**/*.ts\"",
    "format:all": "npm run format --workspaces --stream",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:migrate:prod": "prisma migrate deploy",
    "db:studio": "prisma studio",
    "db:test": "ts-node src/shared/database/testConnection.ts",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "lint:all": "npm run lint --workspaces --stream",
    "docs:generate": "node scripts/generate-docs.js",
    "docs:build": "npm run docs:generate",
    "security:audit": "node scripts/security-audit.js",
    "security:deps": "npm audit",
    "deploy:prepare": "node scripts/deploy.js",
    "deploy:vercel": "vercel --prod"
  },
  "dependencies": {
    "@prisma/client": "^6.12.0",
    "bcryptjs": "^2.4.3",
    "compression": "^1.7.4",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "winston": "^3.11.0",
    "xss": "^1.0.15",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@babel/core": "^7.23.5",
    "@types/bcryptjs": "^2.4.6",
    "@types/compression": "^1.8.1",
    "@types/cors": "^2.8.19",
    "@types/express": "^4.17.21",
    "@types/express-rate-limit": "^5.1.3",
    "@types/jest": "^29.5.8",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/marked": "^4.0.0",
    "@types/node": "^20.10.5",
    "@types/react": "^18.2.42",
    "@types/react-beautiful-dnd": "^13.1.7",
    "@types/react-dom": "^18.2.17",
    "@types/react-native": "^0.72.7",
    "@types/supertest": "^2.0.16",
    "@types/uuid": "^10.0.0",
    "@types/winston": "^2.4.4",
    "@typescript-eslint/eslint-plugin": "^6.13.2",
    "@typescript-eslint/parser": "^6.13.2",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "jest": "^29.7.0",
    "jest-expo": "^49.0.0",
    "jest-junit": "^16.0.0",
    "jest-mock-extended": "^4.0.0",
    "marked": "^12.0.0",
    "postcss": "^8.4.32",
    "prettier": "^2.8.8",
    "prisma": "^6.12.0",
    "supertest": "^6.3.3",
    "tailwindcss": "^3.3.6",
    "ts-jest": "^29.1.1",
    "ts-node-dev": "^2.0.0",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.3.3",
    "uuid": "^11.1.0",
    "vite": "^5.0.5"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 2. Frontend-Creator Package.json

The `frontend-creator/package.json` will be updated to include only runtime dependencies:

```json
{
  "name": "wayrapp-creator",
  "version": "0.1.0",
  "description": "WayrApp Content Creator Tool - Web application for creating educational content",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "type-check": "tsc --noEmit",
    "test": "jest"
  },
  "dependencies": {
    "@headlessui/react": "^1.7.17",
    "axios": "^1.6.2",
    "i18next": "^23.7.7",
    "i18next-browser-languagedetector": "^7.2.0",
    "react": "^18.2.0",
    "react-beautiful-dnd": "^13.1.1",
    "react-dom": "^18.2.0",
    "react-helmet-async": "^2.0.1",
    "react-i18next": "^13.5.0",
    "react-router-dom": "^6.20.1",
    "wayrapp-shared": "0.1.0",
    "zod": "^3.22.4"
  }
}
```

### 3. Frontend-Mobile Package.json

The `frontend-mobile/package.json` will be updated to include only runtime dependencies:

```json
{
  "name": "wayrapp-mobile",
  "version": "0.1.0",
  "description": "WayrApp Mobile - React Native application for language learning",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "build": "expo export:web",
    "build:android": "expo build:android",
    "build:ios": "expo build:ios",
    "test": "jest"
  },
  "dependencies": {
    "@react-native-async-storage/async-storage": "^1.19.5",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/stack": "^6.3.20",
    "axios": "^1.6.2",
    "expo": "^49.0.0",
    "expo-localization": "~14.3.0",
    "expo-status-bar": "~1.6.0",
    "i18next": "^23.7.7",
    "react": "18.2.0",
    "react-native": "0.72.6",
    "react-native-gesture-handler": "~2.12.0",
    "react-native-paper": "^5.11.3",
    "react-native-safe-area-context": "4.6.3",
    "react-native-screens": "~3.22.0",
    "react-native-vector-icons": "^10.0.2",
    "react-i18next": "^13.5.0",
    "wayrapp-shared": "0.1.0"
  }
}
```

### 4. Frontend-Shared Package.json

The `frontend-shared/package.json` will be updated to properly export shared components and utilities:

```json
{
  "name": "wayrapp-shared",
  "version": "0.1.0",
  "description": "Shared utilities and design system for WayrApp frontend applications",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint . --ext .ts,.tsx"
  },
  "dependencies": {},
  "peerDependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

## TypeScript Configuration

### 1. Root tsconfig.json

The root `tsconfig.json` will serve as the base configuration for all TypeScript projects in the monorepo:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noUncheckedIndexedAccess": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "types": ["node", "jest"],
    "typeRoots": ["./node_modules/@types"]
  },
  "references": [
    { "path": "./frontend-creator" },
    { "path": "./frontend-mobile" },
    { "path": "./frontend-shared" }
  ],
  "exclude": ["node_modules"]
}
```

### 2. Backend tsconfig.json (tsconfig.build.json)

The backend will use a separate `tsconfig.build.json` that extends from the root `tsconfig.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"],
      "@/modules/*": ["modules/*"],
      "@/shared/*": ["shared/*"]
    }
  },
  "include": [
    "src/**/*",
    "src/shared/types/*.d.ts"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ],
  "ts-node": {
    "require": ["tsconfig-paths/register"]
  }
}
```

### 3. Frontend-Creator tsconfig.json

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "wayrapp-shared": ["../frontend-shared/dist"]
    }
  },
  "include": ["src"],
  "references": [
    { "path": "../frontend-shared" }
  ]
}
```

### 4. Frontend-Mobile tsconfig.json

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "target": "esnext",
    "module": "ESNext",
    "lib": ["es2019"],
    "jsx": "react-native",
    "noEmit": true,
    "isolatedModules": true,
    "moduleResolution": "node",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "wayrapp-shared": ["../frontend-shared/dist"]
    }
  },
  "include": ["src"],
  "references": [
    { "path": "../frontend-shared" }
  ]
}
```

### 5. Frontend-Shared tsconfig.json

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": ".",
    "composite": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["./**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Testing Framework Configuration

### 1. Root Jest Configuration (jest.config.js)

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
```

### 2. Frontend-Creator Jest Configuration (frontend-creator/jest.config.js)

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^wayrapp-shared$': '<rootDir>/../frontend-shared/dist',
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
};
```

### 3. Frontend-Mobile Jest Configuration (frontend-mobile/jest.config.js)

```javascript
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|expo(nent)?|@expo(nent)?/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|@sentry/.*)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^wayrapp-shared$': '<rootDir>/../frontend-shared/dist',
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
};
```

### 4. Frontend-Shared Jest Configuration (frontend-shared/jest.config.js)

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
```

## Vercel Deployment Configuration

The `vercel.json` file will be updated to support deploying all applications from the monorepo:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.ts",
      "use": "@vercel/node"
    },
    {
      "src": "frontend-creator/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    },
    {
      "src": "frontend-mobile/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "web-build" }
    }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/src/server.ts" },
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/src/server.ts" }
  ]
}
```

## .gitignore Updates

The `.gitignore` file will be updated to exclude common build artifacts and dependencies:

```
# Dependencies
node_modules
.pnp
.pnp.js

# Testing
coverage
.coverage

# Production
dist
build
web-build

# Misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
logs
*.log

# Editor directories and files
.idea
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Expo
.expo/
*.jks
*.p8
*.p12
*.key
*.mobileprovision
*.orig.*
```

## Data Models

No new data models are required for this refactoring. The existing data models will remain unchanged.

## Error Handling

Error handling will be maintained at the application level within each workspace. The monorepo structure itself does not introduce new error handling requirements.

## Testing Strategy

1. **Unit Testing**: Each workspace will maintain its own unit tests, which will be run using Jest as the unified testing framework.

2. **Integration Testing**: Integration tests will be maintained at the workspace level, with the backend workspace containing the primary integration tests.

3. **End-to-End Testing**: End-to-end tests can be added at the root level to test the interaction between the different applications.

4. **Build Testing**: After the refactoring, a build test will be performed to ensure that all applications can be built successfully using the monorepo structure.

5. **Deployment Testing**: A deployment test will be performed to ensure that all applications can be deployed successfully to Vercel.

## Migration Plan

1. **Backup**: Create a backup of the current repository structure.

2. **Root Package.json**: Update the existing backend's `package.json` at the root to include workspace configuration, centralize development dependencies, and maintain backend production dependencies.

3. **Frontend Package.json Files**: Update the frontend `package.json` files to include only runtime dependencies and necessary scripts. Ensure `frontend-shared` declares React as a peer dependency.

4. **TypeScript Configuration**: Update the TypeScript configuration files to support the monorepo structure, with a root `tsconfig.json` and workspace-specific configurations that extend from it. Ensure proper path mappings for shared code.

5. **Jest Configuration**: Create Jest configuration files for each workspace to ensure consistent testing across the monorepo, with proper module resolution for TypeScript and shared code.

6. **Vercel Configuration**: Update the `vercel.json` file to support deploying all applications from the monorepo, with correct source paths and build commands.

7. **Testing**: Test the build and deployment process to ensure that all applications can be built and deployed successfully.

8. **Documentation**: Update the documentation to reflect the new monorepo structure and build/deployment process.

## Conclusion

This design document outlines the definitive approach for refactoring the current project structure into a robust NPM Workspaces monorepo. The refactoring will establish a proper monorepo structure that ensures seamless dependency management, build processes, and error-free deployment on Vercel. The design addresses all the requirements specified in the requirements document and provides a clear path for implementation.