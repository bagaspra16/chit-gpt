"use strict";

const env = require("../config/env");

// Lazy-load cached provider instances for the default (env-configured) provider
let localaiProvider = null;
let geminiProvider = null;
let openaiProvider = null;
let groqProvider = null;

const getDefaultProvider = () => {
  const providerName = env.AI_PROVIDER;

  if (providerName === "openai") {
    if (!openaiProvider) openaiProvider = require("./openai.provider");
    return openaiProvider;
  }

  if (providerName === "groq") {
    if (!groqProvider) groqProvider = require("./groq.provider");
    return groqProvider;
  }

  if (providerName === "gemini") {
    if (!geminiProvider) geminiProvider = require("./gemini.provider");
    return geminiProvider;
  }

  // Default: LocalAI (self-hosted Phi-3 mini)
  if (!localaiProvider) localaiProvider = require("./localai.provider");
  return localaiProvider;
};

/**
 * Abstract AI provider interface.
 * Delegates to the configured provider (gemini/openai) based on env.AI_PROVIDER,
 * unless an override provider is specified via `aiProvider` option.
 *
 * @param {Object} opts
 * @param {Array<{role: 'user'|'assistant', content: string}>} opts.messages
 * @param {string}   [opts.systemPrompt]
 * @param {function(string): void} opts.onChunk       Called with each streamed text chunk
 * @param {function(string): void} opts.onComplete    Called with the full response when done
 * @param {function(Error): void}  opts.onError       Called on error
 * @param {string}   [opts.customApiKey]              Optional user-supplied API key
 * @param {string}   [opts.aiProvider]                Optional provider override ('localai' | 'gemini' | 'openai' | 'groq')
 * @param {string}   [opts.model]                     Optional model name override
 */
const streamCompletion = async (opts) => {
  const {
    customApiKey,
    aiProvider: overrideProvider,
    model: overrideModel,
    ...rest
  } = opts;

  // Determine which provider to use: explicit override > env default
  const providerName = overrideProvider || env.AI_PROVIDER;

  let provider;
  if (providerName === "openai") {
    provider = require("./openai.provider");
  } else if (providerName === "groq") {
    provider = require("./groq.provider");
  } else if (providerName === "gemini") {
    provider = require("./gemini.provider");
  } else {
    // Default: LocalAI (self-hosted Phi-3 mini)
    provider = require("./localai.provider");
  }

  return provider.generateStream({
    ...rest,
    customApiKey: customApiKey || null,
    model: overrideModel || null,
  });
};

/**
 * Non-streaming fallback completion.
 * Always uses the env-configured default provider (no per-request overrides needed here).
 *
 * @param {Object} opts
 * @param {Array<{role: string, content: string}>} opts.messages
 * @param {string}  [opts.systemPrompt]
 * @returns {Promise<string>}
 */
const completion = async (opts) => {
  const provider = getDefaultProvider();
  return provider.generate(opts);
};

module.exports = { streamCompletion, completion };
