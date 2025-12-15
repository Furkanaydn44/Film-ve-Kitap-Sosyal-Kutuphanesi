// controllers/activityController.js
const Activity = require('../models/activityModel');
const Like = require('../models/likeModel');

class ActivityController {
  // ============================================
  // SOSYAL FEED (Ana Sayfa)
  // ============================================

  static async getFeed(req, res) {
    try {
      const userId = req.user.userId;
      const { limit = 15, offset = 0 } = req.query;

      const activities = await Activity.getFeed(
        userId,
        parseInt(limit),
        parseInt(offset)
      );

      res.json({
        success: true,
        data: { activities }
      });
    } catch (error) {
      console.error('Feed getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Akış yüklenemedi'
      });
    }
  }

  // ============================================
  // GLOBAL FEED
  // ============================================

  static async getGlobalFeed(req, res) {
    try {
      const { activity_type, media_type, limit = 20, offset = 0 } = req.query;

      const activities = await Activity.getGlobalFeed(
        parseInt(limit),
        parseInt(offset),
        { activity_type, media_type }
      );

      res.json({
        success: true,
        data: { activities }
      });
    } catch (error) {
      console.error('Global feed getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Global akış yüklenemedi'
      });
    }
  }

  // ============================================
  // POPÜLER AKTİVİTELER
  // ============================================

  static async getPopularActivities(req, res) {
    try {
      const { timeframe = '7d', limit = 20 } = req.query;

      const activities = await Activity.getPopularActivities(
        parseInt(limit),
        timeframe
      );

      res.json({
        success: true,
        data: { activities }
      });
    } catch (error) {
      console.error('Popüler aktiviteler getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Popüler aktiviteler yüklenemedi'
      });
    }
  }

  // ============================================
  // TEK AKTİVİTE DETAYI
  // ============================================

  static async getActivityById(req, res) {
    try {
      const { activityId } = req.params;

      const activity = await Activity.findById(activityId);

      if (!activity) {
        return res.status(404).json({
          success: false,
          message: 'Aktivite bulunamadı'
        });
      }

      // Yorumları da getir
      const comments = await Like.getActivityComments(activityId);

      res.json({
        success: true,
        data: {
          activity,
          comments
        }
      });
    } catch (error) {
      console.error('Aktivite detay getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Aktivite detayı yüklenemedi'
      });
    }
  }

  // ============================================
  // AKTİVİTE SİLME
  // ============================================

  static async deleteActivity(req, res) {
    try {
      const userId = req.user.userId;
      const { activityId } = req.params;

      const success = await Activity.delete(activityId, userId);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Aktivite bulunamadı veya silme yetkiniz yok'
        });
      }

      res.json({
        success: true,
        message: 'Aktivite silindi'
      });
    } catch (error) {
      console.error('Aktivite silme hatası:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Aktivite silinemedi'
      });
    }
  }

  // ============================================
  // AKTİVİTE BEĞENİ İŞLEMLERİ
  // ============================================

  static async likeActivity(req, res) {
    try {
      const userId = req.user.userId;
      const { activityId } = req.params;

      await Like.likeActivity(userId, activityId);

      res.json({
        success: true,
        message: 'Aktivite beğenildi'
      });
    } catch (error) {
      console.error('Aktivite beğenme hatası:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Beğeni işlemi başarısız'
      });
    }
  }

  static async unlikeActivity(req, res) {
    try {
      const userId = req.user.userId;
      const { activityId } = req.params;

      await Like.unlikeActivity(userId, activityId);

      res.json({
        success: true,
        message: 'Beğeni kaldırıldı'
      });
    } catch (error) {
      console.error('Beğeni kaldırma hatası:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Beğeni kaldırılamadı'
      });
    }
  }

  static async getActivityLikes(req, res) {
    try {
      const { activityId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const likes = await Like.getActivityLikes(
        activityId,
        parseInt(limit),
        parseInt(offset)
      );

      res.json({
        success: true,
        data: { likes }
      });
    } catch (error) {
      console.error('Beğenileri getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Beğeniler getirilemedi'
      });
    }
  }

  // ============================================
  // AKTİVİTE YORUM İŞLEMLERİ
  // ============================================

  static async addComment(req, res) {
    try {
      const userId = req.user.userId;
      const { activityId } = req.params;
      const { commentText } = req.body;

      if (!commentText || commentText.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Yorum metni gereklidir'
        });
      }

      const comment = await Like.addActivityComment(userId, activityId, commentText);

      res.status(201).json({
        success: true,
        message: 'Yorum eklendi',
        data: { comment }
      });
    } catch (error) {
      console.error('Yorum ekleme hatası:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Yorum eklenemedi'
      });
    }
  }

  static async updateComment(req, res) {
    try {
      const userId = req.user.userId;
      const { commentId } = req.params;
      const { commentText } = req.body;

      if (!commentText || commentText.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Yorum metni gereklidir'
        });
      }

      const comment = await Like.updateActivityComment(commentId, userId, commentText);

      res.json({
        success: true,
        message: 'Yorum güncellendi',
        data: { comment }
      });
    } catch (error) {
      console.error('Yorum güncelleme hatası:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Yorum güncellenemedi'
      });
    }
  }

  static async deleteComment(req, res) {
    try {
      const userId = req.user.userId;
      const { commentId } = req.params;

      const success = await Like.deleteActivityComment(commentId, userId);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Yorum bulunamadı'
        });
      }

      res.json({
        success: true,
        message: 'Yorum silindi'
      });
    } catch (error) {
      console.error('Yorum silme hatası:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Yorum silinemedi'
      });
    }
  }

  static async getActivityComments(req, res) {
    try {
      const { activityId } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      const currentUserId = req.user?.userId;

      const comments = await Like.getActivityComments(
        activityId,
        currentUserId,
        parseInt(limit),
        parseInt(offset)
      );

      res.json({
        success: true,
        data: { comments }
      });
    } catch (error) {
      console.error('Yorumlar getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Yorumlar getirilemedi'
      });
    }
  }

  // ============================================
  // YORUM BEĞENİ İŞLEMLERİ
  // ============================================

  static async likeComment(req, res) {
    try {
      const userId = req.user.userId;
      const { commentId } = req.params;

      await Like.likeComment(userId, commentId);

      res.json({
        success: true,
        message: 'Yorum beğenildi'
      });
    } catch (error) {
      console.error('Yorum beğenme hatası:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Yorum beğenilemedi'
      });
    }
  }

  static async unlikeComment(req, res) {
    try {
      const userId = req.user.userId;
      const { commentId } = req.params;

      await Like.unlikeComment(userId, commentId);

      res.json({
        success: true,
        message: 'Beğeni kaldırıldı'
      });
    } catch (error) {
      console.error('Beğeni kaldırma hatası:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Beğeni kaldırılamadı'
      });
    }
  }

  static async getCommentLikes(req, res) {
    try {
      const { commentId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const likes = await Like.getCommentLikes(
        commentId,
        parseInt(limit),
        parseInt(offset)
      );

      res.json({
        success: true,
        data: { likes }
      });
    } catch (error) {
      console.error('Yorum beğenileri getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Beğeniler getirilemedi'
      });
    }
  }

  // ============================================
  // KULLANICI AKTİVİTE İSTATİSTİKLERİ
  // ============================================

  static async getUserActivityStats(req, res) {
    try {
      const { username } = req.params;
      const User = require('../models/userModel');

      const user = await User.findByUsername(username);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
      }

      const stats = await Activity.getUserActivityStats(user.id);

      res.json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      console.error('Aktivite istatistik hatası:', error);
      res.status(500).json({
        success: false,
        message: 'İstatistikler alınamadı'
      });
    }
  }

  // ============================================
  // KULLANICININ BEĞENDİĞİ AKTİVİTELER
  // ============================================

  static async getUserLikedActivities(req, res) {
    try {
      const userId = req.user.userId;
      const { limit = 20, offset = 0 } = req.query;

      const activities = await Like.getUserLikedActivities(
        userId,
        parseInt(limit),
        parseInt(offset)
      );

      res.json({
        success: true,
        data: { activities }
      });
    } catch (error) {
      console.error('Beğenilen aktiviteler getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Beğenilen aktiviteler getirilemedi'
      });
    }
  }

  // ============================================
  // KULLANICININ SON YORUMLARI
  // ============================================

  static async getUserRecentComments(req, res) {
    try {
      const userId = req.user.userId;
      const { limit = 20, offset = 0 } = req.query;

      const comments = await Like.getUserRecentComments(
        userId,
        parseInt(limit),
        parseInt(offset)
      );

      res.json({
        success: true,
        data: { comments }
      });
    } catch (error) {
      console.error('Son yorumlar getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Son yorumlar getirilemedi'
      });
    }
  }
}

module.exports = ActivityController;