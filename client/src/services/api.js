
// client/src/services/api.js
import axios from 'axios';

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Axios instance oluştur
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Her istekte token ekle
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Hata yönetimi
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token geçersiz, kullanıcıyı login'e yönlendir
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// ============================================
// AUTH API
// ============================================

export const authAPI = {
  // Kayıt ol
  register: (userData) => api.post('/auth/register', userData),
  
  // Giriş yap
  login: (credentials) => api.post('/auth/login', credentials),
  
  // Mevcut kullanıcıyı getir
  getCurrentUser: () => api.get('/auth/me'),
  
  // Şifre sıfırlama isteği
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  
  // Şifre sıfırla
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
  
  // Şifre değiştir
  changePassword: (currentPassword, newPassword) => api.put('/auth/change-password', { currentPassword, newPassword }),
  
  // Çıkış yap
  logout: () => api.post('/auth/logout'),
};

// ============================================
// USER API
// ============================================

export const userAPI = {
  // Kullanıcı ara
  searchUsers: (query, limit = 20, offset = 0) => 
    api.get('/users/search', { params: { q: query, limit, offset } }),
  
  // Profil getir
  getProfile: (username) => api.get(`/users/${username}`),
  
  // Profil güncelle
  updateProfile: (data) => api.put('/users/profile', data),
  
  // Avatar yükle
  uploadAvatar: (formData) => 
    api.post('/users/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  // Takip et
  followUser: (userId) => api.post(`/users/${userId}/follow`),
  
  // Takipten çık
  unfollowUser: (userId) => api.delete(`/users/${userId}/unfollow`),
  
  // Takipçiler
  getFollowers: (username, limit = 50, offset = 0) => 
    api.get(`/users/${username}/followers`, { params: { limit, offset } }),
  
  // Takip edilenler
  getFollowing: (username, limit = 50, offset = 0) => 
    api.get(`/users/${username}/following`, { params: { limit, offset } }),
  
  // Kullanıcı puanları
  getUserRatings: (username, filters = {}) => 
    api.get(`/users/${username}/ratings`, { params: filters }),
  
  // Kullanıcı yorumları
  getUserReviews: (username, filters = {}) => 
    api.get(`/users/${username}/reviews`, { params: filters }),
  
  // Kullanıcı watchlist
  getUserWatchlist: (username, filters = {}) => 
    api.get(`/users/${username}/watchlist`, { params: filters }),
  
  // Kullanıcı aktiviteleri
  getUserActivities: (username, filters = {}) => 
    api.get(`/users/${username}/activities`, { params: filters }),
  
  // İstatistikler
  getUserStats: (username) => api.get(`/users/${username}/stats`),
  
  // Hesap sil
  deleteAccount: (password) => api.delete('/users/account', { data: { password } }),


   getSuggestions: (limit = 10, offset = 0, query = '') => 
    api.get('/users/suggestions', { params: { limit, offset, q: query } }),
};

// ============================================
// MEDIA API
// ============================================

export const mediaAPI = {
  // TMDB'de film ara (canlı)
  searchTMDB: (query, page = 1) => 
    api.get('/media/search/tmdb', { params: { q: query, page } }),
  
  // Google Books'ta kitap ara (canlı)
  searchBooks: (query, startIndex = 0, maxResults = 20) => 
    api.get('/media/search/books', { params: { q: query, startIndex, maxResults } }),
  
  // Veritabanında ara
  searchMedia: (query, filters = {}) => 
    api.get('/media/search', { params: { q: query, ...filters } }),
  
  // API'den çek ve kaydet
  fetchAndCache: (externalId, mediaType) => 
    api.post('/media/fetch', { external_id: externalId, media_type: mediaType }),
  
  // Media detay
  getMediaDetail: (id) => api.get(`/media/${id}`),
  
  // En yüksek puanlılar
  getTopRated: (mediaType, limit = 20) => 
    api.get('/media/top-rated', { params: { media_type: mediaType, limit } }),
  
  // En popülerler
  getMostPopular: (mediaType, limit = 20) => 
    api.get('/media/popular', { params: { media_type: mediaType, limit } }),
  
  // Türe göre
  getByGenre: (genre, mediaType, limit = 20) => 
    api.get(`/media/genre/${genre}`, { params: { media_type: mediaType, limit } }),
  
  // Yıla göre
  getByYear: (year, mediaType, limit = 20) => 
    api.get(`/media/year/${year}`, { params: { media_type: mediaType, limit } }),
  
  // Media puanları
  getMediaRatings: (mediaId, limit = 100, offset = 0) => 
    api.get(`/media/${mediaId}/ratings`, { params: { limit, offset } }),
  
  // Media yorumları
  getMediaReviews: (mediaId, sort = 'recent', limit = 20, offset = 0) => 
    api.get(`/media/${mediaId}/reviews`, { params: { sort, limit, offset } }),
  
  // Benzer içerikler
  getSimilar: (mediaId, limit = 10) => 
    api.get(`/media/${mediaId}/similar`, { params: { limit } }),
  
  // Media aktiviteleri
  getMediaActivities: (mediaId, limit = 20) => 
    api.get(`/media/${mediaId}/activities`, { params: { limit } }),

  getBookDetail: (id) => api.get(`/media/${id}`),
  
  // Kitap detayı için özel endpoint (string ID için)
  getMediaDetail: (id) => api.get(`/media/${id}`),
  
  getMediaRatings: (mediaId, limit = 100, offset = 0) => 
   api.get(`/media/${mediaId}/ratings`, { params: { limit, offset } }),
  
  getMediaReviews: (mediaId, sort = 'recent', limit = 20, offset = 0) => 
    api.get(`/media/${mediaId}/reviews`, { params: { sort, limit, offset } }), 

  getCommunityTopRated: (mediaType, limit = 20, offset = 0, filters = {}) => 
    api.get('/media/community/top-rated', { 
      params: { 
        media_type: mediaType, 
        limit, 
        offset,
        ...filters // genre, year, min_rating buraya eklenecek
      } 
    })

};

// ============================================
// COLLECTION API (Rating, Review, Watchlist)
// ============================================

export const collectionAPI = {
  // Puan ver
  rateMedia: (mediaId, rating) => 
    api.post('/collections/rate', { mediaId, rating }),
  
  // Puanı sil
  deleteRating: (mediaId) => api.delete(`/collections/rate/${mediaId}`),
  
  // Puan dağılımı
  getRatingDistribution: (mediaId) => 
    api.get(`/collections/rating-distribution/${mediaId}`),
  
  // Yorum ekle
  createReview: (mediaId, reviewText, isSpoiler = false) => 
  api.post('/collections/review', { 
    media_id: mediaId,       // Burası mediaId değil, media_id olmalı!
    review_text: reviewText, // Burası reviewText değil, review_text olmalı!
    is_spoiler: isSpoiler 
  }),
  
  // Yorumu güncelle
  updateReview: (reviewId, reviewText, isSpoiler = false) => 
    api.put(`/collections/review/${reviewId}`, { 
      review_text: reviewText,  // Backend 'review_text' bekliyor
      is_spoiler: isSpoiler 
    }),

  deleteReview: (reviewId) => api.delete(`/collections/review/${reviewId}`),
  likeReview: (reviewId) => api.post(`/collections/review/${reviewId}/like`),
  unlikeReview: (reviewId) => api.delete(`/collections/review/${reviewId}/unlike`),
  
  // Watchlist'e ekle
  addToWatchlist: (mediaId, status = 'plan_to') => 
    api.post('/collections/watchlist', { mediaId, status }),
  
  // Watchlist durumunu güncelle
  updateWatchlistStatus: (mediaId, status) => 
    api.put(`/collections/watchlist/${mediaId}`, { status }),
  
  // Watchlist'ten çıkar
  removeFromWatchlist: (mediaId) => 
    api.delete(`/collections/watchlist/${mediaId}`),
  
  // Watchlist istatistikleri
  getWatchlistStats: () => api.get('/collections/watchlist/stats'),
  
  // Tamamlananlar
  getCompletedItems: (mediaType, limit = 50, offset = 0) => 
    api.get('/collections/watchlist/completed', { params: { media_type: mediaType, limit, offset } }),
  
  // Öneriler
  getRecommendations: (limit = 20) => 
    api.get('/collections/recommendations', { params: { limit } }),
  
  // Koleksiyon istatistikleri
  getCollectionStats: () => api.get('/collections/stats'),
  
  // Ortak puanlananlar
  getCommonRatings: (userId2) => 
    api.get(`/collections/common/ratings/${userId2}`),
  
  // Ortak watchlist
  getCommonWatchlist: (userId2) => 
    api.get(`/collections/common/watchlist/${userId2}`),
};

// ============================================
// ACTIVITY API
// ============================================

export const activityAPI = {
  // Kişisel feed
  getFeed: (limit = 15, offset = 0) => 
    api.get('/activities/feed', { params: { limit, offset } }),
  
  // Global feed
  getGlobalFeed: (filters = {}, limit = 20, offset = 0) => 
    api.get('/activities/global', { params: { ...filters, limit, offset } }),
  
  // Popüler aktiviteler
  getPopular: (timeframe = '7d', limit = 20) => 
    api.get('/activities/popular', { params: { timeframe, limit } }),
  
  // Aktivite detay
  getActivityById: (activityId) => api.get(`/activities/${activityId}`),
  
  // Aktiviteyi sil
  deleteActivity: (activityId) => api.delete(`/activities/${activityId}`),
  
  // Aktiviteyi beğen
  likeActivity: (activityId) => api.post(`/activities/${activityId}/like`),
  
  // Beğeniyi kaldır
  unlikeActivity: (activityId) => api.delete(`/activities/${activityId}/unlike`),
  
  // Beğenenleri getir
  getActivityLikes: (activityId, limit = 50, offset = 0) => 
    api.get(`/activities/${activityId}/likes`, { params: { limit, offset } }),
  
  // Aktivite yorumları
  getActivityComments: (activityId, limit = 50, offset = 0) => 
    api.get(`/activities/${activityId}/comments`, { params: { limit, offset } }),
  
  // Yorum ekle
  addComment: (activityId, commentText) => 
    api.post(`/activities/${activityId}/comments`, { commentText }),
  
  // Yorumu güncelle
  updateComment: (commentId, commentText) => 
    api.put(`/activities/comments/${commentId}`, { commentText }),
  
  // Yorumu sil
  deleteComment: (commentId) => api.delete(`/activities/comments/${commentId}`),
  
  // Yorumu beğen
  likeComment: (commentId) => api.post(`/activities/comments/${commentId}/like`),
  
  // Yorum beğenisini kaldır
  unlikeComment: (commentId) => api.delete(`/activities/comments/${commentId}/unlike`),
  
  // Kullanıcı aktivite istatistikleri
  getUserActivityStats: (username) => api.get(`/activities/user/${username}/stats`),
  
  // Beğendiğim aktiviteler
  getMyLikedActivities: (limit = 20, offset = 0) => 
    api.get('/activities/my/liked', { params: { limit, offset } }),
  
  // Yorumlarım
  getMyComments: (limit = 20, offset = 0) => 
    api.get('/activities/my/comments', { params: { limit, offset } }),
};

// ============================================
// LIST API
// ============================================

export const listAPI = {
  createList: (listName, description, isPublic = true) => 
    api.post('/lists', { list_name: listName, description, is_public: isPublic }),
  
  getListById: (listId) => api.get(`/lists/${listId}`),
  
  updateList: (listId, data) => api.put(`/lists/${listId}`, data),
  
  deleteList: (listId) => api.delete(`/lists/${listId}`),
  
  // 🔥 DÜZELTME BURADA: Backend 'media_id' beklediği için isimlendirmeyi değiştirdik
  addItemToList: (listId, mediaId, note, listOrder) => 
    api.post(`/lists/${listId}/items`, { 
      media_id: mediaId,  // 'mediaId' yerine 'media_id' gönderiyoruz
      note, 
      list_order: listOrder 
    }),

  removeItemFromList: (listId, mediaId) => 
    api.delete(`/lists/${listId}/items/${mediaId}`),
  
  updateListItem: (listId, mediaId, data) => 
    api.put(`/lists/${listId}/items/${mediaId}`, data),
  
  reorderList: (listId, itemOrders) => 
    api.put(`/lists/${listId}/reorder`, { itemOrders }),
  
  bulkAddItems: (listId, mediaIds) => 
    api.post(`/lists/${listId}/items/bulk`, { mediaIds }),
  
  getUserLists: (username) => api.get(`/lists/user/${username}`),
  getUserListStats: (username) => api.get(`/lists/user/${username}/stats`),
  searchLists: (query, limit = 20, offset = 0) => api.get('/lists/search', { params: { q: query, limit, offset } }),
  getPopularLists: (limit = 20) => api.get('/lists/discover/popular', { params: { limit } }),
  getRecentLists: (limit = 20) => api.get('/lists/discover/recent', { params: { limit } }),
  getListsContainingMedia: (mediaId) => api.get(`/lists/media/${mediaId}`),
 
};

export default api;







