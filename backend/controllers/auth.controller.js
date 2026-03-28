'use strict';

const db = require('../config/db');
const authService = require('../services/auth.service');
const emailService = require('../services/email.service');
const response = require('../utils/response');

/**
 * Register a new user
 */
const register = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount > 0) {
      return response.error(res, 'Email already in use', 409);
    }

    const password_hash = await authService.hashPassword(password);
    const verification_token = authService.generateSecureToken();
    const verification_expires_at = authService.getVerificationExpiry();

    // Insert new user
    const result = await db.query(
      `INSERT INTO users (email, password_hash, verification_token, verification_expires_at) 
       VALUES ($1, $2, $3, $4) RETURNING id, email`,
      [email, password_hash, verification_token, verification_expires_at]
    );

    const user = result.rows[0];

    // Send verification email asynchronously
    emailService.sendVerificationEmail(email, verification_token).catch((err) => {
      console.error('[Auth] Failed to send verification email:', err);
    });

    return response.success(res, { user }, 'Registration successful, please verify your email', 201);
  } catch (err) {
    console.error('[Auth] Register Error:', err);
    return response.error(res, 'Registration failed');
  }
};

/**
 * Login user
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await db.query(
      'SELECT id, email, password_hash, is_verified, is_guest, is_admin FROM users WHERE email = $1',
      [email]
    );

    if (result.rowCount === 0) {
      return response.unauthorized(res, 'Invalid credentials');
    }

    const user = result.rows[0];

    // Don't check password for pure guest accounts, but those shouldn't hit this endpoint anyway
    if (user.is_guest || !user.password_hash) {
      return response.unauthorized(res, 'Invalid account type');
    }

    const isValid = await authService.comparePassword(password, user.password_hash);
    if (!isValid) {
      return response.unauthorized(res, 'Invalid credentials');
    }

    if (!user.is_verified) {
      return response.forbidden(res, 'Email not verified. Please check your inbox.');
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      is_guest: false,
      is_admin: user.is_admin || false,
    };

    const token = authService.signToken(tokenPayload);

    return response.success(res, { user: tokenPayload, token }, 'Login successful');
  } catch (err) {
    console.error('[Auth] Login Error:', err);
    return response.error(res, 'Login failed');
  }
};

/**
 * Verify email
 */
const verifyEmail = async (req, res) => {
  const { token } = req.query;

  try {
    const result = await db.query(
      `SELECT id, verification_expires_at FROM users 
       WHERE verification_token = $1 AND is_verified = false`,
      [token]
    );

    if (result.rowCount === 0) {
      return response.error(res, 'Invalid or expired verification token', 400);
    }

    const user = result.rows[0];

    if (new Date() > new Date(user.verification_expires_at)) {
      return response.error(res, 'Verification token expired. Please request a new one.', 400);
    }

    // Update user to verified
    await db.query(
      `UPDATE users SET is_verified = true, verification_token = NULL, verification_expires_at = NULL 
       WHERE id = $1`,
      [user.id]
    );

    return response.success(res, null, 'Email verified successfully. You can now login.');
  } catch (err) {
    console.error('[Auth] Verification Error:', err);
    return response.error(res, 'Verification failed');
  }
};

/**
 * Create a guest session
 */
const createGuest = async (req, res) => {
  try {
    // 24 hours expiry for guest mode by default
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const result = await db.query(
      `INSERT INTO users (is_guest, guest_expires_at) 
       VALUES (true, $1) RETURNING id`,
      [expiresAt]
    );

    const user = result.rows[0];

    const tokenPayload = {
      id: user.id,
      email: null,
      is_guest: true,
      is_admin: false,
    };

    const token = authService.signToken(tokenPayload);

    return response.success(res, { user: tokenPayload, token }, 'Guest session created', 201);
  } catch (err) {
    console.error('[Auth] Create Guest Error:', err);
    return response.error(res, 'Failed to create guest session');
  }
};

/**
 * Get current user profile from token context
 */
const me = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, is_guest, is_admin, created_at FROM users WHERE id = $1',
      [req.user.id],
    );
    if (result.rowCount === 0) {
      return response.unauthorized(res, 'User not found');
    }
    const u = result.rows[0];
    return response.success(res, {
      user: {
        id: u.id,
        email: u.email,
        is_guest: u.is_guest,
        is_admin: u.is_admin,
        created_at: u.created_at,
      },
    });
  } catch (err) {
    console.error('[Auth] Me Error:', err);
    return response.error(res, 'Failed to fetch user');
  }
};

module.exports = { register, login, verifyEmail, createGuest, me };
