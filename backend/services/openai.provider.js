"use strict";

const OpenAI = require("openai");
const env = require("../config/env");

let client = null;

const getClient = () => {
  if (!client) {
    if (!env.OPENAI_API_KEY)
      throw new Error("OPENAI_API_KEY is not configured");
    client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return client;
};

/**
 * Map a raw OpenAI API error to a short, user-facing message.
 * @param {Error} err
 * @param {string} [modelName]
 * @returns {string}
 */
const friendlyError = (err, modelName) => {
  const msg = err.message || "";
  const status = err.status || err.statusCode || 0;

  if (status === 429 || msg.toLowerCase().includes("rate limit")) {
    return "AI rate limit reached — please wait a moment and try again.";
  }
  if (
    status === 401 ||
    msg.toLowerCase().includes("invalid api key") ||
    msg.toLowerCase().includes("authentication")
  ) {
    return "AI API key is invalid. Please check your OPENAI_API_KEY.";
  }
  if (status === 404 || msg.toLowerCase().includes("not found")) {
    return `AI model "${modelName || env.OPENAI_MODEL}" was not found. Update OPENAI_MODEL in your .env file.`;
  }
  if (
    status === 503 ||
    msg.toLowerCase().includes("overloaded") ||
    msg.toLowerCase().includes("unavailable")
  ) {
    return "The AI service is temporarily overloaded. Please try again in a few seconds.";
  }
  if (status === 400 || msg.toLowerCase().includes("billing")) {
    return "OpenAI billing issue — please check your account at platform.openai.com.";
  }
  return "AI generation failed. Please try again.";
};

/**
 * OpenAI provider — implements the AIProvider interface.
 *
 * @param {Object} opts
 * @param {Array<{role: 'user'|'assistant', content: string}>} opts.messages
 * @param {string}   opts.systemPrompt
 * @param {function(string): void} opts.onChunk
 * @param {function(string): void} opts.onComplete
 * @param {function(Error): void}  opts.onError
 * @param {string}  [opts.customApiKey]   - Optional caller-supplied API key
 * @param {string}  [opts.model]          - Optional model override
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
  try {
    const apiKey = customApiKey || env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

    // Use a fresh client when a custom key is provided; otherwise use the cached singleton
    const openai = customApiKey ? new OpenAI({ apiKey }) : getClient();
    const modelName = modelOverride || env.OPENAI_MODEL;

    const formattedMessages = [
      {
        role: "system",
        content: systemPrompt || "You are ChitGPT, a helpful AI assistant.",
      },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const stream = await openai.chat.completions.create({
      model: modelName,
      messages: formattedMessages,
      stream: true,
    });

    let fullText = "";
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || "";
      if (delta) {
        fullText += delta;
        onChunk(delta);
      }
    }

    onComplete(fullText);
  } catch (err) {
    console.error("[OpenAI] Stream error:", err.message);
    const modelName = modelOverride || env.OPENAI_MODEL;
    const wrapped = new Error(friendlyError(err, modelName));
    wrapped.originalError = err;
    onError(wrapped);
  }
};

/**
 * Non-streaming fallback
 *
 * @param {Object} opts
 * @param {Array<{role: string, content: string}>} opts.messages
 * @param {string}  [opts.systemPrompt]
 * @param {string}  [opts.customApiKey]  - Optional caller-supplied API key
 * @param {string}  [opts.model]         - Optional model override
 * @returns {Promise<string>}
 */
const generate = async ({
  messages,
  systemPrompt,
  customApiKey,
  model: modelOverride,
}) => {
  const apiKey = customApiKey || env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const openai = customApiKey ? new OpenAI({ apiKey }) : getClient();
  const modelName = modelOverride || env.OPENAI_MODEL;

  const formattedMessages = [
    {
      role: "system",
      content: systemPrompt || "You are ChitGPT, a helpful AI assistant.",
    },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const response = await openai.chat.completions.create({
    model: modelName,
    messages: formattedMessages,
  });

  return response.choices[0].message.content;
};

module.exports = { generateStream, generate };
