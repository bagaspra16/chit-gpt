'use strict';

const db = require('../config/db');
const emailService = require('../services/email.service');
const response = require('../utils/response');

// ────────────────────────────────────────────────────────────
// DASHBOARD STATS
// ────────────────────────────────────────────────────────────

const getDashboard = async (req, res) => {
  try {
    const [usersResult, chatsResult, messagesResult, aiUsageResult, activeResult] =
      await Promise.all([
        db.query('SELECT COUNT(*) as total FROM users'),
        db.query('SELECT COUNT(*) as total FROM chats'),
        db.query('SELECT COUNT(*) as total FROM messages'),
        db.query('SELECT COUNT(*) as total FROM ai_usage'),
        db.query(
          `SELECT COUNT(*) as total FROM users 
           WHERE created_at > NOW() - INTERVAL '7 days'`,
        ),
      ]);

    const providerResult = await db.query(`
      SELECT provider, COUNT(*) as count, 
             COALESCE(SUM(tokens_in), 0) as total_tokens_in,
             COALESCE(SUM(tokens_out), 0) as total_tokens_out
      FROM ai_usage 
      GROUP BY provider
    `);

    const recentActivityResult = await db.query(`
      SELECT DATE(created_at) as date, COUNT(*) as messages
      FROM messages
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    return response.success(res, {
      stats: {
        totalUsers: parseInt(usersResult.rows[0].total, 10),
        totalChats: parseInt(chatsResult.rows[0].total, 10),
        totalMessages: parseInt(messagesResult.rows[0].total, 10),
        totalAiRequests: parseInt(aiUsageResult.rows[0].total, 10),
        activeUsersWeek: parseInt(activeResult.rows[0].total, 10),
      },
      providerBreakdown: providerResult.rows,
      activityByDay: recentActivityResult.rows,
    });
  } catch (err) {
    console.error('[Admin] Dashboard Error:', err);
    return response.error(res, 'Failed to load dashboard');
  }
};

// ────────────────────────────────────────────────────────────
// USER MANAGEMENT
// ────────────────────────────────────────────────────────────

const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let queryText = `
      SELECT u.id, u.email, u.is_guest, u.is_verified, u.is_admin, u.created_at,
             COUNT(DISTINCT c.id) as chat_count,
             COUNT(DISTINCT m.id) as message_count
      FROM users u
      LEFT JOIN chats c ON c.user_id = u.id
      LEFT JOIN messages m ON m.chat_id = c.id
    `;
    const params = [];

    if (search) {
      queryText += ` WHERE u.email ILIKE $1`;
      params.push(`%${search}%`);
    }

    queryText += ` GROUP BY u.id ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit, 10), offset);

    const result = await db.query(queryText, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM users';
    const countParams = [];
    if (search) {
      countQuery += ' WHERE email ILIKE $1';
      countParams.push(`%${search}%`);
    }
    const countResult = await db.query(countQuery, countParams);

    return response.success(res, {
      users: result.rows,
      total: parseInt(countResult.rows[0].total, 10),
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  } catch (err) {
    console.error('[Admin] Get Users Error:', err);
    return response.error(res, 'Failed to fetch users');
  }
};

const getUserDetail = async (req, res) => {
  try {
    const { userId } = req.params;

    const userResult = await db.query(
      `SELECT id, email, is_guest, is_verified, is_admin, created_at,
              guest_expires_at
       FROM users WHERE id = $1`,
      [userId],
    );

    if (userResult.rowCount === 0) {
      return response.notFound(res, 'User not found');
    }

    const chatsResult = await db.query(
      'SELECT id, title, created_at, updated_at FROM chats WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 20',
      [userId],
    );

    const usageResult = await db.query(
      `SELECT provider, model, COUNT(*) as count,
              COALESCE(SUM(tokens_in), 0) as tokens_in,
              COALESCE(SUM(tokens_out), 0) as tokens_out
       FROM ai_usage WHERE user_id = $1
       GROUP BY provider, model`,
      [userId],
    );

    return response.success(res, {
      user: userResult.rows[0],
      recentChats: chatsResult.rows,
      aiUsage: usageResult.rows,
    });
  } catch (err) {
    console.error('[Admin] Get User Detail Error:', err);
    return response.error(res, 'Failed to fetch user detail');
  }
};

const toggleUserAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user.id) {
      return response.error(res, 'Cannot modify your own admin status', 400);
    }

    const result = await db.query(
      'UPDATE users SET is_admin = NOT is_admin WHERE id = $1 RETURNING id, email, is_admin',
      [userId],
    );

    if (result.rowCount === 0) {
      return response.notFound(res, 'User not found');
    }

    return response.success(res, { user: result.rows[0] }, 'Admin status toggled');
  } catch (err) {
    console.error('[Admin] Toggle Admin Error:', err);
    return response.error(res, 'Failed to toggle admin status');
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user.id) {
      return response.error(res, 'Cannot delete your own account', 400);
    }

    const result = await db.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [userId],
    );

    if (result.rowCount === 0) {
      return response.notFound(res, 'User not found');
    }

    return response.success(res, null, 'User deleted');
  } catch (err) {
    console.error('[Admin] Delete User Error:', err);
    return response.error(res, 'Failed to delete user');
  }
};

