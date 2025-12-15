const db = require('../config/database');

class CustomList {
  // ============================================
  // LİSTE OLUŞTURMA
  // ============================================

  static async create(userId, { list_name, description, is_public = true }) {
    if (!list_name || list_name.trim().length === 0) {
      throw new Error('Liste adı boş olamaz');
    }

    try {
      const [result] = await db.execute(
        'INSERT INTO custom_lists (user_id, list_name, description, is_public) VALUES (?, ?, ?, ?)',
        [userId, list_name, description || null, is_public]
      );

      return {
        id: result.insertId,
        user_id: userId,
        list_name,
        description,
        is_public
      };
    } catch (error) {
      console.error('Liste oluşturma hatası:', error);
      throw error;
    }
  }

  // ============================================
  // LİSTE GÜNCELLEME
  // ============================================

  static async update(listId, userId, { list_name, description, is_public }) {
    const list = await this.findById(listId);
    if (!list) {
      throw new Error('Liste bulunamadı');
    }

    if (list.user_id !== userId) {
      throw new Error('Bu listeyi düzenleme yetkiniz yok');
    }

    const updates = [];
    const params = [];

    if (list_name !== undefined) {
      updates.push('list_name = ?');
      params.push(list_name);
    }

    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }

    if (is_public !== undefined) {
      updates.push('is_public = ?');
      params.push(is_public);
    }

    if (updates.length === 0) {
      throw new Error('Güncellenecek alan bulunamadı');
    }

    params.push(listId);

