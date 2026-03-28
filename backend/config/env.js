"use strict";

require("dotenv").config();

const required = (key) => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
};

const optional = (key, fallback) => process.env[key] || fallback;

const env = {
  PORT: parseInt(optional("PORT", "3001"), 10),
  NODE_ENV: optional("NODE_ENV", "development"),

  // Database
  DATABASE_URL: required("DATABASE_URL"),

  // JWT
  JWT_SECRET: required("JWT_SECRET"),
  JWT_EXPIRES_IN: optional("JWT_EXPIRES_IN", "7d"),

  // Email
  SMTP_HOST: optional("SMTP_HOST", "smtp.gmail.com"),
  SMTP_PORT: parseInt(optional("SMTP_PORT", "587"), 10),
  SMTP_USER: optional("SMTP_USER", ""),
  SMTP_PASS: optional("SMTP_PASS", ""),
  EMAIL_FROM: optional("EMAIL_FROM", "ChitGPT <noreply@chitgpt.com>"),

  // AI Providers
  GEMINI_API_KEY: optional("GEMINI_API_KEY", ""),
  GEMINI_MODEL: optional("GEMINI_MODEL", "gemini-2.5-flash"),
  OPENAI_API_KEY: optional("OPENAI_API_KEY", ""),
  OPENAI_MODEL: optional("OPENAI_MODEL", "gpt-4o-mini"),
  GROQ_API_KEY: optional("GROQ_API_KEY", ""),
  GROQ_MODEL: optional("GROQ_MODEL", "llama-3.3-70b-versatile"),
  AI_PROVIDER: optional("AI_PROVIDER", "gemini"),

  // App
  FRONTEND_URL: optional("FRONTEND_URL", "http://localhost:3000"),
};

module.exports = env;
