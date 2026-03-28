-- ============================================================
-- ChitGPT Database Schema
-- Run this in your Supabase SQL Editor (or any PostgreSQL client)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email                  VARCHAR(255) UNIQUE,
  password_hash          TEXT,
  is_guest               BOOLEAN     NOT NULL DEFAULT FALSE,
  is_verified            BOOLEAN     NOT NULL DEFAULT FALSE,
  verification_token     TEXT,
  verification_expires_at TIMESTAMPTZ,
  guest_expires_at       TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);

-- ============================================================
-- CHATS
-- ============================================================
CREATE TABLE IF NOT EXISTS chats (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(500) NOT NULL DEFAULT 'New Chat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chats_user_id    ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON chats(user_id, updated_at DESC);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_chats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chats_updated_at ON chats;
CREATE TRIGGER trg_chats_updated_at
  BEFORE UPDATE ON chats
  FOR EACH ROW EXECUTE FUNCTION update_chats_updated_at();

-- ============================================================
-- MESSAGES
-- Stored as individual rows — NOT a JSON blob
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id    UUID        NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  role       VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content    TEXT        NOT NULL,
  metadata   JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_chat_id    ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(chat_id, created_at ASC);

-- ============================================================
-- HELPER: Update chat updated_at when message is inserted
-- ============================================================
CREATE OR REPLACE FUNCTION update_chat_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chats SET updated_at = NOW() WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_message_updates_chat ON messages;
CREATE TRIGGER trg_message_updates_chat
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_chat_on_message();

-- ============================================================
-- ADMIN: is_admin column on users
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================================
-- ANNOUNCEMENTS (admin notices to users)
-- ============================================================
CREATE TABLE IF NOT EXISTS announcements (
  id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  title      VARCHAR(500)  NOT NULL,
  content    TEXT          NOT NULL,
  type       VARCHAR(20)   NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'update', 'maintenance')),
  is_active  BOOLEAN       NOT NULL DEFAULT TRUE,
  created_by UUID          REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active, created_at DESC);

-- ============================================================
-- AI USAGE TRACKING
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_usage (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID          REFERENCES users(id) ON DELETE SET NULL,
  provider      VARCHAR(20)   NOT NULL,
  model         VARCHAR(100)  NOT NULL,
  tokens_in     INTEGER       NOT NULL DEFAULT 0,
  tokens_out    INTEGER       NOT NULL DEFAULT 0,
  latency_ms    INTEGER,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id    ON ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_provider   ON ai_usage(provider, created_at DESC);
