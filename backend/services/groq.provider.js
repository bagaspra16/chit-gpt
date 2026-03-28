"use strict";

const OpenAI = require("openai");
const env = require("../config/env");

let client = null;

const getClient = () => {
  if (!client) {
    if (!env.GROQ_API_KEY)
      throw new Error("GROQ_API_KEY is not configured");
    client = new OpenAI({ 
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: env.GROQ_API_KEY,
    });
  }
  return client;
};

/**
 * Map a raw OpenAI/Groq API error to a short, user-facing message.
 */
const friendlyError = (err, modelName) => {
  const msg = err.message || "";
  const status = err.status || err.statusCode || 0;

  if (status === 429 || msg.toLowerCase().includes("rate limit")) {
    return "Groq rate limit reached — please wait a moment and try again.";
  }
  if (
    status === 401 ||
    msg.toLowerCase().includes("invalid api key") ||
    msg.toLowerCase().includes("authentication") ||
    msg.toLowerCase().includes("unauthorized")
  ) {
    return "Groq API key is invalid. Please check your key configuration.";
  }
  if (status === 404 || msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("does not exist")) {
    return `AI model "${modelName}" was not found on Groq Servers. Groq may not support this specific model natively.`;
  }
  if (
    status === 503 ||
    msg.toLowerCase().includes("overloaded") ||
    msg.toLowerCase().includes("unavailable")
  ) {
    return "Groq service is temporarily overloaded. Please try again in a few seconds.";
  }
  if (status === 400 || msg.toLowerCase().includes("billing") || msg.toLowerCase().includes("invalid request")) {
    return "Groq network request failed. Check API payload mapping bounds layout or permissions.";
  }
  return "AI generation failed. Please try again later.";
};

/**
 * Groq provider — implements the AIProvider interface.
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
    const apiKey = customApiKey || env.GROQ_API_KEY;
    if (!apiKey) throw new Error("API key is not configured for Groq");

    const openai = customApiKey ? new OpenAI({ 
      baseURL: "https://api.groq.com/openai/v1",
      apiKey,
    }) : getClient();
    
    const modelName = modelOverride || env.GROQ_MODEL || "llama-3.3-70b-versatile";

    const formattedMessages = [
      {
        role: "system",
        content: systemPrompt || "You are ChitGPT, a helpful AI assistant built precisely entirely for efficiency.",
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
    console.error("[Groq] Stream error:", err.message);
    const modelName = modelOverride || env.GROQ_MODEL;
    const wrapped = new Error(friendlyError(err, modelName));
    wrapped.originalError = err;
    onError(wrapped);
  }
};

/**
 * Non-streaming fallback
 */
const generate = async ({
  messages,
  systemPrompt,
  customApiKey,
  model: modelOverride,
}) => {
  const apiKey = customApiKey || env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured");

  const openai = customApiKey ? new OpenAI({ 
    baseURL: "https://api.groq.com/openai/v1",
    apiKey,
  }) : getClient();
  const modelName = modelOverride || env.GROQ_MODEL || "llama-3.3-70b-versatile";

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
