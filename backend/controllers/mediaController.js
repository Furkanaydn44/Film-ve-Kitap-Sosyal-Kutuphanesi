const db = require('../config/database'); // 🔥 BU SATIRIN OLDUĞUNDAN EMİN OL
const axios = require('axios');

// Modeller
const Media = require('../models/mediaModel'); 
const Rating = require('../models/ratingModel');
const Review = require('../models/reviewModel');
const Activity = require('../models/activityModel');

class MediaController {

  // ============================================
  // EN YÜKSEK PUANLI İÇERİKLER (YEREL DB)
  // ============================================
  static async getTopRated(req, res) {
    try {
      // Frontend'den gelen parametreler
      const { media_type, limit = 20 } = req.query;
      const limitVal = parseInt(limit, 10);

      console.log(`📊 Top Rated İsteği: Tür=${media_type}, Limit=${limitVal}`);

      // SQL Sorgusu: Sadece puanlanmış (avg_rating > 0) içerikleri getir
      let sql = `SELECT * FROM media_items WHERE avg_rating > 0`;
      const params = [];

      // Film veya Kitap ayrımı (eğer 'all' değilse)
      if (media_type && media_type !== 'all') {
        sql += ` AND media_type = ?`;
        params.push(media_type);
      }

      // Puana göre azalan sırada getir
      // 🔥 LIMIT değerini doğrudan string içine gömüyoruz (Hata önleyici)
      sql += ` ORDER BY avg_rating DESC, rating_count DESC LIMIT ${limitVal}`;

      // Sorguyu çalıştır
      const [media] = await db.execute(sql, params);

      res.json({
        success: true,
        data: { media }
      });
    } catch (error) {
      console.error('❌ Top Rated Hatası:', error); // Terminalde hatayı görmek için
      res.status(500).json({ 
        success: false, 
        message: 'Veri çekilemedi',
        error: error.message 
      });
    }
  }

  // =========================================================================
  // YARDIMCI API FONKSİYONLARI (TMDB & GOOGLE BOOKS)
  // =========================================================================

  static async fetchMovieFromTMDB(tmdbId) {
    try {
      const response = await axios.get(
        `https://api.themoviedb.org/3/movie/${tmdbId}`,
        {
          params: {
            api_key: process.env.TMDB_API_KEY,
            language: 'en-US',
            append_to_response: 'credits'
          }
        }
      );

      const movie = response.data;
      const director = movie.credits?.crew?.find(c => c.job === 'Director')?.name;

      return {
        external_id: movie.id.toString(),
        media_type: 'movie',
        title: movie.title,
        original_title: movie.original_title,
        overview: movie.overview,
        poster_url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
        backdrop_url: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null,
        release_year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
        runtime: movie.runtime,
        director,
        genres: movie.genres?.map(g => g.name) || [],
      };
    } catch (error) {
      if (error.response && error.response.status === 404) return null;
      console.error(`TMDB API Hatası (${tmdbId}):`, error.message);
      return null;
    }
  }

  static async fetchBookFromGoogle(googleId) {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/books/v1/volumes/${googleId}`
      );

      const book = response.data.volumeInfo;

      return {
        external_id: googleId,
        media_type: 'book',
        title: book.title,
        original_title: book.subtitle || null,
        overview: book.description ? book.description.substring(0, 5000) : null,
        poster_url: book.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
        backdrop_url: book.imageLinks?.large?.replace('http:', 'https:') || null,
        release_year: book.publishedDate ? parseInt(book.publishedDate.substring(0, 4)) : null,
        author: book.authors?.join(', ') || null,
        page_count: book.pageCount,
        publisher: book.publisher,
        isbn: book.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier || null,
        genres: book.categories || []
      };
    } catch (error) {
      if (error.response && error.response.status === 404) return null;
      console.error(`Google Books API Hatası (${googleId}):`, error.message);
      return null;
    }
  }

  // =========================================================================
  // DATABASE İŞLEMLERİ
  // =========================================================================

  static async saveMediaToDB(mediaData) {
    const {
      external_id, media_type, title, original_title, overview,
      poster_url, backdrop_url, release_year, runtime,
      director, author, page_count, publisher, isbn
    } = mediaData;

    const [existing] = await db.execute(
      'SELECT id FROM media_items WHERE external_id = ? AND media_type = ?',
      [external_id, media_type]
    );

    if (existing.length > 0) {
      return existing[0].id;
    }

    const sql = `
      INSERT INTO media_items (
        external_id, media_type, title, original_title, overview, 
        poster_url, backdrop_url, release_year, 
        runtime, director, author, page_count, publisher, isbn
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      external_id, media_type, title, original_title || null, overview || null,
      poster_url || null, backdrop_url || null, release_year || null,
      runtime || null, director || null, author || null, page_count || null, publisher || null, isbn || null
    ];

    const [result] = await db.execute(sql, values);
    return result.insertId;
  }

