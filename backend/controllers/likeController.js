// controllers/likeController.js
const Like = require('../models/likeModel');

class LikeController {
  // ============================================
  // KULLANICI BEĞENİ İSTATİSTİKLERİ
  // ============================================

  static async getUserLikeStats(req, res) {
    try {
      const userId = req.user.userId;

      // Verdiği beğeniler
      const givenLikes = await Like.getUserLikeStats(userId);
      
      // Aldığı beğeniler
      const receivedLikes = await Like.getUserReceivedLikeStats(userId);

      res.json({
        success: true,
        data: {
          given: givenLikes,
          received: receivedLikes
        }
      });
    } catch (error) {
      console.error('Beğeni istatistik hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Beğeni istatistikleri alınamadı'
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
  // KULLANICININ YORUMLARI
  // ============================================

  static async getUserComments(req, res) {
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
      console.error('Yorumlar getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Yorumlar getirilemedi'
      });
    }
  }

  // ============================================
  // AKTİVİTE BEĞENİ KONTROLÜ
  // ============================================

  static async checkActivityLike(req, res) {
    try {
      const userId = req.user.userId;
      const { activityId } = req.params;

      const isLiked = await Like.isActivityLiked(userId, activityId);

      res.json({
        success: true,
        data: { isLiked }
      });
    } catch (error) {
      console.error('Beğeni kontrolü hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Beğeni durumu kontrol edilemedi'
      });
    }
  }

  // ============================================
  // YORUM BEĞENİ KONTROLÜ
  // ============================================

  static async checkCommentLike(req, res) {
    try {
      const userId = req.user.userId;
      const { commentId } = req.params;

      const isLiked = await Like.isCommentLiked(userId, commentId);

      res.json({
        success: true,
        data: { isLiked }
      });
    } catch (error) {
      console.error('Yorum beğeni kontrolü hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Beğeni durumu kontrol edilemedi'
      });
    }
  }

  // ============================================
  // TOPLU BEĞENİ KONTROLÜ
  // ============================================

  static async checkMultipleActivityLikes(req, res) {
    try {
      const userId = req.user.userId;
      const { activityIds } = req.body;

      if (!activityIds || !Array.isArray(activityIds)) {
        return res.status(400).json({
          success: false,
          message: 'activityIds array gereklidir'
        });
      }

      const likeStatus = await Like.checkMultipleActivityLikes(userId, activityIds);

      res.json({
        success: true,
        data: { likeStatus }
      });
    } catch (error) {
      console.error('Toplu beğeni kontrolü hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Beğeni durumları kontrol edilemedi'
      });
    }
  }

  // ============================================
  // AKTİVİTE BEĞENİ SAYISI
  // ============================================

  static async getActivityLikesCount(req, res) {
    try {
      const { activityId } = req.params;

      const count = await Like.getActivityLikesCount(activityId);

      res.json({
        success: true,
        data: { count }
      });
    } catch (error) {
      console.error('Beğeni sayısı getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Beğeni sayısı alınamadı'
      });
    }
  }

  // ============================================
  // YORUM BEĞENİ SAYISI
  // ============================================

  static async getCommentLikesCount(req, res) {
    try {
      const { commentId } = req.params;

      const count = await Like.getCommentLikesCount(commentId);

      res.json({
        success: true,
        data: { count }
      });
    } catch (error) {
      console.error('Yorum beğeni sayısı getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Beğeni sayısı alınamadı'
      });
    }
  }

  // ============================================
  // AKTİVİTE YORUM SAYISI
  // ============================================

  static async getActivityCommentsCount(req, res) {
    try {
      const { activityId } = req.params;

      const count = await Like.getActivityCommentsCount(activityId);

      res.json({
        success: true,
        data: { count }
      });
    } catch (error) {
      console.error('Yorum sayısı getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Yorum sayısı alınamadı'
      });
    }
  }

  // ============================================
  // TEMİZLİK İŞLEMLERİ (Admin/Sistem)
  // ============================================

  static async deleteAllUserLikes(req, res) {
    try {
      const userId = req.user.userId;

      // Güvenlik kontrolü - kullanıcı sadece kendi beğenilerini silebilir
      // veya admin yetkisi olmalı
      
      await Like.deleteAllUserLikes(userId);

      res.json({
        success: true,
        message: 'Tüm beğeniler silindi'
      });
    } catch (error) {
      console.error('Beğeni silme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Beğeniler silinemedi'
      });
    }
  }

  static async deleteAllUserComments(req, res) {
    try {
      const userId = req.user.userId;

      // Güvenlik kontrolü - kullanıcı sadece kendi yorumlarını silebilir
      // veya admin yetkisi olmalı
      
      const deletedCount = await Like.deleteAllUserComments(userId);

      res.json({
        success: true,
        message: `${deletedCount} yorum silindi`
      });
    } catch (error) {
      console.error('Yorum silme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Yorumlar silinemedi'
      });
    }
  }
}

module.exports = LikeController;