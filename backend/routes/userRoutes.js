// routes/userRoutes.js - Düzeltilmiş Avatar Upload

const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { handleAvatarUpload } = require('../middleware/upload');
const {
  updateProfileValidator,
  usernameParamValidator,
  paginationValidator,
  userIdParamValidator
} = require('../middleware/validators');
/*
 * @route   POST /api/users/profile/avatar
 * @desc    Avatar yükle ve profili güncelle
 * @access  Private
 */
// DÜZELTME BURADA: '/avatar' YERİNE '/profile/avatar' YAZDIK 👇
router.post('/profile/avatar', authenticateToken, handleAvatarUpload, async (req, res) => {
  console.log("📸 Avatar yükleme isteği Router'a ulaştı!");
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Dosya yüklenmedi'
      });
    }

    // URL Oluşturma
    // Windows ters slash (\) sorununu önlemek için replace kullanıyoruz
    const relativePath = `/uploads/avatars/${req.file.filename}`.replace(/\\/g, '/');
    
    console.log('📤 Avatar yüklendi (Path):', relativePath);

    // Veritabanını güncelle
    const User = require('../models/userModel');
    // Sadece relative path'i (/uploads/...) kaydediyoruz. 
    // Frontend'deki getFullAvatarUrl fonksiyonu başına http://localhost:5000 ekleyecek.
    await User.updateProfile(req.user.userId, { avatar_url: relativePath });

    res.json({
      success: true,
      message: 'Avatar başarıyla yüklendi',
      data: { avatar_url: relativePath }
    });
  } catch (error) {
    console.error('Avatar yükleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Avatar yüklenirken bir hata oluştu'
    });
  }
});
// Diğer route'lar...
router.get('/search', UserController.searchUsers);
router.get('/suggestions', authenticateToken, UserController.getUserSuggestions);
router.get('/:username', optionalAuth, UserController.getProfile);
router.put('/profile', authenticateToken, UserController.updateProfile);
router.delete('/account', authenticateToken, UserController.deleteAccount);
router.post('/:userId/follow', authenticateToken, UserController.followUser);
router.delete('/:userId/unfollow', authenticateToken, UserController.unfollowUser);
router.get('/:username/followers', UserController.getFollowers);
router.get('/:username/following', UserController.getFollowing);
router.get('/:username/ratings', UserController.getUserRatings);
router.get('/:username/reviews', UserController.getUserReviews);
router.get('/:username/watchlist', UserController.getUserWatchlist);
router.get('/:username/activities', UserController.getUserActivities);
router.get('/:username/stats', UserController.getUserStats);


module.exports = router;