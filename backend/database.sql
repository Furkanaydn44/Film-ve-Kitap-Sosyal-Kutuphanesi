-- ====================================
-- SOCIAL MEDIA LIBRARY DATABASE SCHEMA
-- ====================================

CREATE DATABASE IF NOT EXISTS web_service 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE web_service;

-- Root kullanıcısı şifresini ayarla
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '0000';

-- ====================================
-- USERS & AUTHENTICATION
-- ====================================

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  bio TEXT,
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email)
) ENGINE=InnoDB;

-- Şifre sıfırlama token'ları
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token)
) ENGINE=InnoDB;

-- ====================================
-- SOCIAL FEATURES
-- ====================================

-- Takip sistemi
CREATE TABLE IF NOT EXISTS follows (
  follower_id INT NOT NULL,
  following_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, following_id),
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_follower (follower_id),
  INDEX idx_following (following_id)
) ENGINE=InnoDB;

-- ====================================
-- MEDIA REFERENCE (Film & Kitap)
-- ====================================

-- Minimal media referans tablosu
-- Detaylı bilgiler API'den çekilecek
CREATE TABLE IF NOT EXISTS media_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  external_id VARCHAR(100) NOT NULL, -- TMDB ID veya Google Books ID
  media_type ENUM('movie', 'book', "tv") NOT NULL,
  title VARCHAR(255) NOT NULL,
  poster_url VARCHAR(512) NULL,
  release_year YEAR NULL ,
  original_title VARCHAR(255) NULL,
  overview TEXT NULL,
  backdrop_url VARCHAR(512) NULL,
  author VARCHAR(255) NULL,
  director VARCHAR(255) NULL,
  runtime INT NULL,
  page_count INT NULL,
  isbn VARCHAR(20) NULL,
  publisher VARCHAR(255) NULL,
  -- Platform istatistikleri (kendi verilerimiz)
  avg_rating DECIMAL(4,2) DEFAULT 0,
  rating_count INT DEFAULT 0,
  review_count INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  

  
  UNIQUE KEY unique_media (external_id, media_type),
  INDEX idx_media_type (media_type),
  INDEX idx_avg_rating (avg_rating)
) ENGINE=InnoDB;

-- ====================================
-- USER LIBRARY (Kütüphanem)
-- ====================================

-- Kullanıcı puanlamaları
CREATE TABLE IF NOT EXISTS user_ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  media_id INT NOT NULL,
  rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_rating (user_id, media_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (media_id) REFERENCES media_items(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_media_id (media_id)
) ENGINE=InnoDB;

-- Kullanıcı yorumları
CREATE TABLE IF NOT EXISTS user_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  media_id INT NOT NULL,
  review_text TEXT NOT NULL,
  is_spoiler BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_review (user_id, media_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (media_id) REFERENCES media_items(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_media_id (media_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- Watchlist / Readlist (İzlenecek/Okunacak)
CREATE TABLE IF NOT EXISTS user_watchlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  media_id INT NOT NULL,
  status ENUM('plan_to', 'watching', 'completed', 'dropped') DEFAULT 'plan_to',
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  UNIQUE KEY unique_user_watchlist (user_id, media_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (media_id) REFERENCES media_items(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- ====================================
-- CUSTOM LISTS (Özel Listeler)
-- ====================================

CREATE TABLE IF NOT EXISTS custom_lists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  list_name VARCHAR(255) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_list_name (list_name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS custom_list_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  list_id INT NOT NULL,
  media_id INT NOT NULL,
  list_order INT DEFAULT 0, -- Listedeki sıralama
  note TEXT, -- Kullanıcının bu içerik için notu
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_list_item (list_id, media_id),
  FOREIGN KEY (list_id) REFERENCES custom_lists(id) ON DELETE CASCADE,
  FOREIGN KEY (media_id) REFERENCES media_items(id) ON DELETE CASCADE,
  INDEX idx_list_id (list_id)
) ENGINE=InnoDB;

-- ====================================
-- ACTIVITY FEED (Sosyal Akış)
-- ====================================

CREATE TABLE IF NOT EXISTS activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  activity_type ENUM('rating', 'review', 'watchlist_add', 'list_create', 'list_add') NOT NULL,
  media_id INT, -- NULL olabilir (list_create için)
  
  -- İlgili kayıtlara referans
  rating_id INT,
  review_id INT,
  watchlist_id INT,
  list_id INT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (media_id) REFERENCES media_items(id) ON DELETE CASCADE,
  FOREIGN KEY (rating_id) REFERENCES user_ratings(id) ON DELETE CASCADE,
  FOREIGN KEY (review_id) REFERENCES user_reviews(id) ON DELETE CASCADE,
  FOREIGN KEY (watchlist_id) REFERENCES user_watchlist(id) ON DELETE CASCADE,
  FOREIGN KEY (list_id) REFERENCES custom_lists(id) ON DELETE CASCADE,
  
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_activity_type (activity_type)
) ENGINE=InnoDB;

-- ====================================
-- ENGAGEMENT (Beğeni & Yorumlar)
-- ====================================

-- Aktivitelere beğeni
CREATE TABLE IF NOT EXISTS activity_likes (
  user_id INT NOT NULL,
  activity_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, activity_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
  INDEX idx_activity_id (activity_id)
) ENGINE=InnoDB;

-- Yorumlara beğeni
CREATE TABLE IF NOT EXISTS review_likes (
  user_id INT NOT NULL,
  review_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, review_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (review_id) REFERENCES user_reviews(id) ON DELETE CASCADE,
  INDEX idx_review_id (review_id)
) ENGINE=InnoDB;

-- Aktivitelere yorum (Footer'daki yorumlar)
CREATE TABLE IF NOT EXISTS activity_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  activity_id INT NOT NULL,
  user_id INT NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_activity_id (activity_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- Aktivite yorumlarına beğeni
CREATE TABLE IF NOT EXISTS activity_comment_likes (
  user_id INT NOT NULL,
  comment_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, comment_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (comment_id) REFERENCES activity_comments(id) ON DELETE CASCADE,
  INDEX idx_comment_id (comment_id)
) ENGINE=InnoDB;

-- ====================================
-- ANALYTICS & STATISTICS (Opsiyonel)
-- ====================================

-- Platform istatistikleri için cache tablosu
CREATE TABLE IF NOT EXISTS platform_stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  stat_type ENUM('top_rated', 'most_popular', 'trending') NOT NULL,
  media_type ENUM('movie', 'book', 'all') DEFAULT 'all',
  cached_data JSON NOT NULL, -- Top 50 liste
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_stat (stat_type, media_type)
) ENGINE=InnoDB;
