'use strict';

const { verifyToken } = require('../services/auth.service');
const { unauthorized } = require('../utils/response');

/**
 * Middleware to protect routes that require authentication
 * Extracts Bearer token from headers, verifies it, and attaches the decoy/user payload to req.user
 */
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorized(res, 'Authentication required');
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyToken(token);
    // payload: { id, email, is_guest, ... }
    req.user = payload;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return unauthorized(res, 'Token expired');
    }
    return unauthorized(res, 'Invalid token');
  }
};

module.exports = { requireAuth };
