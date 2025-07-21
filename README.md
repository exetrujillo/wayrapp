# WayrApp Backend

A comprehensive language learning platform backend built with Node.js, Express, TypeScript, and PostgreSQL. WayrApp provides a robust API for managing courses, lessons, exercises, user progress, and gamification features.

## 🚀 Features

- **🔐 Authentication & Authorization** - JWT-based auth with role-based access control
- **📚 Content Management** - Hierarchical course structure (Courses → Levels → Sections → Modules → Lessons)
- **🎯 Exercise System** - Multiple exercise types with reusable components
- **📊 Progress Tracking** - Experience points, streaks, lives, and completion tracking
- **📱 Offline Support** - Packaged content API with versioning and caching
- **🎮 Gamification** - Lives system, streaks, and experience points
- **🔄 Sync Capabilities** - Offline progress synchronization
- **🛡️ Security** - Input validation, rate limiting, and secure headers

## 🏗️ Architecture

### Tech Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with refresh token rotation
- **Validation**: Zod schemas
- **Testing**: Jest with comprehensive test coverage
- **Caching**: In-memory caching with TTL support

### Project Structure
```
src/
├── modules/           # Feature modules
│   ├── auth/         # Authentication & authorization
│   ├── users/        # User management
│   ├── content/      # Course content management
│   └── progress/     # Progress tracking
├── shared/           # Shared utilities and types
│   ├── middleware/   # Express middleware
│   ├── types/        # TypeScript type definitions
│   ├── utils/        # Utility functions
│   └── schemas/      # Validation schemas
└── server.ts         # Application entry point
```

## 📖 Documentation

- **[Database Setup](docs/DATABASE_SETUP.md)** - Database configuration and migration guide
- **[API Documentation](docs/API_OVERVIEW.md)** - Complete API reference
  - [Authentication](docs/AUTHENTICATION.md) - Auth endpoints and security
  - [Users](docs/USERS.md) - User management
  - [Content](docs/CONTENT.md) - Course and content management
  - [Lessons & Exercises](docs/LESSONS_EXERCISES.md) - Learning content
  - [Progress](docs/PROGRESS.md) - Progress tracking and gamification
- **[Packaged Content API](docs/PACKAGED_CONTENT_API.md)** - Offline support implementation guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (we recommend [Neon](https://neon.tech/))
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd wayrapp-backend
   ```

2. **Install dependencies**
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

5. **Start the development server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:test` - Test database connection

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# JWT Configuration
JWT_SECRET="your-super-secure-jwt-secret-key-here"
JWT_REFRESH_SECRET="your-super-secure-refresh-secret-key-here"

# Server Configuration
PORT=3000
NODE_ENV="development"

# Optional: External Services
# REDIS_URL="redis://localhost:6379"
# SMTP_HOST="smtp.example.com"
# SMTP_PORT=587
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

The project includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

Test files are located alongside source files with `.test.ts` extension.

## 🚀 Deployment

### Production Build

```bash
npm run build
npm start
```

### Docker Support

```dockerfile
# Example Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
COPY prisma ./prisma
RUN npx prisma generate
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