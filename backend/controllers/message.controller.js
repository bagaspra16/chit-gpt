"use strict";

const chatOrchestrator = require("../services/chatOrchestrator.service");
const response = require("../utils/response");

/**
 * Fetch messages for a specific chat (supports pagination via `before` cursor)
 */
const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.params;
    const { limit, before } = req.query;

    const messages = await chatOrchestrator.getChatMessages(
      chatId,
      userId,
      limit ? parseInt(limit, 10) : 50,
      before || null,
    );

    return response.success(res, { messages });
  } catch (err) {
    if (err.statusCode === 404) {
      return response.notFound(res, "Chat not found");
    }
    console.error("[Message] Get Messages Error:", err);
    return response.error(res, "Failed to fetch messages");
  }
};

/**
 * Stream an AI response using SSE
 * Endpoint: POST /api/chats/:chatId/messages/stream
 * Body: { content: string, customApiKey?: string, aiProvider?: string, model?: string }
 */
const streamMessage = async (req, res) => {
  const userId = req.user.id;
  const { chatId } = req.params;
  const { content, customApiKey, aiProvider, model } = req.body;

  // Set appropriate headers for Server-Sent Events
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    // Orchestrator handles fetching history, prompt building, AI call, and persistence
    await chatOrchestrator.streamResponse({
      chatId,
      userId,
      content,
      res,
      customApiKey: customApiKey || null,
      aiProvider: aiProvider || null,
      model: model || null,
    });
  } catch (err) {
    if (err.statusCode === 404) {
      res.write(
        `data: ${JSON.stringify({ type: "error", message: "Chat not found" })}\n\n`,
      );
      res.end();
      return;
    }

    console.error("[Message] Stream Error:", err.message);
    res.write(
      `data: ${JSON.stringify({ type: "error", message: "Internal server error while streaming" })}\n\n`,
    );
    res.end();
  }
};

module.exports = { getMessages, streamMessage };
