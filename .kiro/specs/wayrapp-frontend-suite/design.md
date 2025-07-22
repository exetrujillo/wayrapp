# Design Document - WayrApp Frontend Suite

## Overview

The WayrApp Frontend Suite consists of two complementary applications that together demonstrate the full decentralized content creation and consumption cycle. The design emphasizes a cohesive visual identity inspired by the WayrApp logo, ensuring users experience a seamless brand journey whether they're creating content or learning.

### Applications
- **Creator Tool**: React web application for content creators to build educational materials
- **Mobile App**: React Native application for learners to discover and consume content from various WayrApp servers

## Design System Implementation

### UI Library Recommendations

#### Creator Tool (React Web)
**Recommended: Tailwind CSS + Headless UI**
- **Rationale**: Tailwind provides utility-first CSS that aligns perfectly with our design token system, allowing precise control over colors, spacing, and typography. Headless UI provides accessible, unstyled components that we can style with our design system.
- **Alternative**: Chakra UI (if component-based approach is preferred)
- **Installation**: `npm install tailwindcss @headlessui/react @heroicons/react`

#### Mobile App (React Native)
**Recommended: React Native Paper**
- **Rationale**: Material Design 3 components that can be customized with our color palette. Provides consistent, accessible components with built-in theming support.
- **Alternative**: NativeBase (if more customization is needed)
- **Installation**: `npm install react-native-paper react-native-vector-icons`

### Design Token Implementation

#### Tailwind CSS Configuration (Creator Tool)
```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E6F7F8',
          100: '#B3E8EB',
          500: '#50A8B1', // Main brand color
          600: '#3A8086',
          700: '#2D6469',
        },
        secondary: {
          50: '#FEFEFE',
          100: '#F8F8F8', // Off-white
          200: '#E8E8E8',
        },
        neutral: {
          100: '#E0E0E0',
          300: '#B0B0B0',
          500: '#707070',
          700: '#404040',
          900: '#1A1A1A',
        },
        success: '#4CAF50',
        error: '#F44336',
        warning: '#FF9800',
      },
      fontFamily: {
        sans: ['Lato', 'Open Sans', 'Roboto', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'h1': '2.5rem',
        'h2': '2rem',
        'h3': '1.5rem',
      },
      spacing: {
        'xs': '0.25rem',
        'sm': '0.5rem',
        'md': '1rem',
        'lg': '1.5rem',
        'xl': '2rem',
        'xxl': '3rem',
      },
      borderRadius: {
        'component': '0.5rem', // 8px for components
      }
    }
  }
}
```

#### React Native Paper Theme (Mobile App)
```typescript
// theme.ts
import { MD3LightTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#50A8B1',
    primaryContainer: '#B3E8EB',
    secondary: '#F8F8F8',
    secondaryContainer: '#E8E8E8',
    surface: '#FFFFFF',
    surfaceVariant: '#E0E0E0',
    onSurface: '#1A1A1A',
    onSurfaceVariant: '#707070',
    error: '#F44336',
    onError: '#FFFFFF',
  },
  fonts: {
    ...MD3LightTheme.fonts,
    default: {
      fontFamily: 'Lato',
    },
  },
};
```

## Frontend Architecture

