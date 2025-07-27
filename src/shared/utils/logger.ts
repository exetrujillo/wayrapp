// src/shared/utils/logger.ts

/**
 * Sovereign node logging system for WayrApp platform.
 * 
 * This module provides a centralized, environment-aware logging solution built on Winston.
 * It automatically adapts to serverless environments (Vercel, AWS Lambda, Netlify) by disabling
 * file-based logging while maintaining console output. In traditional server environments,
 * it provides both console and file-based logging with automatic log directory creation.
 * The logger supports multiple log levels (error, warn, info, http, debug) with colorized
 * console output and structured JSON file logging.
 * 
 * @module logger
 * @category Utilities
 * @category Logs
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Basic logging usage
 * import { logger } from '@/shared/utils/logger';
 * 
 * logger.info('User authentication successful', { userId: '123', method: 'JWT' });
 * logger.warn('Rate limit approaching', { currentRequests: 95, limit: 100 });
 * logger.error('Database connection failed', { error: error.message, retryCount: 3 });
 * logger.debug('Cache hit', { key: 'user:123', ttl: 300 });
 * 
 * @example
 * // Environment-specific behavior
 * // In serverless environments (Vercel, Lambda, Netlify):
 * // - Only console logging is active
 * // - No file system operations
 * // - Structured JSON format for log aggregation
 * 
 * // In traditional server environments:
 * // - Console + file logging active
 * // - Automatic logs/ directory creation
 * // - Separate error.log and combined.log files
 * 
 * @example
 * // Configuration via environment variables
 * // LOG_LEVEL=debug (enables all log levels)
 * // LOG_LEVEL=info (default, enables info, warn, error)
 * // LOG_LEVEL=error (only error logs)
 * 
 * logger.debug('This appears only when LOG_LEVEL=debug');
 * logger.info('This appears when LOG_LEVEL=info or debug');
 * logger.error('This always appears unless LOG_LEVEL is disabled');
 */

import winston from "winston";
import fs from "fs";

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info["timestamp"]} ${info.level}: ${info.message}`,
  ),
);

// Define which transports the logger must use
const transports: winston.transport[] = [
  // Console transport (always available)
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
    ),
  }),
];

// Add file transports only in non-serverless environments
const isServerless =
  process.env["VERCEL"] ||
  process.env["AWS_LAMBDA_FUNCTION_NAME"] ||
  process.env["NETLIFY"];

if (!isServerless) {
  // File transport for errors (only in non-serverless environments)
  transports.push(
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  );

  // File transport for all logs (only in non-serverless environments)
  transports.push(
    new winston.transports.File({
      filename: "logs/combined.log",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  );
}

// Create the logger
export const logger = winston.createLogger({
  level: process.env["LOG_LEVEL"] || "info",
  levels,
  format,
  transports,
  exitOnError: false,
});

// Create logs directory if it doesn't exist (only in non-serverless environments)
if (!isServerless) {
  try {
    const logsDir = "logs";
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
    }
  } catch (error) {
    // Ignore errors in serverless environments
    console.warn("Could not create logs directory:", error);
  }
}

export default logger;
