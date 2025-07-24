import express from 'express';

console.log('[SIMPLE APP] Initializing simple Express app...');

const app = express();

// Un único endpoint de salud para probar que el servidor responde
app.get('/api/v1/health', (_req, res) => {
  console.log('[SIMPLE APP] /api/v1/health endpoint was hit!');
  
  // Imprimimos las variables de entorno para confirmar que Vercel las está inyectando
  const dbUrlExists = !!process.env['DATABASE_URL'];
  const jwtSecretExists = !!process.env['JWT_SECRET'];

  res.status(200).json({
    status: 'ok',
    message: 'Simple server is running successfully!',
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL_loaded: dbUrlExists,
      JWT_SECRET_loaded: jwtSecretExists,
    }
  });
});

// Un "catch-all" para cualquier otra ruta. Si vemos esto, sabremos que las peticiones llegan a nuestra app.
app.use('*', (req, res) => {
  console.log(`[SIMPLE APP] Catch-all route hit for: ${req.originalUrl}`);
  res.status(404).json({
    error: 'NOT_FOUND_IN_SIMPLE_APP',
    message: 'This route does not exist in the simplified server, but the request reached the application.',
    path: req.originalUrl,
  });
});

export default app;