// controllers/authController.js
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/emailService');

class AuthController {
  // ============================================
  // KAYIT OL
  // ============================================
  
  static async register(req, res) {
    try {
      const { username, email, password, full_name } = req.body;

      // Validasyon
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Kullanıcı adı, e-posta ve şifre gereklidir'
        });
      }

      // Email formatı kontrolü
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz e-posta formatı'
        });
      }

      // Şifre uzunluğu kontrolü
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Şifre en az 6 karakter olmalıdır'
        });
      }

      // Kullanıcı oluştur
      const user = await User.create({
        username,
        email,
        password,
        full_name: full_name || username
      });

      // Token oluştur
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        message: 'Kayıt başarılı',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            full_name: user.full_name
          },
          token
        }
      });
    } catch (error) {
      console.error('Kayıt hatası:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Kayıt işlemi başarısız'
      });
    }
  }

  // ============================================
  // GİRİŞ YAP
  // ============================================
  
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validasyon
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'E-posta ve şifre gereklidir'
        });
      }

      // Kullanıcıyı bul (şifre hash'i ile birlikte)
      const user = await User.findByEmail(email);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'E-posta veya şifre hatalı'
        });
      }

      // Şifre kontrolü
      const isPasswordValid = await User.verifyPassword(password, user.password_hash);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'E-posta veya şifre hatalı'
        });
      }

      // Token oluştur
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Şifre hash'ini response'dan çıkar
      delete user.password_hash;

      res.json({
        success: true,
        message: 'Giriş başarılı',
        data: {
          user,
          token
        }
      });
    } catch (error) {
      console.error('Giriş hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Giriş işlemi başarısız'
      });
    }
  }

  // ============================================
  // MEVCUT KULLANICIYI GETIR
  // ============================================
  
  static async getCurrentUser(req, res) {
    try {
      // Middleware'den gelen userId
      const userId = req.user.userId;

      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
      }

      // İstatistikleri de ekle
      const stats = await User.getStats(userId);

      res.json({
        success: true,
        data: {
          user,
          stats
        }
      });
    } catch (error) {
      console.error('Kullanıcı getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Kullanıcı bilgileri alınamadı'
      });
    }
  }

  // ============================================
  // ŞİFRE SIFIRLAMA İSTEĞİ
  // ============================================
  
  static async requestPasswordReset(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'E-posta adresi gereklidir' });
      };
    

    const user = await User.findByEmail(email);
    
    if (!user) {
      // Güvenlik için kullanıcı bulunamasa bile başarılı mesajı dön
      return res.json({
        success: true,
        message: 'Eğer bu e-posta kayıtlıysa, şifre sıfırlama linki gönderildi'
      });
    }

    // Token oluştur
    const resetToken = await User.createPasswordResetToken(user.id);

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    const message = `
      <h1>Şifre Sıfırlama İsteği</h1>
      <p>CineBook hesabınız için şifre sıfırlama talebinde bulundunuz.</p>
      <p>Şifrenizi sıfırlamak için aşağıdaki linke tıklayın:</p>
      <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
      <p>Bu link 1 saat süreyle geçerlidir.</p>
      <p>Eğer bu isteği siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
    `;

    /// E-posta Gönder
    const emailSent = await sendEmail({
      to: user.email,
      subject: 'CineBook Şifre Sıfırlama',
      html: message
    });

    if (!emailSent) {
      return res.status(500).json({ success: false, message: 'E-posta gönderilemedi' });
    }

    res.json({
      success: true,
      message: 'Şifre sıfırlama linki e-posta adresinize gönderildi'
    });

  } catch (error) {
    console.error('Şifre sıfırlama isteği hatası:', error);
    res.status(500).json({ success: false, message: 'Şifre sıfırlama isteği başarısız' });
  }
}

  // ============================================
  // ŞİFRE SIFIRLAMA
  // ============================================
  
  static async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Token ve yeni şifre gereklidir'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Şifre en az 6 karakter olmalıdır'
        });
      }

      // Token'ı doğrula
      const tokenData = await User.verifyPasswordResetToken(token);
      
      if (!tokenData) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz veya süresi dolmuş token'
        });
      }

      // Şifreyi güncelle
      await User.updatePassword(tokenData.user_id, newPassword);

      // Token'ı kullanıldı olarak işaretle
      await User.markTokenAsUsed(token);

      res.json({
        success: true,
        message: 'Şifreniz başarıyla güncellendi'
      });
    } catch (error) {
      console.error('Şifre sıfırlama hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Şifre sıfırlama işlemi başarısız'
      });
    }
  }

  // ============================================
  // ŞİFRE DEĞİŞTİRME (Giriş yapmış kullanıcı için)
  // ============================================
  
  static async changePassword(req, res) {
    try {
      const userId = req.user.userId;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Mevcut şifre ve yeni şifre gereklidir'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Yeni şifre en az 6 karakter olmalıdır'
        });
      }

      // Kullanıcıyı bul
      const user = await User.findByEmail((await User.findById(userId)).email);
      
      // Mevcut şifreyi kontrol et
      const isPasswordValid = await User.verifyPassword(currentPassword, user.password_hash);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Mevcut şifre hatalı'
        });
      }

      // Yeni şifreyi kaydet
      await User.updatePassword(userId, newPassword);

      res.json({
        success: true,
        message: 'Şifreniz başarıyla değiştirildi'
      });
    } catch (error) {
      console.error('Şifre değiştirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Şifre değiştirme işlemi başarısız'
      });
    }
  }

  // ============================================
  // ÇIKIŞ YAP
  // ============================================
  
  static async logout(req, res) {
    try {
      // JWT kullandığımız için server tarafında yapacak bir şey yok
      // Client tarafında token'ı localStorage'dan silmek yeterli
      
      res.json({
        success: true,
        message: 'Başarıyla çıkış yapıldı'
      });
    } catch (error) {
      console.error('Çıkış hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Çıkış işlemi başarısız'
      });
    }
  }

  // ============================================
  // TOKEN DOĞRULAMA
  // ============================================
  
  static async verifyToken(req, res) {
    try {
      // Middleware zaten token'ı doğruladı
      // Kullanıcı bilgilerini dön
      const userId = req.user.userId;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
      }

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      console.error('Token doğrulama hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Token doğrulanamadı'
      });
    }
  }
}

module.exports = AuthController;