    await db.execute(
      `UPDATE custom_lists SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      params
    );

    return await this.findById(listId);
  }

  // ============================================
  // LİSTE BULMA
  // ============================================

  static async findById(listId) {
    const [lists] = await db.execute(
      `SELECT l.*, 
        u.username, u.full_name, u.avatar_url,
        (SELECT COUNT(*) FROM custom_list_items WHERE list_id = l.id) as items_count
       FROM custom_lists l
       JOIN users u ON l.user_id = u.id
       WHERE l.id = ?`,
      [listId]
    );
    return lists[0] || null;
  }

  // ============================================
  // KULLANICI LİSTELERİ
  // ============================================

  static async getUserLists(userId, includePrivate = false) {
    let sql = `
      SELECT l.*, 
        (SELECT COUNT(*) FROM custom_list_items WHERE list_id = l.id) as items_count,
        (SELECT poster_url FROM media_items m JOIN custom_list_items cli ON cli.media_id = m.id WHERE cli.list_id = l.id ORDER BY cli.list_order ASC LIMIT 1) as cover_image
      FROM custom_lists l
      WHERE l.user_id = ?
    `;
    const params = [userId];

    if (!includePrivate) {
      sql += ` AND l.is_public = TRUE`;
    }

    sql += ` ORDER BY l.created_at DESC`;

    const [lists] = await db.execute(sql, params);
    return lists;
  }

  // ============================================
  // LİSTE İÇERİKLERİ (ÖNEMLİ DÜZELTME BURADA)
  // ============================================

  /**
   * Listedeki tüm öğeleri getir
   */
  static async getListItems(listId, limit = 100, offset = 0) {
    // 🔥 LIMIT/OFFSET DEĞERLERİNİ SAYIYA ÇEVİRİP GÖMÜYORUZ
    const limitVal = parseInt(limit, 10);
    const offsetVal = parseInt(offset, 10);

    const [items] = await db.execute(
      `SELECT li.*, 
        m.external_id, m.title, m.poster_url, m.backdrop_url,
        m.media_type, m.release_year, m.avg_rating, m.rating_count,
        m.runtime, m.director, m.author
       FROM custom_list_items li
       JOIN media_items m ON li.media_id = m.id
       WHERE li.list_id = ?
       ORDER BY li.list_order ASC, li.added_at ASC
       LIMIT ${limitVal} OFFSET ${offsetVal}`, 
      [listId]
    );
    return items;
  }

  /**
   * Listeye öğe ekle
   */
  static async addItem(listId, userId, mediaId, { note, list_order } = {}) {
    // Önce liste sahibi mi kontrol et
    const list = await this.findById(listId);
    if (!list) {
      throw new Error('Liste bulunamadı');
    }

    if (list.user_id !== userId) {
      throw new Error('Bu listeye öğe ekleme yetkiniz yok');
    }

    // Öğe zaten listede mi?
    const existing = await this.findListItem(listId, mediaId);
    if (existing) {
      throw new Error('Bu öğe zaten listede mevcut');
    }

    try {
      // Eğer list_order belirtilmemişse, en sona ekle
      if (list_order === undefined) {
        const [maxOrder] = await db.execute(
          'SELECT COALESCE(MAX(list_order), -1) + 1 as next_order FROM custom_list_items WHERE list_id = ?',
          [listId]
        );
        list_order = maxOrder[0].next_order;
      }

      const [result] = await db.execute(
        'INSERT INTO custom_list_items (list_id, media_id, list_order, note) VALUES (?, ?, ?, ?)',
        [listId, mediaId, list_order, note || null]
      );

      return {
        id: result.insertId,
        list_id: listId,
        media_id: mediaId,
        list_order,
        note
      };
    } catch (error) {
      console.error('Liste öğesi ekleme hatası:', error);
      throw error;
    }
  }

  /**
   * Listeden öğe çıkar
   */
  static async removeItem(listId, userId, mediaId) {
    // Önce liste sahibi mi kontrol et
    const list = await this.findById(listId);
    if (!list) {
      throw new Error('Liste bulunamadı');
    }

    if (list.user_id !== userId) {
      throw new Error('Bu listeden öğe çıkarma yetkiniz yok');
    }

    const [result] = await db.execute(
      'DELETE FROM custom_list_items WHERE list_id = ? AND media_id = ?',
      [listId, mediaId]
    );

    return result.affectedRows > 0;
  }

  /**
   * Liste öğesini güncelle (not, sıra)
   */
  static async updateItem(listId, userId, mediaId, { note, list_order }) {
    // Önce liste sahibi mi kontrol et
    const list = await this.findById(listId);
    if (!list) {
      throw new Error('Liste bulunamadı');
    }

    if (list.user_id !== userId) {
      throw new Error('Bu liste öğesini düzenleme yetkiniz yok');
    }

    const updates = [];
    const params = [];

    if (note !== undefined) {
      updates.push('note = ?');
      params.push(note);
    }

    if (list_order !== undefined) {
      updates.push('list_order = ?');
      params.push(list_order);
    }

    if (updates.length === 0) {
      throw new Error('Güncellenecek alan bulunamadı');
    }

    params.push(listId, mediaId);

    const [result] = await db.execute(
      `UPDATE custom_list_items SET ${updates.join(', ')} WHERE list_id = ? AND media_id = ?`,
      params
    );

    return result.affectedRows > 0;
  }

  /**
   * Liste öğesi var mı kontrol et
   */
  static async findListItem(listId, mediaId) {
    const [items] = await db.execute(
      'SELECT * FROM custom_list_items WHERE list_id = ? AND media_id = ?',
      [listId, mediaId]
    );
    return items[0] || null;
  }

  // ============================================
  // LİSTE SİLME
  // ============================================

  static async delete(listId, userId) {
    const list = await this.findById(listId);
    if (!list) {
      throw new Error('Liste bulunamadı');
    }

    if (list.user_id !== userId) {
      throw new Error('Bu listeyi silme yetkiniz yok');
    }

    const [result] = await db.execute(
      'DELETE FROM custom_lists WHERE id = ?',
      [listId]
    );

    return result.affectedRows > 0;
  }

  // ============================================
  // SIRA DEĞİŞTİRME
  // ============================================

  static async reorderItems(listId, userId, itemOrders) {
    const list = await this.findById(listId);
    if (!list) {
      throw new Error('Liste bulunamadı');
    }

    if (list.user_id !== userId) {
      throw new Error('Bu listeyi düzenleme yetkiniz yok');
    }

    try {
      await db.execute('START TRANSACTION');

      for (const item of itemOrders) {
        await db.execute(
          'UPDATE custom_list_items SET list_order = ? WHERE list_id = ? AND media_id = ?',
          [item.list_order, listId, item.media_id]
        );
      }

      await db.execute('COMMIT');
      return true;
    } catch (error) {
      await db.execute('ROLLBACK');
      console.error('Sıra değiştirme hatası:', error);
      throw error;
    }
  }

  // ============================================
  // ARAMA & KEŞİF (DÜZELTİLDİ)
  // ============================================

  static async search(query, limit = 20, offset = 0) {
    // 🔥 LIMIT DÜZELTMESİ
    const limitVal = parseInt(limit, 10);
    const offsetVal = parseInt(offset, 10);
    const searchTerm = `%${query}%`;

    const [lists] = await db.execute(
      `SELECT l.*, 
        u.username, u.full_name, u.avatar_url,
        (SELECT COUNT(*) FROM custom_list_items WHERE list_id = l.id) as items_count
       FROM custom_lists l
       JOIN users u ON l.user_id = u.id
       WHERE l.is_public = TRUE 
       AND (l.list_name LIKE ? OR l.description LIKE ?)
       ORDER BY items_count DESC, l.created_at DESC
       LIMIT ${limitVal} OFFSET ${offsetVal}`,
      [searchTerm, searchTerm]
    );

    return lists;
  }

  static async getPopularLists(limit = 20) {
    // 🔥 LIMIT DÜZELTMESİ
    const limitVal = parseInt(limit, 10);

    const [lists] = await db.execute(
      `SELECT l.*, 
        u.username, u.full_name, u.avatar_url,
        (SELECT COUNT(*) FROM custom_list_items WHERE list_id = l.id) as items_count
       FROM custom_lists l
       JOIN users u ON l.user_id = u.id
       WHERE l.is_public = TRUE
       ORDER BY items_count DESC, l.created_at DESC
       LIMIT ${limitVal}`,
      []
    );

    return lists;
  }

  static async getRecentLists(limit = 20) {
    // 🔥 LIMIT DÜZELTMESİ
    const limitVal = parseInt(limit, 10);

    const [lists] = await db.execute(
      `SELECT l.*, 
        u.username, u.full_name, u.avatar_url,
        (SELECT COUNT(*) FROM custom_list_items WHERE list_id = l.id) as items_count
       FROM custom_lists l
       JOIN users u ON l.user_id = u.id
       WHERE l.is_public = TRUE
       ORDER BY l.created_at DESC
       LIMIT ${limitVal}`,
      []
    );

    return lists;
  }

  // ============================================
  // BELİRLİ BİR MEDIA İÇİN LİSTELER
  // ============================================

  static async getListsContainingMedia(mediaId, userId = null) {
    let sql = `
      SELECT l.*, 
        u.username, u.full_name, u.avatar_url,
        (SELECT COUNT(*) FROM custom_list_items WHERE list_id = l.id) as items_count
      FROM custom_lists l
      JOIN users u ON l.user_id = u.id
      JOIN custom_list_items li ON l.id = li.list_id
      WHERE li.media_id = ?
    `;
    const params = [mediaId];

    if (userId) {
      sql += ` AND l.user_id = ?`;
      params.push(userId);
    } else {
      sql += ` AND l.is_public = TRUE`;
    }

    sql += ` ORDER BY l.created_at DESC`;

    const [lists] = await db.execute(sql, params);
    return lists;
  }

  // ============================================
  // İSTATİSTİKLER
  // ============================================

  static async getUserListStats(userId) {
    const [stats] = await db.execute(
      `SELECT 
        COUNT(*) as total_lists,
        SUM(CASE WHEN is_public = TRUE THEN 1 ELSE 0 END) as public_lists,
        SUM(CASE WHEN is_public = FALSE THEN 1 ELSE 0 END) as private_lists,
        (SELECT COUNT(*) FROM custom_list_items li 
         JOIN custom_lists l ON li.list_id = l.id 
         WHERE l.user_id = ?) as total_items
       FROM custom_lists
       WHERE user_id = ?`,
      [userId, userId]
    );
    return stats[0];
  }

  // ============================================
  // TOPLU İŞLEMLER
  // ============================================

  static async bulkAddItems(listId, userId, mediaIds) {
    if (!mediaIds || mediaIds.length === 0) {
      throw new Error('En az bir media ID gerekli');
    }

    // Önce liste sahibi mi kontrol et
    const list = await this.findById(listId);
    if (!list) {
      throw new Error('Liste bulunamadı');
    }

    if (list.user_id !== userId) {
      throw new Error('Bu listeye öğe ekleme yetkiniz yok');
    }

    try {
      const [maxOrder] = await db.execute(
        'SELECT COALESCE(MAX(list_order), -1) as max_order FROM custom_list_items WHERE list_id = ?',
        [listId]
      );

      let currentOrder = maxOrder[0].max_order + 1;
      const values = mediaIds.map(mediaId => {
        return [listId, mediaId, currentOrder++];
      });

      const placeholders = values.map(() => '(?, ?, ?)').join(',');
      const flatValues = values.flat();

      await db.execute(
        `INSERT IGNORE INTO custom_list_items (list_id, media_id, list_order) 
         VALUES ${placeholders}`,
        flatValues
      );

      return { success: true, count: mediaIds.length };
    } catch (error) {
      console.error('Toplu ekleme hatası:', error);
      throw error;
    }
  }
}

module.exports = CustomList;