### Creator Tool Structure (`/frontend-creator`)
```
frontend-creator/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Modal.tsx
│   │   ├── forms/           # Content creation forms
│   │   │   ├── CourseForm.tsx
│   │   │   ├── LessonForm.tsx
│   │   │   ├── ExerciseForm.tsx
│   │   │   └── AssignmentForm.tsx
│   │   ├── layout/          # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Layout.tsx
│   │   └── content/         # Content management
│   │       ├── ContentList.tsx
│   │       ├── ContentCard.tsx
│   │       └── ActionMenu.tsx
│   ├── pages/               # Route components
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── CoursesPage.tsx
│   │   ├── LessonsPage.tsx
│   │   └── ExercisesPage.tsx
│   ├── hooks/               # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useApi.ts
│   │   └── useForm.ts
│   ├── services/            # API and external services
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   └── validation.ts
│   ├── store/               # State management
│   │   ├── authStore.ts
│   │   ├── contentStore.ts
│   │   └── uiStore.ts
│   ├── utils/               # Utility functions
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   └── types.ts
│   ├── locales/             # i18n translations
│   │   ├── en.json
│   │   ├── es.json
│   │   └── eu.json
│   ├── styles/              # Global styles
│   │   ├── globals.css
│   │   └── components.css
│   ├── App.tsx
│   ├── main.tsx
│   └── i18n.ts
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

### Mobile App Structure (`/frontend-mobile`)
```
frontend-mobile/
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── discovery/       # Server discovery
│   │   │   ├── ServerList.tsx
│   │   │   ├── ServerCard.tsx
│   │   │   └── ConnectionStatus.tsx
│   │   ├── learning/        # Learning components
│   │   │   ├── CourseCard.tsx
│   │   │   ├── LessonPlayer.tsx
│   │   │   ├── ExerciseRenderer.tsx
│   │   │   └── ProgressIndicator.tsx
│   │   └── auth/            # Authentication
│   │       ├── LoginForm.tsx
│   │       └── RegisterForm.tsx
│   ├── screens/             # Screen components
│   │   ├── ServerSelectionScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── CourseScreen.tsx
│   │   └── LessonScreen.tsx
│   ├── navigation/          # Navigation setup
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── MainNavigator.tsx
│   ├── services/            # API and services
│   │   ├── api.ts
│   │   ├── serverDiscovery.ts
│   │   ├── storage.ts
│   │   └── offline.ts
│   ├── store/               # State management
│   │   ├── authStore.ts
│   │   ├── serverStore.ts
│   │   ├── learningStore.ts
│   │   └── offlineStore.ts
│   ├── utils/               # Utilities
│   │   ├── constants.ts
│   │   ├── types.ts
│   │   └── helpers.ts
│   ├── locales/             # i18n translations
│   │   ├── en.json
│   │   ├── es.json
│   │   └── eu.json
│   ├── theme/               # Theme configuration
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── index.ts
│   ├── App.tsx
│   └── i18n.ts
├── app.json
├── package.json
├── babel.config.js
└── tsconfig.json
```

## API Service Layer Design

### Creator Tool API Client
```typescript
// services/api.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

class CreatorAPIClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.client.post('/api/v1/auth/login', credentials);
    return response.data;
  }

  // Course management
  async createCourse(course: CreateCourseRequest): Promise<Course> {
    const response = await this.client.post('/api/v1/courses', course);
    return response.data;
  }

  async getCourses(params: PaginationParams): Promise<PaginatedResponse<Course>> {
    const response = await this.client.get('/api/v1/courses', { params });
    return response.data;
  }

  // Lesson management
  async createLesson(moduleId: string, lesson: CreateLessonRequest): Promise<Lesson> {
    const response = await this.client.post(`/api/v1/modules/${moduleId}/lessons`, lesson);
    return response.data;
  }

  // Exercise management
  async createExercise(exercise: CreateExerciseRequest): Promise<Exercise> {
    const response = await this.client.post('/api/v1/exercises', exercise);
    return response.data;
  }

  async assignExerciseToLesson(lessonId: string, assignment: ExerciseAssignment): Promise<void> {
    await this.client.post(`/api/v1/lessons/${lessonId}/exercises`, assignment);
  }
}
```

### Mobile App API Client
```typescript
// services/api.ts
import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

class MobileAPIClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await AsyncStorage.removeItem('auth_token');
          // Navigate to login screen
        }
        return Promise.reject(error);
      }
    );
  }

  // Server discovery
  async getServerList(): Promise<Server[]> {
    try {
      const response = await axios.get('https://raw.githubusercontent.com/wayrapp/servers/main/servers.json');
      return response.data;
    } catch (error) {
      // Fallback to hardcoded list
      return this.getFallbackServers();
    }
  }

  private getFallbackServers(): Server[] {
    return [
      {
        id: 'wayr-euskera',
        name: 'WayrApp Euskera',
        description: 'Learn Basque language and culture',
        url: 'https://euskera.wayrapp.com',
        languages: ['eu', 'es', 'fr'],
        region: 'Europe'
      },
      {
        id: 'wayr-quechua',
        name: 'WayrApp Quechua',
        description: 'Preserve and learn Quechua',
        url: 'https://quechua.wayrapp.com',
        languages: ['qu', 'es', 'en'],
        region: 'South America'
      },
      {
        id: 'wayr-guarani',
        name: 'WayrApp Guaraní',
        description: 'Learn Guaraní language',
        url: 'https://guarani.wayrapp.com',
        languages: ['gn', 'es', 'pt-BR'],
        region: 'South America'
      }
    ];
  }

  // Authentication
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.client.post('/api/v1/auth/login', credentials);
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.client.post('/api/v1/auth/register', userData);
    return response.data;
  }

  // Learning
  async getCourses(): Promise<Course[]> {
    const response = await this.client.get('/api/v1/courses');
    return response.data;
  }

  async getCoursePackage(courseId: string): Promise<CoursePackage> {
    const response = await this.client.get(`/api/v1/courses/${courseId}/package`);
    return response.data;
  }

  async submitProgress(lessonId: string, answers: Answer[]): Promise<ProgressResponse> {
    const response = await this.client.post(`/api/v1/progress/lessons/${lessonId}/complete`, {
      answers
    });
    return response.data;
  }
}
```

## Screen-by-Screen UI/UX Wireframes

### Creator Tool Screens

#### Login Screen
**Layout**: Centered card on full-screen background with subtle teal gradient
- **Header**: WayrApp logo and "Creator Portal" subtitle
- **Form Elements**:
  - Email input field with icon (envelope)
  - Password input field with icon (lock) and show/hide toggle
  - "Remember me" checkbox
  - Primary teal "Sign In" button (full width)
  - "Forgot password?" link in neutral gray
- **Footer**: Link to learner app and support
- **Responsive**: Mobile-first design, scales to desktop

#### Dashboard Screen
**Layout**: Sidebar navigation + main content area
- **Sidebar** (240px width):
  - User profile section with avatar and name
  - Navigation menu: Courses, Lessons, Exercises, Analytics
  - Language selector dropdown
  - Logout button at bottom
- **Main Content**:
  - Header with breadcrumbs and "Create New" dropdown button
  - Stats cards: Total Courses, Active Learners, Completion Rate
  - Recent activity feed
  - Quick actions grid: Create Course, Add Lesson, New Exercise

#### Course Creation Form
**Layout**: Two-column form with preview panel
- **Left Column** (Form):
  - Course name input (required)
  - Source language dropdown with search (BCP 47 codes)
  - Target language dropdown with search (BCP 47 codes)
  - Description textarea with character counter
  - Public/Private toggle switch
  - Tags input with autocomplete
- **Right Column** (Preview):
  - Live preview of course card
  - Language pair display
  - Estimated completion time
- **Actions**: Save Draft, Publish, Cancel buttons

### Mobile App Screens

#### Server Discovery Screen
**Layout**: Full-screen list with search and filter options
- **Header**: 
  - WayrApp logo
  - "Choose Your Learning Server" title
  - Search bar with magnifying glass icon
- **Filter Bar**:
  - Region filter chips: All, Europe, Americas, Asia, Africa
  - Language filter with popular languages as chips
- **Server List**: 
  - Each server card shows:
    - Server name and description
    - Supported languages as flag icons
    - Number of active courses
    - Connection status indicator (green/yellow/red dot)
    - "Connect" button in primary teal
- **Example Server Cards**:
  ```
  🏛️ WayrApp Euskera
  Learn Basque language and culture
  🇪🇺 eu, es, fr • 12 courses • 🟢 Online
  [Connect]

  🏔️ WayrApp Quechua  
  Preserve and learn Quechua
  🇵🇪 qu, es, en • 8 courses • 🟢 Online
  [Connect]

  🌿 WayrApp Guaraní
  Learn Guaraní language
  🇵🇾 gn, es, pt-BR • 6 courses • 🟢 Online
  [Connect]

  🇲🇽 WayrApp Nahuatl
  Ancient Aztec language preservation
  🇲🇽 nah, es, en • 4 courses • 🟡 Limited
  [Connect]

  🏝️ WayrApp Aymara
  Learn Aymara from the Andes
  🇧🇴 aym, es, qu • 5 courses • 🟢 Online
  [Connect]
  ```
- **Footer**: "Can't find your language? Request a server" link

#### Authentication Screens
**Login Screen Layout**:
- Server name and logo at top
- Welcome message in local language
- Email/username input
- Password input with visibility toggle
- "Sign In" button (primary teal)
- "Don't have an account? Register" link
- Language selector at bottom

**Register Screen Layout**:
- Similar to login but with additional fields:
- Full name input
- Email input
- Password input with strength indicator
- Confirm password input
- Native language selector
- Learning goals checkboxes
- Terms acceptance checkbox
- "Create Account" button

#### Course Dashboard Screen
**Layout**: Grid of course cards with progress indicators
- **Header**:
  - Server name and connection status
  - User avatar and XP display
  - Streak counter with fire icon
- **Progress Summary**:
  - Overall progress bar
  - Weekly goal progress
  - Achievement badges earned
- **Course Grid**:
  - Each course card shows:
    - Course thumbnail/icon
    - Course name and language pair
    - Progress percentage and bar
    - Next lesson preview
    - Estimated time to complete
    - "Continue" or "Start" button
- **Bottom Navigation**:
  - Home, Courses, Progress, Profile tabs

#### Lesson Player Screen
**Layout**: Full-screen immersive learning interface
- **Header** (minimal):
  - Progress bar showing lesson completion
  - Lives/hearts indicator
  - Exit button (X)
- **Exercise Area** (dynamic based on type):
  - **Translation Exercise**:
    - Source text in large, readable font
    - Input field for translation
    - Hint button (lightbulb icon)
    - Audio playback button for pronunciation
  - **Fill-in-the-blank**:
    - Sentence with blank spaces
    - Word bank with draggable options
    - Audio playback for context
  - **Multiple Choice**:
    - Question text
    - 3-4 answer options as cards
    - Images for visual context when applicable
- **Footer**:
  - "Check Answer" button (primary teal)
  - Skip button (secondary)
  - Progress dots showing exercise sequence
- **Feedback Overlay**:
  - Correct: Green checkmark with encouraging message
  - Incorrect: Red X with correct answer and explanation
  - XP gained animation

## Internationalization (i18n) Setup

### i18next Configuration

#### Creator Tool i18n Setup
```typescript
// i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';
import euTranslations from './locales/eu.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      es: { translation: esTranslations },
      eu: { translation: euTranslations },
    },
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;
```

#### Mobile App i18n Setup
```typescript
// i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';
import euTranslations from './locales/eu.json';

