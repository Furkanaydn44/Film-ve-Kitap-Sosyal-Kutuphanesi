// models/mediaModel.js
const db = require('../config/database');

class Media {
  // ============================================
  // MEDIA OLUŞTURMA / GÜNCELLEME
  // ============================================

  /**
   * Veritabanında media kaydı oluştur veya varsa güncelle
   * API'den çekilen veriyi cache'lemek için kullanılır
   */
  static async createOrUpdate(mediaData) {
    const {
      external_id,
      media_type,
      title,
      original_title,
      overview,
      poster_url,
      backdrop_url,
      release_year,
      runtime,
      director,
      author,
      page_count,
      publisher,
      isbn,
      genres,
      languages
    } = mediaData;

    try {
      // Önce var mı kontrol et
      const existing = await this.findByExternalId(external_id, media_type);

      if (existing) {
        // Varsa güncelle
        await db.execute(
          `UPDATE media_items SET
            title = ?,
            original_title = ?,
            overview = ?,
            poster_url = ?,
            backdrop_url = ?,
            release_year = ?,
            runtime = ?,
            director = ?,
            author = ?,
            page_count = ?,
            publisher = ?,
            isbn = ?,
            genres = ?,
            languages = ?
          WHERE id = ?`,
          [
            title,
            original_title || null,
            overview || null,
            poster_url || null,
            backdrop_url || null,
            release_year || null,
            runtime || null,
            director || null,
            author || null,
            page_count || null,
            publisher || null,
            isbn || null,
            genres ? JSON.stringify(genres) : null,
            languages ? JSON.stringify(languages) : null,
            existing.id
          ]
        );
        return existing.id;
      } else {
        // Yoksa yeni oluştur
        const [result] = await db.execute(
          `INSERT INTO media_items 
          (external_id, media_type, title, original_title, overview, poster_url, 
           backdrop_url, release_year, runtime, director, author, page_count, 
           publisher, isbn, genres, languages)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            external_id,
            media_type,
            title,
            original_title || null,
            overview || null,
            poster_url || null,
            backdrop_url || null,
            release_year || null,
            runtime || null,
            director || null,
            author || null,
            page_count || null,
            publisher || null,
            isbn || null,
            genres ? JSON.stringify(genres) : null,
            languages ? JSON.stringify(languages) : null
          ]
        );
        return result.insertId;
      }
    } catch (error) {
      console.error('Media oluşturma/güncelleme hatası:', error);
      throw error;
    }
  }

  // ============================================
  // MEDIA BULMA
  // ============================================

  static async findById(id) {
    const [media] = await db.execute(
      `SELECT *,
        genres = CAST(genres AS CHAR) as genres_json,
        languages = CAST(languages AS CHAR) as languages_json
       FROM media_items 
       WHERE id = ?`,
      [id]
    );

    if (media[0]) {
      // JSON alanları parse et
      media[0].genres = media[0].genres ? JSON.parse(media[0].genres) : [];
      media[0].languages = media[0].languages ? JSON.parse(media[0].languages) : [];
      delete media[0].genres_json;
      delete media[0].languages_json;
    }

    return media[0] || null;
  }

  static async findByExternalId(external_id, media_type) {
    const [media] = await db.execute(
      'SELECT * FROM media_items WHERE external_id = ? AND media_type = ?',
      [external_id, media_type]
    );

    if (media[0]) {
      media[0].genres = media[0].genres ? JSON.parse(media[0].genres) : [];
      media[0].languages = media[0].languages ? JSON.parse(media[0].languages) : [];
    }

    return media[0] || null;
  }

  // ============================================
  // ARAMA & FİLTRELEME
  // ============================================

  static async search(query, filters = {}, limit = 20, offset = 0) {
    const { media_type, release_year, genre, min_rating } = filters;
    
    let sql = `SELECT * FROM media_items WHERE 1=1`;
    const params = [];

    // Arama sorgusu
    if (query) {
      sql += ` AND (title LIKE ? OR original_title LIKE ?)`;
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm);
    }

    // Filtreler
    if (media_type) {
      sql += ` AND media_type = ?`;
      params.push(media_type);
    }

    if (release_year) {
      sql += ` AND release_year = ?`;
      params.push(release_year);
    }

    if (genre) {
      sql += ` AND JSON_CONTAINS(genres, ?)`;
      params.push(JSON.stringify(genre));
    }

    if (min_rating) {
      sql += ` AND avg_rating >= ?`;
      params.push(min_rating);
    }

    // Sıralama ve limit
    sql += ` ORDER BY avg_rating DESC, rating_count DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [results] = await db.execute(sql, params);

    // JSON parse
    results.forEach(item => {
      item.genres = item.genres ? JSON.parse(item.genres) : [];
      item.languages = item.languages ? JSON.parse(item.languages) : [];
    });

    return results;
  }

  // ============================================
  // POPÜLER & ÜST SIRALAR
  // ============================================

  static async getTopRated(media_type = null, limit = 20) {
    let sql = `
      SELECT * FROM media_items 
      WHERE rating_count >= 5
    `;
    const params = [];

    if (media_type) {
      sql += ` AND media_type = ?`;
      params.push(media_type);
    }

    sql += ` ORDER BY avg_rating DESC, rating_count DESC LIMIT ?`;
    params.push(limit);

    const [results] = await db.execute(sql, params);

    results.forEach(item => {
      item.genres = item.genres ? JSON.parse(item.genres) : [];
      item.languages = item.languages ? JSON.parse(item.languages) : [];
    });

    return results;
  }

  static async getMostPopular(media_type = null, limit = 20) {
    let sql = `
      SELECT * FROM media_items 
      WHERE 1=1
    `;
    const params = [];

    if (media_type) {
      sql += ` AND media_type = ?`;
      params.push(media_type);
    }

    sql += ` ORDER BY rating_count DESC, review_count DESC LIMIT ?`;
    params.push(limit);

    const [results] = await db.execute(sql, params);

    results.forEach(item => {
      item.genres = item.genres ? JSON.parse(item.genres) : [];
      item.languages = item.languages ? JSON.parse(item.languages) : [];
    });

    return results;
  }

  // ============================================
  // İSTATİSTİK GÜNCELLEME
  // ============================================

  /**
   * Media'nın ortalama puanını ve puan sayısını yeniden hesapla
   */
  static async updateRatingStats(mediaId) {
    const [stats] = await db.execute(
      `SELECT 
        COUNT(*) as rating_count,
        AVG(rating) as avg_rating
       FROM user_ratings 
       WHERE media_id = ?`,
      [mediaId]
    );

    const { rating_count, avg_rating } = stats[0];

    await db.execute(
      `UPDATE media_items 
       SET avg_rating = ?, rating_count = ?
       WHERE id = ?`,
      [avg_rating || 0, rating_count || 0, mediaId]
    );

    return { avg_rating, rating_count };
  }

  /**
   * Media'nın yorum sayısını güncelle
   */
  static async updateReviewCount(mediaId) {
    const [result] = await db.execute(
      `SELECT COUNT(*) as review_count 
       FROM user_reviews 
       WHERE media_id = ?`,
      [mediaId]
    );

    await db.execute(
      'UPDATE media_items SET review_count = ? WHERE id = ?',
      [result[0].review_count, mediaId]
    );

    return result[0].review_count;
  }

  // ============================================
  // TÜRLERE GÖRE FİLTRELEME
  // ============================================

  static async getByGenre(genre, media_type = null, limit = 20) {
    let sql = `
      SELECT * FROM media_items 
      WHERE JSON_CONTAINS(genres, ?)
    `;
    const params = [JSON.stringify(genre)];

    if (media_type) {
      sql += ` AND media_type = ?`;
      params.push(media_type);
    }

    sql += ` ORDER BY avg_rating DESC LIMIT ?`;
    params.push(limit);

    const [results] = await db.execute(sql, params);

    results.forEach(item => {
      item.genres = item.genres ? JSON.parse(item.genres) : [];
      item.languages = item.languages ? JSON.parse(item.languages) : [];
    });

    return results;
  }

  // ============================================
  // YILA GÖRE FİLTRELEME
  // ============================================

  static async getByYear(year, media_type = null, limit = 20) {
    let sql = `
      SELECT * FROM media_items 
      WHERE release_year = ?
    `;
    const params = [year];

    if (media_type) {
      sql += ` AND media_type = ?`;
      params.push(media_type);
    }

    sql += ` ORDER BY avg_rating DESC LIMIT ?`;
    params.push(limit);

    const [results] = await db.execute(sql, params);

    results.forEach(item => {
      item.genres = item.genres ? JSON.parse(item.genres) : [];
      item.languages = item.languages ? JSON.parse(item.languages) : [];
    });

    return results;
  }

  // ============================================
  // BENZERLERİ GETIR
  // ============================================

  static async getSimilar(mediaId, limit = 10) {
    // Önce hedef media'yı al
    const targetMedia = await this.findById(mediaId);
    if (!targetMedia) return [];

    // Aynı türden ve benzer genrelere sahip medyaları getir
    const [results] = await db.execute(
      `SELECT *, 
        (SELECT COUNT(*) FROM user_ratings WHERE media_id = media_items.id) as popularity
       FROM media_items 
       WHERE media_type = ? 
       AND id != ?
       AND release_year BETWEEN ? AND ?
       ORDER BY avg_rating DESC, popularity DESC
       LIMIT ?`,
      [
        targetMedia.media_type,
        mediaId,
        (targetMedia.release_year || 2000) - 5,
        (targetMedia.release_year || 2000) + 5,
        limit
      ]
    );

    results.forEach(item => {
      item.genres = item.genres ? JSON.parse(item.genres) : [];
      item.languages = item.languages ? JSON.parse(item.languages) : [];
    });

    return results;
  }

  // ============================================
  // MEDYA SİLME
  // ============================================

  static async delete(mediaId) {
    const [result] = await db.execute(
      'DELETE FROM media_items WHERE id = ?',
      [mediaId]
    );

    return result.affectedRows > 0;
  }

  // ============================================
  // TOPLU İŞLEMLER
  // ============================================

  static async getMultiple(mediaIds) {
    if (!mediaIds || mediaIds.length === 0) return [];

    const placeholders = mediaIds.map(() => '?').join(',');
    const [results] = await db.execute(
      `SELECT * FROM media_items WHERE id IN (${placeholders})`,
      mediaIds
    );

    results.forEach(item => {
      item.genres = item.genres ? JSON.parse(item.genres) : [];
      item.languages = item.languages ? JSON.parse(item.languages) : [];
    });

    return results;
  }

  static async getCommunityTopRated(mediaType, limit = 20, offset = 0, filters = {}) {
    let sql = `
      SELECT * FROM media_items 
      WHERE media_type = ? AND rating_count > 0 
    `;
    
    const params = [mediaType];

    // Puan Filtresi
    if (filters.min_rating) {
        sql += ` AND avg_rating >= ?`;
        params.push(filters.min_rating);
    }

    // Yıl Filtresi
    if (filters.year_min && filters.year_max) {
        sql += ` AND release_year BETWEEN ? AND ?`;
        params.push(filters.year_min, filters.year_max);
    }

    // Not: Tür filtresi JSON olduğu için biraz daha karmaşıktır.
    // Eğer genres sütununuz JSON ise:
    // if (filters.genre) { sql += ` AND JSON_CONTAINS(genres, ?)`; params.push(`"${filters.genre}"`); }

    sql += ` ORDER BY avg_rating DESC, rating_count DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

    const [rows] = await db.execute(sql, params);
    return rows;
  }


  
}

module.exports = Media;