// models/ratingModel.js
const db = require('../config/database');
const Media = require('./mediaModel');

class Rating {
  // ============================================
  // PUAN VERME / GÜNCELLEME
  // ============================================

  /**
   * Kullanıcı bir media'ya puan verir
   * Eğer daha önce puan verdiyse günceller
   */
  static async createOrUpdate(userId, mediaId, rating) {
    // Rating 1-10 arasında olmalı
    if (rating < 1 || rating > 10) {
      throw new Error('Puan 1 ile 10 arasında olmalıdır');
    }

    try {
      // Önce var mı kontrol et
      const existing = await this.findByUserAndMedia(userId, mediaId);

      if (existing) {
        // Güncelle
        await db.execute(
          'UPDATE user_ratings SET rating = ?, updated_at = NOW() WHERE id = ?',
          [rating, existing.id]
        );

        // Media istatistiklerini güncelle
        await Media.updateRatingStats(mediaId);

        return {
          id: existing.id,
          user_id: userId,
          media_id: mediaId,
          rating,
          updated: true
        };
      } else {
        // Yeni oluştur
        const [result] = await db.execute(
          'INSERT INTO user_ratings (user_id, media_id, rating) VALUES (?, ?, ?)',
          [userId, mediaId, rating]
        );

        // Media istatistiklerini güncelle
        await Media.updateRatingStats(mediaId);

        return {
          id: result.insertId,
          user_id: userId,
          media_id: mediaId,
          rating,
          updated: false
        };
      }
    } catch (error) {
      console.error('Rating oluşturma/güncelleme hatası:', error);
      throw error;
    }
  }

  // ============================================
  // PUAN BULMA
  // ============================================

  static async findById(id) {
    const [ratings] = await db.execute(
      `SELECT r.*, 
        u.username, u.full_name, u.avatar_url,
        m.title as media_title, m.poster_url, m.media_type
       FROM user_ratings r
       JOIN users u ON r.user_id = u.id
       JOIN media_items m ON r.media_id = m.id
       WHERE r.id = ?`,
      [id]
    );
    return ratings[0] || null;
  }

  static async findByUserAndMedia(userId, mediaId) {
    const [ratings] = await db.execute(
      'SELECT * FROM user_ratings WHERE user_id = ? AND media_id = ?',
      [userId, mediaId]
    );
    return ratings[0] || null;
  }

  // ============================================
  // KULLANICI PUANLARI
  // ============================================

  /**
   * Bir kullanıcının verdiği tüm puanları getir
   */
  static async getUserRatings(userId, filters = {}, limit = 50, offset = 0) {
    const { media_type, min_rating, max_rating } = filters;

    let sql = `
      SELECT r.*, 
        m.title, m.poster_url, m.media_type, m.release_year,
        m.avg_rating, m.rating_count
      FROM user_ratings r
      JOIN media_items m ON r.media_id = m.id
      WHERE r.user_id = ?
    `;
    const params = [userId];

    if (media_type) {
      sql += ` AND m.media_type = ?`;
      params.push(media_type);
    }

    if (min_rating) {
      sql += ` AND r.rating >= ?`;
      params.push(min_rating);
    }

    if (max_rating) {
      sql += ` AND r.rating <= ?`;
      params.push(max_rating);
    }

    sql += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [ratings] = await db.execute(sql, params);
    return ratings;
  }

  /**
   * Kullanıcının ortalama puanı
   */
  static async getUserAverageRating(userId, mediaType = null) {
    let sql = `
      SELECT AVG(r.rating) as avg_rating, COUNT(*) as total_ratings
      FROM user_ratings r
    `;
    const params = [userId];

    if (mediaType) {
      sql += `
        JOIN media_items m ON r.media_id = m.id
        WHERE r.user_id = ? AND m.media_type = ?
      `;
      params.push(mediaType);
    } else {
      sql += ` WHERE r.user_id = ?`;
    }

    const [result] = await db.execute(sql, params);
    return result[0];
  }

  // ============================================
  // MEDIA PUANLARI
  // ============================================

