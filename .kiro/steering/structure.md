# WayrApp Project Structure

## Monorepo Organization
This is an NPM Workspaces monorepo with the backend API at the root and frontend applications in subdirectories.

```
wayrapp/
├── src/                        # Backend API (Node.js/Express/TypeScript)
├── frontend-creator/           # Content Creator Web App (React/Vite)
├── frontend-mobile/            # Mobile App (React Native/Expo)
├── frontend-shared/            # Shared Frontend Code (TypeScript)
├── prisma/                     # Database Schema & Migrations
├── scripts/                    # Build & Deployment Scripts
├── docs/                       # Generated Documentation (TypeDoc)
└── api/                        # Vercel Serverless Function Handler
```

## Backend Structure (src/)
Follows domain-driven design with modular architecture:

```
src/
├── modules/                    # Feature Modules (Domain-Driven Design)
│   ├── users/                  # User Management & Authentication
│   │   ├── controllers/        # HTTP Request Handlers
│   │   ├── services/           # Business Logic
│   │   ├── repositories/       # Data Access Layer
│   │   ├── routes/             # Route Definitions
│   │   ├── types/              # Module-Specific Types
│   │   └── __tests__/          # Module Unit Tests
│   ├── content/                # Course Content Management
│   └── progress/               # Progress Tracking & Gamification
├── shared/                     # Shared Infrastructure
│   ├── database/               # Database Connection & Utilities
│   ├── middleware/             # Express Middleware
│   ├── schemas/                # Zod Validation Schemas
│   ├── utils/                  # Utility Functions
│   ├── types/                  # Shared TypeScript Types
│   ├── routes/                 # Shared Routes (health checks)
│   └── test/                   # Test Utilities & Setup
│       ├── factories/          # Test Data Factories
│       ├── fixtures/           # Test Fixtures
│       ├── utils/              # Test Helper Functions
│       ├── setup.ts            # Global Test Configuration
│       └── testDb.ts           # Test Database Utilities
├── types/                      # Global Type Definitions
├── __tests__/                  # Integration Tests
│   └── integration/            # Cross-Module Integration Tests
├── app.ts                      # Express App Configuration
├── server.ts                   # Server Entry Point
└── testInfo.ts                 # Testing Documentation
```

## Frontend Applications

### Content Creator (frontend-creator/)
```
frontend-creator/
├── src/                        # React Application Source
├── public/                     # Static Assets
├── dist/                       # Built Application
├── scripts/                    # Build Scripts
├── vite.config.ts              # Vite Configuration
└── tailwind.config.js          # Tailwind CSS Configuration
```

### Mobile App (frontend-mobile/)
```
frontend-mobile/
├── src/                        # React Native Source
├── assets/                     # Mobile App Assets
├── dist/                       # Built Application
├── app.json                    # Expo Configuration
└── package.json                # Mobile Dependencies
```

### Shared Components (frontend-shared/)
```
frontend-shared/
├── types/                      # Shared TypeScript Types
├── utils/                      # Shared Utility Functions
├── dist/                       # Built Shared Components
├── __mocks__/                  # Jest Mocks
├── constants.js                # Shared Constants
├── design-tokens.js            # Design System Tokens
└── index.ts                    # Main Export File
```

## Key Conventions

### File Naming
- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Services/Utilities**: camelCase (e.g., `userService.ts`)
- **Types**: PascalCase with descriptive names (e.g., `UserProgressType.ts`)
- **Tests**: Same as source file + `.test.ts` or `.integration.test.ts`

### Module Structure
Each backend module follows consistent structure:
- `controllers/` - HTTP request/response handling
- `services/` - Business logic and validation
- `repositories/` - Database operations
- `routes/` - Express route definitions
- `types/` - Module-specific TypeScript types
- `__tests__/` - Unit tests for the module

### Import Paths
- Backend uses `@/` alias pointing to `src/`
- Shared components imported as `wayrapp-shared`
- Relative imports for same-module files

### Database Schema
Hierarchical content structure:
```
Course (id: string, max 20 chars)
├── Level (id: string, max 30 chars)
│   └── Section (id: string, max 40 chars)
│       └── Module (id: string, max 50 chars)
│           └── Lesson (id: string, max 60 chars)
│               └── Exercise (id: string, max 15 chars)
```

### Testing Structure
- **Unit Tests**: `.test.ts` files alongside source code
- **Integration Tests**: `src/__tests__/integration/` directory
- **Test Database**: Mandatory separate database for all tests
- **Test Utilities**: Centralized in `src/shared/test/`

### Configuration Files
- **TypeScript**: Multiple configs for different environments
- **Jest**: Separate configs for unit vs integration tests
- **Environment**: `.env` for dev, `.env.test` for testing (mandatory separation)
- **Deployment**: `vercel.json` for serverless deployment configuration