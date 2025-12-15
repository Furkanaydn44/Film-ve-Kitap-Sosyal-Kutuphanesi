const db = require('../config/database');

class Activity {
  // ============================================
  // AKTİVİTE OLUŞTURMA
  // ============================================

  static async create(activityData) {
    const {
      user_id,
      activity_type,
      media_id = null,
      rating_id = null,
      review_id = null,
      watchlist_id = null,
      list_id = null
    } = activityData;

    const validTypes = ['rating', 'review', 'watchlist_add', 'list_create', 'list_add'];
    
    if (!validTypes.includes(activity_type)) {
      throw new Error(`Geçersiz aktivite türü: ${activity_type}`);
    }

    try {
      const [result] = await db.execute(
        `INSERT INTO activities 
        (user_id, activity_type, media_id, rating_id, review_id, watchlist_id, list_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user_id, activity_type, media_id, rating_id, review_id, watchlist_id, list_id]
      );

      return {
        id: result.insertId,
        user_id,
        activity_type,
        media_id
      };
    } catch (error) {
      console.error('Aktivite oluşturma hatası:', error);
      throw error;
    }
  }

  // ============================================
  // AKTİVİTE BULMA
  // ============================================

  static async findById(id) {
    const [activities] = await db.execute(
      `SELECT a.*, 
        u.username, u.full_name, u.avatar_url,
        m.title as media_title, m.poster_url, m.media_type,
        (SELECT COUNT(*) FROM activity_likes WHERE activity_id = a.id) as likes_count,
        (SELECT COUNT(*) FROM activity_comments WHERE activity_id = a.id) as comments_count
       FROM activities a
       JOIN users u ON a.user_id = u.id
       LEFT JOIN media_items m ON a.media_id = m.id
       WHERE a.id = ?`,
      [id]
    );
    return activities[0] || null;
  }

  // ============================================
  // KİŞİSEL FEED (Kendi + Takip Edilenler)
  // ============================================
  static async getFeed(userId, limit = 15, offset = 0) {
    // 1. Değerleri kesin olarak tamsayıya çeviriyoruz (Güvenlik için)
    const limitVal = parseInt(limit, 10);
    const offsetVal = parseInt(offset, 10);

    // 2. SQL sorgusunda LIMIT ve OFFSET kısımlarındaki soru işaretlerini (?) kaldırıp,
    // değerleri doğrudan ${} ile gömüyoruz. Bu, "Incorrect arguments" hatasını %100 çözer.
    const [activities] = await db.execute(
      `SELECT a.*, 
        u.username, u.full_name, u.avatar_url,
        m.external_id, m.title as media_title, m.poster_url, m.media_type, m.release_year,
        (SELECT COUNT(*) FROM activity_likes WHERE activity_id = a.id) as likes_count,
        (SELECT COUNT(*) FROM activity_comments WHERE activity_id = a.id) as comments_count,
        (SELECT COUNT(*) FROM activity_likes WHERE activity_id = a.id AND user_id = ?) as user_liked
       FROM activities a
       JOIN users u ON a.user_id = u.id
       LEFT JOIN media_items m ON a.media_id = m.id
       WHERE a.user_id IN (
         SELECT following_id FROM follows WHERE follower_id = ?
       )
       OR a.user_id = ?
       ORDER BY a.created_at DESC
       LIMIT ${limitVal} OFFSET ${offsetVal}`, 
      
      // 3. Parametre dizisinden limit ve offset'i çıkardık (Çünkü yukarıya gömdük)
      [userId, userId, userId] 
    );

    // Her aktivite için detay bilgileri ekle (Bu kısım aynı kalıyor)
    for (let activity of activities) {
      activity.user_liked = activity.user_liked > 0;
      
      switch (activity.activity_type) {
        case 'rating':
          if (activity.rating_id) {
            const [rating] = await db.execute(
              'SELECT rating FROM user_ratings WHERE id = ?',
              [activity.rating_id]
            );
            activity.rating_value = rating[0]?.rating;
          }
          break;
        
        case 'review':
          if (activity.review_id) {
            const [review] = await db.execute(
              'SELECT review_text, is_spoiler FROM user_reviews WHERE id = ?',
              [activity.review_id]
            );
            if (review[0]) {
              activity.review_text = review[0].review_text.substring(0, 200);
              activity.review_full = review[0].review_text;
              activity.is_spoiler = review[0].is_spoiler;
              activity.has_more = review[0].review_text.length > 200;
            }
          }
          break;
        
        case 'watchlist_add':
          if (activity.watchlist_id) {
            const [watchlist] = await db.execute(
              'SELECT status FROM user_watchlist WHERE id = ?',
              [activity.watchlist_id]
            );
            activity.watchlist_status = watchlist[0]?.status;
          }
          break;
        
        case 'list_create':
        case 'list_add':
          if (activity.list_id) {
            const [list] = await db.execute(
              'SELECT list_name, is_public FROM custom_lists WHERE id = ?',
              [activity.list_id]
            );
            activity.list_name = list[0]?.list_name;
            activity.list_is_public = list[0]?.is_public;
          }
          break;
      }
    }

    return activities;
  }

  /**
   * Global feed (Filtreli)
   */
  static async getGlobalFeed(limit = 20, offset = 0, filters = {}) {
    const limitVal = parseInt(limit, 10);
    const offsetVal = parseInt(offset, 10);
    const { activity_type, media_type } = filters;

    let sql = `
      SELECT a.*, 
        u.username, u.full_name, u.avatar_url,
        m.external_id, m.title as media_title, m.poster_url, m.media_type,
        (SELECT COUNT(*) FROM activity_likes WHERE activity_id = a.id) as likes_count,
        (SELECT COUNT(*) FROM activity_comments WHERE activity_id = a.id) as comments_count
      FROM activities a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN media_items m ON a.media_id = m.id
      WHERE 1=1
    `;
    const params = [];

    if (activity_type) {
      sql += ` AND a.activity_type = ?`;
      params.push(activity_type);
    }

    if (media_type) {
      sql += ` AND m.media_type = ?`;
      params.push(media_type);
    }

    sql += ` ORDER BY a.created_at DESC LIMIT ${limitVal} OFFSET ${offsetVal}`; // 🔥 Düzeltildi

    const [activities] = await db.execute(sql, params);
    return activities; // Global feed için enrich yapmıyoruz (veya istenirse eklenebilir)
  }

  // ============================================
  // KULLANICI AKTİVİTELERİ (PROFİL SAYFASI İÇİN)
  // ============================================

  static async getUserActivities(userId, filters = {}, limit = 20, offset = 0) {
    const limitVal = parseInt(limit, 10);
    const offsetVal = parseInt(offset, 10);
    const { activity_type, media_type } = filters;

    let sql = `
      SELECT a.*, 
        u.username, u.full_name, u.avatar_url,
        m.external_id, m.title as media_title, m.poster_url, m.media_type, m.release_year,
        (SELECT COUNT(*) FROM activity_likes WHERE activity_id = a.id) as likes_count,
        (SELECT COUNT(*) FROM activity_comments WHERE activity_id = a.id) as comments_count
      FROM activities a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN media_items m ON a.media_id = m.id
      WHERE a.user_id = ?
    `;
    
    // params dizisine önce userId ekliyoruz (WHERE a.user_id = ?)
    const params = [userId];

    if (activity_type) {
      sql += ` AND a.activity_type = ?`;
      params.push(activity_type);
    }

    if (media_type) {
      sql += ` AND m.media_type = ?`;
      params.push(media_type);
    }

    // Limit ve Offset'i SQL stringine gömüyoruz
    sql += ` ORDER BY a.created_at DESC LIMIT ${limitVal} OFFSET ${offsetVal}`; // 🔥 Düzeltildi

    const [activities] = await db.execute(sql, params);

    return await this.enrichActivities(activities);
  }

  // ============================================
  // YARDIMCI METOD: Aktiviteleri Detaylandır
  // ============================================
  static async enrichActivities(activities) {
    for (let activity of activities) {
      // Boolean dönüşümü
      if (activity.hasOwnProperty('user_liked')) {
          activity.user_liked = activity.user_liked > 0;
      }
      
      switch (activity.activity_type) {
        case 'rating':
          if (activity.rating_id) {
            const [rating] = await db.execute(
              'SELECT rating FROM user_ratings WHERE id = ?',
              [activity.rating_id]
            );
            activity.rating_value = rating[0]?.rating;
          }
          break;
        
        case 'review':
          if (activity.review_id) {
            const [review] = await db.execute(
              'SELECT review_text, is_spoiler FROM user_reviews WHERE id = ?',
              [activity.review_id]
            );
            if (review[0]) {
              activity.review_text = review[0].review_text.substring(0, 200);
              activity.has_more = review[0].review_text.length > 200;
              activity.review_full = review[0].review_text; // Tam metin gerekebilir
            }
          }
          break;
        
        case 'watchlist_add':
          if (activity.watchlist_id) {
            const [watchlist] = await db.execute(
              'SELECT status FROM user_watchlist WHERE id = ?',
              [activity.watchlist_id]
            );
            activity.watchlist_status = watchlist[0]?.status;
          }
          break;
        
        case 'list_create':
        case 'list_add':
          if (activity.list_id) {
            const [list] = await db.execute(
              'SELECT list_name, description, is_public FROM custom_lists WHERE id = ?',
              [activity.list_id]
            );
            activity.list_name = list[0]?.list_name;
            activity.list_description = list[0]?.description;
            activity.list_is_public = list[0]?.is_public;
          }
          break;
      }
    }
    return activities;
  }

  // ============================================
  // DİĞER METODLAR
  // ============================================

  static async delete(activityId, userId) {
    const activity = await this.findById(activityId);
    if (!activity) throw new Error('Aktivite bulunamadı');
    if (activity.user_id !== userId) throw new Error('Yetkisiz işlem');

    const [result] = await db.execute('DELETE FROM activities WHERE id = ?', [activityId]);
    return result.affectedRows > 0;
  }

  static async getUserActivityStats(userId) {
    const [stats] = await db.execute(
      `SELECT 
        COUNT(*) as total_activities,
        SUM(CASE WHEN activity_type = 'rating' THEN 1 ELSE 0 END) as rating_activities,
        SUM(CASE WHEN activity_type = 'review' THEN 1 ELSE 0 END) as review_activities,
        SUM(CASE WHEN activity_type = 'watchlist_add' THEN 1 ELSE 0 END) as watchlist_activities,
        SUM(CASE WHEN activity_type = 'list_create' THEN 1 ELSE 0 END) as list_create_activities,
        (SELECT SUM((SELECT COUNT(*) FROM activity_likes WHERE activity_id = a2.id)) 
         FROM activities a2 WHERE a2.user_id = ?) as total_likes_received
       FROM activities a
       WHERE a.user_id = ?`,
      [userId, userId]
    );
    return stats[0];
  }

  static async getPopularActivities(limit = 20, timeframe = '7d') {
    const limitVal = parseInt(limit, 10);
    let dateCondition = '';
    
    if (timeframe === '24h') dateCondition = 'AND a.created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)';
    else if (timeframe === '7d') dateCondition = 'AND a.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    else if (timeframe === '30d') dateCondition = 'AND a.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';

    const [activities] = await db.execute(
      `SELECT a.*, 
        u.username, u.full_name, u.avatar_url,
        m.title as media_title, m.poster_url, m.media_type,
        (SELECT COUNT(*) FROM activity_likes WHERE activity_id = a.id) as likes_count,
        (SELECT COUNT(*) FROM activity_comments WHERE activity_id = a.id) as comments_count
       FROM activities a
       JOIN users u ON a.user_id = u.id
       LEFT JOIN media_items m ON a.media_id = m.id
       WHERE 1=1 ${dateCondition}
       ORDER BY likes_count DESC, comments_count DESC
       LIMIT ${limitVal}`, // 🔥 Düzeltildi
      []
    );
    return await this.enrichActivities(activities);
  }

  static async getMediaActivities(mediaId, limit = 20) {
    const limitVal = parseInt(limit, 10);
    const [activities] = await db.execute(
      `SELECT a.*, 
        u.username, u.full_name, u.avatar_url,
        (SELECT COUNT(*) FROM activity_likes WHERE activity_id = a.id) as likes_count
       FROM activities a
       JOIN users u ON a.user_id = u.id
       WHERE a.media_id = ?
       ORDER BY a.created_at DESC
       LIMIT ${limitVal}`, // 🔥 Düzeltildi
      [mediaId]
    );

    // Detayları ekle (Sadece rating için basit bir check yeterli olabilir bu fonksiyonda)
    for (let activity of activities) {
      if (activity.activity_type === 'rating' && activity.rating_id) {
        const [rating] = await db.execute('SELECT rating FROM user_ratings WHERE id = ?', [activity.rating_id]);
        activity.rating_value = rating[0]?.rating;
      }
    }
    return activities;
  }

  static async deleteAllUserActivities(userId) {
    const [result] = await db.execute('DELETE FROM activities WHERE user_id = ?', [userId]);
    return result.affectedRows;
  }
}

module.exports = Activity;