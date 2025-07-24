# Requirements Document

## Introduction

This feature focuses on transitioning the frontend-creator application from using MSW (Mock Service Worker) handlers to integrating with the live production API. The primary objectives are to align the frontend's data models with the backend's Prisma schema and implement real authentication against the deployed API at https://wayrapp.vercel.app/api/v1. This represents a critical milestone in moving from development mocks to production-ready functionality.

## Requirements

### Requirement 1: Data Model Alignment

**User Story:** As a developer, I want the frontend TypeScript interfaces to exactly match the backend Prisma schema, so that there are no runtime type mismatches when communicating with the real API.

#### Acceptance Criteria

1. WHEN the frontend defines User interfaces THEN they SHALL match the structure returned by the `/api/v1/auth/me` endpoint exactly
2. WHEN the frontend defines Course interfaces THEN they SHALL use `isPublic: boolean` instead of `status: 'draft' | 'published' | 'archived'`
3. WHEN the frontend defines Exercise interfaces THEN they SHALL use `exerciseType: 'translation' | 'fill-in-the-blank' | 'vof' | 'pairs' | 'informative' | 'ordering'` instead of `type: 'multiple-choice' | 'fill-blank' | 'matching'`
4. WHEN the frontend defines data models THEN it SHALL include interfaces for Level, Section, and Module if they don't exist, based on the backend schema
5. WHEN TypeScript compilation occurs THEN there SHALL be no type errors related to data model mismatches
6. WHEN API responses are received THEN the frontend SHALL be able to consume them without type casting or transformation

### Requirement 2: Environment Configuration

**User Story:** As a developer, I want to easily switch between mock and real API modes through environment variables, so that I can control the application's data source without code changes.

#### Acceptance Criteria

1. WHEN the application starts THEN it SHALL read `VITE_API_URL` from environment variables to determine the API base URL
2. WHEN `VITE_ENABLE_MSW` is set to false THEN the system SHALL make real network requests instead of using MSW handlers
3. WHEN environment variables are missing THEN the system SHALL provide sensible defaults pointing to the production API
4. WHEN a developer sets up the project THEN they SHALL have access to a `.env.example` file with all required variables documented
5. WHEN the application is built for production THEN it SHALL default to using the real API without MSW

### Requirement 3: API Client Infrastructure

**User Story:** As a developer, I want a centralized API client that handles authentication, error handling, and request configuration, so that all API communication is consistent and maintainable.

#### Acceptance Criteria

1. WHEN making API requests THEN the system SHALL use a configured HTTP client (axios or fetch) with the correct base URL from environment variables
2. WHEN authenticated requests are made THEN the system SHALL automatically attach JWT tokens from secure storage
3. WHEN API errors occur THEN the system SHALL handle them consistently with appropriate error messages
4. WHEN tokens expire THEN the system SHALL attempt to refresh them automatically using stored refresh tokens
5. WHEN network requests fail THEN the system SHALL provide appropriate retry mechanisms and user feedback

### Requirement 4: Real Authentication Flow

**User Story:** As a content creator, I want to log in using my real credentials against the production API, so that I can access my actual account and data.

#### Acceptance Criteria

1. WHEN a user submits login credentials THEN the system SHALL make a POST request to `/api/v1/auth/login` on the production API
2. WHEN login is successful THEN the system SHALL store the `accessToken` and `refreshToken` securely in localStorage or cookies
3. WHEN login is successful THEN the system SHALL update the AuthContext with the authenticated user's data
4. WHEN login fails THEN the system SHALL display appropriate error messages without exposing sensitive information
5. WHEN a user is authenticated THEN the system SHALL be able to fetch their profile data from `/api/v1/auth/me`

### Requirement 5: Session Management

**User Story:** As a content creator, I want my login session to persist across browser refreshes and be automatically validated, so that I don't have to re-authenticate unnecessarily.

#### Acceptance Criteria

1. WHEN the application loads THEN it SHALL check for existing authentication tokens in secure storage
2. WHEN valid tokens exist THEN the system SHALL automatically authenticate the user and fetch their profile data
3. WHEN the user refreshes the page THEN they SHALL remain logged in if their session is still valid
4. WHEN tokens are expired or invalid THEN the system SHALL redirect the user to the login page
5. WHEN a user logs out THEN the system SHALL clear all stored authentication data and redirect to login

### Requirement 6: Protected Route Integration

**User Story:** As a content creator, I want protected routes to work seamlessly with real authentication, so that unauthorized access is prevented and authorized access is smooth.

#### Acceptance Criteria

1. WHEN an unauthenticated user tries to access protected routes THEN they SHALL be redirected to the login page
2. WHEN an authenticated user accesses protected routes THEN they SHALL be granted access without additional authentication steps
3. WHEN authentication status changes THEN protected routes SHALL respond appropriately by allowing or denying access
4. WHEN session expires during use THEN the user SHALL be redirected to login with a clear message about session expiration
5. WHEN authentication is restored THEN the user SHALL be redirected back to their intended destination

### Requirement 7: Data Fetching Integration

**User Story:** As a content creator, I want the application to fetch real data from the production API with proper loading and error states, so that I can work with my actual content.

#### Acceptance Criteria

1. WHEN the application needs to fetch data THEN it SHALL use TanStack Query for caching, loading states, and error handling
2. WHEN data is loading THEN the system SHALL display appropriate loading indicators
3. WHEN data fetching fails THEN the system SHALL display user-friendly error messages with retry options
4. WHEN data is successfully fetched THEN it SHALL be cached appropriately to improve performance
5. WHEN data becomes stale THEN the system SHALL refetch it according to configured cache policies

### Requirement 8: Development and Production Parity

**User Story:** As a developer, I want the application to work consistently in both development and production environments, so that there are no surprises when deploying.

#### Acceptance Criteria

1. WHEN running in development mode THEN the application SHALL successfully communicate with the production API
2. WHEN building for production THEN the application SHALL include all necessary environment variables and configurations
3. WHEN deployed THEN the application SHALL function identically to the local development version
4. WHEN CORS issues arise THEN they SHALL be properly handled or documented for resolution
5. WHEN environment-specific configurations are needed THEN they SHALL be clearly documented and easily configurable