import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Star, Calendar, Clock, 
  Plus, Check, Bookmark, Edit2, Trash2, Send, Play, Loader2, Heart, X
} from 'lucide-react';
import { mediaAPI, collectionAPI, listAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Backend sunucu adresi
const SERVER_URL = 'http://localhost:5000';

const MovieDetail = () => {
  const { id } = useParams(); // URL'den gelen ID
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  
  const [watchStatus, setWatchStatus] = useState('');
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  
  const [showListMenu, setShowListMenu] = useState(false);
  const [customLists, setCustomLists] = useState([]);
  
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState([]);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const movieStatuses = [
    { value: 'completed', label: 'İzledim', color: 'bg-green-600', icon: Check },
    { value: 'watching', label: 'İzliyorum', color: 'bg-blue-600', icon: Play },
    { value: 'dropped', label: 'Yarım Bıraktım', color: 'bg-red-600', icon: X },
    { value: 'plan_to', label: 'İzleyeceklerim', color: 'bg-purple-600', icon: Bookmark }
  ];

  useEffect(() => {
    loadMovieDetails();
  }, [id]);

  useEffect(() => {
    if (movie?.id) {
      loadComments();
    }
  }, [movie?.id]);

  useEffect(() => {
    if (user) {
      loadUserLists();
    }
  }, [user]);

  // --- BOZUK YORUMLARI DÜZELTME FONKSİYONU ---
  const cleanReviewText = (text) => {
    if (!text) return "";
    try {
      if (typeof text === 'string' && text.trim().startsWith('{"') && text.includes('reviewText')) {
        const parsed = JSON.parse(text);
        return parsed.reviewText || text;
      }
    } catch (e) { }
    return text;
  };

  const loadMovieDetails = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await mediaAPI.getMediaDetail(id);
      if (response.success) {
        const { media, userData } = response.data;
        setMovie(media);
        if (userData) {
          setUserRating(userData.rating || 0);
          setWatchStatus(userData.watchlist_status || '');
        }
      }
    } catch (error) {
      console.error('Film detayı hatası:', error);
      if (error.response?.status === 404 && !silent) {
         alert('Film bulunamadı');
         navigate(-1);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadComments = async (page = 0) => {
    try {
      if (!movie?.id) return;
      const response = await mediaAPI.getMediaReviews(movie.id, 'recent', 10, page * 10);
      if (response.success) {
        const newReviews = response.data.reviews || [];
        if (page === 0) {
          setComments(newReviews);
        } else {
          setComments(prev => [...prev, ...newReviews]);
        }
        setHasMoreComments(newReviews.length === 10);
      }
    } catch (error) {
      console.error('Yorum yükleme hatası:', error);
    }
  };

  const loadUserLists = async () => {
    try {
      if (!user?.username) return;
      const response = await listAPI.getUserLists(user.username);
      if (response.success) {
        setCustomLists(response.data.lists || []);
      }
    } catch (error) {
      console.error('Liste yükleme hatası:', error);
    }
  };

  const handleRating = async (rating) => {
    if (!user) return alert('Giriş yapmalısınız');
    try {
      await collectionAPI.rateMedia(movie.id, rating);
      setUserRating(rating);
      setShowRatingModal(false);
      await loadMovieDetails(true);
    } catch (error) {
      alert('Puan verilemedi.');
    }
  };

  const handleStatusChange = async (status) => {
    if (!user) return alert('Giriş yapmalısınız');
    try {
      if (watchStatus === status) {
        await collectionAPI.removeFromWatchlist(movie.id);
        setWatchStatus('');
      } else if (watchStatus) {
        await collectionAPI.updateWatchlistStatus(movie.id, status);
        setWatchStatus(status);
      } else {
        await collectionAPI.addToWatchlist(movie.id, status);
        setWatchStatus(status);
      }
      setShowStatusMenu(false);
    } catch (error) { alert('Durum güncellenemedi'); }
  };

  const handleAddToList = async (listId) => {
    if (!user) return alert('Giriş yapmalısınız');
    try {
      await listAPI.addItemToList(listId, movie.id);
      alert('Listeye eklendi!');
      setShowListMenu(false);
    } catch (error) { alert('Listeye eklenemedi.'); }
  };

  const handleSubmitComment = async () => {
    if (!user) return alert('Giriş yapmalısınız');
    if (!newComment.trim()) return;
    
    const commentTextToSend = newComment;

    try {
      setSubmittingComment(true);
      const response = await collectionAPI.createReview(movie.id, commentTextToSend, false);

      if (response.success) {
        const createdReview = response.data.review || {};
        
        const completeReview = {
            id: createdReview.id || Date.now(),
            user_id: user.id,
            username: user.username,
            avatar_url: user.avatar_url,
            full_name: user.full_name,
            review_text: commentTextToSend,
            user_liked: false,
            likes_count: 0,
            created_at: new Date().toISOString()
        };

        setComments(prev => [completeReview, ...prev]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Yorum hatası:', error);
      alert('Yorum gönderilemedi');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLikeComment = async (reviewId) => {
     if (!user) return alert('Giriş yapmalısınız');
     try {
       setComments(comments.map(c => 
         c.id === reviewId ? { 
           ...c, 
           user_liked: !c.user_liked, 
           likes_count: c.user_liked ? Number(c.likes_count) - 1 : Number(c.likes_count) + 1 
         } : c
       ));

       const comment = comments.find(c => c.id === reviewId);
       if (comment) {
          if (comment.user_liked) {
              await collectionAPI.unlikeReview(reviewId);
          } else {
              await collectionAPI.likeReview(reviewId);
          }
       }
     } catch(err) { console.error(err); }
  };

  const handleEditComment = (reviewId, text) => {
    setEditingCommentId(reviewId);
    setEditCommentText(cleanReviewText(text));
  };

  const handleSaveEdit = async (reviewId) => {
    if (!editCommentText.trim()) return;
    try {
      await collectionAPI.updateReview(reviewId, editCommentText, false);
      setComments(comments.map(c => c.id === reviewId ? { ...c, review_text: editCommentText } : c));
      setEditingCommentId(null);
    } catch (error) { alert('Güncelleme başarısız'); }
  };

  const handleDeleteComment = async (reviewId) => {
    if (!window.confirm('Silmek istediğine emin misin?')) return;
    try {
      await collectionAPI.deleteReview(reviewId);
      setComments(comments.filter(c => c.id !== reviewId));
    } catch (error) { alert('Silme başarısız'); }
  };

  const getAvatarUrl = (url, seed) => {
    if (!url) return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
    if (url.startsWith('http')) return url;
    return `${SERVER_URL}${url}`;
  };

  const selectedStatusObj = movieStatuses.find(s => s.value === watchStatus);

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><Loader2 className="animate-spin text-purple-500" size={48} /></div>;
  if (!movie) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white"><p>Film bulunamadı</p></div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20">
      {/* Hero Section */}
      <div className="relative bg-cover bg-center" style={{ backgroundImage: movie.backdrop_url ? `url(${movie.backdrop_url})` : 'none', minHeight: '500px' }}>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-gray-900/30"></div>
        
        {/* 🔥 DÜZELTME: z-50 ve cursor-pointer eklendi */}
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-black/50 hover:bg-black/70 rounded-lg backdrop-blur-sm transition-all z-50 cursor-pointer text-white"
        >
          <ArrowLeft size={20} /> Geri
        </button>

        <div className="container mx-auto px-6 py-12 relative z-10 h-full flex flex-col justify-end">
          <div className="flex flex-col md:flex-row gap-8 items-end">
            <div className="w-48 md:w-64 flex-shrink-0 rounded-xl overflow-hidden shadow-2xl border-4 border-gray-700 hidden md:block">
                {movie.poster_url ? <img src={movie.poster_url} alt={movie.title} className="w-full h-auto" /> : <div className="w-full aspect-[2/3] flex items-center justify-center bg-gray-700"><Clock size={64} className="text-gray-600" /></div>}
            </div>
            <div className="flex-1 mb-4">
              <h1 className="text-4xl md:text-6xl font-bold mb-2">{movie.title}</h1>
              {movie.original_title && <h2 className="text-xl text-gray-400 mb-4">{movie.original_title}</h2>}
              <div className="flex flex-wrap items-center gap-4 mb-6 text-sm md:text-base">
                <div className="flex items-center gap-2 bg-yellow-500/20 px-3 py-1.5 rounded-lg border border-yellow-500/30 text-yellow-400"><Star size={18} fill="currentColor" /><span className="font-bold">{Number(movie.average_rating || 0).toFixed(1)}</span></div>
                {movie.release_year && <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg backdrop-blur-md"><Calendar size={18} /> <span>{movie.release_year}</span></div>}
                {movie.runtime && <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg backdrop-blur-md"><Clock size={18} /> <span>{movie.runtime} dk</span></div>}
              </div>
              {movie.director && <p className="text-gray-300 mb-4"><span className="text-gray-500">Yönetmen:</span> <span className="font-semibold text-white">{movie.director}</span></p>}
              <p className="text-gray-300 leading-relaxed max-w-3xl line-clamp-4 hover:line-clamp-none transition-all cursor-pointer">{movie.overview || 'Açıklama bulunmuyor.'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Aksiyonlar */}
      <div className="container mx-auto px-6 -mt-8 relative z-20">
        <div className="md:hidden w-32 -mt-24 mb-4 rounded-lg overflow-hidden shadow-xl border-2 border-gray-600"><img src={movie.poster_url} alt={movie.title} className="w-full" /></div>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-64">
             <button onClick={() => setShowStatusMenu(!showStatusMenu)} className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-semibold transition-all ${watchStatus ? selectedStatusObj?.color : 'bg-gray-700 hover:bg-gray-600'}`}><div className="flex items-center gap-2">{watchStatus ? (selectedStatusObj?.icon && <selectedStatusObj.icon size={20}/>) : <Plus size={20}/>}<span>{watchStatus ? selectedStatusObj?.label : 'Listeme Ekle'}</span></div></button>
             {showStatusMenu && <div className="absolute top-full mt-2 w-full bg-gray-700 rounded-lg shadow-xl overflow-hidden z-50">{movieStatuses.map(status => (<button key={status.value} onClick={() => handleStatusChange(status.value)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-600 text-left"><status.icon size={18} /> {status.label}</button>))}</div>}
          </div>
          <button onClick={() => setShowRatingModal(true)} className="flex items-center gap-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-semibold transition-all w-full md:w-auto justify-center"><Star size={20} className={userRating > 0 ? "fill-white" : ""} />{userRating > 0 ? `Puanım: ${userRating}` : 'Puan Ver'}</button>
          <div className="relative w-full md:w-auto">
            <button onClick={() => setShowListMenu(!showListMenu)} className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-all w-full justify-center"><Bookmark size={20} /> Listeye Ekle</button>
            {showListMenu && <div className="absolute top-full right-0 mt-2 w-full md:w-64 bg-gray-700 rounded-lg shadow-xl overflow-hidden z-50 max-h-60 overflow-y-auto">{customLists.length > 0 ? customLists.map(list => (<button key={list.id} onClick={() => handleAddToList(list.id)} className="w-full text-left px-4 py-3 hover:bg-gray-600 truncate">{list.list_name}</button>)) : <div className="px-4 py-3 text-gray-400 text-sm">Hiç listeniz yok.</div>}</div>}
          </div>
        </div>
      </div>

      {/* Yorumlar */}
      <div className="container mx-auto px-6 py-12">
         <h2 className="text-2xl font-bold mb-6">Yorumlar ({movie.reviews_count || comments.length})</h2>
         <div className="bg-gray-800 rounded-xl p-4 mb-8 border border-gray-700">
            <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Bu film hakkında ne düşünüyorsunuz?" className="w-full bg-gray-900 text-white rounded-lg p-4 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700" />
            <div className="flex justify-end mt-4">
               <button onClick={handleSubmitComment} disabled={submittingComment || !newComment.trim()} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2 transition-colors">{submittingComment ? <Loader2 className="animate-spin" size={18}/> : <Send size={18}/>} Gönder</button>
            </div>
         </div>
         
         <div className="space-y-4">
            {comments.map(comment => (
               <div key={comment.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <div className="flex justify-between items-start">
                     <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-purple-900 flex items-center justify-center font-bold text-lg overflow-hidden">
                           <img 
                             src={getAvatarUrl(comment.avatar_url, comment.username)} 
                             alt={comment.username} 
                             className="w-full h-full object-cover"
                           />
                        </div>
                        <div>
                           <div className="font-bold cursor-pointer hover:underline" onClick={() => navigate(`/main/profile/${comment.username}`)}>{comment.username}</div>
                           <div className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleDateString()}</div>
                        </div>
                     </div>
                     {user && String(user.id) === String(comment.user_id) && (
                       <div className="flex gap-2">
                          <button onClick={() => handleEditComment(comment.id, comment.review_text)} className="p-2 hover:bg-gray-700 rounded-full text-blue-400"><Edit2 size={16} /></button>
                          <button onClick={() => handleDeleteComment(comment.id)} className="p-2 hover:bg-gray-700 rounded-full text-red-400"><Trash2 size={16} /></button>
                       </div>
                     )}
                  </div>
                  {editingCommentId === comment.id ? (
                    <div className="mt-2">
                      <textarea value={editCommentText} onChange={(e) => setEditCommentText(e.target.value)} className="w-full bg-gray-700 p-2 rounded text-white" />
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => handleSaveEdit(comment.id)} className="px-3 py-1 bg-green-600 rounded text-sm">Kaydet</button>
                        <button onClick={() => setEditingCommentId(null)} className="px-3 py-1 bg-gray-600 rounded text-sm">İptal</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-300 mt-2 whitespace-pre-wrap">{cleanReviewText(comment.review_text)}</p>
                  )}
                  <div className="mt-4 flex items-center gap-4">
                     <button onClick={() => handleLikeComment(comment.id)} className={`flex items-center gap-1 text-sm ${comment.user_liked ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}>
                        <Heart size={16} className={comment.user_liked ? "fill-red-500" : ""} />
                        {comment.likes_count || 0}
                     </button>
                  </div>
               </div>
            ))}
            {comments.length === 0 && <p className="text-center text-gray-500 py-8">Henüz yorum yapılmamış. İlk yorumu sen yap!</p>}
         </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
           <div className="bg-gray-800 rounded-xl p-8 max-w-sm w-full text-center border border-gray-700">
              <h3 className="text-2xl font-bold mb-6">Puan Ver</h3>
              <div className="flex justify-center gap-2 mb-8 flex-wrap">{[1,2,3,4,5,6,7,8,9,10].map(num => (<button key={num} onMouseEnter={() => setHoverRating(num)} onMouseLeave={() => setHoverRating(0)} onClick={() => handleRating(num)} className={`w-8 h-8 rounded-lg font-bold transition-all ${num <= (hoverRating || userRating) ? 'bg-yellow-500 text-black scale-110' : 'bg-gray-700 text-gray-400'}`}>{num}</button>))}</div>
              <button onClick={() => setShowRatingModal(false)} className="text-gray-400 hover:text-white">İptal</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default MovieDetail;