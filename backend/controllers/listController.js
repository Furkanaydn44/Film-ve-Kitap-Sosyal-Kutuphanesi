// controllers/listController.js
const CustomList = require('../models/customListModel');
const Activity = require('../models/activityModel');
const User = require('../models/userModel');

class ListController {
  // ============================================
  // LİSTE OLUŞTURMA
  // ============================================

  static async createList(req, res) {
    try {
      const userId = req.user.userId;
      const { list_name, description, is_public } = req.body;

      if (!list_name || list_name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Liste adı gereklidir'
        });
      }

      const list = await CustomList.create(userId, {
        list_name,
        description,
        is_public: is_public !== undefined ? is_public : true
      });

      // Aktivite oluştur
      await Activity.create({
        user_id: userId,
        activity_type: 'list_create',
        list_id: list.id
      });

      res.status(201).json({
        success: true,
        message: 'Liste oluşturuldu',
        data: { list }
      });
    } catch (error) {
      console.error('Liste oluşturma hatası:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Liste oluşturulamadı'
      });
    }
  }

  // ============================================
  // LİSTE GÜNCELLEME
  // ============================================

  static async updateList(req, res) {
    try {
      const userId = req.user.userId;
      const listId = req.params.id;
      const { list_name, description, is_public } = req.body;

      const list = await CustomList.update(listId, userId, {
        list_name,
        description,
        is_public
      });

      res.json({
        success: true,
        message: 'Liste güncellendi',
        data: { list }
      });
    } catch (error) {
      console.error('Liste güncelleme hatası:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Liste güncellenemedi'
      });
    }
  }

  // ============================================
  // LİSTE SİLME
  // ============================================

  static async deleteList(req, res) {
    try {
      const userId = req.user.userId;
      const listId = req.params.id;

      const success = await CustomList.delete(listId, userId);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Liste bulunamadı'
        });
      }

      res.json({
        success: true,
        message: 'Liste silindi'
      });
    } catch (error) {
      console.error('Liste silme hatası:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Liste silinemedi'
      });
    }
  }

  // ============================================
  // LİSTE DETAYI
  // ============================================

  static async getListById(req, res) {
    try {
      const listId = req.params.id;
      const currentUserId = req.user?.userId;

      const list = await CustomList.findById(listId);

      if (!list) {
        return res.status(404).json({
          success: false,
          message: 'Liste bulunamadı'
        });
      }

      // Private liste ise sadece sahibi görebilir
      if (!list.is_public && list.user_id !== currentUserId) {
        return res.status(403).json({
          success: false,
          message: 'Bu liste privattır'
        });
      }

      // Liste öğelerini getir
      const items = await CustomList.getListItems(listId);

      res.json({
        success: true,
        data: {
          list,
          items,
          isOwner: currentUserId === list.user_id
        }
      });
    } catch (error) {
      console.error('Liste detay getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Liste detayı alınamadı'
      });
    }
  }

  // ============================================
  // KULLANICI LİSTELERİ
  // ============================================

  static async getUserLists(req, res) {
    try {
      const { username } = req.params;
      const currentUserId = req.user?.userId;

      const user = await User.findByUsername(username);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
      }

      // Kendi listelerine bakıyorsa private'ları da göster
      const includePrivate = currentUserId === user.id;
      const lists = await CustomList.getUserLists(user.id, includePrivate);

      res.json({
        success: true,
        data: { lists }
      });
    } catch (error) {
      console.error('Kullanıcı listeleri getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Listeler getirilemedi'
      });
    }
  }

  // ============================================
  // LİSTEYE ÖĞEE EKLEME
  // ============================================

  // ============================================
  // LİSTEYE ÖĞE EKLEME (DÜZELTİLMİŞ)
  // ============================================

  static async addItemToList(req, res) {
    try {
      const userId = req.user.userId;
      
      // 🔥 DÜZELTME 1: Route '/:id' olduğu için 'listId' değil 'id' alıyoruz
      const listId = req.params.id; 
      
      // 🔥 DÜZELTME 2: Frontend 'media_id' gönderiyor, onu karşılıyoruz
      const { media_id, note, list_order } = req.body;

      // Kontrolü de media_id üzerinden yapıyoruz
      if (!media_id) {
        return res.status(400).json({
          success: false,
          message: 'media_id gereklidir'
        });
      }

      // Model fonksiyonuna doğru parametreleri gönderiyoruz
      const item = await CustomList.addItem(listId, userId, media_id, {
        note,
        list_order
      });

      // Aktivite oluştururken de media_id kullanıyoruz
      await Activity.create({
        user_id: userId,
        activity_type: 'list_add',
        media_id: media_id,
        list_id: parseInt(listId)
      });

      res.status(201).json({
        success: true,
        message: 'Öğe listeye eklendi',
        data: { item }
      });
    } catch (error) {
      console.error('Liste öğesi ekleme hatası:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Öğe eklenemedi'
      });
    }
  }

  // ============================================
  // LİSTEDEN ÖĞEE ÇIKARMA
  // ============================================

  static async removeItemFromList(req, res) {
    try {
      const userId = req.user.userId;
      
      // 🔥 DÜZELTME: Route '/:id/items/:mediaId' olduğu için id'yi ayrı alıyoruz
      const listId = req.params.id; 
      const { mediaId } = req.params;

      const success = await CustomList.removeItem(listId, userId, mediaId);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Öğe listede bulunamadı'
        });
      }

      res.json({
        success: true,
        message: 'Öğe listeden çıkarıldı'
      });
    } catch (error) {
      console.error('Liste öğesi çıkarma hatası:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Öğe çıkarılamadı'
      });
    }
  }

  // ============================================
  // LİSTE ÖĞESİ GÜNCELLEME
  // ============================================

  static async updateListItem(req, res) {
    try {
      const userId = req.user.userId;
      const listId = req.params.id; 
      const { mediaId } = req.params;
      const { note, list_order } = req.body;

      const success = await CustomList.updateItem(listId, userId, mediaId, {
        note,
        list_order
      });

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Öğe listede bulunamadı'
        });
      }

      res.json({
        success: true,
        message: 'Öğe güncellendi'
      });
    } catch (error) {
      console.error('Liste öğesi güncelleme hatası:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Öğe güncellenemedi'
      });
    }
  }

  // ============================================
  // LİSTE SIRALAMA
  // ============================================

  static async reorderList(req, res) {
    try {
      const userId = req.user.userId;
      const listId = req.params.id;
      const { itemOrders } = req.body;

      // itemOrders: [{ media_id: 1, list_order: 0 }, ...]
      if (!itemOrders || !Array.isArray(itemOrders)) {
        return res.status(400).json({
          success: false,
          message: 'itemOrders array gereklidir'
        });
      }

      const success = await CustomList.reorderItems(listId, userId, itemOrders);

      res.json({
        success: true,
        message: 'Liste sıralaması güncellendi'
      });
    } catch (error) {
      console.error('Liste sıralama hatası:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Sıralama güncellenemedi'
      });
    }
  }

  // ============================================
  // LİSTE ARAMA
  // ============================================

  static async searchLists(req, res) {
    try {
      const { q, limit = 20, offset = 0 } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Arama terimi en az 2 karakter olmalıdır'
        });
      }

      const lists = await CustomList.search(q, parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        data: { lists }
      });
    } catch (error) {
      console.error('Liste arama hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Arama yapılamadı'
      });
    }
  }

  // ============================================
  // POPÜLER LİSTELER
  // ============================================

  static async getPopularLists(req, res) {
    try {
      const { limit = 20 } = req.query;

      const lists = await CustomList.getPopularLists(parseInt(limit));

      res.json({
        success: true,
        data: { lists }
      });
    } catch (error) {
      console.error('Popüler listeler getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Popüler listeler getirilemedi'
      });
    }
  }

  // ============================================
  // SON OLUŞTURULAN LİSTELER
  // ============================================

  static async getRecentLists(req, res) {
    try {
      const { limit = 20 } = req.query;

      const lists = await CustomList.getRecentLists(parseInt(limit));

      res.json({
        success: true,
        data: { lists }
      });
    } catch (error) {
      console.error('Son listeler getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Son listeler getirilemedi'
      });
    }
  }

  // ============================================
  // MEDIA İÇİN LİSTELER
  // ============================================

  static async getListsContainingMedia(req, res) {
    try {
      const { mediaId } = req.params;
      const currentUserId = req.user?.userId;

      const lists = await CustomList.getListsContainingMedia(mediaId, currentUserId);

      res.json({
        success: true,
        data: { lists }
      });
    } catch (error) {
      console.error('Media listeleri getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: 'Listeler getirilemedi'
      });
    }
  }

  // ============================================
  // LİSTE İSTATİSTİKLERİ
  // ============================================

  static async getUserListStats(req, res) {
    try {
      const { username } = req.params;

      const user = await User.findByUsername(username);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
      }

      const stats = await CustomList.getUserListStats(user.id);

      res.json({
        success: true,
        data: { stats }
      });
    } catch (error) {
      console.error('Liste istatistik hatası:', error);
      res.status(500).json({
        success: false,
        message: 'İstatistikler alınamadı'
      });
    }
  }

  // ============================================
  // TOPLU ÖĞEE EKLEME
  // ============================================

  static async bulkAddItems(req, res) {
    try {
      const userId = req.user.userId;
      const listId = req.params.id;
      const { mediaIds } = req.body;

      if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'mediaIds array gereklidir'
        });
      }

      const result = await CustomList.bulkAddItems(listId, userId, mediaIds);

      res.json({
        success: true,
        message: `${result.count} öğe listeye eklendi`,
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
}

module.exports = ListController;