const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      const savedLanguage = await AsyncStorage.getItem('user-language');
      if (savedLanguage) {
        callback(savedLanguage);
        return;
      }
      callback(Localization.locale.split('-')[0]);
    } catch (error) {
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem('user-language', lng);
    } catch (error) {
      // Handle error
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      es: { translation: esTranslations },
      eu: { translation: euTranslations },
    },
    fallbackLng: 'en',
    compatibilityJSON: 'v3',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

### Translation File Structure

#### English Translation Example (`locales/en.json`)
```json
{
  "common": {
    "buttons": {
      "save": "Save",
      "cancel": "Cancel",
      "delete": "Delete",
      "edit": "Edit",
      "create": "Create",
      "connect": "Connect",
      "continue": "Continue",
      "start": "Start"
    },
    "messages": {
      "loading": "Loading...",
      "error": "An error occurred",
      "success": "Success!",
      "noData": "No data available"
    },
    "navigation": {
      "home": "Home",
      "courses": "Courses",
      "progress": "Progress",
      "profile": "Profile"
    }
  },
  "creator": {
    "auth": {
      "title": "Creator Portal",
      "signIn": "Sign In",
      "email": "Email",
      "password": "Password",
      "rememberMe": "Remember me",
      "forgotPassword": "Forgot password?"
    },
    "dashboard": {
      "title": "Dashboard",
      "createNew": "Create New",
      "totalCourses": "Total Courses",
      "activeLearners": "Active Learners",
      "completionRate": "Completion Rate"
    },
    "forms": {
      "course": {
        "title": "Create Course",
        "name": "Course Name",
        "sourceLanguage": "Source Language",
        "targetLanguage": "Target Language",
        "description": "Description",
        "isPublic": "Make Public"
      },
      "lesson": {
        "title": "Create Lesson",
        "name": "Lesson Name",
        "experiencePoints": "Experience Points",
        "order": "Order",
        "module": "Module"
      },
      "exercise": {
        "title": "Create Exercise",
        "type": "Exercise Type",
        "data": "Exercise Data"
      }
    }
  },
  "mobile": {
    "serverDiscovery": {
      "title": "Choose Your Learning Server",
      "searchPlaceholder": "Search servers...",
      "regions": {
        "all": "All",
        "europe": "Europe",
        "americas": "Americas",
        "asia": "Asia",
        "africa": "Africa"
      },
      "requestServer": "Can't find your language? Request a server"
    },
    "auth": {
      "welcome": "Welcome to {{serverName}}",
      "signIn": "Sign In",
      "register": "Register",
      "email": "Email",
      "password": "Password",
      "confirmPassword": "Confirm Password",
      "fullName": "Full Name",
      "nativeLanguage": "Native Language",
      "createAccount": "Create Account",
      "noAccount": "Don't have an account? Register",
      "hasAccount": "Already have an account? Sign In"
    },
    "dashboard": {
      "title": "My Courses",
      "weeklyGoal": "Weekly Goal",
      "streak": "Day Streak",
      "xpEarned": "XP Earned"
    },
    "lesson": {
      "checkAnswer": "Check Answer",
      "skip": "Skip",
      "correct": "Correct!",
      "incorrect": "Try again",
      "hint": "Hint",
      "nextExercise": "Next Exercise",
      "lessonComplete": "Lesson Complete!"
    }
  }
}
```

