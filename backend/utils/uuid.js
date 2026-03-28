'use strict';

const crypto = require('crypto');

/**
 * Generate a new UUID v4
 * @returns {string}
 */
const generateId = () => crypto.randomUUID();

/**
 * Validate UUID format
 * @param {string} id
 * @returns {boolean}
 */
const isValidUUID = (id) => {
  if (typeof id !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

module.exports = { generateId, isValidUUID };