// ────────────────────────────────────────────────────────────
// CHAT & MESSAGE VIEWING
// ────────────────────────────────────────────────────────────

const getChats = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', userId } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let queryText = `
      SELECT c.id, c.title, c.created_at, c.updated_at,
             u.email as user_email, u.id as user_id,
             (SELECT COUNT(*) FROM messages WHERE chat_id = c.id) as message_count
      FROM chats c
      JOIN users u ON u.id = c.user_id
    `;
    const conditions = [];
    const params = [];

    if (userId) {
      conditions.push(`c.user_id = $${params.length + 1}`);
      params.push(userId);
    }
    if (search) {
      conditions.push(`(c.title ILIKE $${params.length + 1} OR u.email ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }

    queryText += ` ORDER BY c.updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit, 10), offset);

    const result = await db.query(queryText, params);

    return response.success(res, { chats: result.rows });
  } catch (err) {
    console.error('[Admin] Get Chats Error:', err);
    return response.error(res, 'Failed to fetch chats');
  }
};

const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit = 50, before } = req.query;

    let queryText = `
      SELECT id, role, content, metadata, created_at 
      FROM messages WHERE chat_id = $1
    `;
    const params = [chatId];

    if (before) {
      queryText += ` AND created_at < $${params.length + 1}`;
      params.push(before);
    }

    queryText += ` ORDER BY created_at ASC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit, 10));

    const result = await db.query(queryText, params);

    const chatResult = await db.query(
      'SELECT c.title, u.email FROM chats c JOIN users u ON u.id = c.user_id WHERE c.id = $1',
      [chatId],
    );

    return response.success(res, {
      chat: chatResult.rows[0] || null,
      messages: result.rows,
    });
  } catch (err) {
    console.error('[Admin] Get Chat Messages Error:', err);
    return response.error(res, 'Failed to fetch chat messages');
  }
};

const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const result = await db.query(
      'DELETE FROM chats WHERE id = $1 RETURNING id',
      [chatId],
    );
    if (result.rowCount === 0) {
      return response.notFound(res, 'Chat not found');
    }
    return response.success(res, null, 'Chat deleted');
  } catch (err) {
    console.error('[Admin] Delete Chat Error:', err);
    return response.error(res, 'Failed to delete chat');
  }
};

// ────────────────────────────────────────────────────────────
// AI USAGE
// ────────────────────────────────────────────────────────────