  /**
   * Bir media'nın aldığı tüm puanları getir
   */
  static async getMediaRatings(mediaId, limit = 100, offset = 0) {
    const [ratings] = await db.execute(
      `SELECT r.*, 
        u.username, u.full_name, u.avatar_url
       FROM user_ratings r
       JOIN users u ON r.user_id = u.id
       WHERE r.media_id = ?
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [mediaId, limit, offset]
    );
    return ratings;
  }

  /**
   * Media'nın puan dağılımı (1-10 arası her puandan kaç tane var)
   */
  static async getMediaRatingDistribution(mediaId) {
    const [distribution] = await db.execute(
      `SELECT rating, COUNT(*) as count
       FROM user_ratings
       WHERE media_id = ?
       GROUP BY rating
       ORDER BY rating DESC`,
      [mediaId]
    );

    // 1-10 arası tüm puanlar için obje oluştur
    const result = {};
    for (let i = 1; i <= 10; i++) {
      result[i] = 0;
    }

    // Var olan puanları doldur
    distribution.forEach(item => {
      result[item.rating] = item.count;
    });

    return result;
  }

  // ============================================
  // PUAN SİLME
  // ============================================

  static async delete(userId, mediaId) {
    const [result] = await db.execute(
      'DELETE FROM user_ratings WHERE user_id = ? AND media_id = ?',
      [userId, mediaId]
    );

    if (result.affectedRows > 0) {
      // Media istatistiklerini güncelle
      await Media.updateRatingStats(mediaId);
      return true;
    }

    return false;
  }

  // ============================================
  // İSTATİSTİKLER
  // ============================================

  /**
   * En yüksek puanlı medyalar (belirli bir kullanıcı için)
   */
  static async getUserTopRated(userId, limit = 10) {
    const [ratings] = await db.execute(
      `SELECT r.*, 
        m.title, m.poster_url, m.media_type, m.release_year
       FROM user_ratings r
       JOIN media_items m ON r.media_id = m.id
       WHERE r.user_id = ?
       ORDER BY r.rating DESC, r.created_at DESC
       LIMIT ?`,
      [userId, limit]
    );
    return ratings;
  }

  /**
   * Kullanıcının son puanladıkları
   */
  static async getUserRecentRatings(userId, limit = 10) {
    const [ratings] = await db.execute(
      `SELECT r.*, 
        m.title, m.poster_url, m.media_type, m.release_year
       FROM user_ratings r
       JOIN media_items m ON r.media_id = m.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC
       LIMIT ?`,
      [userId, limit]
    );
    return ratings;
  }

  /**
   * İki kullanıcının ortak puanladığı medyalar
   */
  static async getCommonRatings(userId1, userId2) {
    const [ratings] = await db.execute(
      `SELECT 
        m.id, m.title, m.poster_url, m.media_type,
        r1.rating as user1_rating,
        r2.rating as user2_rating,
        ABS(r1.rating - r2.rating) as rating_diff
       FROM user_ratings r1
       JOIN user_ratings r2 ON r1.media_id = r2.media_id
       JOIN media_items m ON r1.media_id = m.id
       WHERE r1.user_id = ? AND r2.user_id = ?
       ORDER BY rating_diff ASC`,
      [userId1, userId2]
    );
    return ratings;
  }

  /**
   * Kullanıcının puan istatistikleri
   */
  static async getUserRatingStats(userId) {
    const [stats] = await db.execute(
      `SELECT 
        COUNT(*) as total_ratings,
        AVG(rating) as avg_rating,
        MIN(rating) as min_rating,
        MAX(rating) as max_rating,
        SUM(CASE WHEN m.media_type = 'movie' THEN 1 ELSE 0 END) as movie_ratings,
        SUM(CASE WHEN m.media_type = 'book' THEN 1 ELSE 0 END) as book_ratings
       FROM user_ratings r
       JOIN media_items m ON r.media_id = m.id
       WHERE r.user_id = ?`,
      [userId]
    );
    return stats[0];
  }
}

module.exports = Rating;