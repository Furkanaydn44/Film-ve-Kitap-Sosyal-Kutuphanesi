// routes/likeRoutes.js
const express = require('express');
const router = express.Router();
const LikeController = require('../controllers/likeController');
const { authenticateToken } = require('../middleware/auth');
const {
  activityIdParamValidator,
  commentIdParamValidator,
  paginationValidator
} = require('../middleware/validators');

// ============================================
// USER LIKE STATS
// ============================================

/**
 * @route   GET /api/likes/stats
 * @desc    Kullanıcının beğeni istatistikleri
 * @access  Private
 */
router.get('/stats', authenticateToken, LikeController.getUserLikeStats);

/**
 * @route   GET /api/likes/my/activities
 * @desc    Beğendiğim aktiviteler
 * @access  Private
 */
router.get('/my/activities', authenticateToken, paginationValidator, LikeController.getUserLikedActivities);

/**
 * @route   GET /api/likes/my/comments
 * @desc    Yorumlarım
 * @access  Private
 */
router.get('/my/comments', authenticateToken, paginationValidator, LikeController.getUserComments);

// ============================================
// LIKE STATUS CHECKS
// ============================================

/**
 * @route   GET /api/likes/activity/:activityId/status
 * @desc    Aktiviteyi beğendim mi?
 * @access  Private
 */
router.get('/activity/:activityId/status', authenticateToken, activityIdParamValidator, LikeController.checkActivityLike);

/**
 * @route   GET /api/likes/comment/:commentId/status
 * @desc    Yorumu beğendim mi?
 * @access  Private
 */
router.get('/comment/:commentId/status', authenticateToken, commentIdParamValidator, LikeController.checkCommentLike);

/**
 * @route   POST /api/likes/check-multiple
 * @desc    Birden fazla aktivitenin beğeni durumunu kontrol et
 * @access  Private
 */
router.post('/check-multiple', authenticateToken, LikeController.checkMultipleActivityLikes);

// ============================================
// LIKE COUNTS
// ============================================

/**
 * @route   GET /api/likes/activity/:activityId/count
 * @desc    Aktivite beğeni sayısı
 * @access  Public
 */
router.get('/activity/:activityId/count', activityIdParamValidator, LikeController.getActivityLikesCount);

/**
 * @route   GET /api/likes/comment/:commentId/count
 * @desc    Yorum beğeni sayısı
 * @access  Public
 */
router.get('/comment/:commentId/count', commentIdParamValidator, LikeController.getCommentLikesCount);

/**
 * @route   GET /api/likes/activity/:activityId/comments/count
 * @desc    Aktivite yorum sayısı
 * @access  Public
 */
router.get('/activity/:activityId/comments/count', activityIdParamValidator, LikeController.getActivityCommentsCount);

// ============================================
// CLEANUP (Advanced - Admin/User)
// ============================================

/**
 * @route   DELETE /api/likes/my/all
 * @desc    Tüm beğenilerimi sil
 * @access  Private
 */
router.delete('/my/all', authenticateToken, LikeController.deleteAllUserLikes);

/**
 * @route   DELETE /api/likes/my/comments/all
 * @desc    Tüm yorumlarımı sil
 * @access  Private
 */
router.delete('/my/comments/all', authenticateToken, LikeController.deleteAllUserComments);

module.exports = router;