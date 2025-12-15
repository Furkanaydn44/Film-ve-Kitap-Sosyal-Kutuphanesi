// routes/activityRoutes.js
const express = require('express');
const router = express.Router();
const ActivityController = require('../controllers/activityController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const {
  activityIdParamValidator,
  addCommentValidator,
  commentIdParamValidator,
  paginationValidator,
  usernameParamValidator
} = require('../middleware/validators');

// ============================================
// FEED ROUTES
// ============================================

/**
 * @route   GET /api/activities/feed
 * @desc    Sosyal feed (takip edilenlerin aktiviteleri)
 * @access  Private
 */
router.get('/feed', authenticateToken, paginationValidator, ActivityController.getFeed);

/**
 * @route   GET /api/activities/global
 * @desc    Global feed (tüm aktiviteler)
 * @access  Public
 */
router.get('/global', paginationValidator, ActivityController.getGlobalFeed);

/**
 * @route   GET /api/activities/popular
 * @desc    Popüler aktiviteler
 * @access  Public
 */
router.get('/popular', paginationValidator, ActivityController.getPopularActivities);

// ============================================
// ACTIVITY DETAIL
// ============================================

/**
 * @route   GET /api/activities/:activityId
 * @desc    Aktivite detayı
 * @access  Public
 */
router.get('/:activityId', activityIdParamValidator, ActivityController.getActivityById);

/**
 * @route   DELETE /api/activities/:activityId
 * @desc    Aktiviteyi sil
 * @access  Private
 */
router.delete('/:activityId', authenticateToken, activityIdParamValidator, ActivityController.deleteActivity);

// ============================================
// ACTIVITY LIKES
// ============================================

/**
 * @route   POST /api/activities/:activityId/like
 * @desc    Aktiviteyi beğen
 * @access  Private
 */
router.post('/:activityId/like', authenticateToken, activityIdParamValidator, ActivityController.likeActivity);

/**
 * @route   DELETE /api/activities/:activityId/unlike
 * @desc    Beğeniyi kaldır
 * @access  Private
 */
router.delete('/:activityId/unlike', authenticateToken, activityIdParamValidator, ActivityController.unlikeActivity);

/**
 * @route   GET /api/activities/:activityId/likes
 * @desc    Aktiviteyi beğenenleri listele
 * @access  Public
 */
router.get('/:activityId/likes', activityIdParamValidator, paginationValidator, ActivityController.getActivityLikes);

// ============================================
// ACTIVITY COMMENTS
// ============================================

/**
 * @route   GET /api/activities/:activityId/comments
 * @desc    Aktivite yorumlarını getir
 * @access  Public (ama giriş yaptıysa beğeni durumu gösterir)
 */
router.get(
  '/:activityId/comments',
  activityIdParamValidator,
  paginationValidator,
  optionalAuth,
  ActivityController.getActivityComments
);

/**
 * @route   POST /api/activities/:activityId/comments
 * @desc    Aktiviteye yorum ekle
 * @access  Private
 */
router.post('/:activityId/comments', authenticateToken, addCommentValidator, ActivityController.addComment);

/**
 * @route   PUT /api/activities/comments/:commentId
 * @desc    Yorumu güncelle
 * @access  Private
 */
router.put('/comments/:commentId', authenticateToken, commentIdParamValidator, ActivityController.updateComment);

/**
 * @route   DELETE /api/activities/comments/:commentId
 * @desc    Yorumu sil
 * @access  Private
 */
router.delete('/comments/:commentId', authenticateToken, commentIdParamValidator, ActivityController.deleteComment);

// ============================================
// COMMENT LIKES
// ============================================

/**
 * @route   POST /api/activities/comments/:commentId/like
 * @desc    Yorumu beğen
 * @access  Private
 */
router.post('/comments/:commentId/like', authenticateToken, commentIdParamValidator, ActivityController.likeComment);

/**
 * @route   DELETE /api/activities/comments/:commentId/unlike
 * @desc    Yorum beğenisini kaldır
 * @access  Private
 */
router.delete('/comments/:commentId/unlike', authenticateToken, commentIdParamValidator, ActivityController.unlikeComment);

/**
 * @route   GET /api/activities/comments/:commentId/likes
 * @desc    Yorumu beğenenleri listele
 * @access  Public
 */
router.get('/comments/:commentId/likes', commentIdParamValidator, paginationValidator, ActivityController.getCommentLikes);

// ============================================
// USER ACTIVITY STATS
// ============================================

/**
 * @route   GET /api/activities/user/:username/stats
 * @desc    Kullanıcının aktivite istatistikleri
 * @access  Public
 */
router.get('/user/:username/stats', usernameParamValidator, ActivityController.getUserActivityStats);

/**
 * @route   GET /api/activities/my/liked
 * @desc    Beğendiğim aktiviteler
 * @access  Private
 */
router.get('/my/liked', authenticateToken, paginationValidator, ActivityController.getUserLikedActivities);

/**
 * @route   GET /api/activities/my/comments
 * @desc    Yorumlarım
 * @access  Private
 */
router.get('/my/comments', authenticateToken, paginationValidator, ActivityController.getUserRecentComments);

module.exports = router;