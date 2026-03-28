"use strict";

const { validationError } = require("../utils/response");

/**
 * Express middleware generator to validate request bodies against a Zod schema
 * @param {import('zod').ZodSchema} schema
 */
const validateBody = (schema) => (req, res, next) => {
  const parseResult = schema.safeParse(req.body);

  if (!parseResult.success) {
    const formattedErrors = parseResult.error.issues.map((err) => ({
      path: err.path.join("."),
      message: err.message,
    }));
    return validationError(res, "Invalid request data", formattedErrors);
  }

  // Replace req.body with typed, validated data (strips unknown keys if schema uses .strip())
  // req.body is a plain writable own-property set by express.json(), so assignment is safe.
  req.body = parseResult.data;
  next();
};

/**
 * Express middleware generator to validate query params against a Zod schema
 * @param {import('zod').ZodSchema} schema
 */
const validateQuery = (schema) => (req, res, next) => {
  const parseResult = schema.safeParse(req.query);

  if (!parseResult.success) {
    const formattedErrors = parseResult.error.issues.map((err) => ({
      path: err.path.join("."),
      message: err.message,
    }));
    return validationError(res, "Invalid query parameters", formattedErrors);
  }

  // NOTE: In Express v5, req.query is a read-only getter on the prototype
  // (TypeError: Cannot set property query … which has only a getter).
  // We only validate here — controllers read directly from req.query as strings,
  // which is safe because none of our query schemas rely on Zod transforms being
  // forwarded to the controller (e.g. parseInt is done in the controller itself).
  next();
};

module.exports = { validateBody, validateQuery };
