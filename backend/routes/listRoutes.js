// routes/listRoutes.js
const express = require('express');
const router = express.Router();
const ListController = require('../controllers/listController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const {
  createListValidator,
  addItemToListValidator,
  paginationValidator,
  idParamValidator, // Bu genelde 'id' bekler
  mediaIdParamValidator,
  usernameParamValidator
} = require('../middleware/validators');

// ============================================
// LIST CRUD
// ============================================

router.post('/', authenticateToken, createListValidator, ListController.createList);

router.get('/:id', idParamValidator, optionalAuth, ListController.getListById);

router.put('/:id', authenticateToken, idParamValidator, ListController.updateList);

router.delete('/:id', authenticateToken, idParamValidator, ListController.deleteList);

// ============================================
// LIST ITEMS
// ============================================

// Buradakileri de :id ile uyumlu hale getiriyoruz (Controller'da buna dikkat edeceğiz)
router.post('/:id/items', authenticateToken, addItemToListValidator, ListController.addItemToList);

router.delete('/:id/items/:mediaId', authenticateToken, idParamValidator, ListController.removeItemFromList);

router.put('/:id/items/:mediaId', authenticateToken, idParamValidator, ListController.updateListItem);

router.put('/:id/reorder', authenticateToken, idParamValidator, ListController.reorderList);

router.post('/:id/items/bulk', authenticateToken, idParamValidator, ListController.bulkAddItems);

// ============================================
// USER LISTS & DISCOVER
// ============================================

router.get('/user/:username', usernameParamValidator, optionalAuth, ListController.getUserLists);
router.get('/user/:username/stats', usernameParamValidator, ListController.getUserListStats);
router.get('/search', paginationValidator, ListController.searchLists);
router.get('/discover/popular', paginationValidator, ListController.getPopularLists);
router.get('/discover/recent', paginationValidator, ListController.getRecentLists);
router.get('/media/:mediaId', mediaIdParamValidator, optionalAuth, ListController.getListsContainingMedia);

module.exports = router;