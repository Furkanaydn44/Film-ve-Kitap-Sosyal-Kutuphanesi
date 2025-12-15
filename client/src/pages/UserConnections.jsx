import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, UserMinus, Search, Loader2 } from 'lucide-react';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Avatar Helper
const SERVER_URL = 'http://localhost:5000';
const getAvatarUrl = (avatarUrl, username) => {
  if (!avatarUrl) return `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
  if (avatarUrl.startsWith('http')) return avatarUrl;
  return `${SERVER_URL}${avatarUrl}`;
};

const UserConnections = () => {
  const { username, type } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false); // İlk yükleme değil, genel yükleme durumu
  const [pageTitle, setPageTitle] = useState('');
  
  // Arama ve Sayfalama State'leri
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 10;

  // Sayfa tipi değiştiğinde veya arama yapıldığında sıfırla
  useEffect(() => {
    setUsers([]);
    setPage(0);
    setHasMore(true);
    loadData(0, true); // İlk sayfa yüklemesi (reset=true)
  }, [username, type, searchQuery]);

  const loadData = async (currentPage, reset = false) => {
    setLoading(true);
    try {
      let response;
      const offset = currentPage * LIMIT;
      
      switch (type) {
        case 'followers':
          setPageTitle(`@${username} - Takipçiler`);
          // Not: Takipçi/Takip edilenler için de arama/sayfalama backend desteği gerekebilir.
          // Şimdilik sadece önerilerde arama aktif olacak.
          response = await userAPI.getFollowers(username, LIMIT, offset);
          if (response.success) {
             const newUsers = response.data.followers;
             if (newUsers.length < LIMIT) setHasMore(false);
             setUsers(prev => reset ? newUsers : [...prev, ...newUsers]);
          }
          break;
          
        case 'following':
          setPageTitle(`@${username} - Takip Edilenler`);
          response = await userAPI.getFollowing(username, LIMIT, offset);
          if (response.success) {
             const newUsers = response.data.following;
             if (newUsers.length < LIMIT) setHasMore(false);
             setUsers(prev => reset ? newUsers : [...prev, ...newUsers]);
          }
          break;
          
        case 'suggestions':
          setPageTitle('Kullanıcıları Keşfet');
          // Arama parametresi buraya gidiyor
          response = await userAPI.getSuggestions(LIMIT, offset, searchQuery); 
          if (response.success) {
             const newUsers = response.data.users;
             if (newUsers.length < LIMIT) setHasMore(false);
             setUsers(prev => reset ? newUsers : [...prev, ...newUsers]);
          }
          break;
          
        default:
          navigate('/main');
      }
    } catch (error) {
      console.error('Liste yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadData(nextPage, false);
  };

  const handleFollowToggle = async (targetUserId, isFollowing) => {
    try {
      if (isFollowing) {
        await userAPI.unfollowUser(targetUserId);
      } else {
        await userAPI.followUser(targetUserId);
      }
      
      // Sadece butonu güncellemek yerine listeyi tazelemek istemiyorsak
      // Manuel state güncellemesi yapabiliriz ama şimdilik loadData çağırmadan bırakalım
      // veya sadece o kullanıcının durumunu yerelde değiştirebiliriz (kompleks olur)
      
      // Eğer öneriler sayfasındaysak ve takip ettiysek listeden çıkarabiliriz (İsteğe bağlı)
       if (type === 'suggestions' && !isFollowing) {
         setUsers(prev => prev.filter(u => u.id !== targetUserId));
       } else if (type === 'following' && isFollowing && username === currentUser?.username) {
         // Kendi takip ettiklerimden çıkarıyorsam listeden sil
         setUsers(prev => prev.filter(u => u.id !== targetUserId));
       }

    } catch (error) {
      console.error('Takip işlemi hatası:', error);
    }

    finally{window.location.reload();}
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 p-4 z-10">
        <div className="flex items-center gap-4 mb-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-800 rounded-full">
            <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold">{pageTitle}</h1>
        </div>

        {/* Arama Çubuğu (Sadece Suggestions için aktif edelim veya hepsi için) */}
        {type === 'suggestions' && (
            <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Kullanıcı ara..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-purple-500 transition-colors text-white"
                />
            </div>
        )}
      </div>

      {/* Liste */}
      <div className="max-w-2xl mx-auto p-4">
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-xl border border-gray-700 hover:border-gray-600 transition-all">
              
              <div 
                className="flex items-center gap-4 flex-1 cursor-pointer"
                onClick={() => navigate(`/main/profile/${user.username}`)}
              >
                <img 
                  src={getAvatarUrl(user.avatar_url, user.username)} 
                  alt={user.username} 
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-700"
                  onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`; }}
                />
                <div>
                  <h3 className="font-bold">{user.full_name || user.username}</h3>
                  <p className="text-sm text-gray-400">@{user.username}</p>
                  {user.bio && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{user.bio}</p>}
                </div>
              </div>

              {user.id !== currentUser?.id && (
                <button
                  onClick={(e) => {
                      e.stopPropagation();
                      // type='following' ise kesin takip ediyordur. Diğerlerinde backend'den isFollowing gelmediği için
                      // basitçe type kontrolü yapıyoruz. Daha gelişmişi için users arrayine isFollowing eklenmeli.
                      const isAlreadyFollowing = type === 'following';
                      handleFollowToggle(user.id, isAlreadyFollowing);
                  }} 
                  className={`p-2 rounded-lg transition-all ${
                     type === 'following' 
                     ? 'bg-gray-700 hover:bg-red-900/30 text-gray-300 hover:text-red-400' 
                     : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                  title={type === 'following' ? "Takipten Çık" : "Takip Et"}
                >
                  {type === 'following' ? <UserMinus size={20} /> : <UserPlus size={20} />}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Yükleniyor Durumu */}
        {loading && (
            <div className="flex justify-center py-6">
                <Loader2 className="animate-spin text-purple-500" size={32} />
            </div>
        )}

        {/* Boş Durum */}
        {!loading && users.length === 0 && (
            <div className="text-center py-12 text-gray-500">
                Kullanıcı bulunamadı.
            </div>
        )}

        {/* Daha Fazla Yükle */}
        {!loading && hasMore && users.length > 0 && (
            <div className="flex justify-center mt-6">
                <button 
                    onClick={handleLoadMore}
                    className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-full text-sm font-medium transition-colors border border-gray-700"
                >
                    Daha Fazla Göster
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default UserConnections;