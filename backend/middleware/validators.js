// middleware/validators.js
const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation sonuçlarını kontrol et
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validasyon hatası',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
};

// ============================================
// AUTH VALIDATORS
// ============================================

const registerValidator = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Kullanıcı adı 3-50 karakter arasında olmalıdır')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Geçerli bir e-posta adresi giriniz')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Şifre en az 6 karakter olmalıdır'),
  
  body('full_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('İsim 2-100 karakter arasında olmalıdır'),
  
  validate
];

const loginValidator = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Geçerli bir e-posta adresi giriniz')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Şifre gereklidir'),
  
  validate
];

const passwordResetValidator = [
  body('token')
    .notEmpty()
    .withMessage('Token gereklidir'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Yeni şifre en az 6 karakter olmalıdır'),
  
  validate
];

// ============================================
// USER VALIDATORS
// ============================================

const updateProfileValidator = [
  body('full_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('İsim 2-100 karakter arasında olmalıdır'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Biyografi maksimum 500 karakter olabilir'),
  
  body('avatar_url')
    .optional()
    .trim()
    // .isURL() // <--- BU SATIRI SİLİN veya YORUMA ALIN
    // Relative path (/uploads/...) valid URL sayılmaz, o yüzden kaldırdık.
    .isString() 
    .withMessage('Avatar URL metin olmalıdır'),
  
  validate
];

const usernameParamValidator = [
  param('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Geçersiz kullanıcı adı'),
  
  validate
];

// ============================================
// MEDIA VALIDATORS
// ============================================

const mediaIdParamValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Geçersiz media ID'),
  
  validate
];

const searchQueryValidator = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Arama terimi 1-200 karakter arasında olmalıdır'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit 1-100 arasında olmalıdır'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset 0 veya daha büyük olmalıdır'),
  
  validate
];

const fetchMediaValidator = [
  body('external_id')
    .notEmpty()
    .withMessage('external_id gereklidir'),
  
  body('media_type')
    .isIn(['movie', 'book'])
    .withMessage('media_type "movie" veya "book" olmalıdır'),
  
  validate
];

// ============================================
// RATING VALIDATORS
// ============================================

const ratingValidator = [
  body('mediaId')
    .isInt({ min: 1 })
    .withMessage('Geçerli bir media ID giriniz'),
  
  body('rating')
    .isInt({ min: 1, max: 10 })
    .withMessage('Puan 1 ile 10 arasında olmalıdır'),
  
  validate
];

// ============================================
// REVIEW VALIDATORS
// ============================================

const createReviewValidator = [
  body('media_id') // Eskiden burada 'mediaId' yazıyordu, sorun buydu.
    .notEmpty()
    .withMessage('Media ID zorunludur')
    .isInt()
    .withMessage('Geçersiz ID formatı'),
  
  body('review_text') // Eskiden 'reviewText' yazıyordu.
    .notEmpty()
    .withMessage('Yorum boş olamaz'),
    
  validate
];

const updateReviewValidator = [
  param('reviewId')
    .isInt({ min: 1 })
    .withMessage('Geçersiz review ID'),
  
  body('reviewText')
    .optional()
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Yorum 10-5000 karakter arasında olmalıdır'),
  
  body('isSpoiler')
    .optional()
    .isBoolean()
    .withMessage('isSpoiler boolean olmalıdır'),
  
  validate
];

// ============================================
// WATCHLIST VALIDATORS
// ============================================

const addToWatchlistValidator = [
  body('mediaId')
    .isInt({ min: 1 })
    .withMessage('Geçerli bir media ID giriniz'),
  
  body('status')
    .optional()
    .isIn(['plan_to', 'watching', 'completed', 'dropped'])
    .withMessage('Geçersiz durum. plan_to, watching, completed veya dropped olmalıdır'),
  
  validate
];

const updateWatchlistStatusValidator = [
  param('mediaId')
    .isInt({ min: 1 })
    .withMessage('Geçersiz media ID'),
  
  body('status')
    .isIn(['plan_to', 'watching', 'completed', 'dropped'])
    .withMessage('Geçersiz durum'),
  
  validate
];

// ============================================
// LIST VALIDATORS
// ============================================

const createListValidator = [
  body('list_name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Liste adı 1-255 karakter arasında olmalıdır'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Açıklama maksimum 1000 karakter olabilir'),
  
  body('is_public')
    .optional()
    .isBoolean()
    .withMessage('is_public boolean olmalıdır'),
  
  validate
];

const addItemToListValidator = [
  // 1. Değişiklik: Route artık /:id olduğu için 'listId' yerine 'id' kontrol ediyoruz
  param('id')
    .isInt({ min: 1 })
    .withMessage('Geçersiz liste ID'),
  
  // 2. Değişiklik: Frontend 'media_id' gönderdiği için 'mediaId' yerine 'media_id' bekliyoruz
  body('media_id')
    .notEmpty()
    .withMessage('Media ID zorunludur')
    .isInt({ min: 1 })
    .withMessage('Geçerli bir media ID giriniz'),
  
  body('note')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Not maksimum 500 karakter olabilir'),
  
  body('list_order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('list_order 0 veya daha büyük olmalıdır'),
  
  validate
];

// ============================================
// ACTIVITY VALIDATORS
// ============================================

const activityIdParamValidator = [
  param('activityId')
    .isInt({ min: 1 })
    .withMessage('Geçersiz aktivite ID'),
  
  validate
];

const addCommentValidator = [
  param('activityId')
    .isInt({ min: 1 })
    .withMessage('Geçersiz aktivite ID'),
  
  body('commentText')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Yorum 1-1000 karakter arasında olmalıdır'),
  
  validate
];

const commentIdParamValidator = [
  param('commentId')
    .isInt({ min: 1 })
    .withMessage('Geçersiz yorum ID'),
  
  validate
];

// ============================================
// PAGINATION VALIDATORS
// ============================================

const paginationValidator = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit 1-100 arasında olmalıdır')
    .toInt(),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset 0 veya daha büyük olmalıdır')
    .toInt(),
  
  validate
];

// ============================================
// COMMON VALIDATORS
// ============================================

const idParamValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Geçersiz ID'),
  
  validate
];

const userIdParamValidator = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('Geçersiz kullanıcı ID'),
  
  validate
];

module.exports = {
  validate,
  
  // Auth
  registerValidator,
  loginValidator,
  passwordResetValidator,
  
  // User
  updateProfileValidator,
  usernameParamValidator,
  
  // Media
  mediaIdParamValidator,
  searchQueryValidator,
  fetchMediaValidator,
  
  // Rating
  ratingValidator,
  
  // Review
  createReviewValidator,
  updateReviewValidator,
  
  // Watchlist
  addToWatchlistValidator,
  updateWatchlistStatusValidator,
  
  // List
  createListValidator,
  addItemToListValidator,
  
  // Activity
  activityIdParamValidator,
  addCommentValidator,
  commentIdParamValidator,
  
  // Common
  paginationValidator,
  idParamValidator,
  userIdParamValidator
};