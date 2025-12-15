// routes/mediaRoutes.js
const express = require('express');
const router = express.Router();
const MediaController = require('../controllers/mediaController');
const { optionalAuth } = require('../middleware/auth');
const {
  searchQueryValidator,
  fetchMediaValidator,
  paginationValidator,
  // mediaIdParamValidator <-- Bunu detay için kullanmıyoruz!
} = require('../middleware/validators');

/**
 * @route   GET /api/media/search
 * @desc    Media ara (veritabanında)
 * @access  Public
 */
router.get('/search', searchQueryValidator, MediaController.searchMedia);

/**
 * @route   GET /api/media/search/tmdb
 * @desc    TMDB'de film ara (canlı API)
 * @access  Public
 */
router.get('/search/tmdb', searchQueryValidator, MediaController.searchTMDB);

/**
 * @route   GET /api/media/search/books
 * @desc    Google Books'ta kitap ara (canlı API)
 * @access  Public
 */
router.get('/search/books', searchQueryValidator, MediaController.searchGoogleBooks);

/**
 * @route   POST /api/media/fetch
 * @desc    API'den media çek ve veritabanına kaydet
 * @access  Public
 */
router.post('/fetch', fetchMediaValidator, MediaController.fetchAndCacheMedia);

// --- BURADAKİ '/book/:bookId' ROTASI SİLİNDİ ÇÜNKÜ ARTIK GEREKSİZ ---

/**
 * @route   GET /api/media/top-rated
 * @desc    En yüksek puanlı içerikler
 * @access  Public
 */
router.get('/top-rated', paginationValidator, MediaController.getTopRated);

/**
 * @route   GET /api/media/popular
 * @desc    En popüler içerikler
 * @access  Public
 */
router.get('/popular', paginationValidator, MediaController.getMostPopular);

/**
 * @route   GET /api/media/genre/:genre
 * @desc    Türe göre filtrele
 * @access  Public
 */
router.get('/genre/:genre', paginationValidator, MediaController.getByGenre);

/**
 * @route   GET /api/media/year/:year
 * @desc    Yıla göre filtrele
 * @access  Public
 */
router.get('/year/:year', paginationValidator, MediaController.getByYear);

/**
 * @route   GET /api/media/:id
 * @desc    Media detayını getir (Kitap veya Film, String veya Int ID)
 * @access  Public
 */
// Bu rota artık her türlü ID'yi (Google Books String ID dahil) karşılayacak zekaya sahip
router.get('/:id', optionalAuth, MediaController.getMediaDetail);

/**
 * @route   GET /api/media/:id/ratings
 * @desc    Media'nın aldığı puanları getir
 * @access  Public
 */
router.get('/:id/ratings', paginationValidator, MediaController.getMediaRatings);

/**
 * @route   GET /api/media/:id/reviews
 * @desc    Media'nın yorumlarını getir
 * @access  Public
 */
router.get('/:id/reviews', paginationValidator, optionalAuth, MediaController.getMediaReviews);

/**
 * @route   GET /api/media/:id/similar
 * @desc    Benzer içerikleri getir
 * @access  Public
 */
router.get('/:id/similar', paginationValidator, MediaController.getSimilarMedia);

/**
 * @route   GET /api/media/:id/activities
 * @desc    Media ile ilgili aktiviteleri getir
 * @access  Public
 */
router.get('/:id/activities', paginationValidator, MediaController.getMediaActivities);

module.exports = router;