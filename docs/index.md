---
layout: default
title: Platform Overview
---

# WayrApp Platform Documentation

Welcome to the official documentation for the WayrApp Language Learning Platform. This documentation covers the complete WayrApp ecosystem, including the Backend API, Content Creator web application, and Mobile application.

## Platform Overview

WayrApp is a decentralized open-source language learning platform built as a monorepo containing:

- **Backend API**: RESTful API server for content management and user progress
- **Content Creator**: Web application for educators to create learning content
- **Mobile App**: Cross-platform mobile application for learners
- **Shared Components**: Common utilities and components across applications

The API is organized around REST principles and uses standard HTTP response codes, authentication, and verbs.

### API Base URL for example

```
https://wayrapp.vercel.app/api/v1
```

### Authentication

Most API endpoints require authentication. WayrApp uses JWT (JSON Web Tokens) for authentication. See the [Authentication](/wayrapp/AUTHENTICATION) section for details on how to authenticate your requests.

## Platform Features

### Backend API
- **User Management**: Create and manage user accounts, profiles, and authentication
- **Content Management**: Create and retrieve language learning content
- **Progress Tracking**: Track user progress and learning statistics
- **Offline Support**: Package content for offline use with efficient synchronization
- **Pagination & Filtering**: Advanced query capabilities for efficient data retrieval

### Content Creator Application
- **Course Builder**: Drag-and-drop interface for creating language courses
- **Exercise Designer**: Tools for creating various types of learning exercises
- **Content Preview**: Real-time preview of learning content
- **Multi-language Support**: Create content in multiple languages
- **Collaboration**: Share and collaborate on content creation

### Mobile Application
- **Cross-platform**: Native iOS, Android, and web support
- **Offline Learning**: Download content for offline study
- **Progress Sync**: Synchronize learning progress across devices
- **Gamification**: Streaks, points, and achievement system
- **Interactive Exercises**: Touch-friendly learning activities

## Documentation Sections

### Platform Documentation
- **[Platform Architecture](PLATFORM_ARCHITECTURE)** - Complete platform overview and architecture
- **[Monorepo Setup](MONOREPO_SETUP)** - Development setup and workflow guide
- **[Database Setup](DATABASE_SETUP)** - Database configuration and migration guide

### API Documentation
- **[Authentication](AUTHENTICATION)** - Auth endpoints, JWT tokens, and security
- **[Users](USERS)** - User management and profile operations
- **[Content](CONTENT)** - Course hierarchy and content management
- **[Lessons & Exercises](LESSONS_EXERCISES)** - Learning content and exercise types
- **[Progress](PROGRESS)** - Progress tracking, gamification, and analytics
- **[Packaged Content API](PACKAGED_CONTENT_API)** - Offline support and caching

### Development Documentation
- **[Integration Tests](INTEGRATION_TESTS)** - Testing strategies and implementation
- **[Performance Optimization](PERFORMANCE_OPTIMIZATION)** - Performance best practices
- **[Security](SECURITY)** - Security implementation and best practices
- **[Pagination & Filtering](PAGINATION_AND_FILTERING)** - Advanced query capabilities

Browse through the documentation sections using the navigation menu to learn more about specific aspects of the platform.

## API Status

You can check the current API status at our [status page](https://status.wayrapp.com) (not available yet).

## Support

If you need help or have questions about the API, please:

1. Check the documentation thoroughly
2. Look for answers in our [GitHub Issues](https://github.com/exetrujillo/wayrapp/issues)
3. Create a new issue if you can't find an answer

## Contributing

WayrApp is an open-source project. We welcome contributions to both the platform and its documentation. See our [Contributing Guide](https://github.com/wayrapp/backend/blob/main/CONTRIBUTING.md) for more information.