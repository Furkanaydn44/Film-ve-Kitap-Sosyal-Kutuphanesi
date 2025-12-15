// models/reviewModel.js
const db = require('../config/database');
const Media = require('./mediaModel');

class Review {
  // ============================================
  // YORUM OLUŞTURMA
  // ============================================

  static async create(userId, mediaId, reviewText, isSpoiler = false) {
    if (!reviewText || reviewText.trim().length === 0) {
      throw new Error('Yorum metni boş olamaz');
    }

    // Kullanıcı bu media için daha önce yorum yapmış mı?
    const existing = await this.findByUserAndMedia(userId, mediaId);
    if (existing) {
      throw new Error('Bu içerik için zaten yorum yapmışsınız. Yorumunuzu düzenleyebilirsiniz.');
    }

    try {
      const [result] = await db.execute(
        'INSERT INTO user_reviews (user_id, media_id, review_text, is_spoiler) VALUES (?, ?, ?, ?)',
        [userId, mediaId, reviewText, isSpoiler]
      );

      // Media'nın yorum sayısını güncelle
      await Media.updateReviewCount(mediaId);

      return {
        id: result.insertId,
        user_id: userId,
        media_id: mediaId,
        review_text: reviewText,
        is_spoiler: isSpoiler
      };
    } catch (error) {
      console.error('Yorum oluşturma hatası:', error);
      throw error;
    }
  }

  // ============================================
  // YORUM GÜNCELLEME
  // ============================================

