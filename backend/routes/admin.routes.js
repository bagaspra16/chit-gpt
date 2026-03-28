'use strict';

const express = require('express');
const { z } = require('zod');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');
const { validateBody, validateQuery } = require('../middleware/validate.middleware');
const adminController = require('../controllers/admin.controller');

const router = express.Router();

// All admin routes require auth + admin role
router.use(requireAuth, requireAdmin);

// ── Dashboard ──────────────────────────────────────────────
router.get('/dashboard', adminController.getDashboard);

// ── Users ──────────────────────────────────────────────────
const getUsersQuery = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  search: z.string().optional(),
});
router.get('/users', validateQuery(getUsersQuery), adminController.getUsers);
router.get('/users/:userId', adminController.getUserDetail);
router.patch('/users/:userId/toggle-admin', adminController.toggleUserAdmin);
router.delete('/users/:userId', adminController.deleteUser);

// ── Active Users ───────────────────────────────────────────
const activeUsersQuery = z.object({
  period: z.enum(['24h', '7d', '30d']).optional(),
});
router.get('/active-users', validateQuery(activeUsersQuery), adminController.getActiveUsers);

// ── Chats ──────────────────────────────────────────────────
const getChatsQuery = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  search: z.string().optional(),
  userId: z.string().uuid().optional(),
});
router.get('/chats', validateQuery(getChatsQuery), adminController.getChats);
router.get('/chats/:chatId/messages', adminController.getChatMessages);
router.delete('/chats/:chatId', adminController.deleteChat);

// ── AI Usage ───────────────────────────────────────────────
const aiUsageQuery = z.object({
  days: z.string().regex(/^\d+$/).optional(),
});
router.get('/ai-usage', validateQuery(aiUsageQuery), adminController.getAiUsage);

// ── Rate Limits ────────────────────────────────────────────
router.get('/rate-limits', adminController.getRateLimits);
const updateRateLimitsBody = z.object({
  api_max: z.number().int().min(1).max(100000).optional(),
  auth_max: z.number().int().min(1).max(10000).optional(),
  message_max: z.number().int().min(1).max(1000).optional(),
});
router.put('/rate-limits', validateBody(updateRateLimitsBody), adminController.updateRateLimits);

// ── Announcements ──────────────────────────────────────────
router.get('/announcements', adminController.getAnnouncements);
const createAnnouncementBody = z.object({
  title: z.string().min(1).max(500),
  content: z.string().min(1),
  type: z.enum(['info', 'warning', 'update', 'maintenance']).optional(),
});
router.post('/announcements', validateBody(createAnnouncementBody), adminController.createAnnouncement);
const updateAnnouncementBody = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().min(1).optional(),
  type: z.enum(['info', 'warning', 'update', 'maintenance']).optional(),
  is_active: z.boolean().optional(),
});
router.patch('/announcements/:id', validateBody(updateAnnouncementBody), adminController.updateAnnouncement);
router.delete('/announcements/:id', adminController.deleteAnnouncement);

// ── Email Blast ────────────────────────────────────────────
const emailBlastBody = z.object({
  subject: z.string().min(1).max(500),
  html: z.string().min(1),
  testEmail: z.string().email().optional(),
});
router.post('/email-blast', validateBody(emailBlastBody), adminController.sendEmailBlast);

module.exports = router;
