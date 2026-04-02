"use strict";

/**
 * LocalAI provider — Self-hosted Phi-3 mini via GPT4All
 * API: https://noneleemosynary-subumbellated-yuonne.ngrok-free.dev
 *
 * Implements the AIProvider interface (generateStream + generate).
 * No API key required — free, self-hosted, always available.
 */

const LOCAL_AI_BASE_URL =
  process.env.LOCAL_AI_BASE_URL ||
  "https://noneleemosynary-subumbellated-yuonne.ngrok-free.dev";

const LOCAL_AI_MODEL = "Phi-3-mini-4k-instruct.Q4_0.gguf"; // returned by /v1/models

/**
 * Map a fetch/network error to a friendly user-facing message.
 */
const friendlyError = (err) => {
  const msg = err.message || "";
  if (
    msg.toLowerCase().includes("failed to fetch") ||
    msg.toLowerCase().includes("econnrefused") ||
    msg.toLowerCase().includes("network") ||
    msg.toLowerCase().includes("fetch")
  ) {
    return "Local AI service is unreachable. Please check your network or try another provider.";
  }
  if (msg.includes("429") || msg.toLowerCase().includes("rate")) {
    return "Local AI rate limit reached — please wait a moment and try again.";
  }
  if (msg.includes("422")) {
    return "Local AI rejected the request. Please try again.";
  }
  return "Local AI generation failed. Please try again.";
};

/**
 * Build the messages array for the /v1/chat/completions endpoint.
 * The API uses OpenAI-compatible format: {role, content}[]
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
 * Streaming completion — calls POST /v1/chat/completions with stream: true.
 * Falls back to non-streaming if SSE is not supported.
 */
const generateStream = async ({
  messages,
  systemPrompt,
  onChunk,
  onComplete,
  onError,
  // customApiKey and model are accepted but LocalAI doesn't need an API key
  model: modelOverride,
}) => {
  const modelName = modelOverride || LOCAL_AI_MODEL;

  try {
    const body = JSON.stringify({
      messages: buildMessages(
        messages,
        systemPrompt ||
          "You are ChitGPT, a helpful and concise AI assistant. Powered by a local Phi-3 mini model."
      ),
      max_tokens: 512,
      temperature: 0.7,
      stream: true,
    });

    const response = await fetch(`${LOCAL_AI_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`LocalAI HTTP ${response.status}: ${text}`);
    }

    // Parse SSE stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // keep incomplete line

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") break;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content || "";
          if (delta) {
            fullText += delta;
            onChunk(delta);
          }
        } catch {
          // non-JSON line — skip
        }
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
 * Non-streaming fallback — calls POST /v1/chat/completions with stream: false.
 */
const generate = async ({
  messages,
  systemPrompt,
  model: modelOverride,
}) => {
  const modelName = modelOverride || LOCAL_AI_MODEL;

  const response = await fetch(`${LOCAL_AI_BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify({
      messages: buildMessages(
        messages,
        systemPrompt ||
          "You are ChitGPT, a helpful and concise AI assistant. Powered by a local Phi-3 mini model."
      ),
      max_tokens: 512,
      temperature: 0.7,
      stream: false,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`LocalAI HTTP ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
};

module.exports = { generateStream, generate };
