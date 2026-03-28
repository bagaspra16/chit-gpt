"use strict";

const { GoogleGenerativeAI } = require("@google/generative-ai");
const env = require("../config/env");

let client = null;

const getClient = () => {
  if (!client) {
    if (!env.GEMINI_API_KEY)
      throw new Error("GEMINI_API_KEY is not configured");
    client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }
  return client;
};

/**
 * Map a raw Gemini API error to a short, user-facing message.
 * Keeps internal details (keys, URLs) out of the SSE stream.
 * @param {Error} err
 * @param {string} [modelName]
 * @returns {string}
 */
const friendlyError = (err, modelName) => {
  const msg = err.message || "";
  if (
    msg.includes("429") ||
    msg.toLowerCase().includes("quota") ||
    msg.toLowerCase().includes("rate")
  ) {
    return "AI rate limit reached — please wait a moment and try again.";
  }
  if (
    msg.includes("403") ||
    msg.toLowerCase().includes("permission") ||
    msg.toLowerCase().includes("api key")
  ) {
    return "AI API key is invalid or lacks permission. Please check your GEMINI_API_KEY.";
  }
  if (msg.includes("404") || msg.toLowerCase().includes("not found")) {
    return `AI model "${modelName || env.GEMINI_MODEL}" was not found. Update GEMINI_MODEL in your .env file.`;
  }
  if (
    msg.includes("503") ||
    msg.toLowerCase().includes("unavailable") ||
    msg.toLowerCase().includes("overloaded")
  ) {
    return "The AI service is temporarily overloaded. Please try again in a few seconds.";
  }
  return "AI generation failed. Please try again.";
};

/**
 * Gemini provider — implements the AIProvider interface.
 *
 * @param {Object} opts
 * @param {Array<{role: 'user'|'assistant', content: string}>} opts.messages
 * @param {string}   opts.systemPrompt
 * @param {function(string): void} opts.onChunk
 * @param {function(string): void} opts.onComplete
 * @param {function(Error): void}  opts.onError
 * @param {string}  [opts.customApiKey]   - Optional user-supplied API key
 * @param {string}  [opts.model]          - Optional model name override
 */
const generateStream = async ({
  messages,
  systemPrompt,
  onChunk,
  onComplete,
  onError,
  customApiKey,
  model: modelOverride,
}) => {
  const modelName = modelOverride || env.GEMINI_MODEL;
  try {
    const apiKey = customApiKey || env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

    // Create a fresh client when a custom key is provided; otherwise use the cached singleton
    const genAI = customApiKey
      ? new GoogleGenerativeAI(customApiKey)
      : getClient();

    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction:
        systemPrompt || "You are ChitGPT, a helpful and concise AI assistant.",
    });

    // Map to Gemini's content format — assistant → model, everything else → user
    const history = messages.slice(0, -1).map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // Last message is always the current user turn
    const lastMessage = messages[messages.length - 1];

    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(lastMessage.content);

    let fullText = "";
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        fullText += chunkText;
        onChunk(chunkText);
      }
    }

    onComplete(fullText);
  } catch (err) {
    console.error("[Gemini] Stream error:", err.message);
    // Wrap with a friendly message so the orchestrator can surface it to the client
    const wrapped = new Error(friendlyError(err, modelName));
    wrapped.originalError = err;
    onError(wrapped);
  }
};

/**
 * Non-streaming fallback
 * @param {Object} opts
 * @param {Array<{role: string, content: string}>} opts.messages
 * @param {string} [opts.systemPrompt]
 * @param {string} [opts.customApiKey]  - Optional user-supplied API key
 * @param {string} [opts.model]         - Optional model name override
 * @returns {Promise<string>}
 */
const generate = async ({
  messages,
  systemPrompt,
  customApiKey,
  model: modelOverride,
}) => {
  const modelName = modelOverride || env.GEMINI_MODEL;

  const apiKey = customApiKey || env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const genAI = customApiKey
    ? new GoogleGenerativeAI(customApiKey)
    : getClient();

  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction:
      systemPrompt || "You are ChitGPT, a helpful and concise AI assistant.",
  });

  const history = messages.slice(0, -1).map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  const lastMessage = messages[messages.length - 1];
  const chat = model.startChat({ history });
  const result = await chat.sendMessage(lastMessage.content);
  return result.response.text();
};

module.exports = { generateStream, generate };
