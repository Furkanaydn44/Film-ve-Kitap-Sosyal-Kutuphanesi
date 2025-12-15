import React, { useState, useEffect,useRef} from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { Edit2, UserPlus, UserMinus, Plus, Star, MessageCircle, Book, Clock, Check, Bookmark, Loader2, List } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userAPI, listAPI } from '../services/api';

// Backend sunucu adresi
const SERVER_URL = 'http://localhost:5000';

// Avatar Helper
const getAvatarUrl = (avatarUrl, username) => {
  if (!avatarUrl) return `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
  if (avatarUrl.startsWith('http')) return avatarUrl;
  return `${SERVER_URL}${avatarUrl}`;
};

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  // 🔥 MainPage'den gelen yenileme fonksiyonunu alıyoruz
  const context = useOutletContext();
  const refreshUserStats = context?.refreshUserStats;
  
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('watched');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [libraryData, setLibraryData] = useState({ watched: [], toWatch: [], read: [], toRead: [] });
  const [customLists, setCustomLists] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  const profileUsername = username || currentUser?.username;
  const isOwnProfile = currentUser?.username === profileUsername;

  // Profil verilerini yükleyen fonksiyon
  const loadProfile = async () => {
    if (!profileUsername) return;

    try {
      if (!userProfile) setLoading(true);
      
      // 1. Profil Bilgileri
      const profileResponse = await userAPI.getProfile(profileUsername);
      if (profileResponse.success) {
        // 🔥 KRİTİK DÜZELTME: Backend 'user' ve 'stats'ı ayrı gönderiyor.
        // Biz bunları tek bir objede birleştiriyoruz ki render ederken hata almayalım.
        setUserProfile({
           ...profileResponse.data.user,
           stats: profileResponse.data.stats || { followers_count: 0, following_count: 0 } 
        });
        setIsFollowing(profileResponse.data.isFollowing);
      }

      // 2. Kütüphane (Watchlist)
      try {
        const watchlistResponse = await userAPI.getUserWatchlist(profileUsername);
        if (watchlistResponse.success) {
          const watchlist = watchlistResponse.data.watchlist || [];
          setLibraryData({
            watched: watchlist.filter(item => item.status === 'completed' && item.media_type === 'movie'),
            toWatch: watchlist.filter(item => (item.status === 'plan_to' || item.status === 'watching') && item.media_type === 'movie'),
            read: watchlist.filter(item => item.status === 'completed' && item.media_type === 'book'),
            toRead: watchlist.filter(item => (item.status === 'plan_to' || item.status === 'watching') && item.media_type === 'book')
          });
        }
      } catch (err) { console.warn('Watchlist hatası:', err); }

      // 3. Özel Listeler
      try {
        const listsResponse = await listAPI.getUserLists(profileUsername);
        if (listsResponse.success) {
          setCustomLists(listsResponse.data.lists || []);
        }
      } catch (err) { console.warn('Liste hatası:', err); }

      // 4. Son Aktiviteler
      try {
        const activitiesResponse = await userAPI.getUserActivities(profileUsername, {}, 10, 0);
        if (activitiesResponse.success) {
          setRecentActivities(activitiesResponse.data.activities || []);
        }
      } catch (err) { console.warn('Aktivite hatası:', err); }

    } catch (error) {
      console.error('Profil yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [profileUsername, currentUser]);

  const handleFollowToggle = async () => {
    try {
      if (isFollowing) {
        await userAPI.unfollowUser(userProfile.id);
      } else {
        await userAPI.followUser(userProfile.id);
      }
      
      // 🔥 İşlem sonrası profili tekrar çekiyoruz (Hatasız güncelleme için)
      await loadProfile(); 

      // Sol menüdeki sayıları güncelle
      if (refreshUserStats) {
        refreshUserStats();
      }

    } catch (error) {
      console.error('Takip hatası:', error);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><Loader2 className="animate-spin text-purple-500" size={48} /></div>;
  if (!userProfile) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white"><p>Kullanıcı bulunamadı</p></div>;

  const tabs = [
    { id: 'watched', label: 'İzlenenler', icon: Check, data: libraryData.watched },
    { id: 'toWatch', label: 'İzlenecekler', icon: Clock, data: libraryData.toWatch },
    { id: 'read', label: 'Okunanlar', icon: Check, data: libraryData.read },
    { id: 'toRead', label: 'Okunacaklar', icon: Clock, data: libraryData.toRead }
  ];

  const currentTabData = tabs.find(tab => tab.id === activeTab)?.data || [];

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            
            {/* Avatar */}
            <div className="relative">
              <img
                src={getAvatarUrl(userProfile.avatar_url, userProfile.username)}
                alt={userProfile.username}
                className="w-32 h-32 rounded-full border-4 border-gray-700 shadow-2xl object-cover"
              />
            </div>

            {/* Bilgiler */}
            <div className="flex-1 w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-1">{userProfile.full_name || userProfile.username}</h1>
                  <p className="text-gray-400">@{userProfile.username}</p>
                </div>

                <div className="flex gap-3">
                  {isOwnProfile ? (
                    <>
                      <button onClick={() => setShowEditModal(true)} className="flex items-center gap-2 px-6 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-all border border-gray-700">
                        <Edit2 size={18} /> Profili Düzenle
                      </button>
                      <button onClick={() => setShowNewListModal(true)} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-medium transition-all shadow-lg">
                        <Plus size={18} /> Yeni Liste
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleFollowToggle}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
                        isFollowing
                          ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300'
                          : 'bg-white text-black hover:bg-gray-200'
                      }`}
                    >
                      {isFollowing ? <><UserMinus size={18} /> Takipten Çık</> : <><UserPlus size={18} /> Takip Et</>}
                    </button>
                  )}
                </div>
              </div>

              <p className="text-gray-300 mb-6 leading-relaxed max-w-2xl">{userProfile.bio || 'Henüz biyografi eklenmemiş.'}</p>

              <div className="flex gap-8 text-sm border-t border-gray-800 pt-4">
    
    {/* TAKİPÇİ KISMI */}
    <div 
        className="text-center md:text-left cursor-pointer group" // cursor-pointer ekledik
        onClick={() => navigate(`/main/profile/${userProfile.username}/connections/followers`)} // Link verdik
    >
        <span className="block font-bold text-xl text-white group-hover:text-purple-400 transition-colors">
            {userProfile.stats?.followers_count || 0}
        </span>
        <span className="text-gray-500 group-hover:text-gray-300 transition-colors">Takipçi</span>
    </div>

    {/* TAKİP EDİLEN KISMI */}
    <div 
        className="text-center md:text-left cursor-pointer group" // cursor-pointer ekledik
        onClick={() => navigate(`/main/profile/${userProfile.username}/connections/following`)} // Link verdik
    >
        <span className="block font-bold text-xl text-white group-hover:text-purple-400 transition-colors">
            {userProfile.stats?.following_count || 0}
        </span>
        <span className="text-gray-500 group-hover:text-gray-300 transition-colors">Takip</span>
    </div>

    {/* KATILIM TARİHİ (Tıklanmaz) */}
    <div className="text-center md:text-left ml-auto md:ml-0 self-center text-gray-500">
        Katılım: {new Date(userProfile.created_at).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
    </div>
</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Sol: Kütüphane & Aktiviteler */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Kütüphane Tabs */}
            <div className="bg-gray-800 rounded-xl p-1 border border-gray-700">
              <div className="grid grid-cols-4 gap-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex flex-col items-center gap-1 py-3 px-2 rounded-lg font-medium transition-all ${
                        activeTab === tab.id ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-xs">{tab.label}</span>
                      <span className="text-xs font-bold text-purple-400">{tab.data.length}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grid */}
            {currentTabData.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {currentTabData.map((item) => (
                    <div key={item.id} onClick={() => navigate(`/main/book/${item.media_id}`)} className="group relative bg-gray-800 rounded-lg overflow-hidden shadow-lg cursor-pointer border border-gray-700 hover:border-purple-500 transition-all">
                    <div className="aspect-[2/3]">
                        <img src={item.poster_url || 'https://via.placeholder.com/200x300'} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    {item.user_rating && (
                        <div className="absolute top-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 text-yellow-400">
                        <Star size={10} fill="currentColor" /> {item.user_rating}
                        </div>
                    )}
                    </div>
                ))}
                </div>
            ) : (
                <div className="text-center py-12 text-gray-500 bg-gray-800/50 rounded-xl border border-gray-700 border-dashed">
                    Bu bölümde henüz içerik yok.
                </div>
            )}

            {/* Son Aktiviteler */}
            <div>
               <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-200">
                  <MessageCircle size={20} className="text-purple-500" /> Son Aktiviteler
               </h3>
               <div className="space-y-3">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity) => <ActivityCard key={activity.id} activity={activity} />)
                  ) : (
                    <p className="text-gray-500">Henüz bir aktivite yok.</p>
                  )}
               </div>
            </div>
          </div>

          {/* Sağ: Listeler */}
          <div>
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 sticky top-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Bookmark className="text-purple-400" size={20} /> Listeler
              </h2>
              <div className="space-y-3">
                {customLists.map((list) => (
                  <div 
                    key={list.id} 
                    onClick={() => navigate(`/main/list/${list.id}`)} // 🔥 TIKLAMA ÖZELLİĞİ
                    className="p-3 bg-gray-900/50 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors group border border-gray-700 hover:border-gray-600"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-900/30 rounded text-purple-400 group-hover:text-white transition-colors">
                         <List size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                         <h3 className="font-semibold text-sm truncate text-gray-200 group-hover:text-purple-300 transition-colors">{list.list_name}</h3>
                         <p className="text-xs text-gray-500">{list.items_count || 0} içerik</p>
                      </div>
                    </div>
                  </div>
                ))}
                {customLists.length === 0 && <p className="text-sm text-gray-500">Henüz liste oluşturulmamış.</p>}
              </div>
            </div>
          </div>

        </div>
      </div>

      {showEditModal && <EditProfileModal profile={userProfile} onClose={() => setShowEditModal(false)} onSave={async (updatedProfile) => {
          try {
             await userAPI.updateProfile(updatedProfile);
             await loadProfile(); 
             setShowEditModal(false);
          } catch(e) { console.error(e); }
      }} />}
      
      {showNewListModal && <NewListModal onClose={() => setShowNewListModal(false)} onCreate={async (name, desc) => {
          try {
             await listAPI.createList(name, desc);
             const res = await listAPI.getUserLists(profileUsername);
             if(res.success) setCustomLists(res.data.lists);
             setShowNewListModal(false);
          } catch(e) { console.error(e); }
      }} />}

    </div>
  );
};

