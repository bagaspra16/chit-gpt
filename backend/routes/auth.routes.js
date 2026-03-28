'use strict';

const express = require('express');
const { z } = require('zod');
const { register, login, verifyEmail, createGuest, me } = require('../controllers/auth.controller');
const { validateBody, validateQuery } = require('../middleware/validate.middleware');
const { requireAuth } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');

const router = express.Router();

/**
 * Validation Schemas
 */
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string(),
});

const verifySchema = z.object({
  token: z.string().min(32, 'Invalid token format'),
});

/**
 * Routes
 */
// Public
router.post('/register', authLimiter, validateBody(registerSchema), register);
router.post('/login', authLimiter, validateBody(loginSchema), login);
router.get('/verify', authLimiter, validateQuery(verifySchema), verifyEmail);
router.post('/guest', authLimiter, createGuest);

// Protected
router.get('/me', requireAuth, me);

module.exports = router;
