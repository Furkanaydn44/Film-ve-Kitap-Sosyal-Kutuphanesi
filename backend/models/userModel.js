// models/userModel.js
const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // ============================================
  // KULLANICI OLUŞTURMA
  // ============================================
  
  static async create({ username, email, password, full_name }) {
    try {
      // Şifreyi hashle
      const password_hash = await bcrypt.hash(password, 10);
      
      const [result] = await db.execute(
        `INSERT INTO users (username, email, password_hash, full_name) 
         VALUES (?, ?, ?, ?)`,
        [username, email, password_hash, full_name]
      );
      
      return {
        id: result.insertId,
        username,
        email,
        full_name
      };
    } catch (error) {
      // Duplicate entry hatası kontrolü
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.message.includes('username')) {
          throw new Error('Bu kullanıcı adı zaten kullanımda');
        }
        if (error.message.includes('email')) {
          throw new Error('Bu e-posta adresi zaten kullanımda');
        }
      }
      throw error;
    }
  }

  // ============================================
  // KULLANICI BULMA
  // ============================================

  static async findById(id) {
    const [users] = await db.execute(
      `SELECT id, username, email, full_name, bio, avatar_url, created_at, updated_at
       FROM users WHERE id = ?`,
      [id]
    );
    return users[0] || null;
  }

  static async findByEmail(email) {
    const [users] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return users[0] || null;
  }

  static async findByUsername(username) {
    const [users] = await db.execute(
      `SELECT id, username, email, full_name, bio, avatar_url, created_at, updated_at
       FROM users WHERE username = ?`,
      [username]
    );
    return users[0] || null;
  }

  // ============================================
  // ŞİFRE KONTROLÜ
  // ============================================

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // ============================================
  // PROFİL GÜNCELLEME
  // ============================================

  static async updateProfile(userId, { full_name, bio, avatar_url }) {
    const updates = [];
    const values = [];

    if (full_name !== undefined) {
      updates.push('full_name = ?');
      values.push(full_name);
    }
    if (bio !== undefined) {
      updates.push('bio = ?');
      values.push(bio);
    }
    if (avatar_url !== undefined) {
      updates.push('avatar_url = ?');
      values.push(avatar_url);
    }

    if (updates.length === 0) {
      throw new Error('Güncellenecek alan bulunamadı');
    }

    values.push(userId);

    await db.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return await this.findById(userId);
  }

  // ============================================
  // ŞİFRE DEĞİŞTİRME
  // ============================================

  static async updatePassword(userId, newPassword) {
    const password_hash = await bcrypt.hash(newPassword, 10);
    
    await db.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [password_hash, userId]
    );
    
    return true;
  }

  // ============================================
  // TAKİP SİSTEMİ
  // ============================================

  // Kullanıcıyı takip et
  static async follow(followerId, followingId) {
    try {
      await db.execute(
        'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
        [followerId, followingId]
      );
      return true;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Bu kullanıcıyı zaten takip ediyorsunuz');
      }
      throw error;
    }
  }

  // Takibi bırak
  static async unfollow(followerId, followingId) {
    const [result] = await db.execute(
      'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
      [followerId, followingId]
    );
    
    if (result.affectedRows === 0) {
      throw new Error('Bu kullanıcıyı zaten takip etmiyorsunuz');
    }
    
    return true;
  }

  // Takip durumunu kontrol et
  static async isFollowing(followerId, followingId) {
    const [rows] = await db.execute(
      'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?',
      [followerId, followingId]
    );
    return rows.length > 0;
  }

  // Takipçileri getir
   static async getFollowers(userId, limit = 50, offset = 0) {
    // Limit ve Offset'i doğrudan SQL stringine gömüyoruz (En garantili yöntem)
    const sql = `
      SELECT 
        u.id, 
        u.username, 
        u.full_name, 
        u.avatar_url, 
        f.created_at as followed_at
      FROM follows f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = ?
      ORDER BY f.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `;
    
    // Parametre dizisinde sadece userId kalıyor
    const [followers] = await db.execute(sql, [userId]);
    return followers;
  }

  // Takip edilenleri getir
  static async getFollowing(userId, limit = 50, offset = 0) {
    // Limit ve Offset'i doğrudan SQL stringine gömüyoruz
    const sql = `
      SELECT 
        u.id, 
        u.username, 
        u.full_name, 
        u.avatar_url, 
        f.created_at as followed_at
      FROM follows f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = ?
      ORDER BY f.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `;

    // Parametre dizisinde sadece userId kalıyor
    const [following] = await db.execute(sql, [userId]);
    return following;
  }

  // Takipçi ve takip edilen sayısını getir
  static async getFollowCounts(userId) {
    const [result] = await db.execute(
      `SELECT 
        (SELECT COUNT(*) FROM follows WHERE following_id = ?) as followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ?) as following_count`,
      [userId, userId]
    );
    return result[0];
  }

  // ============================================
  // İSTATİSTİKLER
  // ============================================

  static async getStats(userId) {
    const [stats] = await db.execute(
      `SELECT 
        (SELECT COUNT(*) FROM user_ratings WHERE user_id = ?) as ratings_count,
        (SELECT COUNT(*) FROM user_reviews WHERE user_id = ?) as reviews_count,
        (SELECT COUNT(*) FROM user_watchlist WHERE user_id = ?) as watchlist_count,
        (SELECT COUNT(*) FROM custom_lists WHERE user_id = ?) as lists_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ?) as following_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = ?) as followers_count`,
      [userId, userId, userId, userId, userId, userId]
    );
    return stats[0];
  }

  // ============================================
  // KULLANICI ARAMA
  // ============================================

  static async search(query, limit = 20, offset = 0) {
    const searchTerm = `%${query}%`;
    
    const [users] = await db.execute(
      `SELECT id, username, full_name, avatar_url, bio
       FROM users
       WHERE username LIKE ? OR full_name LIKE ?
       ORDER BY username
       LIMIT ? OFFSET ?`,
      [searchTerm, searchTerm, limit, offset]
    );
    
    return users;
  }

  // ============================================
  // KULLANICI SİLME
  // ============================================

  static async delete(userId) {
    const [result] = await db.execute(
      'DELETE FROM users WHERE id = ?',
      [userId]
    );
    
    return result.affectedRows > 0;
  }

  // ============================================
  // ŞİFRE SIFIRLAMA TOKEN
  // ============================================

  static async createPasswordResetToken(userId) {
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expires_at = new Date(Date.now() + 3600000); // 1 saat

    await db.execute(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at) 
       VALUES (?, ?, ?)`,
      [userId, token, expires_at]
    );

    return token;
  }

  static async verifyPasswordResetToken(token) {
    const [tokens] = await db.execute(
      `SELECT user_id FROM password_reset_tokens 
       WHERE token = ? AND expires_at > NOW() AND used = FALSE`,
      [token]
    );

    return tokens[0] || null;
  }

  static async markTokenAsUsed(token) {
    await db.execute(
      'UPDATE password_reset_tokens SET used = TRUE WHERE token = ?',
      [token]
    );
  }



  static async getSuggestions(userId, limit = 10, offset = 0, query = '') {
    let sql = `
       SELECT u.id, u.username, u.full_name, u.avatar_url, u.bio
       FROM users u
       WHERE u.id != ? 
       AND u.id NOT IN (SELECT following_id FROM follows WHERE follower_id = ?)
    `;

    const params = [userId, userId];

    // Arama varsa filtrele
    if (query) {
      sql += ` AND (u.username LIKE ? OR u.full_name LIKE ?)`;
      params.push('%${query}%', '%${query}%');
    }

    // Rastgelelik yerine ID veya Username sıralaması (Daha stabil sayfalama için)
    sql += ` ORDER BY u.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

    const [users] = await db.execute(sql, params);
    return users;
  }




  
}

module.exports = User;