// Activity Card Component
const ActivityCard = ({ activity }) => {
    const navigate = useNavigate();
    let content = null;
    if (activity.activity_type === 'rating') {
        content = <span className="text-yellow-400 flex items-center gap-1"><Star size={12} fill="currentColor"/> {activity.rating_value}/10 puan verdi</span>;
    } else if (activity.activity_type === 'review') {
        content = <span className="text-gray-400 italic text-xs">"{activity.review_text}"</span>;
    } else if (activity.activity_type === 'watchlist_add') {
        content = <span className={`text-xs px-2 py-0.5 rounded ${activity.watchlist_status === 'completed' ? 'bg-green-900/30 text-green-400' : 'bg-blue-900/30 text-blue-400'}`}>
            {activity.watchlist_status === 'completed' ? 'Bitirdi' : 'Listeye Eklendi'}
        </span>;
    }

    return (
        <div 
            onClick={() => activity.media_id && navigate(`/main/book/${activity.media_id}`)}
            className="flex gap-3 p-3 bg-gray-900/50 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-colors cursor-pointer group"
        >
            <div className="relative w-10 h-14 flex-shrink-0 bg-gray-800 rounded overflow-hidden">
                <img src={activity.poster_url || 'https://via.placeholder.com/100x150'} alt={activity.media_title} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h4 className="font-bold text-sm text-gray-200 group-hover:text-purple-400 transition-colors truncate">{activity.media_title}</h4>
                <div className="flex items-center gap-2 mt-1 text-sm">{content}</div>
                <span className="text-[10px] text-gray-600 mt-1">{new Date(activity.created_at).toLocaleDateString('tr-TR')}</span>
            </div>
        </div>
    );
};

