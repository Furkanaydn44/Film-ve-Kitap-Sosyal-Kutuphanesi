// middleware/errorHandler.js

/**
 * Global Error Handler Middleware
 * Tüm catch edilmemiş hataları yakalar
 */
const errorHandler = (err, req, res, next) => {
  console.error('❌ Hata yakalandı:', err);

  // Varsayılan hata değerleri
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Sunucu hatası';

  // MySQL/Database hataları
  if (err.code) {
    switch (err.code) {
      case 'ER_DUP_ENTRY':
        statusCode = 409;
        if (err.message.includes('email')) {
          message = 'Bu e-posta adresi zaten kullanımda';
        } else if (err.message.includes('username')) {
          message = 'Bu kullanıcı adı zaten kullanımda';
        } else {
          message = 'Bu kayıt zaten mevcut';
        }
        break;

      case 'ER_NO_REFERENCED_ROW':
      case 'ER_NO_REFERENCED_ROW_2':
        statusCode = 404;
        message = 'İlişkili kayıt bulunamadı';
        break;

      case 'ER_ROW_IS_REFERENCED':
      case 'ER_ROW_IS_REFERENCED_2':
        statusCode = 409;
        message = 'Bu kayıt başka kayıtlar tarafından kullanılıyor, silinemez';
        break;

      case 'ER_BAD_NULL_ERROR':
        statusCode = 400;
        message = 'Zorunlu alanlar eksik';
        break;

      case 'ER_DATA_TOO_LONG':
        statusCode = 400;
        message = 'Veri çok uzun';
        break;

      case 'ECONNREFUSED':
        statusCode = 503;
        message = 'Veritabanı bağlantısı kurulamadı';
        break;

      default:
        // Diğer database hataları
        if (err.code.startsWith('ER_')) {
          statusCode = 400;
          message = 'Veritabanı işlemi başarısız';
        }
    }
  }

  // JWT hataları
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Geçersiz token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token süresi dolmuş';
  }

  // Validation hataları (express-validator)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  }

  // Multer file upload hataları
  if (err.name === 'MulterError') {
    statusCode = 400;
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'Dosya boyutu çok büyük (max 5MB)';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Çok fazla dosya yüklendi';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Beklenmeyen dosya alanı';
        break;
      default:
        message = 'Dosya yükleme hatası';
    }
  }

  // CastError (MongoDB ObjectId hatası - kullanmıyoruz ama olsun)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Geçersiz ID formatı';
  }

  // Response oluştur
  const errorResponse = {
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? {
      statusCode,
      stack: err.stack,
      details: err
    } : undefined
  };

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found Handler
 * Route bulunamadığında çağrılır
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Bulunamadı - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Async Error Handler Wrapper
 * Async fonksiyonları wrap eder ve hataları yakalar
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Custom Error Class
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError
};