  // =========================================================================
  // ANA CONTROLLER METODLARI
  // =========================================================================

  static async getMediaDetail(req, res) {
    try {
      const { id } = req.params;
      const currentUserId = req.user?.userId;

      let media = null;

      if (!isNaN(id)) {
        const [rows] = await db.execute('SELECT * FROM media_items WHERE id = ?', [id]);
        if (rows.length > 0) media = rows[0];
      }

      if (!media) {
        const [rows] = await db.execute('SELECT * FROM media_items WHERE external_id = ?', [id]);
        if (rows.length > 0) media = rows[0];
      }

      if (!media) {
        let fetchedData = null;
        if (/[a-zA-Z]/.test(id)) {
          fetchedData = await MediaController.fetchBookFromGoogle(id);
        } else {
          fetchedData = await MediaController.fetchMovieFromTMDB(id);
          if (!fetchedData) {
             fetchedData = await MediaController.fetchBookFromGoogle(id);
          }
        }

        if (!fetchedData) {
          return res.status(404).json({ success: false, message: 'İçerik bulunamadı' });
        }

        const newId = await MediaController.saveMediaToDB(fetchedData);
        const [rows] = await db.execute('SELECT * FROM media_items WHERE id = ?', [newId]);
        media = rows[0];
      }

      let userData = null;
      if (currentUserId && media) {
        const [ratings] = await db.execute('SELECT rating FROM user_ratings WHERE user_id = ? AND media_id = ?', [currentUserId, media.id]);
        const [reviews] = await db.execute('SELECT review_text FROM user_reviews WHERE user_id = ? AND media_id = ?', [currentUserId, media.id]);
        const [watchlist] = await db.execute('SELECT status FROM user_watchlist WHERE user_id = ? AND media_id = ?', [currentUserId, media.id]);

        userData = {
            rating: ratings[0]?.rating || null,
            review: reviews[0]?.review_text || null,
            watchlist_status: watchlist[0]?.status || null
        };
      }

      const [stats] = await db.execute('SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM user_ratings WHERE media_id = ?', [media.id]);
      const [reviewCount] = await db.execute('SELECT COUNT(*) as count FROM user_reviews WHERE media_id = ?', [media.id]);

      media.average_rating = parseFloat(stats[0].avg_rating || 0);
      media.ratings_count = stats[0].count;
      media.reviews_count = reviewCount[0].count;

      res.json({ success: true, data: { media, userData } });

    } catch (error) {
      console.error('[MediaController] Hata:', error);
      res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
  }

  static async fetchAndCacheMedia(req, res) {
    try {
      const { external_id, media_type } = req.body;
      if (!external_id || !media_type) return res.status(400).json({ success: false, message: 'Eksik veri' });

      let mediaData;
      if (media_type === 'movie') mediaData = await MediaController.fetchMovieFromTMDB(external_id);
      else if (media_type === 'book') mediaData = await MediaController.fetchBookFromGoogle(external_id);
      else return res.status(400).json({ success: false, message: 'Geçersiz tip' });

      if (!mediaData) return res.status(404).json({ success: false, message: 'Bulunamadı' });

      const mediaId = await MediaController.saveMediaToDB(mediaData);
      const [rows] = await db.execute('SELECT * FROM media_items WHERE id = ?', [mediaId]);

      res.json({ success: true, message: 'Kaydedildi', data: { media: rows[0] } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Diğer tüm metodlar (aynen kalabilir, yer kaplamaması için kısalttım)
  static async searchMedia(req, res) {
      try {
          const { q, media_type, release_year, genre, min_rating, limit, offset } = req.query;
          const media = await Media.search(q, { media_type, release_year, genre, min_rating }, parseInt(limit), parseInt(offset));
          res.json({ success: true, data: { media } });
      } catch (e) { res.status(500).json({ success: false }); }
  }

  static async searchTMDB(req, res) {
      try {
          const { q, page } = req.query;
          const response = await axios.get('https://api.themoviedb.org/3/search/movie', { params: { api_key: process.env.TMDB_API_KEY, language: 'tr-TR', query: q, page } });
          const results = response.data.results.map(movie => ({ id: movie.id, title: movie.title, poster_url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null, release_year: movie.release_date ? new Date(movie.release_date).getFullYear() : null, vote_average: movie.vote_average, media_type: 'movie' }));
          res.json({ success: true, data: { results, page: response.data.page, total_pages: response.data.total_pages } });
      } catch(e) { res.status(500).json({success: false}); }
  }

  static async searchGoogleBooks(req, res) {
      try {
          const { q, startIndex } = req.query;
          const response = await axios.get('https://www.googleapis.com/books/v1/volumes', { params: { q, startIndex, maxResults: 20 } });
          const results = response.data.items?.map(item => ({ id: item.id, title: item.volumeInfo.title, poster_url: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || null, release_year: item.volumeInfo.publishedDate ? parseInt(item.volumeInfo.publishedDate.substring(0,4)) : null, media_type: 'book', averageRating: item.volumeInfo.averageRating })) || [];
          res.json({ success: true, data: { results } });
      } catch(e) { res.status(500).json({success: false}); }
  }

  static async getMostPopular(req, res) {
    try {
      const { media_type, limit } = req.query;
      const media = await Media.getMostPopular(media_type, parseInt(limit));
      res.json({ success: true, data: { media } });
    } catch (e) { res.status(500).json({ success: false }); }
  }

  static async getMediaRatings(req, res) {
    try {
      const { id } = req.params;
      const { limit, offset } = req.query;
      const ratings = await Rating.getMediaRatings(id, parseInt(limit), parseInt(offset));
      res.json({ success: true, data: { ratings } });
    } catch (e) { res.status(500).json({ success: false }); }
  }

  static async getMediaReviews(req, res) {
    try {
      const { id } = req.params;
      const { sort, limit, offset } = req.query;
      const reviews = await Review.getMediaReviews(id, { sort, limit: parseInt(limit), offset: parseInt(offset), userId: req.user?.userId });
      res.json({ success: true, data: { reviews } });
    } catch (e) { res.status(500).json({ success: false }); }
  }

  static async getSimilarMedia(req, res) {
    try {
      const { id } = req.params;
      const { limit } = req.query;
      const similarMedia = await Media.getSimilar(id, parseInt(limit));
      res.json({ success: true, data: { media: similarMedia } });
    } catch (e) { res.status(500).json({ success: false }); }
  }

  static async getMediaActivities(req, res) {
    try {
      const { id } = req.params;
      const { limit } = req.query;
      const activities = await Activity.getMediaActivities(id, parseInt(limit));
      res.json({ success: true, data: { activities } });
    } catch (e) { res.status(500).json({ success: false }); }
  }

  static async getByGenre(req, res) {
    try {
      const { genre } = req.params;
      const { media_type, limit } = req.query;
      const media = await Media.getByGenre(genre, media_type, parseInt(limit));
      res.json({ success: true, data: { media } });
    } catch (e) { res.status(500).json({ success: false }); }
  }

  static async getByYear(req, res) {
    try {
      const { year } = req.params;
      const { media_type, limit } = req.query;
      const media = await Media.getByYear(parseInt(year), media_type, parseInt(limit));
      res.json({ success: true, data: { media } });
    } catch (e) { res.status(500).json({ success: false }); }
  }
}

module.exports = MediaController;