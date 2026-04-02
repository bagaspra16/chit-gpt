"use strict";

/**
 * LocalAI provider — Self-hosted Phi-3 mini via GPT4All
 * API: https://noneleemosynary-subumbellated-yuonne.ngrok-free.dev
 *
 * Implements the AIProvider interface (generateStream + generate).
 * Uses the OpenAI SDK (already installed) with a custom baseURL.
 * No API key required — free, self-hosted.
 */

const OpenAI = require("openai");
const env = require("../config/env");

const LOCAL_AI_BASE_URL =
  env.LOCAL_AI_BASE_URL ||
  "https://noneleemosynary-subumbellated-yuonne.ngrok-free.dev";

// The model name returned by GET /v1/models on the self-hosted server
const LOCAL_AI_MODEL = "Phi-3-mini-4k-instruct.Q4_0.gguf";

// Singleton client — no API key needed, use a dummy string so OpenAI SDK is happy
let client = null;
const getClient = () => {
  if (!client) {
    client = new OpenAI({
      baseURL: `${LOCAL_AI_BASE_URL}/v1`,
      apiKey: "localai", // dummy — server ignores it
      timeout: 120_000,  // 2 minutes (Phi-3 mini is slow on CPU)
      maxRetries: 0,
    });
  }
  return client;
};

/**
 * Map a raw error to a friendly user-facing message.
 */
const friendlyError = (err) => {
  const msg = (err.message || "").toLowerCase();
  const status = err.status || err.statusCode || 0;

  if (
    msg.includes("econnrefused") ||
    msg.includes("fetch failed") ||
    msg.includes("network") ||
    msg.includes("enotfound") ||
    msg.includes("timeout") ||
    msg.includes("timed out")
  ) {
    return "Local AI is unreachable or timed out. The model may be busy — please try again in a moment.";
  }
  if (status === 429 || msg.includes("rate limit")) {
    return "Local AI rate limit reached — please wait a moment and try again.";
  }
  if (status === 422) {
    return "Local AI rejected the request — please try again.";
  }
  return "Local AI generation failed. Please try again.";
};

/**
 * Build the messages array for the chat/completions endpoint.
 */
const buildMessages = (messages, systemPrompt) => {
  const result = [];
  if (systemPrompt) {
    result.push({ role: "system", content: systemPrompt });
  }
  for (const m of messages) {
    result.push({ role: m.role, content: m.content });
  }
  return result;
};

/**
 * Streaming completion using OpenAI SDK → POST /v1/chat/completions stream:true
 */
const generateStream = async ({
  messages,
  systemPrompt,
  onChunk,
  onComplete,
  onError,
  model: modelOverride,
  // customApiKey intentionally ignored — LocalAI needs no key
}) => {
  try {
    const openai = getClient();
    const modelName = modelOverride || LOCAL_AI_MODEL;

    const formattedMessages = buildMessages(
      messages,
      systemPrompt ||
        "You are ChitGPT, a helpful and concise AI assistant. Powered by a local Phi-3 mini model."
    );

    const stream = await openai.chat.completions.create({
      model: modelName,
      messages: formattedMessages,
      max_tokens: 512,
      temperature: 0.7,
      stream: true,
    });

    let fullText = "";
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content || "";
      if (delta) {
        fullText += delta;
        onChunk(delta);
      }
    }

    onComplete(fullText);
  } catch (err) {
    console.error("[LocalAI] Stream error:", err.message);
    const wrapped = new Error(friendlyError(err));
    wrapped.originalError = err;
    onError(wrapped);
  }
};

/**
 * Non-streaming fallback — POST /v1/chat/completions stream:false
 */
const generate = async ({
  messages,
  systemPrompt,
  model: modelOverride,
}) => {
  const openai = getClient();
  const modelName = modelOverride || LOCAL_AI_MODEL;

  const formattedMessages = buildMessages(
    messages,
    systemPrompt ||
      "You are ChitGPT, a helpful and concise AI assistant. Powered by a local Phi-3 mini model."
  );

  const response = await openai.chat.completions.create({
    model: modelName,
    messages: formattedMessages,
    max_tokens: 512,
    temperature: 0.7,
    stream: false,
  });

  return response.choices?.[0]?.message?.content || "";
};

module.exports = { generateStream, generate };
