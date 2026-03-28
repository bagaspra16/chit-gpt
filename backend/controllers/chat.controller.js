"use strict";

const db = require("../config/db");
const chatOrchestrator = require("../services/chatOrchestrator.service");
const response = require("../utils/response");

/**
 * Get all chats for the authenticated user
 */
const getChats = async (req, res) => {
  try {
    const userId = req.user.id;
    const chats = await chatOrchestrator.getUserChats(userId);
    return response.success(res, { chats });
  } catch (err) {
    console.error("[Chat] Get Chats Error:", err);
    return response.error(res, "Failed to fetch chats");
  }
};

/**
 * Create a new chat
 */
const startNewChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title } = req.body; // optional
    const newChat = await chatOrchestrator.createChat(userId, title);
    return response.success(res, { chat: newChat }, "Chat created", 201);
  } catch (err) {
    console.error("[Chat] Create Chat Error:", err);
    return response.error(res, "Failed to create chat");
  }
};

/**
 * Delete a specific chat by ID
 */
const removeChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.params;

    await chatOrchestrator.deleteChat(chatId, userId);
    return response.success(res, null, "Chat deleted");
  } catch (err) {
    if (err.statusCode === 404) {
      return response.notFound(res, "Chat not found");
    }
    console.error("[Chat] Delete Chat Error:", err);
    return response.error(res, "Failed to delete chat");
  }
};

/**
 * Rename a specific chat by ID
 */
const renameChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.params;
    const { title } = req.body;

    const result = await db.query(
      "UPDATE chats SET title = $1 WHERE id = $2 AND user_id = $3 RETURNING id, title, updated_at",
      [title.trim(), chatId, userId],
    );

    if (result.rowCount === 0) return response.notFound(res, "Chat not found");
    return response.success(res, { chat: result.rows[0] }, "Chat renamed");
  } catch (err) {
    console.error("[Chat] Rename Error:", err);
    return response.error(res, "Failed to rename chat");
  }
};

module.exports = { getChats, startNewChat, removeChat, renameChat };
