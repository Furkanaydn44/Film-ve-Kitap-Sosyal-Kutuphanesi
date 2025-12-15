// config/database.js
const mysql = require('mysql2');

// ============================================
// MySQL Connection Pool Oluşturma
// ============================================

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '0000',
  database: process.env.DB_NAME || 'social_library',  // Düzelt!
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// Promise wrapper - async/await kullanabilmek için
const promisePool = pool.promise();

// ============================================
// Bağlantı Testi
// ============================================

const testConnection = async () => {
  try {
    const connection = await promisePool.getConnection();
    console.log('✅ MySQL veritabanına başarıyla bağlanıldı');
    console.log(`📊 Database: ${process.env.DB_NAME || 'social_library'}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MySQL bağlantı hatası:', error.message);
    return false;
  }
};

// ============================================
// Export - BURADA DEĞİŞİKLİK
// ============================================

// Tüm modellerde db.execute() kullanıyoruz, o yüzden direkt promisePool'u export et
module.exports = promisePool;

// Test fonksiyonunu ayrı export et
module.exports.testConnection = testConnection;