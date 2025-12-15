const express = require('express');
const router = express.Router();
const CollectionController = require('../controllers/collectionController');
const { authenticateToken } = require('../middleware/auth');
const {
  ratingValidator,
  createReviewValidator,
  updateReviewValidator,
  addToWatchlistValidator,
  updateWatchlistStatusValidator,
  mediaIdParamValidator,
  paginationValidator,
  idParamValidator,
  userIdParamValidator
} = require('../middleware/validators');

// ============================================
// RATING ROUTES
// ============================================

router.post('/rate', authenticateToken, ratingValidator, CollectionController.rateMedia);

router.delete('/rate/:mediaId', authenticateToken, mediaIdParamValidator, CollectionController.deleteRating);

router.get('/rating-distribution/:mediaId', mediaIdParamValidator, CollectionController.getRatingDistribution);

// ============================================
// REVIEW ROUTES
// ============================================

// Yorum Ekle
router.post('/review', authenticateToken, createReviewValidator, CollectionController.createReview);

// Yorum Güncelle (Validator 'reviewId' bekliyorsa burası kalabilir, ama standart :id yapmak iyidir)
// Eğer updateReviewValidator içinde param('reviewId') varsa burası :reviewId kalmalı.
router.put('/review/:reviewId', authenticateToken, updateReviewValidator, CollectionController.updateReview);

// 🔥 DÜZELTME 1: Silme işlemi için :id kullanıyoruz (idParamValidator ile uyumlu olsun diye)
router.delete('/review/:id', authenticateToken, idParamValidator, CollectionController.deleteReview);

// 🔥 DÜZELTME 2: Beğeni işlemleri için :id kullanıyoruz
router.post('/review/:id/like', authenticateToken, idParamValidator, CollectionController.likeReview);

// 🔥 DÜZELTME 3: Beğeni kaldırma için :id kullanıyoruz
router.delete('/review/:id/unlike', authenticateToken, idParamValidator, CollectionController.unlikeReview);

// ============================================
// WATCHLIST ROUTES
// ============================================

router.post('/watchlist', authenticateToken, addToWatchlistValidator, CollectionController.addToWatchlist);

router.put(
  '/watchlist/:mediaId',
  authenticateToken,
  updateWatchlistStatusValidator,
  CollectionController.updateWatchlistStatus
);

router.delete('/watchlist/:mediaId', authenticateToken, mediaIdParamValidator, CollectionController.removeFromWatchlist);

router.get('/watchlist/stats', authenticateToken, CollectionController.getWatchlistStats);

router.get('/watchlist/completed', authenticateToken, paginationValidator, CollectionController.getCompletedItems);

router.post('/watchlist/bulk', authenticateToken, CollectionController.bulkAddToWatchlist);

// ============================================
// RECOMMENDATIONS & STATS
// ============================================

router.get('/recommendations', authenticateToken, paginationValidator, CollectionController.getRecommendations);

router.get('/stats', authenticateToken, CollectionController.getUserCollectionStats);

router.get('/common/ratings/:userId2', authenticateToken, userIdParamValidator, CollectionController.getCommonRatings);

router.get('/common/watchlist/:userId2', authenticateToken, userIdParamValidator, CollectionController.getCommonWatchlist);

module.exports = router;