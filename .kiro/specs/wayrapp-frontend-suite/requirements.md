# Requirements Document - Frontend & UI/UX

## Introduction

This feature encompasses the development of a comprehensive frontend suite for WayrApp, consisting of two distinct applications: a React Native mobile app for learners and a React web-based Content Creator Tool. Both applications will share a cohesive design system directly inspired by the WayrApp logo, ensuring a consistent and delightful brand experience. This suite will demonstrate the full decentralized content creation and consumption cycle, fulfilling our ambitious vision.

## Requirements

### Requirement 1: Design System and Visual Identity

**User Story:** As a user of any WayrApp application, I expect a seamless, modern, and accessible visual experience that consistently reflects the brand's identity and commitment to cultural preservation, enabling effortless navigation and an inspiring learning/creation journey.

#### Acceptance Criteria

1. WHEN viewing any UI component THEN the system SHALL render it using the established **color palette**, where the primary brand color (`#50A8B1` or similar inviting teal) is used for primary actions and headers, and the secondary off-white (`#F8F8F8` or similar off-white) provides optimal contrast (WCAG AA compliant for text/backgrounds).
2. WHEN displaying text THEN the system SHALL consistently apply the chosen **sans-serif font family** (Lato, Open Sans, or Roboto) with a defined typographic scale (e.g., at least 5 distinct font sizes for headings, body text, and captions) and appropriate line heights for readability.
3. WHEN presenting icons THEN the system SHALL employ a **single, unified minimal, line-based iconography set** (e.g., Material Community Icons or Feather Icons) ensuring visual consistency in weight, stroke, and fill states.
4. WHEN interacting with the UI THEN components (buttons, inputs, cards, lists) SHALL feature **subtle rounded corners (e.g., 4-8px radius)**, clear hover/focus/active states, and **generous spacing (e.g., using a 4-8px grid system)** to enhance clarity and reduce cognitive load.
5. WHEN the application loads THEN it SHALL support **Internationalization (i18n)** for all static UI text elements, leveraging `i18next` and `react-i18next` with at least **3 pre-loaded UI languages** (e.g., English, Spanish, Euskera).
6. WHEN encountering feedback THEN the system SHALL display **consistent visual cues for success (soft green), errors/warnings (soft red)**, and loading states (e.g., spinners, progress bars) that are immediately understandable to the user.

### Requirement 2: WayrApp Creator Tool (React Web Application)

**User Story:** As a content creator with diverse linguistic knowledge, I want an intuitive, secure, and performant web-based tool to efficiently create, assign, and manage new educational content that immediately becomes available on WayrApp servers, so that I can easily contribute to and grow my community's linguistic heritage.

#### Acceptance Criteria

1. WHEN initializing the project THEN the system SHALL set up a **Vite + React with TypeScript** project in `/frontend-creator`, including `react-router-dom` for navigation and a lightweight, design-system-compliant UI component library (e.g., custom components or a minimal third-party library).
2. WHEN managing API communication THEN the system SHALL implement a dedicated **`axios` client** with interceptors for attaching JWT authentication tokens and handling API-specific errors uniformly.
3. WHEN accessing the creator tool THEN the system SHALL present a **login screen** where a content creator can successfully authenticate (`POST /api/v1/auth/login`), securely storing JWT tokens.
4. WHEN creating content THEN the system SHALL provide **dedicated, validated UI forms** for:
   * **Course Creation:** (POST `/api/v1/courses`) - Inputs for `id`, `name`, `source_language` (BCP 47 validated, with a searchable dropdown for common languages), `target_language` (BCP 47 validated, searchable dropdown), `description` (multi-line), and `is_public` (checkbox).
   * **Lesson Creation:** (POST `/api/v1/modules/{moduleId}/lessons`) - Inputs for `id`, `name`, `experience_points` (numeric, default 10), `order` (numeric), and a **searchable dropdown to select an existing `moduleId`** (fetching from `/api/v1/sections/{sectionId}/modules`).
   * **Exercise Creation:** (POST `/api/v1/exercises`) - Supports all 6 `exercise_type`s with dynamic form fields for `data` (JSONB), `id`, and `exercise_type`.
   * **Exercise Assignment to Lesson:** (POST `/api/v1/lessons/{lessonId}/exercises`) - A form with a **searchable dropdown for existing `exercise_id`s** and an `order` input, for a given `lessonId`.