  static async update(reviewId, userId, { reviewText, isSpoiler }) {
    // Önce yorum sahibi mi kontrol et
    const review = await this.findById(reviewId);
    if (!review) {
      throw new Error('Yorum bulunamadı');
    }

    if (review.user_id !== userId) {
      throw new Error('Bu yorumu düzenleme yetkiniz yok');
    }

    const updates = [];
    const params = [];

    if (reviewText !== undefined) {
      updates.push('review_text = ?');
      params.push(reviewText);
    }

    if (isSpoiler !== undefined) {
      updates.push('is_spoiler = ?');
      params.push(isSpoiler);
    }

    if (updates.length === 0) {
      throw new Error('Güncellenecek alan bulunamadı');
    }

    params.push(reviewId);

    await db.execute(
      `UPDATE user_reviews SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      params
    );

    return await this.findById(reviewId);
  }

  // ============================================
  // YORUM BULMA
  // ============================================

  static async findById(id) {
    const [reviews] = await db.execute(
      `SELECT r.*, 
        u.username, u.full_name, u.avatar_url,
        m.title as media_title, m.poster_url, m.media_type,
        (SELECT COUNT(*) FROM review_likes WHERE review_id = r.id) as likes_count
       FROM user_reviews r
       JOIN users u ON r.user_id = u.id
       JOIN media_items m ON r.media_id = m.id
       WHERE r.id = ?`,
      [id]
    );
    return reviews[0] || null;
  }

  static async findByUserAndMedia(userId, mediaId) {
    const [reviews] = await db.execute(
      'SELECT * FROM user_reviews WHERE user_id = ? AND media_id = ?',
      [userId, mediaId]
    );
    return reviews[0] || null;
  }

  // ============================================
  // KULLANICI YORUMLARI (DÜZELTİLMİŞ HALİ)
  // ============================================

  static async getUserReviews(userId, filters = {}, limit = 20, offset = 0) {
    const { media_type } = filters;
    
    // 🔥 DÜZELTME 1: Sayıya çeviriyoruz
    const limitVal = parseInt(limit, 10);
    const offsetVal = parseInt(offset, 10);

    let sql = `
      SELECT r.*, 
        m.title, m.poster_url, m.media_type, m.release_year,
        (SELECT COUNT(*) FROM review_likes WHERE review_id = r.id) as likes_count
      FROM user_reviews r
      JOIN media_items m ON r.media_id = m.id
      WHERE r.user_id = ?
    `;
    const params = [userId];

    if (media_type) {
      sql += ` AND m.media_type = ?`;
      params.push(media_type);
    }

    // 🔥 DÜZELTME 2: LIMIT ve OFFSET'i soru işareti (?) yerine direkt gömüyoruz
    sql += ` ORDER BY r.created_at DESC LIMIT ${limitVal} OFFSET ${offsetVal}`;
    
    // params.push(limit, offset); // BU SATIRI İPTAL ETTİK

    const [reviews] = await db.execute(sql, params);
    return reviews;
  }



  // ============================================
  // MEDIA YORUMLARI (DÜZELTİLMİŞ HALİ)
  // ============================================

  // ============================================
  // MEDIA YORUMLARI (DÜZELTİLMİŞ)
  // ============================================

  static async getMediaReviews(mediaId, options = {}) {
    const { 
      limit = 20, 
      offset = 0, 
      sort = 'recent', 
      userId = null 
    } = options;

    // 1. Limit ve Offset'i sayıya çeviriyoruz
    const limitVal = parseInt(limit, 10);
    const offsetVal = parseInt(offset, 10);

    let orderBy = 'r.created_at DESC';
    if (sort === 'likes') {
      orderBy = 'likes_count DESC, r.created_at DESC';
    } else if (sort === 'oldest') {
      orderBy = 'r.created_at ASC';
    }

    let sql = `
      SELECT r.*, 
        u.username, u.full_name, u.avatar_url,
        (SELECT COUNT(*) FROM review_likes WHERE review_id = r.id) as likes_count
    `;

    if (userId) {
      sql += `,
        (SELECT COUNT(*) FROM review_likes WHERE review_id = r.id AND user_id = ?) as user_liked
      `;
    }

    // 2. LIMIT ve OFFSET değerlerini '?' yerine direkt SQL içine gömüyoruz
    sql += `
      FROM user_reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.media_id = ?
      ORDER BY ${orderBy}
      LIMIT ${limitVal} OFFSET ${offsetVal}
    `;

    // 3. Params dizisinden limit ve offset'i ÇIKARIYORUZ (Sadece ID'ler kalıyor)
    const params = userId ? [userId, mediaId] : [mediaId];
    
    const [reviews] = await db.execute(sql, params);

    if (userId) {
      reviews.forEach(review => {
        review.user_liked = review.user_liked > 0;
      });
    }

    return reviews;
  }

  // ============================================
  // YORUM SİLME
  // ============================================

  static async delete(reviewId, userId) {
    // Önce yorum sahibi mi kontrol et
    const review = await this.findById(reviewId);
    if (!review) {
      throw new Error('Yorum bulunamadı');
    }

    if (review.user_id !== userId) {
      throw new Error('Bu yorumu silme yetkiniz yok');
    }

    const [result] = await db.execute(
      'DELETE FROM user_reviews WHERE id = ?',
      [reviewId]
    );

    if (result.affectedRows > 0) {
      // Media'nın yorum sayısını güncelle
      await Media.updateReviewCount(review.media_id);
      return true;
    }

    return false;
  }

  // ============================================
  // YORUM BEĞENİ SİSTEMİ
  // ============================================

  static async likeReview(userId, reviewId) {
    try {
      await db.execute(
        'INSERT INTO review_likes (user_id, review_id) VALUES (?, ?)',
        [userId, reviewId]
      );
      return true;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Bu yorumu zaten beğenmişsiniz');
      }
      throw error;
    }
  }

  static async unlikeReview(userId, reviewId) {
    const [result] = await db.execute(
      'DELETE FROM review_likes WHERE user_id = ? AND review_id = ?',
      [userId, reviewId]
    );

    if (result.affectedRows === 0) {
      throw new Error('Bu yorumu beğenmemişsiniz');
    }

    return true;
  }

  static async isReviewLiked(userId, reviewId) {
    const [rows] = await db.execute(
      'SELECT 1 FROM review_likes WHERE user_id = ? AND review_id = ?',
      [userId, reviewId]
    );
    return rows.length > 0;
  }

  static async getReviewLikes(reviewId, limit = 50, offset = 0) {
    const [likes] = await db.execute(
      `SELECT u.id, u.username, u.full_name, u.avatar_url, rl.created_at
       FROM review_likes rl
       JOIN users u ON rl.user_id = u.id
       WHERE rl.review_id = ?
       ORDER BY rl.created_at DESC
       LIMIT ? OFFSET ?`,
      [reviewId, limit, offset]
    );
    return likes;
  }

  // ============================================
  // YORUM İSTATİSTİKLERİ
  // ============================================

  static async getUserReviewStats(userId) {
    const [stats] = await db.execute(
      `SELECT 
        COUNT(*) as total_reviews,
        SUM(CASE WHEN m.media_type = 'movie' THEN 1 ELSE 0 END) as movie_reviews,
        SUM(CASE WHEN m.media_type = 'book' THEN 1 ELSE 0 END) as book_reviews,
        (SELECT SUM((SELECT COUNT(*) FROM review_likes WHERE review_id = r2.id)) 
         FROM user_reviews r2 WHERE r2.user_id = ?) as total_likes_received
       FROM user_reviews r
       JOIN media_items m ON r.media_id = m.id
       WHERE r.user_id = ?`,
      [userId, userId]
    );
    return stats[0];
  }

  static async getPopularReviews(limit = 20, mediaType = null) {
    let sql = `
      SELECT r.*, 
        u.username, u.full_name, u.avatar_url,
        m.title, m.poster_url, m.media_type,
        (SELECT COUNT(*) FROM review_likes WHERE review_id = r.id) as likes_count
      FROM user_reviews r
      JOIN users u ON r.user_id = u.id
      JOIN media_items m ON r.media_id = m.id
    `;
    const params = [];

    if (mediaType) {
      sql += ` WHERE m.media_type = ?`;
      params.push(mediaType);
    }

    sql += `
      ORDER BY likes_count DESC, r.created_at DESC
      LIMIT ?
    `;
    params.push(limit);

    const [reviews] = await db.execute(sql, params);
    return reviews;
  }

  static async getRecentReviews(limit = 20, mediaType = null) {
    let sql = `
      SELECT r.*, 
        u.username, u.full_name, u.avatar_url,
        m.title, m.poster_url, m.media_type,
        (SELECT COUNT(*) FROM review_likes WHERE review_id = r.id) as likes_count
      FROM user_reviews r
      JOIN users u ON r.user_id = u.id
      JOIN media_items m ON r.media_id = m.id
    `;
    const params = [];

    if (mediaType) {
      sql += ` WHERE m.media_type = ?`;
      params.push(mediaType);
    }

    sql += `
      ORDER BY r.created_at DESC
      LIMIT ?
    `;
    params.push(limit);

    const [reviews] = await db.execute(sql, params);
    return reviews;
  }
}

module.exports = Review;