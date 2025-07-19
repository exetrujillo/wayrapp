/**
 * WayrApp Backend API
 * Open-source language learning platform
 * 
 * @author Exequiel Trujillo
 * @version 1.0.0
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

import { 
  errorHandler, 
  requestLogger,
  corsOptions,
  defaultRateLimiter,
  helmetOptions,
  sanitizeInput,
  securityHeaders,
  requestSizeLimiter
} from '@/shared/middleware';
import { logger } from '@/shared/utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 3000;

// Security middleware
app.use(helmet(helmetOptions));
app.use(compression());
app.use(securityHeaders);

// CORS configuration
app.use(cors(corsOptions));

// Rate limiting
app.use(defaultRateLimiter);

// Request size limiting
app.use(requestSizeLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env['NODE_ENV'] || 'development'
    });
});

// Import routes
import authRoutes from '@/modules/users/routes/authRoutes';

// API routes
app.get('/api', (_req, res) => {
    res.json({
        message: 'WayrApp API v1.0.0',
        documentation: '/api/docs',
        health: '/health'
    });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Global error handler (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: {
            code: 'NOT_FOUND',
            message: 'Endpoint not found',
            path: req.originalUrl,
            timestamp: new Date().toISOString()
        }
    });
});

// Start server
app.listen(PORT, () => {
    logger.info(`WayrApp API server running on port ${PORT}`, {
        environment: process.env['NODE_ENV'] || 'development',
        port: PORT
    });
});

export default app;