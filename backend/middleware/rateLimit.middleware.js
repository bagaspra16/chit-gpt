'use strict';

const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter (100 req per 15 min per IP)
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increased for development
  message: { ok: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Stricter auth rate limiter (10 req per 15 min per IP) - for login/register
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Increased for development
  message: { ok: false, message: 'Too many auth attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * AI Message streaming rate limiter (30 req per min per IP)
 */
const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { ok: false, message: 'Too many messages sent. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { apiLimiter, authLimiter, messageLimiter };
