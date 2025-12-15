// middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Upload dizinini oluştur (yoksa)
const uploadDir = path.join(__dirname, '../uploads/avatars'); 
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ============================================
// STORAGE CONFIGURATION
// ============================================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/avatars/'); // Dosyanın kaydedileceği yer
  },
  filename: function (req, file, cb) {
    // Dosya ismini benzersiz yap (çakışmayı önlemek için)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// ============================================
// FILE FILTER
// ============================================

const fileFilter = (req, file, cb) => {
  // Kabul edilen dosya türleri
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Sadece resim dosyaları (JPG, PNG) yüklenebilir!'), false);
  }
};

// ============================================
// MULTER CONFIGURATION
// ============================================

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Tek dosya
  },
  fileFilter: fileFilter
});

// ============================================
// UPLOAD MIDDLEWARE
// ============================================

/**
 * Tekil dosya yükleme (Avatar için)
 */
const uploadAvatar = upload.single('avatar');

/**
 * Avatar yükleme middleware'i (hata yakalama ile)
 */
const handleAvatarUpload = (req, res, next) => {
  uploadAvatar(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Multer hatası
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Dosya boyutu çok büyük. Maksimum 5MB olmalıdır.'
        });
      }
      
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Tek seferde sadece 1 dosya yüklenebilir.'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'Dosya yükleme hatası: ' + err.message
      });
    } else if (err) {
      // Özel hata (file filter)
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    // Başarılı
    next();
  });
};

// ============================================
// DOSYA SİLME HELPER
// ============================================

/**
 * Eski avatar'ı sil
 */
const deleteOldAvatar = (avatarPath) => {
  if (!avatarPath) return;
  
  try {
    // Sadece local dosyaları sil (uploads/ ile başlayanlar)
    if (avatarPath.startsWith('/uploads/')) {
      const fullPath = path.join(__dirname, '..', avatarPath);
      
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log('✅ Eski avatar silindi:', avatarPath);
      }
    }
  } catch (error) {
    console.error('❌ Eski avatar silinirken hata:', error);
  }
};

// ============================================
// ÇOKLU DOSYA UPLOAD (İleride kullanılabilir)
// ============================================

/**
 * Birden fazla dosya yükleme
 */
const uploadMultiple = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5 // Max 5 dosya
  },
  fileFilter: fileFilter
}).array('images', 5);

/**
 * Çoklu dosya yükleme middleware'i
 */
const handleMultipleUpload = (req, res, next) => {
  uploadMultiple(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: 'Dosya yükleme hatası: ' + err.message
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    next();
  });
};

// ============================================
// MEMORY STORAGE (Base64 için - opsiyonel)
// ============================================

const memoryStorage = multer.memoryStorage();

const uploadToMemory = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: fileFilter
}).single('avatar');

/**
 * Memory'ye yükleme (Base64 encode için)
 */
const handleMemoryUpload = (req, res, next) => {
  uploadToMemory(req, res, function (err) {
    if (err) {
      return res.status(400).json({
        success: false,
        message: 'Dosya yükleme hatası: ' + err.message
      });
    }
    
    // File'ı base64'e çevir
    if (req.file) {
      req.file.base64 = req.file.buffer.toString('base64');
    }
    
    next();
  });
};

// ============================================
// DOSYA BOYUTU KONTROL HELPER
// ============================================

/**
 * Dosya boyutunu human-readable formata çevir
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// ============================================
// MİME TYPE KONTROL
// ============================================

/**
 * Dosyanın gerçekten resim olup olmadığını kontrol et
 */
const validateImageMimeType = (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.mimetype);
};
exports.handleAvatarUpload = upload.single('avatar');
module.exports = {
  upload,
  uploadAvatar,
  handleAvatarUpload,
  deleteOldAvatar,
  uploadMultiple,
  handleMultipleUpload,
  handleMemoryUpload,
  formatFileSize,
  validateImageMimeType
};