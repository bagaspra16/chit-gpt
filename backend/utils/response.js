"use strict";

/**
 * Sends a standardized success response
 * @param {import('express').Response} res
 * @param {any} data
 * @param {string} [message]
 * @param {number} [statusCode]
 */
const success = (res, data, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    ok: true,
    message,
    data,
  });
};

/**
 * Sends a standardized error response
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} [statusCode]
 * @param {any} [details]
 */
const error = (
  res,
  message = "Internal Server Error",
  statusCode = 500,
  details = null,
) => {
  const payload = { ok: false, message };
  if (details) {
    payload.details = details;
  }
  return res.status(statusCode).json(payload);
};

/**
 * Sends a 401 Unauthorized response
 */
const unauthorized = (res, message = "Unauthorized") =>
  error(res, message, 401);

/**
 * Sends a 403 Forbidden response
 */
const forbidden = (res, message = "Forbidden") => error(res, message, 403);

/**
 * Sends a 404 Not Found response
 */
const notFound = (res, message = "Not found") => error(res, message, 404);

/**
 * Sends a 422 Validation Error response
 */
const validationError = (res, message = "Validation failed", details = null) =>
  error(res, message, 422, details);

module.exports = {
  success,
  error,
  unauthorized,
  forbidden,
  notFound,
  validationError,
};