const getAiUsage = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const usageResult = await db.query(`
      SELECT DATE(created_at) as date, provider,
             COUNT(*) as requests,
             COALESCE(SUM(tokens_in), 0) as tokens_in,
             COALESCE(SUM(tokens_out), 0) as tokens_out,
             COALESCE(AVG(latency_ms), 0)::INTEGER as avg_latency
      FROM ai_usage
      WHERE created_at > NOW() - INTERVAL '${parseInt(days, 10)} days'
      GROUP BY DATE(created_at), provider
      ORDER BY date ASC
    `);

    const modelResult = await db.query(`
      SELECT model, provider, COUNT(*) as requests,
             COALESCE(SUM(tokens_in + tokens_out), 0) as total_tokens
      FROM ai_usage
      WHERE created_at > NOW() - INTERVAL '${parseInt(days, 10)} days'
      GROUP BY model, provider
      ORDER BY requests DESC
      LIMIT 20
    `);

    const totalResult = await db.query(`
      SELECT COUNT(*) as total_requests,
             COALESCE(SUM(tokens_in), 0) as total_tokens_in,
             COALESCE(SUM(tokens_out), 0) as total_tokens_out,
             COALESCE(AVG(latency_ms), 0)::INTEGER as avg_latency
      FROM ai_usage
      WHERE created_at > NOW() - INTERVAL '${parseInt(days, 10)} days'
    `);

    return response.success(res, {
      dailyUsage: usageResult.rows,
      modelBreakdown: modelResult.rows,
      totals: totalResult.rows[0],
    });
  } catch (err) {
    console.error('[Admin] Get AI Usage Error:', err);
    return response.error(res, 'Failed to fetch AI usage');
  }
};

// ────────────────────────────────────────────────────────────
// RATE LIMITS (read from env, configurable via DB in future)
// ────────────────────────────────────────────────────────────

const getRateLimits = async (req, res) => {
  try {
    // Read current rate limit values from env/config
    // These are the defaults from the rate limiter middleware
    const limits = {
      api: { windowMs: 15 * 60 * 1000, max: 1000, label: 'General API' },
      auth: { windowMs: 15 * 60 * 1000, max: 100, label: 'Authentication' },
      message: { windowMs: 60 * 1000, max: 30, label: 'Message Streaming' },
    };

    // Check if we have stored overrides in DB
    try {
      const storedResult = await db.query(
        `SELECT * FROM rate_limits WHERE id = 'default'`,
      );
      if (storedResult.rowCount > 0) {
        const stored = storedResult.rows[0];
        if (stored.api_max) limits.api.max = stored.api_max;
        if (stored.auth_max) limits.auth.max = stored.auth_max;
        if (stored.message_max) limits.message.max = stored.message_max;
      }
    } catch {
      // rate_limits table may not exist yet, use defaults
    }

    return response.success(res, { limits });
  } catch (err) {
    console.error('[Admin] Get Rate Limits Error:', err);
    return response.error(res, 'Failed to fetch rate limits');
  }
};

const updateRateLimits = async (req, res) => {
  try {
    const { api_max, auth_max, message_max } = req.body;

    // Ensure table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        id          VARCHAR(20) PRIMARY KEY DEFAULT 'default',
        api_max     INTEGER NOT NULL DEFAULT 1000,
        auth_max    INTEGER NOT NULL DEFAULT 100,
        message_max INTEGER NOT NULL DEFAULT 30,
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await db.query(
      `INSERT INTO rate_limits (id, api_max, auth_max, message_max)
       VALUES ('default', $1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET
         api_max = COALESCE($1, rate_limits.api_max),
         auth_max = COALESCE($2, rate_limits.auth_max),
         message_max = COALESCE($3, rate_limits.message_max),
         updated_at = NOW()`,
      [api_max || 1000, auth_max || 100, message_max || 30],
    );

    return response.success(res, null, 'Rate limits updated. Restart server to apply.');
  } catch (err) {
    console.error('[Admin] Update Rate Limits Error:', err);
    return response.error(res, 'Failed to update rate limits');
  }
};

// ────────────────────────────────────────────────────────────
// ANNOUNCEMENTS
// ────────────────────────────────────────────────────────────

const getAnnouncements = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT a.*, u.email as creator_email
       FROM announcements a
       LEFT JOIN users u ON u.id = a.created_by
       ORDER BY a.created_at DESC`,
    );
    return response.success(res, { announcements: result.rows });
  } catch (err) {
    console.error('[Admin] Get Announcements Error:', err);
    return response.error(res, 'Failed to fetch announcements');
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const { title, content, type = 'info' } = req.body;

    const result = await db.query(
      `INSERT INTO announcements (title, content, type, created_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, content, type, req.user.id],
    );

    return response.success(res, { announcement: result.rows[0] }, 'Announcement created', 201);
  } catch (err) {
    console.error('[Admin] Create Announcement Error:', err);
    return response.error(res, 'Failed to create announcement');
  }
};

