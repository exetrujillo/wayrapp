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
