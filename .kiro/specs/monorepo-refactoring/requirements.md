# Requirements Document

## Introduction

This document outlines the requirements for refactoring the current project structure into a robust NPM Workspaces monorepo. The refactoring aims to solve persistent build and deployment issues on Vercel, particularly related to TypeScript type resolution and dependency management across multiple applications. The current structure has the backend application code at the root of the repository, with frontend applications residing in sub-directories. The refactoring will establish a proper monorepo structure that ensures seamless dependency management, build processes, and deployment.

## Requirements

### Requirement 1: Monorepo Root Configuration

**User Story:** As a developer, I want a properly configured monorepo root, so that I can manage all workspaces from a central location.

#### Acceptance Criteria

1. WHEN examining the root package.json THEN the system SHALL have "private": true declared.
2. WHEN examining the root package.json THEN the system SHALL have a workspaces array listing all frontend sub-directories ["frontend-creator", "frontend-mobile", "frontend-shared"].
3. WHEN examining the root package.json THEN the system SHALL have centralized global devDependencies.
4. WHEN examining the root package.json THEN the system SHALL have monorepo-wide scripts for building, testing, and running all workspaces using `npm run <script-name> --workspaces --stream`.
5. WHEN examining the root package.json THEN the system SHALL NOT contain redundant scripts or configurations that belong in individual workspaces.

### Requirement 2: Sub-Project Configuration

**User Story:** As a developer, I want each sub-project to have its own configuration, so that I can manage project-specific dependencies and scripts.

#### Acceptance Criteria

1. WHEN examining each sub-directory package.json THEN the system SHALL have project-specific dependencies declared.
2. WHEN examining each sub-directory package.json THEN the system SHALL have project-specific devDependencies declared.
3. WHEN examining each sub-directory package.json THEN the system SHALL have project-specific scripts defined.
4. WHEN examining each sub-directory package.json THEN the system SHALL NOT declare workspaces or private: true.

### Requirement 3: Dependency Management

**User Story:** As a developer, I want a streamlined dependency management process, so that I can install all dependencies with a single command.

#### Acceptance Criteria

1. WHEN running npm install at the root THEN the system SHALL install all dependencies for all workspaces.
2. WHEN examining frontend-creator's package.json THEN the system SHALL have react-beautiful-dnd and its @types added as dependencies.
3. WHEN adding a new dependency to a specific workspace THEN the system SHALL allow installation from the monorepo root.
4. WHEN examining node_modules folders THEN the system SHALL have correctly populated dependencies across the monorepo according to npm's hoisting rules.

### Requirement 4: TypeScript Configuration

**User Story:** As a developer, I want proper TypeScript configuration across the monorepo, so that I can avoid type resolution errors during build and deployment.

#### Acceptance Criteria

1. WHEN examining the root tsconfig.json THEN the system SHALL define global compilerOptions.
2. WHEN examining the root tsconfig.json THEN the system SHALL include references to sub-project tsconfig.json files.
3. WHEN examining each sub-project tsconfig.json THEN the system SHALL extend from the root tsconfig.json or configure project-specific settings.
4. WHEN building the project THEN the system SHALL NOT produce TS7016 errors for missing declaration files.
5. WHEN examining relevant package.json files THEN the system SHALL have all necessary @types/* packages correctly installed.

### Requirement 5: Vercel Deployment Configuration

**User Story:** As a developer, I want a robust Vercel deployment configuration, so that all applications deploy correctly from the monorepo.

#### Acceptance Criteria

1. WHEN examining vercel.json THEN the system SHALL have configuration for deploying the backend as a Serverless Function.
2. WHEN examining vercel.json THEN the system SHALL have configuration for deploying frontend-creator as a Static Site.
3. WHEN examining vercel.json THEN the system SHALL have configuration for deploying frontend-mobile as a Static Site.
4. WHEN examining vercel.json THEN the system SHALL have correct builds and routes configurations for all three applications.
5. WHEN examining vercel.json THEN the system SHALL specify explicit buildCommand and outputDirectory for each build.

### Requirement 6: Git Configuration

**User Story:** As a developer, I want proper Git configuration, so that unnecessary files are excluded from version control.

#### Acceptance Criteria

1. WHEN examining .gitignore THEN the system SHALL correctly exclude node_modules globally.
2. WHEN examining .gitignore THEN the system SHALL correctly exclude build artifacts.
3. WHEN examining .gitignore THEN the system SHALL ensure necessary files for each workspace are tracked.

### Requirement 7: Build and Deployment Process

**User Story:** As a developer, I want a streamlined build and deployment process, so that I can deploy the entire application suite with minimal commands.

#### Acceptance Criteria

1. WHEN running npm run build --workspaces THEN the system SHALL successfully build all applications.
2. WHEN running vercel build THEN the system SHALL successfully build all applications.
3. WHEN deploying to Vercel THEN the system SHALL successfully deploy the entire WayrApp ecosystem.