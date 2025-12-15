const db = require('../config/database');

class Watchlist {
  // ============================================
  // EKLEME / GÜNCELLEME
  // ============================================

  static async addOrUpdate(userId, mediaId, status) {
    // Önce var mı diye kontrol et
    const [existing] = await db.execute(
      'SELECT id FROM user_watchlist WHERE user_id = ? AND media_id = ?',
      [userId, mediaId]
    );

    if (existing.length > 0) {
      // Varsa güncelle
      await db.execute(
        'UPDATE user_watchlist SET status = ?, added_at = NOW() WHERE id = ?',
        [status, existing[0].id]
      );
      return { id: existing[0].id, updated: true };
    } else {
      // Yoksa ekle
      const [result] = await db.execute(
        'INSERT INTO user_watchlist (user_id, media_id, status) VALUES (?, ?, ?)',
        [userId, mediaId, status]
      );
      return { id: result.insertId, updated: false };
    }
  }

  static async updateStatus(userId, mediaId, status) {
    const [result] = await db.execute(
      'UPDATE user_watchlist SET status = ? WHERE user_id = ? AND media_id = ?',
      [status, userId, mediaId]
    );
    return result.affectedRows > 0;
  }

  static async remove(userId, mediaId) {
    const [result] = await db.execute(
      'DELETE FROM user_watchlist WHERE user_id = ? AND media_id = ?',
      [userId, mediaId]
    );
    return result.affectedRows > 0;
  }

  // ============================================
  // LİSTELEME (Buradaki LIMIT sorunu düzeltildi)
  // ============================================

  static async getUserWatchlist(userId, filters = {}, limit = 50, offset = 0) {
    // 🔥 DÜZELTME: Sayıya çeviriyoruz
    const limitVal = parseInt(limit, 10);
    const offsetVal = parseInt(offset, 10);
    
    const { status, media_type, sort } = filters;

    let sql = `
      SELECT w.*,
        m.title, m.poster_url, m.media_type, m.release_year, 
        m.avg_rating, m.external_id,
        (SELECT rating FROM user_ratings WHERE user_id = w.user_id AND media_id = w.media_id) as user_rating
      FROM user_watchlist w
      JOIN media_items m ON w.media_id = m.id
      WHERE w.user_id = ?
    `;
    const params = [userId];

    if (status) {
      sql += ` AND w.status = ?`;
      params.push(status);
    }

    if (media_type) {
      sql += ` AND m.media_type = ?`;
      params.push(media_type);
    }

    // Sıralama
    if (sort === 'rating_desc') {
      sql += ` ORDER BY user_rating DESC, m.avg_rating DESC`;
    } else if (sort === 'oldest') {
      sql += ` ORDER BY w.added_at ASC`;
    } else {
      sql += ` ORDER BY w.added_at DESC`; // Varsayılan: En yeni eklenen
    }

    // 🔥 DÜZELTME: LIMIT ve OFFSET doğrudan gömüldü
    sql += ` LIMIT ${limitVal} OFFSET ${offsetVal}`;

    const [rows] = await db.execute(sql, params);
    return rows;
  }

  static async getCompleted(userId, media_type, limit = 50, offset = 0) {
    const limitVal = parseInt(limit, 10);
    const offsetVal = parseInt(offset, 10);

    let sql = `
      SELECT w.*, m.title, m.poster_url, m.media_type, m.release_year
      FROM user_watchlist w
      JOIN media_items m ON w.media_id = m.id
      WHERE w.user_id = ? AND w.status = 'completed'
    `;
    const params = [userId];

    if (media_type) {
      sql += ` AND m.media_type = ?`;
      params.push(media_type);
    }

    sql += ` ORDER BY w.completed_at DESC LIMIT ${limitVal} OFFSET ${offsetVal}`;

    const [rows] = await db.execute(sql, params);
    return rows;
  }

  // ============================================
  // İSTATİSTİKLER & DİĞER
  // ============================================

  static async getUserWatchlistStats(userId) {
    const [rows] = await db.execute(
      `SELECT 
        COUNT(*) as total_items,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN status = 'watching' THEN 1 ELSE 0 END) as watching_count,
        SUM(CASE WHEN status = 'plan_to' THEN 1 ELSE 0 END) as plan_to_count,
        SUM(CASE WHEN status = 'dropped' THEN 1 ELSE 0 END) as dropped_count
       FROM user_watchlist
       WHERE user_id = ?`,
      [userId]
    );
    return rows[0];
  }

  static async getRecommendations(userId, limit = 20) {
    const limitVal = parseInt(limit, 10);
    // Basit öneri: Yüksek puanlı ama kullanıcının listesinde olmayanlar
    const [rows] = await db.execute(
      `SELECT m.* FROM media_items m
       WHERE m.id NOT IN (SELECT media_id FROM user_watchlist WHERE user_id = ?)
       ORDER BY m.avg_rating DESC, m.rating_count DESC
       LIMIT ${limitVal}`,
      [userId]
    );
    return rows;
  }

  static async bulkAdd(userId, mediaIds, status) {
    if (!mediaIds.length) return { count: 0 };

    let addedCount = 0;
    for (const mediaId of mediaIds) {
      const res = await this.addOrUpdate(userId, mediaId, status);
      if (!res.updated) addedCount++;
    }
    return { count: addedCount };
  }

  static async getCommonItems(userId1, userId2) {
    const [rows] = await db.execute(
      `SELECT m.id, m.title, m.poster_url, w1.status as user1_status, w2.status as user2_status
       FROM user_watchlist w1
       JOIN user_watchlist w2 ON w1.media_id = w2.media_id
       JOIN media_items m ON w1.media_id = m.id
       WHERE w1.user_id = ? AND w2.user_id = ?`,
      [userId1, userId2]
    );
    return rows;
  }
}

module.exports = Watchlist;