## Deployment Configuration

### Vercel Configuration (`vercel.json`)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/package.json",
      "use": "@vercel/node",
      "config": {
        "includeFiles": ["backend/**"]
      }
    },
    {
      "src": "frontend-creator/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist",
        "buildCommand": "npm run build"
      }
    },
    {
      "src": "frontend-mobile/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist",
        "buildCommand": "npm run build:web"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/backend/index.js"
    },
    {
      "src": "/creator/(.*)",
      "dest": "/frontend-creator/$1"
    },
    {
      "src": "/mobile/(.*)",
      "dest": "/frontend-mobile/$1"
    },
    {
      "src": "/creator",
      "dest": "/frontend-creator/index.html"
    },
    {
      "src": "/mobile",
      "dest": "/frontend-mobile/index.html"
    },
    {
      "src": "/(.*)",
      "dest": "/backend/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "DATABASE_URL": "@database-url",
    "JWT_SECRET": "@jwt-secret",
    "CORS_ORIGIN": "@cors-origin"
  }
}
```

### Creator Tool Build Configuration

#### Vite Configuration (`vite.config.ts`)
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/creator/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

#### Package.json Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "type-check": "tsc --noEmit"
  }
}
```

### Mobile App Build Configuration

#### Expo Configuration (`app.json`)
```json
{
  "expo": {
    "name": "WayrApp Mobile",
    "slug": "wayrapp-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#50A8B1"
    },
    "platforms": ["ios", "android", "web"],
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/favicon.png"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.wayrapp.mobile"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#50A8B1"
      },
      "package": "com.wayrapp.mobile"
    }
  }
}
```

#### Package.json Scripts
```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "build:web": "expo export:web",
    "build:android": "expo build:android",
    "build:ios": "expo build:ios"
  }
}
```

## Test Strategy for Frontend

### Creator Tool Testing

