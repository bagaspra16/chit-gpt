"use strict";

const express = require("express");
const { z } = require("zod");
const {
  getChats,
  startNewChat,
  removeChat,
  renameChat,
} = require("../controllers/chat.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { validateBody } = require("../middleware/validate.middleware");
const messageRoutes = require("./message.routes");

const router = express.Router();

// All chat routes require authentication
router.use(requireAuth);

/**
 * Validation Schemas
 */
const createChatSchema = z.object({
  title: z.string().max(500, "Title too long").optional(),
});

const renameChatSchema = z.object({
  title: z.string().min(1, "Title required").max(500, "Title too long"),
});

/**
 * Sub-router mounting for messages (/api/chats/:chatId/messages)
 */
router.use("/:chatId/messages", messageRoutes);

/**
 * Chat Routes
 */
// GET /api/chats -> Get all user's chats
router.get("/", getChats);

// POST /api/chats -> Start a new chat
router.post("/", validateBody(createChatSchema), startNewChat);

// PUT /api/chats/:chatId -> Rename a specific chat
router.put("/:chatId", validateBody(renameChatSchema), renameChat);

// DELETE /api/chats/:chatId -> Delete a specific chat (and its messages)
router.delete("/:chatId", removeChat);

module.exports = router;
