// client/src/services/api.js - DÜZELTILMIŞ
import axios from 'axios';

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Axios instance oluştur
const api = axios.create({
  baseURL: API_URL,
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
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, new_password: newPassword }),
  changePassword: (currentPassword, newPassword) => api.put('/auth/change-password', { current_password: currentPassword, new_password: newPassword }),
  logout: () => api.post('/auth/logout'),
};

// ============================================
// USER API
// ============================================

export const userAPI = {
  searchUsers: (query, limit = 20, offset = 0) => 
    api.get('/users/search', { params: { q: query, limit, offset } }),
  getProfile: (username) => api.get(`/users/${username}`),
  updateProfile: (data) => api.put('/users/profile', data),
  uploadAvatar: (formData) => 
    api.post('/users/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  followUser: (userId) => api.post(`/users/${userId}/follow`),
  unfollowUser: (userId) => api.delete(`/users/${userId}/unfollow`),
  getFollowers: (username, limit = 50, offset = 0) => 
    api.get(`/users/${username}/followers`, { params: { limit, offset } }),
  getFollowing: (username, limit = 50, offset = 0) => 
    api.get(`/users/${username}/following`, { params: { limit, offset } }),
  getUserRatings: (username, filters = {}) => 
    api.get(`/users/${username}/ratings`, { params: filters }),
  getUserReviews: (username, filters = {}) => 
    api.get(`/users/${username}/reviews`, { params: filters }),
  getUserWatchlist: (username, filters = {}) => 
    api.get(`/users/${username}/watchlist`, { params: filters }),
  getUserActivities: (username, filters = {}) => 
    api.get(`/users/${username}/activities`, { params: filters }),
  getUserStats: (username) => api.get(`/users/${username}/stats`),
  deleteAccount: (password) => api.delete('/users/account', { data: { password } }),
};

// ============================================
// MEDIA API - DÜZELTİLDİ
// ============================================

export const mediaAPI = {
  // Arama
  searchTMDB: (query, page = 1) => 
    api.get('/media/search/tmdb', { params: { q: query, page } }),
  
  searchBooks: (query, startIndex = 0, maxResults = 20) => 
    api.get('/media/search/books', { params: { q: query, startIndex, maxResults } }),
  
  searchMedia: (query, filters = {}) => 
    api.get('/media/search', { params: { q: query, ...filters } }),
  
  // API'den çek ve kaydet - DÜZELTİLDİ
  fetchAndCacheMedia: (data) => 
    api.post('/media/fetch', {
      external_id: data.external_id,
      media_type: data.media_type,
      source: data.source || 'google_books'
    }),
  
  // Media detay
  getMediaDetail: (id) => api.get(`/media/${id}`),
  
  // Filtreleme
  getTopRated: (mediaType, limit = 20, offset = 0) => 
    api.get('/media/top-rated', { params: { media_type: mediaType, limit, offset } }),
  
  getMostPopular: (mediaType, limit = 20, offset = 0) => 
    api.get('/media/popular', { params: { media_type: mediaType, limit, offset } }),
  
  getByGenre: (genre, mediaType, limit = 20, offset = 0) => 
    api.get(`/media/genre/${genre}`, { params: { media_type: mediaType, limit, offset } }),
  
  getByYear: (year, mediaType, limit = 20, offset = 0) => 
    api.get(`/media/year/${year}`, { params: { media_type: mediaType, limit, offset } }),
  
  // Media içerikleri
  getMediaRatings: (mediaId, limit = 100, offset = 0) => 
    api.get(`/media/${mediaId}/ratings`, { params: { limit, offset } }),
  
  getMediaReviews: (mediaId, limit = 20, offset = 0) => 
    api.get(`/media/${mediaId}/reviews`, { params: { limit, offset } }),
  
  getSimilar: (mediaId, limit = 10) => 
    api.get(`/media/${mediaId}/similar`, { params: { limit } }),
  
  getMediaActivities: (mediaId, limit = 20, offset = 0) => 
    api.get(`/media/${mediaId}/activities`, { params: { limit, offset } }),
};

// ============================================
// COLLECTION API - DÜZELTİLDİ
// ============================================

export const collectionAPI = {
  // Puan ver - DÜZELTİLDİ
  rateMedia: (data) => 
    api.post('/collections/rate', {
      media_id: data.media_id,
      rating_value: data.rating_value
    }),
  
  // Puanı sil
  deleteRating: (mediaId) => api.delete(`/collections/rate/${mediaId}`),
  
  // Puan dağılımı
  getRatingDistribution: (mediaId) => 
    api.get(`/collections/rating-distribution/${mediaId}`),
  
  // Yorum ekle - DÜZELTİLDİ
  createReview: (data) => 
    api.post('/collections/review', {
      media_id: data.media_id,
      review_text: data.review_text,
      is_spoiler: data.is_spoiler || false
    }),
  
  // Yorumu güncelle - DÜZELTİLDİ
  updateReview: (reviewId, data) => 
    api.put(`/collections/review/${reviewId}`, {
      review_text: data.review_text,
      is_spoiler: data.is_spoiler
    }),
  
  // Yorumu sil
  deleteReview: (reviewId) => api.delete(`/collections/review/${reviewId}`),
  
  // Yorumu beğen
  likeReview: (reviewId) => api.post(`/collections/review/${reviewId}/like`),
  
  // Yorum beğenisini kaldır
  unlikeReview: (reviewId) => api.delete(`/collections/review/${reviewId}/unlike`),
  
  // Watchlist'e ekle - DÜZELTİLDİ
  addToWatchlist: (data) => 
    api.post('/collections/watchlist', {
      media_id: data.media_id,
      status: data.status || 'plan_to_read'
    }),
  
  // Watchlist durumunu güncelle - DÜZELTİLDİ
  updateWatchlistStatus: (mediaId, data) => 
    api.put(`/collections/watchlist/${mediaId}`, {
      status: data.status
    }),
  
  // Watchlist'ten çıkar
  removeFromWatchlist: (mediaId) => 
    api.delete(`/collections/watchlist/${mediaId}`),
  
  // Watchlist istatistikleri
  getWatchlistStats: () => api.get('/collections/watchlist/stats'),
  
  // Tamamlananlar
  getCompletedItems: (mediaType, limit = 50, offset = 0) => 
    api.get('/collections/watchlist/completed', { params: { media_type: mediaType, limit, offset } }),
  
  // Toplu ekleme
  bulkAddToWatchlist: (mediaIds, status) =>
    api.post('/collections/watchlist/bulk', { media_ids: mediaIds, status }),
  
  // Öneriler
  getRecommendations: (limit = 20, offset = 0) => 
    api.get('/collections/recommendations', { params: { limit, offset } }),
  
  // Koleksiyon istatistikleri
  getUserCollectionStats: () => api.get('/collections/stats'),
  
  // Ortak içerikler
  getCommonRatings: (userId2) => 
    api.get(`/collections/common/ratings/${userId2}`),
  
  getCommonWatchlist: (userId2) => 
    api.get(`/collections/common/watchlist/${userId2}`),
};

// ============================================
// ACTIVITY API
// ============================================

export const activityAPI = {
  // Feed'ler
  getFeed: (limit = 15, offset = 0) => 
    api.get('/activities/feed', { params: { limit, offset } }),
  
  getGlobalFeed: (filters = {}, limit = 20, offset = 0) => 
    api.get('/activities/global', { params: { ...filters, limit, offset } }),
  
  getPopularActivities: (timeframe = '7d', limit = 20, offset = 0) => 
    api.get('/activities/popular', { params: { timeframe, limit, offset } }),
  
  // Aktivite işlemleri
  getActivityById: (activityId) => api.get(`/activities/${activityId}`),
  deleteActivity: (activityId) => api.delete(`/activities/${activityId}`),
  
  // Beğeni
  likeActivity: (activityId) => api.post(`/activities/${activityId}/like`),
  unlikeActivity: (activityId) => api.delete(`/activities/${activityId}/unlike`),
  getActivityLikes: (activityId, limit = 50, offset = 0) => 
    api.get(`/activities/${activityId}/likes`, { params: { limit, offset } }),
  
  // Yorumlar
  getActivityComments: (activityId, limit = 50, offset = 0) => 
    api.get(`/activities/${activityId}/comments`, { params: { limit, offset } }),
  
  addComment: (activityId, commentText) => 
    api.post(`/activities/${activityId}/comments`, { comment_text: commentText }),
  
  updateComment: (commentId, commentText) => 
    api.put(`/activities/comments/${commentId}`, { comment_text: commentText }),
  
  deleteComment: (commentId) => 
    api.delete(`/activities/comments/${commentId}`),
  
  likeComment: (commentId) => 
    api.post(`/activities/comments/${commentId}/like`),
  
  unlikeComment: (commentId) => 
    api.delete(`/activities/comments/${commentId}/unlike`),
  
  getCommentLikes: (commentId, limit = 50, offset = 0) =>
    api.get(`/activities/comments/${commentId}/likes`, { params: { limit, offset } }),
  
  // Kullanıcı aktiviteleri
  getUserActivityStats: (username) => 
    api.get(`/activities/user/${username}/stats`),
  
  getUserLikedActivities: (limit = 20, offset = 0) => 
    api.get('/activities/my/liked', { params: { limit, offset } }),
  
  getUserRecentComments: (limit = 20, offset = 0) => 
    api.get('/activities/my/comments', { params: { limit, offset } }),
};

// ============================================
// LIST API - DÜZELTİLDİ
// ============================================

export const listAPI = {
  // Liste CRUD
  createList: (data) => 
    api.post('/lists', {
      list_name: data.list_name,
      description: data.description,
      is_public: data.is_public !== undefined ? data.is_public : true
    }),
  
  getListById: (listId) => api.get(`/lists/${listId}`),
  
  updateList: (listId, data) => api.put(`/lists/${listId}`, data),
  
  deleteList: (listId) => api.delete(`/lists/${listId}`),
  
  // Liste öğeleri - DÜZELTİLDİ
  addItemToList: (listId, data) => 
    api.post(`/lists/${listId}/items`, {
      media_id: data.media_id,
      note: data.note,
      list_order: data.list_order
    }),
  
  removeItemFromList: (listId, mediaId) => 
    api.delete(`/lists/${listId}/items/${mediaId}`),
  
  updateListItem: (listId, mediaId, data) => 
    api.put(`/lists/${listId}/items/${mediaId}`, data),
  
  reorderList: (listId, itemOrders) => 
    api.put(`/lists/${listId}/reorder`, { item_orders: itemOrders }),
  
  bulkAddItems: (listId, mediaIds) => 
    api.post(`/lists/${listId}/items/bulk`, { media_ids: mediaIds }),
  
  // Liste keşfi
  getUserLists: (username, limit = 50, offset = 0) => 
    api.get(`/lists/user/${username}`, { params: { limit, offset } }),
  
  getUserListStats: (username) => 
    api.get(`/lists/user/${username}/stats`),
  
  searchLists: (query, limit = 20, offset = 0) => 
    api.get('/lists/search', { params: { q: query, limit, offset } }),
  
  getPopularLists: (limit = 20, offset = 0) => 
    api.get('/lists/discover/popular', { params: { limit, offset } }),
  
  getRecentLists: (limit = 20, offset = 0) => 
    api.get('/lists/discover/recent', { params: { limit, offset } }),
  
  getListsContainingMedia: (mediaId, limit = 20, offset = 0) => 
    api.get(`/lists/media/${mediaId}`, { params: { limit, offset } }),
};

export default api;

