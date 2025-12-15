import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Film, Book, Home, User, LogOut , UserPlus} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';

// ============================================================
// AVATAR HELPER (URL DÜZELTİCİ)
// ============================================================
const getAvatarUrl = (avatarUrl, username) => {
  if (!avatarUrl) {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
  }
  
  if (avatarUrl.startsWith('http')) {
    return avatarUrl;
  }
  
  if (avatarUrl.startsWith('/uploads/')) {
    return `http://localhost:5000${avatarUrl}`;
  }
  
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
};

const MainPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [userStats, setUserStats] = useState(null);

  const currentPage = location.pathname;

  // Kullanıcı istatistiklerini yükleyen fonksiyon (Dışarıdan tetiklenebilir)
  const loadUserStats = async () => {
    if (user?.username) {
      try {
        const response = await userAPI.getUserStats(user.username);
        if (response.success) {
          setUserStats(response.data);
        }
      } catch (error) {
        console.error('İstatistik yükleme hatası:', error);
      }
    }
  };

  // İlk açılışta ve kullanıcı değiştiğinde yükle
  useEffect(() => {
    loadUserStats();
  }, [user]);

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = async () => {
    if (window.confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
      await logout();
      navigate('/login');
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Sol Navigasyon */}
      <Sidebar 
        currentPage={currentPage} 
        handleNavigation={handleNavigation} 
        user={user}
        userStats={userStats}
        handleLogout={handleLogout}
      />
      
      {/* Ana İçerik */}
      <main className="flex-1 overflow-y-auto">
        {/* 🔥 ÖNEMLİ: context prop'u ile refresh fonksiyonunu alt sayfalara gönderiyoruz.
            Böylece Profile.jsx içinden bu fonksiyon çağrıldığında Sidebar güncellenecek. */}
        <Outlet context={{ refreshUserStats: loadUserStats }} />
      </main>

      
    </div>
  );
};

// Sol Navigasyon Bileşeni
const Sidebar = ({ currentPage, handleNavigation, user, userStats, handleLogout }) => {
  const menuItems = [
    { path: '/main', icon: Home, label: 'Ana Sayfa' },
    { path: '/main/discover', icon: Film, label: 'Film Keşfet' },
    { path: '/main/bookdiscover', icon: Book, label: 'Kitap Keşfet' },
    { path: '/main/profile', icon: User, label: 'Profil' },
    { path: '/main/connections/suggestions', icon: UserPlus, label: 'Kullanıcı Önerileri' }
  ];

  // İstatistikleri güvenli bir şekilde al (API yapısına göre bazen 'general' altında bazen direkt kökte gelebilir)
  const followingCount = userStats?.general?.following_count ?? userStats?.following_count ?? 0;
  const followersCount = userStats?.general?.followers_count ?? userStats?.followers_count ?? 0;

  return (
    <div className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          CineBook
        </h1>
        <p className="text-xs text-gray-500 mt-1">Film & Kitap Sosyal Ağı</p>
      </div>

      {/* Kullanıcı Bilgisi */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <img 
            src={getAvatarUrl(user?.avatar_url, user?.username)} 
            alt={user?.username} 
            className="w-12 h-12 rounded-full border-2 border-gray-700 object-cover" 
            onError={(e) => {
                e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`;
            }}
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{user?.full_name || user?.username}</p>
            <p className="text-xs text-gray-500 truncate">@{user?.username}</p>
          </div>
        </div>
        
        {/* İstatistikler */}
        <div className="flex gap-4 mt-3 text-xs">
          <div>
            <span className="font-bold text-white">{followingCount}</span>
            <span className="text-gray-500 ml-1">Takip</span>
          </div>
          <div>
            <span className="font-bold text-white">{followersCount}</span>
            <span className="text-gray-500 ml-1">Takipçi</span>
          </div>
        </div>
      </div>

      {/* Menü */}
      <nav className="flex-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.path || 
                           (item.path === '/main/discover' && currentPage.includes('discover') && !currentPage.includes('bookdiscover')) ||
                           (item.path === '/main/profile' && currentPage.includes('profile'));
          return (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl mb-2 transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon size={22} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Çıkış Butonu */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-all"
        >
          <LogOut size={22} />
          <span className="font-medium">Çıkış Yap</span>
        </button>
      </div>
    </div>
  );
};


export default MainPage;