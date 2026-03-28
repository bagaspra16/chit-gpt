'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');

const SALT_ROUNDS = 12;

/**
 * Hash a plain-text password
 * @param {string} password
 * @returns {Promise<string>}
 */
const hashPassword = async (password) => bcrypt.hash(password, SALT_ROUNDS);

/**
 * Compare plain-text password against stored hash
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
const comparePassword = (password, hash) => bcrypt.compare(password, hash);

/**
 * Sign a JWT access token
 * @param {{ id: string, email: string|null, is_guest: boolean }} payload
 * @returns {string}
 */
const signToken = (payload) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

/**
 * Verify and decode a JWT token
 * @param {string} token
 * @returns {{ id: string, email: string|null, is_guest: boolean }}
 */
const verifyToken = (token) => jwt.verify(token, env.JWT_SECRET);

/**
 * Generate a secure random hex token (for email verification)
 * @param {number} [bytes=32]
 * @returns {string}
 */
const generateSecureToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

/**
 * Calculate verification token expiry (24 hours from now)
 * @returns {Date}
 */
const getVerificationExpiry = () => new Date(Date.now() + 24 * 60 * 60 * 1000);

module.exports = {
  hashPassword,
  comparePassword,
  signToken,
  verifyToken,
  generateSecureToken,
  getVerificationExpiry,
};
