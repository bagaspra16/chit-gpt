'use strict';

const db = require('../config/db');
const { forbidden } = require('../utils/response');

/**
 * Middleware that requires the authenticated user to be an admin.
 * Must be used AFTER requireAuth middleware.
 */
const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return forbidden(res, 'Admin access required');
    }

    const result = await db.query(
      'SELECT is_admin FROM users WHERE id = $1',
      [userId],
    );

    if (result.rowCount === 0 || !result.rows[0].is_admin) {
      return forbidden(res, 'Admin access required');
    }

    next();
  } catch (err) {
    console.error('[Admin Middleware] Error:', err);
    return forbidden(res, 'Admin access required');
  }
};

module.exports = { requireAdmin };
