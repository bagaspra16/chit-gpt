'use strict';

const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const { apiLimiter } = require('./middleware/rateLimit.middleware');

// Import Routes
const authRoutes = require('./routes/auth.routes');
const chatRoutes = require('./routes/chat.routes');

const app = express();

// Middleware
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
// Increase JSON payload limit just in case, but keep it reasonable
app.use(express.json({ limit: '10mb' }));
// Apply general rate limits to all /api routes
app.use('/api', apiLimiter);

// Health check
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', time: new Date() }));

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ ok: false, message: 'API route not found' });
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[Server] Unhandled Error:', err);
  const status = err.statusCode || 500;
  const message = Object.keys(err).length > 0 && err.message ? err.message : 'Internal Server Error';
  res.status(status).json({
    ok: false,
    message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start Server (Hanya jalan di lokal/VM, di Vercel Node runtime dia di-bypass)
let server;
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  server = app.listen(process.env.PORT || env.PORT || 3001, () => {
    console.log(`[Server] ChitGPT backend listening on port ${env.PORT} in ${env.NODE_ENV} mode.`);
  });
}

// Graceful shutdown handling
const gracefulShutdown = () => {
  console.log('[Server] Received kill signal, shutting down gracefully.');
  if (server) {
    server.close(() => {
      console.log('[Server] Closed out remaining connections.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }

  setTimeout(() => {
    console.error('[Server] Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = app;