5. WHEN submitting any form THEN the system SHALL perform **real-time frontend validation (using Zod)**, display clear inline validation errors, and provide **visual feedback for API request states** (loading, success, API-returned error messages).
6. WHEN managing existing content THEN the system SHALL display **basic, paginated lists** of created Courses, Lessons, and Exercises with options to view/edit their details (e.g., `GET /api/v1/courses?page=1&limit=10`).
7. WHEN the application is built THEN it SHALL be deployable as a **separate, production-ready Vercel static site** from the monorepo.

### Requirement 3: WayrApp Mobile Learning Application (React Native)

**User Story:** As a learner, I desire a beautiful, reliable, and responsive mobile application to effortlessly discover and engage with diverse language content from any WayrApp community server, making my learning journey flexible, enjoyable, and always accessible.

#### Acceptance Criteria

1. WHEN initializing the project THEN the system SHALL set up a **React Native project with Expo and TypeScript** in `/frontend-mobile`, including `react-navigation` for navigation and a design-system-compliant UI component library (e.g., React Native Paper).
2. WHEN the app starts THEN the system SHALL present a **Server Discovery screen** that:
   * Attempts to fetch a dynamic list of WayrApp content servers from a **publicly hosted JSON file URL** (e.g., `https://raw.githubusercontent.com/your-username/your-repo/main/servers.json`).
   * Displays server `name` and `description` in a visually appealing list.
   * **Fallbacks gracefully** to a hardcoded list of pre-configured servers if the fetch fails or the list is empty.
   * Allows the user to select a server and **store its URL securely** for subsequent sessions.
3. WHEN selecting a server THEN the system SHALL navigate to **Login/Register screens** for student authentication against the chosen server's API, securely storing their tokens.
4. WHEN authenticated THEN the system SHALL display a **Course Dashboard screen** that:
   * Presents available courses from the selected server, adhering to the design system.
   * Visually indicates course progress (e.g., "Started", "Completed").
   * Allows selection of a course to view its lessons.
5. WHEN a user selects a course THEN the system SHALL efficiently load its content, leveraging the backend's **packaged content API** (`GET /api/v1/courses/{id}/package`) for optimal performance and offline capabilities, with a clear loading indicator.
6. WHEN starting a lesson THEN the system SHALL present a **Lesson Player screen** that:
   * Dynamically renders different `exercise_type`s (e.g., 'translation', 'fill_in_the_blank') based on the loaded content's JSONB `data` field.
   * Provides appropriate input fields for answers (e.g., text inputs, multiple choice buttons).
   * Displays clear and immediate **visual and auditory feedback** for correct/incorrect answers.
   * Navigates smoothly between exercises.
7. WHEN completing an exercise THEN the system SHALL submit the user's answers and update their progress (`POST /api/v1/progress/lessons/{lessonId}/complete`), with visual updates to XP, streak, and lives indicators.
8. WHEN navigating the application THEN the system SHALL utilize **React Navigation** for a smooth, intuitive, and consistent user flow across all screens.

### Requirement 4: Monorepo Integration and Deployment

**User Story:** As a developer, I require a cohesive monorepo structure with robust deployment configurations, ensuring the entire WayrApp ecosystem (backend + both frontends) is managed, built, and deployed efficiently, securely, and scalably.

#### Acceptance Criteria

1. WHEN setting up the monorepo THEN the project structure SHALL include distinct directories: `/backend`, `/frontend-creator`, `/frontend-mobile`, each with its own `package.json` for isolated dependency management.
2. WHEN deploying the applications THEN the `vercel.json` configuration SHALL successfully deploy the backend as a Serverless Function, `frontend-creator` as a separate Static Site, and `frontend-mobile` as a separate Static Site via Expo web build (if feasible) from the same repository.
3. WHEN built, both frontend applications SHALL successfully **communicate with the deployed backend API** (your Vercel backend URL), respecting CORS rules and security protocols.
4. WHEN managing dependencies THEN updates to one application's dependencies SHALL not inadvertently affect others.