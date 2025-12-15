import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { 
  Film, 
  Star, 
  Heart, 
  MessageCircle, 
  Loader2, 
  List, 
  Quote,
  FolderOpen
} from 'lucide-react';
import { activityAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Backend sunucu adresi
const SERVER_URL = 'http://localhost:5000';

// Avatar Helper
const getAvatarUrl = (avatarUrl, username) => {
  if (!avatarUrl) return `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
  if (avatarUrl.startsWith('http')) return avatarUrl;
  return `${SERVER_URL}${avatarUrl}`;
};

const HomePage = () => {
  const { user } = useAuth();
  const [feedPosts, setFeedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Feed'i API'den Çek
  const loadFeed = async (pageNum = 0) => {
    try {
      if (pageNum === 0) setLoading(true);
      
      const response = await activityAPI.getFeed(15, pageNum * 15);
      
      if (response && response.success && Array.isArray(response.data.activities)) {
        if (pageNum === 0) {
          setFeedPosts(response.data.activities);
        } else {
          setFeedPosts(prev => [...prev, ...response.data.activities]);
        }
        setHasMore(response.data.activities.length === 15);
      } else {
        if (pageNum === 0) setFeedPosts([]);
      }
    } catch (error) {
      console.error('Feed yüklenirken hata:', error);
      if (pageNum === 0) setFeedPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadFeed(nextPage);
  };

  const handleLike = async (activityId) => {
    try {
      setFeedPosts(posts => posts.map(post => 
        post.id === activityId 
          ? { 
              ...post, 
              user_liked: !post.user_liked, 
              likes_count: post.user_liked ? Math.max(0, Number(post.likes_count) - 1) : Number(post.likes_count) + 1 
            }
          : post
      ));

      const post = feedPosts.find(p => p.id === activityId);
      if (post) {
        if (post.user_liked) {
          await activityAPI.unlikeActivity(activityId);
        } else {
          await activityAPI.likeActivity(activityId);
        }
      }
    } catch (error) {
      console.error('Beğeni hatası:', error);
      loadFeed(page);
    }
  };

  if (loading && page === 0) {
    return (
      <div className="max-w-2xl mx-auto py-6 px-4 flex justify-center h-64 items-center">
        <Loader2 className="animate-spin text-purple-500" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 pb-24">
      {feedPosts.length === 0 && !loading ? (
        <div className="text-center py-20 text-gray-400">
          <Film size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-xl mb-2">Akışın çok sessiz...</p>
          <p className="text-sm">Platformdaki ilk aktiviteleri sen yap!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {feedPosts.map((post) => (
            <FeedPost key={post.id} post={post} onLike={handleLike} />
          ))}
        </div>
      )}

      {hasMore && feedPosts.length > 0 && (
        <div className="flex justify-center mt-8">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-full font-semibold transition-all border border-gray-700 flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Daha Fazla Göster'}
          </button>
        </div>
      )}
    </div>
  );
};

// ==========================================
// ALT BİLEŞEN: FeedPost
// ==========================================
const FeedPost = ({ post, onLike }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [commentCount, setCommentCount] = useState(Number(post.comments_count) || 0);

  const toggleComments = async () => {
    const newState = !showComments;
    setShowComments(newState);

    if (newState && comments.length === 0) {
      try {
        setLoadingComments(true);
        const response = await activityAPI.getActivityComments(post.id);
        if (response.success) {
          setComments(response.data.comments || []);
        }
      } catch (error) {
        console.error('Yorum yükleme hatası:', error);
      } finally {
        setLoadingComments(false);
      }
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim()) return;

    try {
      setSubmitting(true);
      const response = await activityAPI.addComment(post.id, commentText);
      
      if (response.success) {
        const newComment = {
            ...response.data.comment,
            username: user.username,       
            avatar_url: user.avatar_url,   
            full_name: user.full_name
        };

        setComments(prev => [newComment, ...prev]);
        setCommentText('');
        setCommentCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Yorum hatası:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      setComments(prevComments => prevComments.map(c => {
        if (c.id === commentId) {
          const isLiked = c.user_liked;
          return {
            ...c,
            user_liked: !isLiked,
            likes_count: isLiked ? Math.max(0, Number(c.likes_count) - 1) : Number(c.likes_count) + 1
          };
        }
        return c;
      }));

      const comment = comments.find(c => c.id === commentId);
      if (comment) {
        if (comment.user_liked) {
           await activityAPI.unlikeComment(commentId);
        } else {
           await activityAPI.likeComment(commentId);
        }
      }
    } catch (error) {
      console.error('Yorum beğeni hatası:', error);
    }
  };

  // 🔥 DÜZELTME BURADA: Türüne göre doğru sayfaya yönlendiriyoruz
  const handleMediaClick = () => { 
    if (post.media_id) {
        if (post.media_type === 'movie') {
            navigate(`/main/detail/${post.media_id}`); // Filme git
        } else {
            navigate(`/main/book/${post.media_id}`);   // Kitaba git
        }
    } 
  };

  const handleListClick = (e) => { 
      e.stopPropagation(); 
      if (post.list_id) navigate(`/main/list/${post.list_id}`); 
  };
  const handleProfileClick = () => { navigate(`/main/profile/${post.username}`); };
  
  const getActivityText = () => {
    const isMovie = post.media_type === 'movie';
    const typeName = isMovie ? 'filmi' : 'kitabı';
    
    switch (post.activity_type) {
      case 'rating': return `bir ${typeName} oyladı`;
      case 'review': return `bir ${typeName} inceledi`;
      case 'watchlist_add':
        switch(post.watchlist_status) {
            case 'completed': return `bir ${typeName} bitirdi`;
            case 'watching': return `bir ${typeName} okuyor/izliyor`;
            case 'dropped': return `bir ${typeName} yarım bıraktı`;
            case 'plan_to': default: return `bir ${typeName} listesine ekledi`;
        }
      case 'list_create': return 'yeni bir liste oluşturdu';
      case 'list_add': return `"${post.list_name || 'Bir listeye'}" listesine ekleme yaptı`;
      default: return 'bir aktivite paylaştı';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Az önce';
    if (diff < 3600) return `${Math.floor(diff / 60)}dk önce`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}sa önce`;
    return date.toLocaleDateString('tr-TR');
  };

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-all shadow-lg">
      
      {/* HEADER */}
      <div className="p-4 flex items-center gap-3 border-b border-gray-700/50">
        <div className="cursor-pointer" onClick={handleProfileClick}>
             <img 
               src={getAvatarUrl(post.avatar_url, post.username)} 
               alt={post.username} 
               className="w-10 h-10 rounded-full bg-gray-700 object-cover" 
             />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 truncate">
             <span className="font-bold hover:underline cursor-pointer truncate" onClick={handleProfileClick}>
                {post.full_name || post.username}
             </span>
             <span className="text-xs text-gray-500">@{post.username}</span>
          </div>
          <p className="text-xs text-gray-400">{formatDate(post.created_at)} · {getActivityText()}</p>
        </div>
      </div>

      {/* BODY */}
      <div className="p-4">
        {/* İnceleme Varsa */}
        {post.activity_type === 'review' && post.review_text && (
          <div className="mb-4 bg-gray-900/50 p-4 rounded-lg border-l-4 border-purple-500">
            <Quote className="w-4 h-4 text-purple-500 mb-1 opacity-50" />
            <p className="text-gray-200 text-sm leading-relaxed italic">
              "{post.has_more ? `${post.review_text}...` : post.review_text}"
            </p>
          </div>
        )}

        {/* Listeye Ekleme Başlığı */}
        {post.activity_type === 'list_add' && post.list_name && (
            <div 
                onClick={handleListClick}
                className="flex items-center gap-2 mb-3 bg-blue-900/20 text-blue-300 px-3 py-2 rounded-lg cursor-pointer hover:bg-blue-900/30 transition-colors w-fit border border-blue-900/30"
            >
                <FolderOpen size={16} />
                <span className="text-sm font-semibold">{post.list_name}</span>
            </div>
        )}

        {/* Medya Kartı */}
        {post.media_title && (
          <div onClick={handleMediaClick} className="flex gap-4 bg-gray-900 hover:bg-black/40 transition-colors rounded-lg p-3 cursor-pointer group">
            <div className="relative w-16 h-24 flex-shrink-0 rounded overflow-hidden shadow-lg">
               <img src={post.poster_url || 'https://via.placeholder.com/100x150'} alt={post.media_title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
            </div>
            <div className="flex-1 py-1">
              <h4 className="font-bold text-lg leading-tight group-hover:text-purple-400 transition-colors">{post.media_title}</h4>
              {post.release_year && <p className="text-xs text-gray-500 mt-1">{post.release_year}</p>}
              
              {post.activity_type === 'rating' && post.rating_value && (
                <div className="mt-2 flex items-center gap-1">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (<Star key={star} size={12} className={star <= Math.round(post.rating_value / 2) ? "fill-yellow-500 text-yellow-500" : "text-gray-600"} />))}
                  </div>
                  <span className="text-xs font-bold text-yellow-500 ml-1">{post.rating_value}/10</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Liste Oluşturma Kartı */}
        {post.activity_type === 'list_create' && post.list_name && (
           <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer group hover:border-purple-500/50 transition-all" onClick={handleListClick}>
              <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 bg-purple-900/30 rounded-lg text-purple-400 group-hover:text-purple-300 group-hover:bg-purple-900/50 transition-colors"><List size={24} /></div>
                 <div>
                    <h4 className="font-bold text-lg text-gray-100 group-hover:text-purple-400 transition-colors">{post.list_name}</h4>
                    <p className="text-xs text-gray-500">Özel Liste</p>
                 </div>
              </div>
              {post.list_description && <p className="text-gray-400 text-sm italic pl-1 border-l-2 border-gray-700 mt-2">"{post.list_description}"</p>}
           </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="px-4 py-3 border-t border-gray-700/50 flex items-center gap-6 bg-gray-800/50">
        <button onClick={() => onLike(post.id)} className={`flex items-center gap-2 text-sm transition-all active:scale-95 ${post.user_liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}>
          <Heart size={18} className={post.user_liked ? 'fill-red-500' : ''} />
          <span>{post.likes_count || 0}</span>
        </button>
        <button onClick={toggleComments} className={`flex items-center gap-2 text-sm transition-colors ${showComments ? 'text-blue-400' : 'text-gray-400 hover:text-blue-400'}`}>
          <MessageCircle size={18} />
          <span>{commentCount}</span>
        </button>
      </div>

      {/* YORUM BÖLÜMÜ */}
      {showComments && (
        <div className="bg-gray-900/50 border-t border-gray-700/50 p-4 animate-in slide-in-from-top-2">
          <div className="flex gap-3 mb-4">
             <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0" />
             <div className="flex-1 relative">
                <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendComment()} placeholder="Yorum yaz..." className="w-full bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500 pr-10" />
                <button onClick={handleSendComment} disabled={!commentText.trim() || submitting} className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-300 disabled:opacity-50 p-1">
                  {submitting ? <Loader2 size={16} className="animate-spin"/> : <MessageCircle size={16} className="fill-current"/>}
                </button>
             </div>
          </div>
          {loadingComments ? (<div className="text-center py-4"><Loader2 size={20} className="animate-spin mx-auto text-gray-500"/></div>) : comments.length > 0 ? (
             <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {comments.map((comment) => (
                   <div key={comment.id} className="flex gap-3 text-sm group">
                      <img 
                        src={getAvatarUrl(comment.avatar_url, comment.username)} 
                        alt={comment.username}
                        className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0 cursor-pointer"
                        onClick={() => navigate(`/main/profile/${comment.username}`)}
                      />
                      <div className="flex-1">
                         <div className="bg-gray-800 rounded-2xl rounded-tl-none px-4 py-2 inline-block">
                            <span className="font-bold text-xs text-gray-300 block mb-0.5 cursor-pointer hover:underline" onClick={() => navigate(`/main/profile/${comment.username}`)}>{comment.username}</span>
                            <span className="text-gray-200">{comment.comment_text}</span>
                         </div>
                         <div className="flex items-center gap-3 mt-1 ml-2 text-[10px] text-gray-500">
                            <span>{formatDate(comment.created_at)}</span>
                            <button onClick={() => handleLikeComment(comment.id)} className={`font-semibold hover:underline transition-colors ${comment.user_liked ? 'text-red-500' : 'text-gray-400 hover:text-gray-300'}`}>{comment.user_liked ? 'Beğenildi' : 'Beğen'}</button>
                            {Number(comment.likes_count) > 0 && (<span className="flex items-center gap-1 bg-gray-800 px-1.5 py-0.5 rounded-full border border-gray-700"><Heart size={8} className="fill-red-500 text-red-500" /><span>{comment.likes_count}</span></span>)}
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          ) : (<div className="text-center text-gray-500 text-sm py-2">Henüz yorum yok.</div>)}
        </div>
      )}
    </div>
  );
};

export default HomePage;