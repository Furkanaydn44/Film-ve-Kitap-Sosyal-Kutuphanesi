// middleware/auth.js
const jwt = require('jsonwebtoken');

/**
 * JWT Token Doğrulama Middleware
 * Protected route'larda kullanılır
 */
const authenticateToken = (req, res, next) => {
  try {
    // Token'ı header'dan al
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Erişim reddedildi. Token bulunamadı.'
      });
    }

    // Token'ı doğrula
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        // Token süresi dolmuş veya geçersiz
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'Token süresi dolmuş. Lütfen tekrar giriş yapın.'
          });
        }

        return res.status(403).json({
          success: false,
          message: 'Geçersiz token'
        });
      }

      // Token geçerli, kullanıcı bilgisini req objesine ekle
      req.user = user;
      next();
    });
  } catch (error) {
    console.error('Token doğrulama hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Token doğrulama işlemi başarısız'
    });
  }
};

/**
 * Opsiyonel Token Doğrulama
 * Token varsa doğrula, yoksa devam et (public + authenticated karma endpoint'ler için)
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // Token yok, ama devam et
      req.user = null;
      return next();
    }

    // Token var, doğrula
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        // Token geçersiz ama public endpoint olduğu için devam et
        req.user = null;
      } else {
        // Token geçerli
        req.user = user;
      }
      next();
    });
  } catch (error) {
    console.error('Opsiyonel auth hatası:', error);
    req.user = null;
    next();
  }
};

/**
 * Admin Kontrolü (İleride kullanılabilir)
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Bu işlem için admin yetkisi gereklidir'
    });
  }
  next();
};

/**
 * Rate Limiting için user ID kontrolü
 */
const requireUserId = (req, res, next) => {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({
      success: false,
      message: 'Kullanıcı kimliği bulunamadı'
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  requireUserId
};