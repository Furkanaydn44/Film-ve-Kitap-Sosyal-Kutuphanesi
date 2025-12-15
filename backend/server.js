// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// ============================================
// DATABASE BAĞLANTISI
// ============================================

const { testConnection } = require('./config/database');

// ============================================
// MIDDLEWARE
// ============================================

// Güvenlik
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS - Frontend'den gelen isteklere izin ver
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'Content-Type']
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (profil resimleri için)
app.use('/uploads', express.static('uploads'));

// ============================================
// ROUTES
// ============================================

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const collectionRoutes = require('./routes/collectionRoutes');
const activityRoutes = require('./routes/activityRoutes');
const listRoutes = require('./routes/listRoutes');
const likeRoutes = require('./routes/likeRoutes');

// Route mounting
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/likes', likeRoutes);

// ============================================
// TEST ROUTE
// ============================================

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🎬 Film & Kitap API çalışıyor!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      media: '/api/media',
      collections: '/api/collections',
      activities: '/api/activities',
      lists: '/api/lists',
      likes: '/api/likes'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server sağlıklı çalışıyor',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ============================================
// ERROR HANDLERS
// ============================================

const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

// ============================================
// SERVER BAŞLATMA
// ============================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Önce database bağlantısını test et
  const dbConnected = await testConnection();
  
  if (!dbConnected) {
    console.error('❌ Database bağlantısı kurulamadı. Server başlatılamıyor.');
    process.exit(1);
  }
  
  // Database bağlantısı başarılıysa server'ı başlat
  app.listen(PORT, () => {
    console.log('\n🚀 ================================');
    console.log(`✅ Server ${PORT} portunda çalışıyor`);
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('\n📚 API Endpoints:');
    console.log(`   🔐 Auth:        /api/auth`);
    console.log(`   👤 Users:       /api/users`);
    console.log(`   🎬 Media:       /api/media`);
    console.log(`   ⭐ Collections: /api/collections`);
    console.log(`   📱 Activities:  /api/activities`);
    console.log(`   📋 Lists:       /api/lists`);
    console.log(`   ❤️  Likes:       /api/likes`);
    console.log('================================\n');
  });
};

startServer();