// Edit Profile Modal
const EditProfileModal = ({ profile, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    username: profile.username, 
    email: profile.email,
    full_name: profile.full_name || '',
    bio: profile.bio || ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(getAvatarUrl(profile.avatar_url, profile.username));
  const [uploading, setUploading] = useState(false);


  const fileInputRef = useRef(null);

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Lütfen geçerli bir resim dosyası seçin (JPG, PNG)');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('Dosya boyutu 5MB\'dan küçük olmalıdır');
        return;
      }

      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    try {
      setUploading(true);
      let updatedProfile = { ...formData };
      
      if (avatarFile) {
        const data = new FormData();
        data.append('avatar', avatarFile);

        const uploadResponse = await userAPI.uploadAvatar(data);
        
        if (uploadResponse.success) {
          updatedProfile.avatar_url = uploadResponse.data.avatar_url;
        }
      }

      await onSave(updatedProfile);
      
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      alert('Profil güncellenirken bir hata oluştu');
    } finally {
      setUploading(false);
      window.location.reload();
      //Sayfayı yeniliyor kod bozulursa buraya bak.
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-lg w-full p-6 border border-gray-700">
        <h2 className="text-2xl font-bold mb-6">Profili Düzenle</h2>
        
        <div className="space-y-6">
          {/* Avatar Upload Alanı */}
          <div className="flex flex-col items-center gap-4">
            
            {/* Resim Alanı - Tıklanabilir */}
            <div 
                className="relative group cursor-pointer"
                onClick={handleImageClick} // Tıklama buraya bağlandı
            >
              <img 
                src={previewUrl} 
                alt="Avatar Önizleme" 
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-600 group-hover:border-purple-500 transition-colors"
              />
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Edit2 size={24} className="text-white" />
              </div>
              
              {/* 🔥 GİZLİ INPUT (hidden class'ı ile gizlendi) */}
              <input 
                type="file" 
                ref={fileInputRef} // Ref bağlandı
                accept="image/png, image/jpeg, image/jpg" 
                className="hidden" 
                onChange={handleFileChange}
              />
            </div>

            <button 
                type="button"
                onClick={handleImageClick}
                className="text-sm text-purple-400 hover:text-purple-300 font-medium"
            >
                Profil fotoğrafını değiştir
            </button>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold mb-2">İsim</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
              placeholder="Adınız Soyadınız"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-semibold mb-2">Biyografi</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white resize-none"
              placeholder="Kendinizden bahsedin..."
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={uploading}
              className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              İptal
            </button>
            <button
              onClick={handleSave}
              disabled={uploading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold transition-all disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                'Kaydet'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// New List Modal
const NewListModal = ({ onClose, onCreate }) => {
  const [listName, setListName] = useState('');
  const [description, setDescription] = useState('');
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4">Yeni Liste</h2>
        <input type="text" value={listName} onChange={(e) => setListName(e.target.value)} placeholder="Liste Adı" className="w-full bg-gray-700 p-3 rounded mb-3 text-white" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Açıklama" className="w-full bg-gray-700 p-3 rounded mb-4 text-white" rows={3} />
        <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 bg-gray-700 p-3 rounded">İptal</button>
            <button onClick={() => onCreate(listName, description)} className="flex-1 bg-purple-600 p-3 rounded">Oluştur</button>
        </div>
      </div>
    </div>
  );
};

export default Profile;