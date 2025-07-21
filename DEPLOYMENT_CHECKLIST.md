# WayrApp Backend - Vercel Deployment Checklist

## Pre-Deployment Checklist

### ✅ Code Preparation
- [ ] All tests pass locally (`npm run test:unit`)
- [ ] Code builds successfully (`npm run build`)
- [ ] No TypeScript errors
- [ ] All dependencies properly categorized in package.json
- [ ] Environment variables documented

### ✅ Database Setup
- [ ] Production PostgreSQL database provisioned
- [ ] Database URL with connection pooling configured
- [ ] Database migrations tested
- [ ] Database connection verified

### ✅ Environment Variables
- [ ] `DATABASE_URL` - Production database connection string
- [ ] `JWT_SECRET` - Strong secret (min 32 chars)
- [ ] `JWT_REFRESH_SECRET` - Strong secret (min 32 chars)
- [ ] `NODE_ENV` - Set to "production"
- [ ] `CORS_ORIGIN` - Frontend domain(s)
- [ ] All optional variables configured as needed

### ✅ Vercel Configuration
- [ ] `vercel.json` configured correctly
- [ ] Build command set to `npm run vercel-build`
- [ ] Node.js version specified (18.x)
- [ ] Function timeout configured (30s)

### ✅ Security
- [ ] Strong JWT secrets generated
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] No sensitive data in code/logs
- [ ] Database credentials secured

## Deployment Commands

### Local Testing
```bash
# Install dependencies
npm ci

# Run tests
npm run test:unit

# Build application
npm run build

# Test build locally
npm start
```

### Vercel Deployment
```bash
# First-time setup
vercel

# Production deployment
vercel --prod

# Or use npm script
npm run deploy:vercel
```

## Environment Variables for Vercel Dashboard

Copy these to your Vercel project settings:

### Required
```
DATABASE_URL=postgresql://user:pass@host:5432/db?schema=public
JWT_SECRET=your-32-char-minimum-secret-here
JWT_REFRESH_SECRET=your-32-char-minimum-refresh-secret
NODE_ENV=production
```

### Recommended
```
CORS_ORIGIN=https://your-frontend.com
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
BCRYPT_ROUNDS=12
```

## Post-Deployment Verification

### ✅ Health Checks
- [ ] `GET /health` returns 200
- [ ] `GET /api` returns API information
- [ ] Database connection working
- [ ] Authentication endpoints functional

### ✅ API Testing
- [ ] User registration works
- [ ] User login works
- [ ] Protected routes require authentication
- [ ] CORS headers present
- [ ] Rate limiting active

### ✅ Performance
- [ ] Response times acceptable
- [ ] Database queries optimized
- [ ] No memory leaks
- [ ] Function cold starts reasonable

## Troubleshooting

### Common Issues
1. **Build Failures**: Check TypeScript errors, missing dependencies
2. **Database Connection**: Verify URL format, connection pooling
3. **Environment Variables**: Check spelling, encoding
4. **CORS Issues**: Verify origin configuration
5. **Function Timeouts**: Check database query performance

### Debug Commands
```bash
# Check build locally
npm run build

# Test database connection
npm run db:test

# Check environment variables
vercel env ls

# View function logs
vercel logs
```

## Success Criteria

- [ ] Application builds and deploys without errors
- [ ] All health check endpoints return 200
- [ ] Authentication flow works end-to-end
- [ ] Database operations function correctly
- [ ] CORS allows frontend access
- [ ] Rate limiting prevents abuse
- [ ] Performance meets requirements
- [ ] Security measures active

## Next Steps After Deployment

1. **Monitor**: Set up monitoring and alerts
2. **Scale**: Configure auto-scaling if needed
3. **Backup**: Ensure database backups are configured
4. **CI/CD**: Set up continuous deployment
5. **Documentation**: Update API documentation with production URLs