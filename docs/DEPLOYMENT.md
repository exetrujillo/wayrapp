# WayrApp Backend Deployment Guide

## Vercel Deployment Instructions

### Prerequisites

1. **Vercel CLI installed globally:**
   ```bash
   npm install -g vercel
   ```

2. **Database Setup:**
   - PostgreSQL database (recommended: Neon, Supabase, or Railway)
   - Database URL with connection pooling enabled

3. **Environment Variables Ready:**
   - All production environment variables from `.env.production`

### Step-by-Step Deployment

#### 1. Local Preparation

```bash
# Install dependencies
npm ci

# Run tests to ensure everything works
npm run test:unit

# Build the application
npm run build

# Prepare for deployment (runs checks and migrations)
npm run deploy:prepare
```

#### 2. Vercel Project Setup

```bash
# Login to Vercel (if not already logged in)
vercel login

# Link your project to Vercel (run in project root)
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? (select your account/team)
# - Link to existing project? N (for first deployment)
# - Project name: wayrapp-backend
# - Directory: ./
```

#### 3. Environment Variables Configuration

Set these environment variables in your Vercel Dashboard:

**Required Variables:**
```
DATABASE_URL=postgresql://username:password@host:5432/database?schema=public
JWT_SECRET=your-production-jwt-secret-minimum-32-characters
JWT_REFRESH_SECRET=your-production-jwt-refresh-secret-minimum-32-characters
NODE_ENV=production
```

**Optional but Recommended:**
```
CORS_ORIGIN=https://your-frontend-domain.com
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
BCRYPT_ROUNDS=12
DB_CONNECTION_LIMIT=10
DB_POOL_TIMEOUT=10
ENABLE_PERFORMANCE_MONITORING=true
```

#### 4. Deploy to Production

```bash
# Deploy to production
npm run deploy:vercel

# Or use Vercel CLI directly
vercel --prod
```

### Vercel Dashboard Configuration

#### Build Settings
- **Build Command:** `npm run vercel-build`
- **Output Directory:** `dist`
- **Install Command:** `npm ci`
- **Node.js Version:** 18.x (or latest LTS)

#### Function Configuration
- **Max Duration:** 30 seconds
- **Memory:** 1024 MB (adjust based on needs)

### Database Migration Strategy

#### For Production Deployments:
1. Migrations run automatically via `postinstall` script
2. Use `prisma migrate deploy` for production
3. Never use `prisma db push` in production

#### Manual Migration (if needed):
```bash
# Connect to your production database
DATABASE_URL="your-production-db-url" npx prisma migrate deploy
```

### Monitoring and Health Checks

#### Health Check Endpoints:
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system status
- `GET /api` - API information and endpoints

#### Logs and Monitoring:
- Check Vercel Function logs in dashboard
- Monitor database connection pool usage
- Set up alerts for error rates

### Troubleshooting Common Issues

#### 1. TypeScript Build Errors
```bash
# Clear TypeScript cache
rm -rf dist/
npm run build
```

#### 2. Prisma Client Issues
```bash
# Regenerate Prisma client
npx prisma generate
```

#### 3. Database Connection Issues
- Verify DATABASE_URL format
- Check connection pooling settings
- Ensure database allows connections from Vercel IPs

#### 4. Environment Variable Issues
- Verify all required variables are set in Vercel Dashboard
- Check for typos in variable names
- Ensure secrets are properly encoded

### Performance Optimization

#### Database Optimization:
- Use connection pooling (included in DATABASE_URL)
- Enable query caching
- Monitor slow queries

#### Vercel Optimization:
- Enable Edge Caching where appropriate
- Use Vercel Analytics for performance monitoring
- Configure proper CORS headers

### Security Checklist

- [ ] Strong JWT secrets (minimum 32 characters)
- [ ] CORS configured for specific domains
- [ ] Rate limiting enabled
- [ ] HTTPS enforced
- [ ] Database credentials secured
- [ ] No sensitive data in logs

### Rollback Strategy

#### Quick Rollback:
```bash
# Rollback to previous deployment
vercel rollback
```

#### Manual Rollback:
1. Identify working deployment in Vercel Dashboard
2. Promote previous deployment to production
3. Verify functionality

### Continuous Deployment

#### GitHub Integration:
1. Connect repository to Vercel
2. Enable automatic deployments
3. Configure branch protection rules
4. Set up preview deployments for PRs

#### Environment-Specific Deployments:
- `main` branch → Production
- `develop` branch → Staging
- Feature branches → Preview deployments

### Support and Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [Node.js on Vercel](https://vercel.com/docs/functions/serverless-functions/runtimes/node-js)

For issues or questions, check the project's GitHub issues or contact the development team.