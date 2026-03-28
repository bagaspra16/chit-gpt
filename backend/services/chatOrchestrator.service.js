"use strict";

const db = require("../config/db");
const aiProvider = require("./aiProvider.service");
const { buildContext, generateChatTitle } = require("./contextBuilder.service");
const { generateId } = require("../utils/uuid");

/**
 * ChatOrchestrator — the core service that coordinates the entire chat lifecycle.
 *
 * Flow:
 *  1. Validate chat ownership
 *  2. Fetch message history (all prior messages)
 *  3. Build token-limited sliding window context
 *  4. Stream AI response via SSE
 *  5. Persist user message + assistant response
 *  6. Update chat title on first message
 */

/**
 * Stream a chat response via SSE
 *
 * @param {Object} opts
 * @param {string}   opts.chatId         - UUID of the chat
 * @param {string}   opts.userId         - UUID of the requesting user
 * @param {string}   opts.content        - The user's new message
 * @param {import('express').Response} opts.res - Express response (SSE)
 * @param {string|null} [opts.customApiKey]   - Optional user-supplied API key
 * @param {string|null} [opts.aiProvider]     - Optional provider override ('gemini'|'openai')
 * @param {string|null} [opts.model]          - Optional model name override
 */
const streamResponse = async ({
  chatId,
  userId,
  content,
  res,
  customApiKey = null,
  aiProvider: overrideProvider = null,
  model = null,
}) => {
  // 1. Validate chat ownership
  const chatResult = await db.query(
    "SELECT id, title FROM chats WHERE id = $1 AND user_id = $2",
    [chatId, userId],
  );

  if (chatResult.rowCount === 0) {
    throw Object.assign(new Error("Chat not found or access denied"), {
      statusCode: 404,
    });
  }

  const chat = chatResult.rows[0];

  // 2. Fetch message history (all messages, ordered oldest → newest)
  const historyResult = await db.query(
    "SELECT role, content FROM messages WHERE chat_id = $1 ORDER BY created_at ASC",
    [chatId],
  );
  const history = historyResult.rows;

  // 3. Persist the user's message immediately (before AI call)
  const userMessageId = generateId();
  await db.query(
    "INSERT INTO messages (id, chat_id, role, content) VALUES ($1, $2, $3, $4)",
    [userMessageId, chatId, "user", content],
  );

  // 4. Build context (sliding window)
  const { messages, systemPrompt } = buildContext(history, content);

  // 5. Stream AI response via SSE
  let assistantContent = "";
  let streamError = null;

  await aiProvider.streamCompletion({
    messages,
    systemPrompt,
    onChunk: (chunk) => {
      assistantContent += chunk;
      // SSE format: "data: <json>\n\n"
      res.write(
        `data: ${JSON.stringify({ type: "chunk", content: chunk })}\n\n`,
      );
    },
    onComplete: async (fullText) => {
      assistantContent = fullText;
    },
    onError: (err) => {
      streamError = err;
      console.error(
        "[Orchestrator] AI stream error:",
        err.originalError?.message || err.message,
      );
    },
    customApiKey,
    aiProvider: overrideProvider,
    model,
  });

  if (streamError) {
    const clientMessage =
      streamError.message || "AI generation failed. Please try again.";
    res.write(
      `data: ${JSON.stringify({ type: "error", message: clientMessage })}\n\n`,
    );
    res.end();
    return;
  }

  // 6. Persist assistant response
  const assistantMessageId = generateId();
  await db.query(
    "INSERT INTO messages (id, chat_id, role, content) VALUES ($1, $2, $3, $4)",
    [assistantMessageId, chatId, "assistant", assistantContent],
  );

  // 7. Update chat title on first exchange (title was 'New Chat') and surface it to the client
  let newTitle = null;
  if (chat.title === "New Chat" && history.length === 0) {
    newTitle = generateChatTitle(content);
    await db.query("UPDATE chats SET title = $1 WHERE id = $2", [
      newTitle,
      chatId,
    ]);
  }

  // Signal stream end — include titleUpdate so the client can refresh the sidebar
  res.write(
    `data: ${JSON.stringify({
      type: "done",
      messageId: assistantMessageId,
      titleUpdate: newTitle,
    })}\n\n`,
  );
  res.end();
};

/**
 * Create a new chat for a user
 * @param {string} userId
 * @param {string} [title]
 * @returns {Promise<Object>} - The new chat row
 */
const createChat = async (userId, title = "New Chat") => {
  const id = generateId();
  const result = await db.query(
    "INSERT INTO chats (id, user_id, title) VALUES ($1, $2, $3) RETURNING *",
    [id, userId, title],
  );
  return result.rows[0];
};

/**
 * Get all chats for a user, ordered by most recently updated
 * @param {string} userId
 * @returns {Promise<Array>}
 */
const getUserChats = async (userId) => {
  const result = await db.query(
    "SELECT id, title, created_at, updated_at FROM chats WHERE user_id = $1 ORDER BY updated_at DESC",
    [userId],
  );
  return result.rows;
};

/**
 * Get paginated messages for a chat
 * @param {string} chatId
 * @param {string} userId
 * @param {number} [limit=50]
 * @param {string} [before] - ISO timestamp cursor for pagination
 * @returns {Promise<Array>}
 */
const getChatMessages = async (chatId, userId, limit = 50, before = null) => {
  // Validate ownership
  const chatCheck = await db.query(
    "SELECT id FROM chats WHERE id = $1 AND user_id = $2",
    [chatId, userId],
  );
  if (chatCheck.rowCount === 0) {
    throw Object.assign(new Error("Chat not found"), { statusCode: 404 });
  }

  let queryText =
    "SELECT id, role, content, metadata, created_at FROM messages WHERE chat_id = $1";
  const params = [chatId];

  if (before) {
    queryText += ` AND created_at < $${params.length + 1}`;
    params.push(before);
  }

  queryText += ` ORDER BY created_at ASC LIMIT $${params.length + 1}`;
  params.push(limit);

  const result = await db.query(queryText, params);
  return result.rows;
};

/**
 * Delete a chat (cascades to messages via FK)
 * @param {string} chatId
 * @param {string} userId
 */
const deleteChat = async (chatId, userId) => {
  const result = await db.query(
    "DELETE FROM chats WHERE id = $1 AND user_id = $2 RETURNING id",
    [chatId, userId],
  );
  if (result.rowCount === 0) {
    throw Object.assign(new Error("Chat not found"), { statusCode: 404 });
  }
};

module.exports = {
  streamResponse,
  createChat,
  getUserChats,
  getChatMessages,
  deleteChat,
};
