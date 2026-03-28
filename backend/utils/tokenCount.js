'use strict';

/**
 * Rough token estimator — 1 token ≈ 4 characters (English text)
 * Good enough for sliding window budget. Not a BPE tokenizer.
 * @param {string} text
 * @returns {number}
 */
const estimateTokens = (text) => {
  if (!text || typeof text !== 'string') return 0;
  return Math.ceil(text.length / 4);
};

/**
 * Estimate total tokens for an array of message objects { role, content }
 * Adds ~4 tokens overhead per message for role framing
 * @param {Array<{role: string, content: string}>} messages
 * @returns {number}
 */
const estimateMessagesTokens = (messages) => {
  return messages.reduce((total, msg) => {
    return total + estimateTokens(msg.content) + 4;
  }, 0);
};

module.exports = { estimateTokens, estimateMessagesTokens };
