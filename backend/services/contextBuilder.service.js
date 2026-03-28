'use strict';

const { estimateMessagesTokens } = require('../utils/tokenCount');

// Maximum tokens to send in context (leaves room for the model's output)
const MAX_CONTEXT_TOKENS = 6000;

// System prompt injected at the start of every request
const SYSTEM_PROMPT = `You are ChitGPT, an intelligent AI assistant. You are helpful, concise, and accurate. 
Format responses using Markdown when appropriate (code blocks, lists, etc.).
Be direct — avoid unnecessary preamble.`;

/**
 * Build a token-limited sliding window context from chat history.
 *
 * Strategy:
 * 1. Always include the current user message (last message)
 * 2. Walk backwards through history, adding messages until token budget is full
 * 3. Newer messages take priority over older ones
 * 4. Enforce alternating user/assistant roles (required by some providers)
 *
 * @param {Array<{role: string, content: string, created_at: string}>} history - All messages from DB, oldest first
 * @param {string} currentInput - The new user message content
 * @returns {{ messages: Array<{role: string, content: string}>, systemPrompt: string }}
 */
const buildContext = (history, currentInput) => {
  const currentMessage = { role: 'user', content: currentInput };
  let tokenBudget = MAX_CONTEXT_TOKENS - estimateMessagesTokens([currentMessage]);

  // Walk history in reverse (newest first), accumulate until budget exhausted
  const windowMessages = [];
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    // Only include user and assistant messages in context
    if (msg.role !== 'user' && msg.role !== 'assistant') continue;

    const msgTokens = estimateMessagesTokens([msg]);
    if (tokenBudget - msgTokens < 0) break;

    windowMessages.unshift({ role: msg.role, content: msg.content });
    tokenBudget -= msgTokens;
  }

  // Append current user message at end
  windowMessages.push(currentMessage);

  return {
    messages: windowMessages,
    systemPrompt: SYSTEM_PROMPT,
  };
};

/**
 * Generate a short chat title from the first user message
 * Truncates to 60 chars, strips newlines
 * @param {string} firstMessage
 * @returns {string}
 */
const generateChatTitle = (firstMessage) => {
  if (!firstMessage) return 'New Chat';
  const cleaned = firstMessage.replace(/\n/g, ' ').trim();
  return cleaned.length > 60 ? cleaned.substring(0, 57) + '...' : cleaned;
};

module.exports = { buildContext, generateChatTitle, SYSTEM_PROMPT };
