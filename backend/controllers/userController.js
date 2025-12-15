// controllers/userController.js
const User = require('../models/userModel');
const Rating = require('../models/ratingModel');
const Review = require('../models/reviewModel');
const Watchlist = require('../models/watchlistModel');
const Activity = require('../models/activityModel');

class UserController {
  // ============================================
  // PROFİL GÖRÜNTÜLEME
  // ============================================

  static async getProfile(req, res) {
    try {
      const { username } = req.params;
      const currentUserId = req.user?.userId; // Opsiyonel - giriş yapmış kullanıcı

      const user = await User.findByUsername(username);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
      }

      // İstatistikler
      const stats = await User.getStats(user.id);
      const followCounts = await User.getFollowCounts(user.id);

      // Takip durumu (eğer giriş yapılmışsa)
      let isFollowing = false;
      if (currentUserId && currentUserId !== user.id) {
        isFollowing = await User.isFollowing(currentUserId, user.id);
      }

      res.json({
        success: true,
        data: {
          user,
          stats: {
            ...stats,
            ...followCounts
          },
          isFollowing,
          isOwnProfile: currentUserId === user.id
        }
      });
    } catch (error) {
      console.error('Profil getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Profil bilgileri alınamadı'
      });
    }
  }

  // ============================================
  // PROFİL GÜNCELLEME
  // ============================================

  static async updateProfile(req, res) {
    try {
      const userId = req.user.userId;
      const { full_name, bio, avatar_url } = req.body;

      const updatedUser = await User.updateProfile(userId, {
        full_name,
        bio,
        avatar_url
      });

      res.json({
        success: true,
        message: 'Profil güncellendi',
        data: { user: updatedUser }
      });
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Profil güncellenemedi'
      });
    }
  }

  // ============================================
  // TAKİP SİSTEMİ
  // ============================================

  static async followUser(req, res) {
    try {
      const followerId = req.user.userId;
      const { userId } = req.params;

      // Kendini takip etmeyi engelle
      if (followerId === parseInt(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Kendinizi takip edemezsiniz'
        });
      }

      // Kullanıcı var mı kontrol et
      const userToFollow = await User.findById(userId);
      if (!userToFollow) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
      }

      await User.follow(followerId, userId);

      res.json({
        success: true,
        message: `${userToFollow.username} takip edildi`
      });
    } catch (error) {
      console.error('Takip etme hatası:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Takip işlemi başarısız'
      });
    }
  }

  static async unfollowUser(req, res) {
    try {
      const followerId = req.user.userId;
      const { userId } = req.params;

      await User.unfollow(followerId, userId);

      res.json({
        success: true,
        message: 'Takipten çıkıldı'
      });
    } catch (error) {
      console.error('Takipten çıkma hatası:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Takipten çıkma işlemi başarısız'
      });
    }
  }

  static async getFollowers(req, res) {
    try {
      const { username } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const user = await User.findByUsername(username);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
      }

      const followers = await User.getFollowers(user.id, parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        data: { followers }
      });
    } catch (error) {
      console.error('Takipçiler getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Takipçiler alınamadı'
      });
    }
  }

  static async getFollowing(req, res) {
    try {
      const { username } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const user = await User.findByUsername(username);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
      }

      const following = await User.getFollowing(user.id, parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        data: { following }
      });
    } catch (error) {
      console.error('Takip edilenler getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Takip edilenler alınamadı'
      });
    }
  }

  // ============================================
  // KULLANICI PUANLARI
  // ============================================

  static async getUserRatings(req, res) {
    try {
      const { username } = req.params;
      const { media_type, min_rating, max_rating, limit = 50, offset = 0 } = req.query;

      const user = await User.findByUsername(username);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
      }

      const ratings = await Rating.getUserRatings(
        user.id,
        { media_type, min_rating, max_rating },
        parseInt(limit),
        parseInt(offset)
      );

      res.json({
        success: true,
        data: { ratings }
      });
    } catch (error) {
      console.error('Puanlar getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Puanlar alınamadı'
      });
    }
  }

  // ============================================
  // KULLANICI YORUMLARI
  // ============================================

  static async getUserReviews(req, res) {
    try {
      const { username } = req.params;
      const { media_type, limit = 20, offset = 0 } = req.query;

      const user = await User.findByUsername(username);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
      }

      const reviews = await Review.getUserReviews(
        user.id,
        { media_type },
        parseInt(limit),
        parseInt(offset)
      );

      res.json({
        success: true,
        data: { reviews }
      });
    } catch (error) {
      console.error('Yorumlar getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Yorumlar alınamadı'
      });
    }
  }

  // ============================================
  // KULLANICI WATCHLIST
  // ============================================

  static async getUserWatchlist(req, res) {
    try {
      const { username } = req.params;
      const { status, media_type, sort, limit = 50, offset = 0 } = req.query;

      const user = await User.findByUsername(username);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
      }

      const watchlist = await Watchlist.getUserWatchlist(
        user.id,
        { status, media_type, sort },
        parseInt(limit),
        parseInt(offset)
      );

      res.json({
        success: true,
        data: { watchlist }
      });
    } catch (error) {
      console.error('Watchlist getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Watchlist alınamadı'
      });
    }
  }

  // ============================================
  // KULLANICI AKTİVİTELERİ
  // ============================================

  static async getUserActivities(req, res) {
    try {
      const { username } = req.params;
      const { activity_type, media_type, limit = 20, offset = 0 } = req.query;

      const user = await User.findByUsername(username);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
      }

      const activities = await Activity.getUserActivities(
        user.id,
        { activity_type, media_type },
        parseInt(limit),
        parseInt(offset)
      );

      res.json({
        success: true,
        data: { activities }
      });
    } catch (error) {
      console.error('Aktiviteler getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Aktiviteler alınamadı'
      });
    }
  }

  // ============================================
  // KULLANICI ARAMA
  // ============================================

  static async searchUsers(req, res) {
    try {
      const { q, limit = 20, offset = 0 } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Arama terimi en az 2 karakter olmalıdır'
        });
      }

      const users = await User.search(q, parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        data: { users }
      });
    } catch (error) {
      console.error('Kullanıcı arama hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Kullanıcı araması yapılamadı'
      });
    }
  }

  // ============================================
  // KULLANICI İSTATİSTİKLERİ
  // ============================================

  static async getUserStats(req, res) {
    try {
      const { username } = req.params;

      const user = await User.findByUsername(username);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
      }

      // Genel istatistikler
      const generalStats = await User.getStats(user.id);
      
      // Puan istatistikleri
      const ratingStats = await Rating.getUserRatingStats(user.id);
      
      // Yorum istatistikleri
      const reviewStats = await Review.getUserReviewStats(user.id);
      
      // Watchlist istatistikleri
      const watchlistStats = await Watchlist.getUserWatchlistStats(user.id);

      res.json({
        success: true,
        data: {
          general: generalStats,
          ratings: ratingStats,
          reviews: reviewStats,
          watchlist: watchlistStats
        }
      });
    } catch (error) {
      console.error('İstatistik getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'İstatistikler alınamadı'
      });
    }
  }

  // ============================================
  // KULLANICI SİLME
  // ============================================

  static async deleteAccount(req, res) {
    try {
      const userId = req.user.userId;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Şifre gereklidir'
        });
      }

      // Kullanıcıyı bul
      const user = await User.findByEmail((await User.findById(userId)).email);

      // Şifreyi kontrol et
      const isPasswordValid = await User.verifyPassword(password, user.password_hash);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Şifre hatalı'
        });
      }

      // Hesabı sil
      await User.delete(userId);

      res.json({
        success: true,
        message: 'Hesabınız başarıyla silindi'
      });
    } catch (error) {
      console.error('Hesap silme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Hesap silinemedi'
      });
    }
  }


  static async getUserSuggestions(req, res) {
    try {
      const userId = req.user.userId;
      const { limit = 10, offset = 0, q = '' } = req.query; // 'q' arama parametresi

      const suggestions = await User.getSuggestions(
        userId, 
        parseInt(limit), 
        parseInt(offset), 
        q
      );

      res.json({
        success: true,
        data: { users: suggestions }
      });
    } catch (error) {
      console.error('Öneri getirme hatası:', error);
      res.status(500).json({ success: false, message: 'Kullanıcılar alınamadı' });
    }
  }
}

module.exports = UserController;