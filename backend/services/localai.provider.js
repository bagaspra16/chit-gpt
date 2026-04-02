"use strict";

const env = require("../config/env");

const LOCAL_AI_BASE_URL =
  env.LOCAL_AI_BASE_URL ||
  "https://noneleemosynary-subumbellated-yuonne.ngrok-free.dev";

const LOCAL_AI_MODEL = "Phi-3-mini-4k-instruct.Q4_0.gguf";

const friendlyError = (err) => {
  const msg = (err.message || "").toLowerCase();
  const status = err.status || err.statusCode || 0;

  if (
    msg.includes("econnrefused") ||
    msg.includes("fetch failed") ||
    msg.includes("enotfound") ||
    msg.includes("socket hang up") ||
    msg.includes("aborted")
  ) {
    return "Local AI is unreachable. Please check the server is running.";
  }
  if (msg.includes("timeout") || msg.includes("timed out")) {
    return "Local AI timed out — the model is busy or the server is slow. Please try again.";
  }
  if (status === 429 || msg.includes("rate limit")) {
    return "Local AI rate limit reached — please wait a moment and try again.";
  }
  return `Local AI generation failed (${status || err.message || "unknown error"}). Please try again.`;
};

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
 * generateStream uses NATIVE fetch to connect to LocalAI with streaming enabled.
 * Since the external AI can be extremely slow on CPU, we emit an empty chunk `""`
 * every 15 seconds to prevent the SSE proxy/browser client from closing an idle connection.
 */
const generateStream = async ({
  messages,
  systemPrompt,
  onChunk,
  onComplete,
  onError,
  model: modelOverride,
}) => {
  let timerId = null;
  const controller = new AbortController();

  try {
    const modelName = modelOverride || LOCAL_AI_MODEL;
    
    // Start keep-alive ping loop to prevent Vercel/browser idle disconnects
    timerId = setInterval(() => {
      onChunk(""); // Send empty chunk (ignored by frontend) to keep SSE active
    }, 15000);

    const body = JSON.stringify({
      model: modelName,
      messages: buildMessages(
        messages,
        systemPrompt || "You are ChitGPT, a helpful and concise AI assistant."
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
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw Object.assign(new Error(`HTTP ${response.status}: ${text}`), {
        status: response.status,
      });
    }

    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

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
            // Ignore non-JSON
          }
        }
      }
      clearInterval(timerId);
      onComplete(fullText);
    } else {
      throw new Error("Local AI Stream returned no body");
    }
  } catch (err) {
    if (timerId) clearInterval(timerId);
    
    // If the client aborted the stream
    if (err.name === "AbortError") {
       throw err; 
    }
    
    console.error("[LocalAI] Error:", err.message);
    const wrapped = new Error(friendlyError(err));
    wrapped.originalError = err;
    onError(wrapped);
  }
};

const generate = async ({ messages, systemPrompt, model: modelOverride }) => {
  const modelName = modelOverride || LOCAL_AI_MODEL;
  const body = JSON.stringify({
    model: modelName,
    messages: buildMessages(messages, systemPrompt || "You are ChitGPT, a helpful and concise AI assistant."),
    max_tokens: 512,
    temperature: 0.7,
    stream: false,
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
    throw Object.assign(new Error(`HTTP ${response.status}: ${text}`), { status: response.status });
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
};

module.exports = { generateStream, generate };