#### Unit Testing Setup
```typescript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

#### Test Examples
```typescript
// components/forms/CourseForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CourseForm } from './CourseForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('CourseForm', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('validates required fields', async () => {
    renderWithProviders(<CourseForm onSubmit={jest.fn()} />);
    
    fireEvent.click(screen.getByText('Create Course'));
    
    await waitFor(() => {
      expect(screen.getByText('Course name is required')).toBeInTheDocument();
      expect(screen.getByText('Source language is required')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const mockSubmit = jest.fn();
    renderWithProviders(<CourseForm onSubmit={mockSubmit} />);
    
    fireEvent.change(screen.getByLabelText('Course Name'), {
      target: { value: 'Test Course' },
    });
    fireEvent.change(screen.getByLabelText('Source Language'), {
      target: { value: 'en' },
    });
    fireEvent.change(screen.getByLabelText('Target Language'), {
      target: { value: 'es' },
    });
    
    fireEvent.click(screen.getByText('Create Course'));
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        name: 'Test Course',
        source_language: 'en',
        target_language: 'es',
        description: '',
        is_public: false,
      });
    });
  });
});
```

#### Integration Testing
```typescript
// services/api.test.ts
import { CreatorAPIClient } from './api';
import { server } from '../test/mocks/server';

describe('CreatorAPIClient', () => {
  const client = new CreatorAPIClient('http://localhost:3000');

  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('creates course successfully', async () => {
    const courseData = {
      name: 'Test Course',
      source_language: 'en',
      target_language: 'es',
      description: 'Test description',
      is_public: true,
    };

    const result = await client.createCourse(courseData);
    
    expect(result).toMatchObject({
      id: expect.any(String),
      name: 'Test Course',
      source_language: 'en',
      target_language: 'es',
    });
  });
});
```

### Mobile App Testing

#### Jest Configuration for React Native
```javascript
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**',
  ],
};
```

#### Component Testing Example
```typescript
// screens/ServerSelectionScreen.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { ServerSelectionScreen } from './ServerSelectionScreen';
import { NavigationContainer } from '@react-navigation/native';

const renderWithNavigation = (component: React.ReactElement) => {
  return render(
    <NavigationContainer>
      {component}
    </NavigationContainer>
  );
};

describe('ServerSelectionScreen', () => {
  it('displays server list', async () => {
    renderWithNavigation(<ServerSelectionScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('WayrApp Euskera')).toBeTruthy();
      expect(screen.getByText('WayrApp Quechua')).toBeTruthy();
      expect(screen.getByText('WayrApp Guaraní')).toBeTruthy();
    });
  });

  it('filters servers by region', async () => {
    renderWithNavigation(<ServerSelectionScreen />);
    
    fireEvent.press(screen.getByText('Europe'));
    
    await waitFor(() => {
      expect(screen.getByText('WayrApp Euskera')).toBeTruthy();
      expect(screen.queryByText('WayrApp Quechua')).toBeFalsy();
    });
  });
});
```

### End-to-End Testing

#### Cypress Configuration (Creator Tool)
```typescript
// cypress.config.ts
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3001',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: true,
    screenshotOnRunFailure: true,
  },
});
```

#### E2E Test Example
```typescript
// cypress/e2e/content-creation.cy.ts
describe('Content Creation Flow', () => {
  beforeEach(() => {
    cy.login('creator@example.com', 'password');
  });

  it('creates a complete course with lesson and exercise', () => {
    // Create course
    cy.visit('/courses');
    cy.get('[data-testid="create-course-btn"]').click();
    cy.get('[data-testid="course-name"]').type('Euskera Basics');
    cy.get('[data-testid="source-language"]').select('eu');
    cy.get('[data-testid="target-language"]').select('en');
    cy.get('[data-testid="description"]').type('Learn basic Euskera phrases');
    cy.get('[data-testid="submit-course"]').click();

    // Verify course creation
    cy.contains('Course created successfully');
    cy.contains('Euskera Basics');

    // Create lesson
    cy.get('[data-testid="add-lesson-btn"]').click();
    cy.get('[data-testid="lesson-name"]').type('Greetings');
    cy.get('[data-testid="experience-points"]').clear().type('10');
    cy.get('[data-testid="submit-lesson"]').click();

    // Verify lesson creation
    cy.contains('Lesson created successfully');
    cy.contains('Greetings');
  });
});
```

### Testing Coverage Goals
- **Unit Tests**: 80% code coverage minimum
- **Integration Tests**: All API endpoints and critical user flows
- **E2E Tests**: Complete user journeys for both applications
- **Accessibility Tests**: WCAG AA compliance verification
- **Performance Tests**: Load time and interaction responsiveness