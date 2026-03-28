"use strict";

const express = require("express");
const { z } = require("zod");
const {
  getMessages,
  streamMessage,
} = require("../controllers/message.controller");
const {
  validateBody,
  validateQuery,
} = require("../middleware/validate.middleware");
const { messageLimiter } = require("../middleware/rateLimit.middleware");

// mergeParams: true ensures we can access `req.params.chatId` from the parent router
const router = express.Router({ mergeParams: true });

/**
 * Validation Schemas
 */
const streamMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(20000, "Message too long"),
  customApiKey: z.string().optional(),
  aiProvider: z.enum(["gemini", "openai", "groq"]).optional(),
  model: z.string().optional(),
});

const getMessagesQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  before: z.string().datetime().optional(), // ISO date for pagination cursor
});

/**
 * Routes (Protected implicitly because parent router applies requireAuth)
 */

// GET /api/chats/:chatId/messages -> Paginated message history
router.get("/", validateQuery(getMessagesQuerySchema), getMessages);

// POST /api/chats/:chatId/messages/stream -> Stream user message / AI response
router.post(
  "/stream",
  messageLimiter,
  validateBody(streamMessageSchema),
  streamMessage,
);

module.exports = router;
