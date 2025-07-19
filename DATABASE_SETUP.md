# WayrApp Database Setup Instructions

**Author:** Exequiel Trujillo

## Prerequisites

1. **Neon Database Account**: Ensure you have a Neon PostgreSQL database created
2. **Environment Variables**: Create your `.env` file based on `.env.example`

## Step-by-Step Setup

### 1. Configure Environment Variables

Create a `.env` file in the project root with your Neon database connection:

```bash
# Copy the example file
cp .env.example .env
```

Update your `.env` file with your Neon database URL:
```env
DATABASE_URL="postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/wayrapp_db?sslmode=require"
JWT_SECRET="your-super-secure-jwt-secret-key-here"
PORT=3000
NODE_ENV="development"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Generate Prisma Client

```bash
npm run db:generate
```

### 4. Create and Apply Initial Migration

This command will create the migration files and apply them to your database:

```bash
npm run db:migrate
```

When prompted, name your migration: `initial_schema`

### 5. Test Database Connection

```bash
npm run db:test
```

### 6. (Optional) Open Prisma Studio

To visually inspect your database:

```bash
npm run db:studio
```

## Production Deployment Commands

For production deployment (after setting up production environment variables):

```bash
# Generate Prisma client for production
npm run db:generate

# Apply migrations to production database
npm run db:migrate:prod
```

## Troubleshooting

### Connection Issues
- Verify your DATABASE_URL is correct
- Ensure your Neon database is running and accessible
- Check that SSL mode is properly configured (`sslmode=require`)

### Migration Issues
- If migrations fail, check database permissions
- Ensure the database exists and is accessible
- Verify no conflicting schema exists

### Schema Changes
- After modifying `schema.prisma`, run: `npm run db:migrate`
- Always test migrations in development before production

## Database Schema Overview

The database includes:
- **Users & Authentication**: User accounts with roles and social features
- **Content Hierarchy**: Courses → Levels → Sections → Modules → Lessons
- **Exercise System**: Reusable exercises with many-to-many lesson relationships
- **Progress Tracking**: User progress with experience points, streaks, and completion tracking

## Next Steps

After successful database setup:
1. Run the development server: `npm run dev`
2. Test the health endpoint: `http://localhost:3000/health`
3. Proceed with implementing authentication and API endpoints