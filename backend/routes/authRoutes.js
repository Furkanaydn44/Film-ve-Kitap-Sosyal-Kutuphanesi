// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const {
  registerValidator,
  loginValidator,
  passwordResetValidator
} = require('../middleware/validators');

/**
 * @route   POST /api/auth/register
 * @desc    Yeni kullanıcı kaydı
 * @access  Public
 */
router.post('/register', registerValidator, AuthController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Kullanıcı girişi
 * @access  Public
 */
router.post('/login', loginValidator, AuthController.login);

/**
 * @route   GET /api/auth/me
 * @desc    Mevcut kullanıcı bilgilerini getir
 * @access  Private
 */
router.get('/me', authenticateToken, AuthController.getCurrentUser);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Şifre sıfırlama isteği
 * @access  Public
 */
router.post('/forgot-password', AuthController.requestPasswordReset);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Şifre sıfırlama
 * @access  Public
 */
router.post('/reset-password', passwordResetValidator, AuthController.resetPassword);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Şifre değiştirme (giriş yapmış kullanıcı)
 * @access  Private
 */
router.put('/change-password', authenticateToken, AuthController.changePassword);

/**
 * @route   POST /api/auth/logout
 * @desc    Çıkış yap
 * @access  Private
 */
router.post('/logout', authenticateToken, AuthController.logout);

/**
 * @route   GET /api/auth/verify
 * @desc    Token doğrulama
 * @access  Private
 */
router.get('/verify', authenticateToken, AuthController.verifyToken);

module.exports = router;