const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, type, is_active } = req.body;

    const result = await db.query(
      `UPDATE announcements 
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           type = COALESCE($3, type),
           is_active = COALESCE($4, is_active),
           updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [title, content, type, is_active, id],
    );

    if (result.rowCount === 0) {
      return response.notFound(res, 'Announcement not found');
    }

    return response.success(res, { announcement: result.rows[0] }, 'Announcement updated');
  } catch (err) {
    console.error('[Admin] Update Announcement Error:', err);
    return response.error(res, 'Failed to update announcement');
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM announcements WHERE id = $1 RETURNING id',
      [id],
    );
    if (result.rowCount === 0) {
      return response.notFound(res, 'Announcement not found');
    }
    return response.success(res, null, 'Announcement deleted');
  } catch (err) {
    console.error('[Admin] Delete Announcement Error:', err);
    return response.error(res, 'Failed to delete announcement');
  }
};

// ────────────────────────────────────────────────────────────
// EMAIL AUTOMATION
// ────────────────────────────────────────────────────────────

const sendEmailBlast = async (req, res) => {
  try {
    const { subject, html, testEmail } = req.body;

    // If testEmail is provided, only send to that email
    if (testEmail) {
      await emailService.sendUpdateEmail(testEmail, subject, html);
      return response.success(res, { sent: 1 }, 'Test email sent');
    }

    // Get all verified, non-guest users with emails
    const usersResult = await db.query(
      `SELECT email FROM users 
       WHERE is_verified = true AND is_guest = false AND email IS NOT NULL`,
    );

    let sent = 0;
    let failed = 0;

    for (const user of usersResult.rows) {
      try {
        await emailService.sendUpdateEmail(user.email, subject, html);
        sent++;
      } catch (err) {
        console.error(`[Admin] Failed to send email to ${user.email}:`, err.message);
        failed++;
      }
    }

    return response.success(res, { sent, failed, total: usersResult.rowCount }, 'Email blast complete');
  } catch (err) {
    console.error('[Admin] Email Blast Error:', err);
    return response.error(res, 'Failed to send email blast');
  }
};

// ────────────────────────────────────────────────────────────
// ACTIVE USERS (real-time / recent activity)
// ────────────────────────────────────────────────────────────

const getActiveUsers = async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const intervalMap = { '24h': '1 day', '7d': '7 days', '30d': '30 days' };
    const interval = intervalMap[period] || '7 days';

    const result = await db.query(`
      SELECT u.id, u.email, u.is_guest, u.created_at,
             COUNT(DISTINCT c.id) as chats_created,
             COUNT(m.id) as messages_sent
      FROM users u
      LEFT JOIN chats c ON c.user_id = u.id AND c.created_at > NOW() - INTERVAL '${interval}'
      LEFT JOIN messages m ON m.chat_id = c.id AND m.role = 'user' AND m.created_at > NOW() - INTERVAL '${interval}'
      WHERE u.created_at > NOW() - INTERVAL '${interval}'
         OR EXISTS (
           SELECT 1 FROM chats cc 
           JOIN messages mm ON mm.chat_id = cc.id 
           WHERE cc.user_id = u.id AND mm.created_at > NOW() - INTERVAL '${interval}'
         )
      GROUP BY u.id
      HAVING COUNT(m.id) > 0
      ORDER BY messages_sent DESC
      LIMIT 50
    `);

    return response.success(res, { users: result.rows, period });
  } catch (err) {
    console.error('[Admin] Get Active Users Error:', err);
    return response.error(res, 'Failed to fetch active users');
  }
};

module.exports = {
  getDashboard,
  getUsers,
  getUserDetail,
  toggleUserAdmin,
  deleteUser,
  getChats,
  getChatMessages,
  deleteChat,
  getAiUsage,
  getRateLimits,
  updateRateLimits,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  sendEmailBlast,
  getActiveUsers,
};
