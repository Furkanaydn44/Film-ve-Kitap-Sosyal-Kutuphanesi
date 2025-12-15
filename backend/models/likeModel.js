// models/likeModel.js
const db = require('../config/database');

class Like {
  // ============================================
  // AKTİVİTE BEĞENİLERİ
  // ============================================

  /**
   * Aktiviteyi beğen
   */
  static async likeActivity(userId, activityId) {
    try {
      await db.execute(
        'INSERT INTO activity_likes (user_id, activity_id) VALUES (?, ?)',
        [userId, activityId]
      );
      return true;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Bu aktiviteyi zaten beğenmişsiniz');
      }
      throw error;
    }
  }

  /**
   * Aktivite beğenisini kaldır
   */
  static async unlikeActivity(userId, activityId) {
    const [result] = await db.execute(
      'DELETE FROM activity_likes WHERE user_id = ? AND activity_id = ?',
      [userId, activityId]
    );

    if (result.affectedRows === 0) {
      throw new Error('Bu aktiviteyi beğenmemişsiniz');
    }

    return true;
  }

  /**
   * Kullanıcı bu aktiviteyi beğenmiş mi?
   */
  static async isActivityLiked(userId, activityId) {
    const [rows] = await db.execute(
      'SELECT 1 FROM activity_likes WHERE user_id = ? AND activity_id = ?',
      [userId, activityId]
    );
    return rows.length > 0;
  }

  /**
   * Aktiviteyi beğenen kullanıcıları getir
   */
  static async getActivityLikes(activityId, limit = 50, offset = 0) {
    const [likes] = await db.execute(
      `SELECT u.id, u.username, u.full_name, u.avatar_url, al.created_at
       FROM activity_likes al
       JOIN users u ON al.user_id = u.id
       WHERE al.activity_id = ?
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [activityId, limit, offset]
    );
    return likes;
  }

  /**
   * Aktivite beğeni sayısı
   */
  static async getActivityLikesCount(activityId) {
    const [result] = await db.execute(
      'SELECT COUNT(*) as count FROM activity_likes WHERE activity_id = ?',
      [activityId]
    );
    return result[0].count;
  }

  // ============================================
  // AKTİVİTE YORUMLARI
  // ============================================

  /**
   * Aktiviteye yorum ekle
   */
  static async addActivityComment(userId, activityId, commentText) {
    if (!commentText || commentText.trim().length === 0) {
      throw new Error('Yorum metni boş olamaz');
    }

    try {
      const [result] = await db.execute(
        'INSERT INTO activity_comments (activity_id, user_id, comment_text) VALUES (?, ?, ?)',
        [activityId, userId, commentText]
      );

      return {
        id: result.insertId,
        activity_id: activityId,
        user_id: userId,
        comment_text: commentText
      };
    } catch (error) {
      console.error('Yorum ekleme hatası:', error);
      throw error;
    }
  }

  /**
   * Yorumu güncelle
   */
  static async updateActivityComment(commentId, userId, commentText) {
    if (!commentText || commentText.trim().length === 0) {
      throw new Error('Yorum metni boş olamaz');
    }

    // Önce yorum sahibi mi kontrol et
    const comment = await this.getCommentById(commentId);
    if (!comment) {
      throw new Error('Yorum bulunamadı');
    }

    if (comment.user_id !== userId) {
      throw new Error('Bu yorumu düzenleme yetkiniz yok');
    }

    await db.execute(
      'UPDATE activity_comments SET comment_text = ?, updated_at = NOW() WHERE id = ?',
      [commentText, commentId]
    );

    return await this.getCommentById(commentId);
  }

  /**
   * Yorumu sil
   */
  static async deleteActivityComment(commentId, userId) {
    // Önce yorum sahibi mi kontrol et
    const comment = await this.getCommentById(commentId);
    if (!comment) {
      throw new Error('Yorum bulunamadı');
    }

    if (comment.user_id !== userId) {
      throw new Error('Bu yorumu silme yetkiniz yok');
    }

    const [result] = await db.execute(
      'DELETE FROM activity_comments WHERE id = ?',
      [commentId]
    );

    return result.affectedRows > 0;
  }

  /**
   * Yorum detayını getir
   */
  static async getCommentById(commentId) {
    const [comments] = await db.execute(
      `SELECT c.*, 
        u.username, u.full_name, u.avatar_url,
        (SELECT COUNT(*) FROM activity_comment_likes WHERE comment_id = c.id) as likes_count
       FROM activity_comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [commentId]
    );
    return comments[0] || null;
  }

  /**
   * Aktivitenin yorumlarını getir
   */
  static async getActivityComments(activityId, userId, limit = 50, offset = 0) {
    // 1. Limit ve Offset'i güvenli bir şekilde sayıya çeviriyoruz
    const limitVal = parseInt(limit, 10);
    const offsetVal = parseInt(offset, 10);

    // userId null veya undefined gelirse null olarak ayarla (SQL hatası almamak için)
    const currentUserId = userId || null;

    const [comments] = await db.execute(
      `SELECT c.*, 
        u.username, u.full_name, u.avatar_url,
        (SELECT COUNT(*) FROM activity_comment_likes WHERE comment_id = c.id) as likes_count,
        -- Kullanıcının beğenip beğenmediğini kontrol eden kısım:
        (SELECT COUNT(*) FROM activity_comment_likes WHERE comment_id = c.id AND user_id = ?) as user_liked
       FROM activity_comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.activity_id = ?
       ORDER BY c.created_at ASC
       LIMIT ${limitVal} OFFSET ${offsetVal}`, // 🔥 DÜZELTME: Değerleri buraya gömdük
      
      // 🔥 Parametre dizisinde sadece userId ve activityId kaldı
      [currentUserId, activityId] 
    );

    // user_liked değerini boolean'a çevir (1 -> true, 0 -> false)
    return comments.map(comment => ({
      ...comment,
      user_liked: comment.user_liked > 0
    }));
  }
  /**
   * Aktivite yorum sayısı
   */
  static async getActivityCommentsCount(activityId) {
    const [result] = await db.execute(
      'SELECT COUNT(*) as count FROM activity_comments WHERE activity_id = ?',
      [activityId]
    );
    return result[0].count;
  }

  // ============================================
  // YORUM BEĞENİLERİ
  // ============================================

  /**
   * Yorumu beğen
   */
  static async likeComment(userId, commentId) {
    try {
      await db.execute(
        'INSERT INTO activity_comment_likes (user_id, comment_id) VALUES (?, ?)',
        [userId, commentId]
      );
      return true;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Bu yorumu zaten beğenmişsiniz');
      }
      throw error;
    }
  }

  /**
   * Yorum beğenisini kaldır
   */
  static async unlikeComment(userId, commentId) {
    const [result] = await db.execute(
      'DELETE FROM activity_comment_likes WHERE user_id = ? AND comment_id = ?',
      [userId, commentId]
    );

    if (result.affectedRows === 0) {
      throw new Error('Bu yorumu beğenmemişsiniz');
    }

    return true;
  }

  /**
   * Kullanıcı bu yorumu beğenmiş mi?
   */
  static async isCommentLiked(userId, commentId) {
    const [rows] = await db.execute(
      'SELECT 1 FROM activity_comment_likes WHERE user_id = ? AND comment_id = ?',
      [userId, commentId]
    );
    return rows.length > 0;
  }

  /**
   * Yorumu beğenen kullanıcıları getir
   */
  static async getCommentLikes(commentId, limit = 50, offset = 0) {
    const [likes] = await db.execute(
      `SELECT u.id, u.username, u.full_name, u.avatar_url, cl.created_at
       FROM activity_comment_likes cl
       JOIN users u ON cl.user_id = u.id
       WHERE cl.comment_id = ?
       ORDER BY cl.created_at DESC
       LIMIT ? OFFSET ?`,
      [commentId, limit, offset]
    );
    return likes;
  }

  /**
   * Yorum beğeni sayısı
   */
  static async getCommentLikesCount(commentId) {
    const [result] = await db.execute(
      'SELECT COUNT(*) as count FROM activity_comment_likes WHERE comment_id = ?',
      [commentId]
    );
    return result[0].count;
  }

  // ============================================
  // KULLANICI İSTATİSTİKLERİ
  // ============================================

  /**
   * Kullanıcının verdiği beğeni istatistikleri
   */
  static async getUserLikeStats(userId) {
    const [stats] = await db.execute(
      `SELECT 
        (SELECT COUNT(*) FROM activity_likes WHERE user_id = ?) as activities_liked,
        (SELECT COUNT(*) FROM review_likes WHERE user_id = ?) as reviews_liked,
        (SELECT COUNT(*) FROM activity_comment_likes WHERE user_id = ?) as comments_liked
      FROM dual`,
      [userId, userId, userId]
    );
    return stats[0];
  }

  /**
   * Kullanıcının aldığı beğeni istatistikleri
   */
  static async getUserReceivedLikeStats(userId) {
    const [stats] = await db.execute(
      `SELECT 
        (SELECT COUNT(*) FROM activity_likes al 
         JOIN activities a ON al.activity_id = a.id 
         WHERE a.user_id = ?) as activities_likes_received,
        (SELECT COUNT(*) FROM review_likes rl 
         JOIN user_reviews r ON rl.review_id = r.id 
         WHERE r.user_id = ?) as reviews_likes_received,
        (SELECT COUNT(*) FROM activity_comment_likes cl 
         JOIN activity_comments c ON cl.comment_id = c.id 
         WHERE c.user_id = ?) as comments_likes_received
      FROM dual`,
      [userId, userId, userId]
    );
    return stats[0];
  }

  /**
   * Kullanıcının son yorumları
   */
  static async getUserRecentComments(userId, limit = 20, offset = 0) {
    const [comments] = await db.execute(
      `SELECT c.*, 
        a.activity_type,
        m.title as media_title, m.poster_url, m.media_type,
        (SELECT COUNT(*) FROM activity_comment_likes WHERE comment_id = c.id) as likes_count
       FROM activity_comments c
       JOIN activities a ON c.activity_id = a.id
       LEFT JOIN media_items m ON a.media_id = m.id
       WHERE c.user_id = ?
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
    return comments;
  }

  // ============================================
  // TOPLU İŞLEMLER
  // ============================================

  /**
   * Birden fazla aktivitenin beğeni durumunu kontrol et
   */
  static async checkMultipleActivityLikes(userId, activityIds) {
    if (!activityIds || activityIds.length === 0) {
      return {};
    }

    const placeholders = activityIds.map(() => '?').join(',');
    const [likes] = await db.execute(
      `SELECT activity_id 
       FROM activity_likes 
       WHERE user_id = ? AND activity_id IN (${placeholders})`,
      [userId, ...activityIds]
    );

    // Object olarak döndür: { activity_id: true/false }
    const result = {};
    activityIds.forEach(id => {
      result[id] = likes.some(like => like.activity_id === id);
    });

    return result;
  }

  /**
   * Kullanıcının beğendiği aktiviteleri getir
   */
  static async getUserLikedActivities(userId, limit = 20, offset = 0) {
    const [activities] = await db.execute(
      `SELECT a.*, 
        u.username, u.full_name, u.avatar_url,
        m.title as media_title, m.poster_url, m.media_type,
        al.created_at as liked_at,
        (SELECT COUNT(*) FROM activity_likes WHERE activity_id = a.id) as likes_count
       FROM activity_likes al
       JOIN activities a ON al.activity_id = a.id
       JOIN users u ON a.user_id = u.id
       LEFT JOIN media_items m ON a.media_id = m.id
       WHERE al.user_id = ?
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
    return activities;
  }

  // ============================================
  // TEMİZLİK İŞLEMLERİ
  // ============================================

  /**
   * Kullanıcının tüm beğenilerini sil (hesap silme için)
   */
  static async deleteAllUserLikes(userId) {
    await db.execute('DELETE FROM activity_likes WHERE user_id = ?', [userId]);
    await db.execute('DELETE FROM review_likes WHERE user_id = ?', [userId]);
    await db.execute('DELETE FROM activity_comment_likes WHERE user_id = ?', [userId]);
    return true;
  }

  /**
   * Kullanıcının tüm yorumlarını sil (hesap silme için)
   */
  static async deleteAllUserComments(userId) {
    const [result] = await db.execute(
      'DELETE FROM activity_comments WHERE user_id = ?',
      [userId]
    );
    return result.affectedRows;
  }
}

module.exports = Like;