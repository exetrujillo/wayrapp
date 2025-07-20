/**
 * Server Entry Point
 * Starts the Express server
 */

import app from "./app";
import { logger } from "@/shared/utils/logger";

const PORT = process.env["PORT"] || 3000;

// Start server
app.listen(PORT, () => {
  logger.info(`WayrApp API server running on port ${PORT}`, {
    environment: process.env["NODE_ENV"] || "development",
    port: PORT,
  });
});