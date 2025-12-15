// controllers/collectionController.js
const Rating = require('../models/ratingModel');
const Review = require('../models/reviewModel');
const Watchlist = require('../models/watchlistModel');
const Activity = require('../models/activityModel');
const Media = require('../models/mediaModel');

class CollectionController {
  // ============================================
  // PUANLAMA İŞLEMLERİ
  // ============================================

  static async rateMedia(req, res) {
    try {
      const userId = req.user.userId;
      const { mediaId, rating } = req.body;

      if (!mediaId || !rating) {
        return res.status(400).json({
          success: false,
          message: 'mediaId ve rating gereklidir'
        });
      }

      // Media var mı kontrol et
      const media = await Media.findById(mediaId);
      if (!media) {
        return res.status(404).json({
          success: false,
          message: 'İçerik bulunamadı'
        });
      }

      // Puanı kaydet
      const result = await Rating.createOrUpdate(userId, mediaId, rating);

      // Aktivite oluştur (sadece yeni puanlarda, güncelleme değil)
      if (!result.updated) {
        await Activity.create({
          user_id: userId,
          activity_type: 'rating',
          media_id: mediaId,
          rating_id: result.id
        });
      }

      res.json({
        success: true,
        message: result.updated ? 'Puan güncellendi' : 'Puan verildi',
        data: result
      });
    } catch (error) {
      console.error('Puanlama hatası:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Puanlama işlemi başarısız'
      });
    }
  }

  static async deleteRating(req, res) {
    try {
      const userId = req.user.userId;
      const { mediaId } = req.params;

      const success = await Rating.delete(userId, mediaId);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Puan bulunamadı'
        });
      }

      res.json({
        success: true,
        message: 'Puan silindi'
      });
    } catch (error) {
      console.error('Puan silme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Puan silinemedi'
      });
    }
  }

  static async getRatingDistribution(req, res) {
    try {
      const { mediaId } = req.params;

      const distribution = await Rating.getMediaRatingDistribution(mediaId);

      res.json({
        success: true,
        data: { distribution }
      });
    } catch (error) {
      console.error('Puan dağılımı getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Puan dağılımı alınamadı'
      });
    }
  }

  // ============================================
  // YORUM İŞLEMLERİ
  // ============================================

  static async createReview(req, res) {
  try {
    const userId = req.user.userId;
    // Frontend ve Validator ile aynı isimleri kullanıyoruz:
    const { media_id, review_text, is_spoiler } = req.body; 

    // Kontrol için terminale yazdıralım
    console.log('✅ Yorum İsteği Ulaştı:', { userId, media_id, review_text });

    if (!media_id || !review_text) {
      return res.status(400).json({ 
        success: false, 
        message: 'Eksik bilgi: media_id ve review_text gerekli' 
      });
    }

    // Modelleri çağır
    const Review = require('../models/reviewModel');
    const Activity = require('../models/activityModel');

    // Yorumu oluştur
    const review = await Review.create(userId, media_id, review_text, is_spoiler || false);

    // Aktiviteye işle
    await Activity.create({
      user_id: userId,
      activity_type: 'review',
      media_id: media_id,
      review_id: review.id
    });

    res.status(201).json({
      success: true,
      message: 'Yorumun başarıyla eklendi',
      data: { review }
    });

  } catch (error) {
    console.error('❌ Yorum Hatası:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Yorum eklenirken bir sorun oluştu'
    });
  }
}

  static async updateReview(req, res) {
    try {
      const userId = req.user.userId;
      
      // 🔥 DÜZELTME 1: ID'yi hem 'id' hem 'reviewId' olarak kontrol et (Garanti olsun)
      const reviewId = req.params.id || req.params.reviewId;
      
      // 🔥 DÜZELTME 2: Frontend'den gelen veriyi doğru al
      // Eğer frontend { review_text: "..." } gönderiyorsa onu alıyoruz.
      const { review_text, reviewText, is_spoiler } = req.body;
      
      // Hangi isimle gelirse gelsin, metni yakala
      const finalReviewText = review_text || reviewText;

      const updatedReview = await Review.update(reviewId, userId, {
        reviewText: finalReviewText, // Modele düz metin gönderiyoruz
        isSpoiler: is_spoiler
      });

      res.json({
        success: true,
        message: 'Yorum güncellendi',
        data: { review: updatedReview }
      });
    } catch (error) {
      console.error('Yorum güncelleme hatası:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Yorum güncellenemedi'
      });
    }
  }

  // ============================================
  // YORUM SİLME (DÜZELTİLDİ)
  // ============================================
  static async deleteReview(req, res) {
    try {
      const userId = req.user.userId;
      
      // 🔥 KRİTİK DÜZELTME: ID'yi hem 'id' hem 'reviewId' parametresinden kontrol et
      const reviewId = req.params.id || req.params.reviewId;

      if (!reviewId) {
        return res.status(400).json({ success: false, message: 'Geçersiz Yorum ID' });
      }

      // Modelde silme işlemini çağır
      const success = await Review.delete(reviewId, userId);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Yorum bulunamadı veya silme yetkiniz yok'
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

  // ============================================
  // YORUM BEĞENME (DÜZELTİLDİ)
  // ============================================
  static async likeReview(req, res) {
    try {
      const userId = req.user.userId;
      // 🔥 ID DÜZELTMESİ
      const reviewId = req.params.id || req.params.reviewId;

      if (!reviewId) return res.status(400).json({ success: false, message: 'ID yok' });

      await Review.likeReview(userId, reviewId);

      res.json({ success: true, message: 'Yorum beğenildi' });
    } catch (error) {
      console.error('Beğeni hatası:', error);
      res.status(400).json({ success: false, message: 'İşlem başarısız' });
    }
  }

  // ============================================
  // BEĞENİ KALDIRMA (DÜZELTİLDİ)
  // ============================================
  static async unlikeReview(req, res) {
    try {
      const userId = req.user.userId;
      // 🔥 ID DÜZELTMESİ
      const reviewId = req.params.id || req.params.reviewId;

      if (!reviewId) return res.status(400).json({ success: false, message: 'ID yok' });

      await Review.unlikeReview(userId, reviewId);

      res.json({ success: true, message: 'Beğeni kaldırıldı' });
    } catch (error) {
      console.error('Beğeni geri alma hatası:', error);
      res.status(400).json({ success: false, message: 'İşlem başarısız' });
    }
  }

  // ============================================
  // WATCHLIST İŞLEMLERİ
  // ============================================

  static async addToWatchlist(req, res) {
    try {
      const userId = req.user.userId;
      const { mediaId, status } = req.body;

      if (!mediaId) {
        return res.status(400).json({
          success: false,
          message: 'mediaId gereklidir'
        });
      }

      // Media var mı kontrol et
      const media = await Media.findById(mediaId);
      if (!media) {
        return res.status(404).json({
          success: false,
          message: 'İçerik bulunamadı'
        });
      }

      // Watchlist'e ekle
      const result = await Watchlist.addOrUpdate(userId, mediaId, status || 'plan_to');

      // Aktivite oluştur (sadece yeni eklemelerde)
      if (!result.updated) {
        await Activity.create({
          user_id: userId,
          activity_type: 'watchlist_add',
          media_id: mediaId,
          watchlist_id: result.id
        });
      }

      res.json({
        success: true,
        message: result.updated ? 'Durum güncellendi' : 'Listeye eklendi',
        data: result
      });
    } catch (error) {
      console.error('Watchlist ekleme hatası:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Listeye eklenemedi'
      });
    }
  }

  static async updateWatchlistStatus(req, res) {
    try {
      const userId = req.user.userId;
      const { mediaId } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'status gereklidir'
        });
      }

      const result = await Watchlist.updateStatus(userId, mediaId, status);

      res.json({
        success: true,
        message: 'Durum güncellendi',
        data: result
      });
    } catch (error) {
      console.error('Watchlist güncelleme hatası:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Durum güncellenemedi'
      });
    }
  }

  static async removeFromWatchlist(req, res) {
    try {
      const userId = req.user.userId;
      const { mediaId } = req.params;

      const success = await Watchlist.remove(userId, mediaId);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Listede bulunamadı'
        });
      }

      res.json({
        success: true,
        message: 'Listeden çıkarıldı'
      });
    } catch (error) {
      console.error('Watchlist çıkarma hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Listeden çıkarılamadı'
      });
    }
  }

  static async getWatchlistStats(req, res) {
    try {
      const userId = req.user.userId;

      const stats = await Watchlist.getUserWatchlistStats(userId);

      res.json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      console.error('Watchlist istatistik hatası:', error);
      res.status(500).json({
        success: false,
        message: 'İstatistikler alınamadı'
      });
    }
  }

  static async getCompletedItems(req, res) {
    try {
      const userId = req.user.userId;
      const { media_type, limit = 50, offset = 0 } = req.query;

      const items = await Watchlist.getCompleted(
        userId,
        media_type,
        parseInt(limit),
        parseInt(offset)
      );

      res.json({
        success: true,
        data: { items }
      });
    } catch (error) {
      console.error('Tamamlananlar getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Tamamlananlar getirilemedi'
      });
    }
  }

  // ============================================
  // ÖNERİLER
  // ============================================

  static async getRecommendations(req, res) {
    try {
      const userId = req.user.userId;
      const { limit = 20 } = req.query;

      const recommendations = await Watchlist.getRecommendations(userId, parseInt(limit));

      res.json({
        success: true,
        data: { recommendations }
      });
    } catch (error) {
      console.error('Öneri getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Öneriler getirilemedi'
      });
    }
  }

  // ============================================
  // TOPLU İŞLEMLER
  // ============================================

  static async bulkAddToWatchlist(req, res) {
    try {
      const userId = req.user.userId;
      const { mediaIds, status } = req.body;

      if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'mediaIds array gereklidir'
        });
      }

      const result = await Watchlist.bulkAdd(userId, mediaIds, status || 'plan_to');

      res.json({
        success: true,
        message: `${result.count} içerik listeye eklendi`,
        data: result
      });
    } catch (error) {
      console.error('Toplu ekleme hatası:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Toplu ekleme başarısız'
      });
    }
  }

  // ============================================
  // KULLANICI İSTATİSTİKLERİ
  // ============================================

  static async getUserCollectionStats(req, res) {
    try {
      const userId = req.user.userId;

      // Puan istatistikleri
      const ratingStats = await Rating.getUserRatingStats(userId);
      
      // Yorum istatistikleri
      const reviewStats = await Review.getUserReviewStats(userId);
      
      // Watchlist istatistikleri
      const watchlistStats = await Watchlist.getUserWatchlistStats(userId);

      res.json({
        success: true,
        data: {
          ratings: ratingStats,
          reviews: reviewStats,
          watchlist: watchlistStats
        }
      });
    } catch (error) {
      console.error('Koleksiyon istatistik hatası:', error);
      res.status(500).json({
        success: false,
        message: 'İstatistikler alınamadı'
      });
    }
  }

  // ============================================
  // ORTAK İÇERİKLER
  // ============================================

  static async getCommonRatings(req, res) {
    try {
      const userId1 = req.user.userId;
      const { userId2 } = req.params;

      const commonRatings = await Rating.getCommonRatings(userId1, userId2);

      res.json({
        success: true,
        data: { commonRatings }
      });
    } catch (error) {
      console.error('Ortak puanlar getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Ortak puanlar getirilemedi'
      });
    }
  }

  static async getCommonWatchlist(req, res) {
    try {
      const userId1 = req.user.userId;
      const { userId2 } = req.params;

      const commonItems = await Watchlist.getCommonItems(userId1, userId2);

      res.json({
        success: true,
        data: { commonItems }
      });
    } catch (error) {
      console.error('Ortak watchlist getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Ortak liste getirilemedi'
      });
    }
  }
}

module.exports = CollectionController;