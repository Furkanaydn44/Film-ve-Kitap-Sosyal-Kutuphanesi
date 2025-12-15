import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Calendar, TrendingUp, Film, Tv, X, SlidersHorizontal, Trophy } from 'lucide-react';
import { mediaAPI } from '../services/api';

const Discover = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [category, setCategory] = useState('popular');
  const [mediaType, setMediaType] = useState('movie');
  const [page, setPage] = useState(1);
  
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [yearRange, setYearRange] = useState({ min: 1900, max: new Date().getFullYear() });
  const [showFilters, setShowFilters] = useState(false);

  const API_KEY = '8d2c12733bf13bf407a255052b10dbdd';
  const BASE_URL = 'https://api.themoviedb.org/3';
  const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

  const movieGenres = [
    { id: 28, name: 'Aksiyon' }, { id: 12, name: 'Macera' }, { id: 16, name: 'Animasyon' },
    { id: 35, name: 'Komedi' }, { id: 80, name: 'Suç' }, { id: 99, name: 'Belgesel' },
    { id: 18, name: 'Drama' }, { id: 10751, name: 'Aile' }, { id: 14, name: 'Fantastik' },
    { id: 36, name: 'Tarih' }, { id: 27, name: 'Korku' }, { id: 10402, name: 'Müzik' },
    { id: 9648, name: 'Gizem' }, { id: 10749, name: 'Romantik' }, { id: 878, name: 'Bilim Kurgu' },
    { id: 10770, name: 'TV Film' }, { id: 53, name: 'Gerilim' }, { id: 10752, name: 'Savaş' },
    { id: 37, name: 'Western' }
  ];

  const tvGenres = [
    { id: 10759, name: 'Aksiyon & Macera' }, { id: 16, name: 'Animasyon' }, { id: 35, name: 'Komedi' },
    { id: 80, name: 'Suç' }, { id: 99, name: 'Belgesel' }, { id: 18, name: 'Drama' },
    { id: 10751, name: 'Aile' }, { id: 10762, name: 'Çocuk' }, { id: 9648, name: 'Gizem' },
    { id: 10763, name: 'Haber' }, { id: 10764, name: 'Reality' }, { id: 10765, name: 'Bilim Kurgu & Fantastik' },
    { id: 10766, name: 'Pembe Dizi' }, { id: 10767, name: 'Talk Show' }, { id: 10768, name: 'Savaş & Politik' },
    { id: 37, name: 'Western' }
  ];

  const currentGenres = mediaType === 'movie' ? movieGenres : tvGenres;

  const fetchMovies = async () => {
    setLoading(true);
    try {
      // 🔥 DURUM 1: CINEBOOK EN İYİLER (YEREL DB)
      if (category === 'cinebook_best' && !searchQuery) {
        // Backend'e 'movie' veya 'tv' gönderiyoruz
        const typeToSend = mediaType === 'tv' ? 'tv' : 'movie';
        
        const response = await mediaAPI.getTopRated(typeToSend, 20);
        
        if (response.success) {
          setMovies(response.data.media || []);
        }
      } 
      // 🔥 DURUM 2: TMDB API (Popüler, Yeni, Arama vb.)
      else {
        let url;
        
        if (searchQuery) {
          url = `${BASE_URL}/search/${mediaType}?api_key=${API_KEY}&query=${searchQuery}&page=${page}`;
        } else {
          url = `${BASE_URL}/discover/${mediaType}?api_key=${API_KEY}&page=${page}`;
          
          if (category === 'popular') {
            url += '&sort_by=popularity.desc';
          } 
           else if (category === 'top_rated') {
          url += '&sort_by=vote_average.desc&vote_count.gte=100';}else if (category === 'upcoming' && mediaType === 'movie') {
            const today = new Date().toISOString().split('T')[0];
            const future = new Date();
            future.setMonth(future.getMonth() + 3);
            const futureDate = future.toISOString().split('T')[0];
            url += `&primary_release_date.gte=${today}&primary_release_date.lte=${futureDate}&sort_by=popularity.desc`;
          }
          
          if (selectedGenres.length > 0) url += `&with_genres=${selectedGenres.join(',')}`;
          if (minRating > 0) url += `&vote_average.gte=${minRating}`;
          
          if (mediaType === 'movie') {
            url += `&primary_release_date.gte=${yearRange.min}-01-01&primary_release_date.lte=${yearRange.max}-12-31`;
          } else {
            url += `&first_air_date.gte=${yearRange.min}-01-01&first_air_date.lte=${yearRange.max}-12-31`;
          }
        }

        const response = await fetch(url);
        const data = await response.json();
        
        if (page === 1) {
          setMovies(data.results || []);
        } else {
          setMovies(prev => [...prev, ...(data.results || [])]);
        }
      }
    } catch (error) {
      console.error('Film yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMovies([]); 
    setPage(1);
    fetchMovies();
  }, [category, mediaType, selectedGenres, minRating, yearRange]);

  useEffect(() => {
    if (page > 1 && category !== 'cinebook_best') fetchMovies();
  }, [page]);

  useEffect(() => {
     const timer = setTimeout(() => {
        if (searchQuery) {
            setCategory('search');
            setPage(1);
            fetchMovies();
        } else if (category === 'search') {
            setCategory('popular');
        }
     }, 500);
     return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
    setSearchQuery('');
    setPage(1);
  };

  const handleMediaTypeChange = (newType) => {
    setMediaType(newType);
    setCategory('popular');
    setSearchQuery('');
    setPage(1);
    setSelectedGenres([]);
  };

  const loadMore = () => { setPage(prev => prev + 1); };

  const toggleGenre = (genreId) => {
    setSelectedGenres(prev => prev.includes(genreId) ? prev.filter(id => id !== genreId) : [...prev, genreId]);
    setPage(1);
  };

  const clearFilters = () => { setSelectedGenres([]); setMinRating(0); setYearRange({ min: 1900, max: new Date().getFullYear() }); setPage(1); };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <div className="p-6">
        
        {/* Medya Tipi Toggle */}
        <div className="mb-6 flex gap-3">
          <button onClick={() => handleMediaTypeChange('movie')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${mediaType === 'movie' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
            <Film size={20} /> <span>Filmler</span>
          </button>
          
        </div>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                {mediaType === 'movie' ? 'Film Keşfet' : 'Dizi Keşfet'}
              </h2>
              <p className="text-gray-400">
                {category === 'cinebook_best' ? 'CineBook topluluğunun en sevdikleri' : 'En popüler içerikleri keşfedin'}
              </p>
            </div>
            
            {category !== 'cinebook_best' && (
              <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700">
                <SlidersHorizontal size={20} /> <span className="font-medium">Filtreler</span>
                {(selectedGenres.length > 0 || minRating > 0) && <span className="bg-blue-600 text-xs px-2 py-1 rounded-full">{selectedGenres.length + (minRating > 0 ? 1 : 0)}</span>}
              </button>
            )}
          </div>
        </div>

        <div className="mb-6 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder={`${mediaType === 'movie' ? 'Film' : 'Dizi'} ara...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"/>
        </div>

        {/* Filtre Paneli */}
        {showFilters && category !== 'cinebook_best' && (
          <div className="mb-6 p-6 bg-gray-800 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold">Filtreler</h3><button onClick={clearFilters} className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"><X size={16} /> Temizle</button></div>
            <div className="mb-6"><label className="block text-sm font-semibold mb-3 flex items-center gap-2"><Star size={16} className="text-yellow-400" /> Minimum Puan: {minRating.toFixed(1)}</label><input type="range" min="0" max="10" step="0.5" value={minRating} onChange={(e) => { setMinRating(parseFloat(e.target.value)); setPage(1); }} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600" /><div className="flex justify-between text-xs text-gray-400 mt-1"><span>0.0</span><span>5.0</span><span>10.0</span></div></div>
            <div className="mb-6"><label className="block text-sm font-semibold mb-3 flex items-center gap-2"><Calendar size={16} className="text-purple-400" /> Yıl Aralığı: {yearRange.min} - {yearRange.max}</label><div className="flex gap-4"><div className="flex-1"><label className="text-xs text-gray-400 mb-1 block">Başlangıç</label><input type="number" min="1900" max={yearRange.max} value={yearRange.min} onChange={(e) => { setYearRange(prev => ({ ...prev, min: parseInt(e.target.value) })); setPage(1); }} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" /></div><div className="flex-1"><label className="text-xs text-gray-400 mb-1 block">Bitiş</label><input type="number" min={yearRange.min} max={new Date().getFullYear()} value={yearRange.max} onChange={(e) => { setYearRange(prev => ({ ...prev, max: parseInt(e.target.value) })); setPage(1); }} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" /></div></div></div>
            <div><label className="block text-sm font-semibold mb-3 flex items-center gap-2"><Film size={16} className="text-green-400" /> Türler</label><div className="flex flex-wrap gap-2">{currentGenres.map((genre) => (<button key={genre.id} onClick={() => toggleGenre(genre.id)} className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedGenres.includes(genre.id) ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{genre.name}</button>))}</div></div>
          </div>
        )}

        {/* Kategori Butonları */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          <button onClick={() => handleCategoryChange('popular')} className={`flex items-center gap-2 px-5 py-2 rounded-full font-medium whitespace-nowrap transition-all ${category === 'popular' ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}><TrendingUp size={16} /> Popüler</button>
          {mediaType === 'movie' } <button
            onClick={() => handleCategoryChange('top_rated')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
              category === 'top_rated'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Star size={16} />
            En Yüksek Puanlı
          </button>
          {/* 🔥 YENİ BUTON: CineBook En İyiler */}
          <button 
            onClick={() => handleCategoryChange('cinebook_best')} 
            className={`flex items-center gap-2 px-5 py-2 rounded-full font-medium whitespace-nowrap transition-all ${category === 'cinebook_best' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-900/20' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          >
             <Trophy size={16} /> CineBook En İyiler
          </button>
        </div>

        {/* Grid */}
        {loading && page === 1 ? (
          <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div></div>
        ) : (
          <>
            {movies.length === 0 ? (
              <div className="text-center py-20 text-gray-400"><Film size={64} className="mx-auto mb-4 opacity-50"/><p className="text-xl">Sonuç bulunamadı</p></div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {movies.map((item) => (
                  <MovieCard key={item.id} item={item} imageBaseUrl={IMAGE_BASE_URL} mediaType={mediaType} navigate={navigate} />
                ))}
              </div>
            )}
            
            {/* Load More (Sadece TMDB) */}
            {category !== 'cinebook_best' && movies.length > 0 && (
              <div className="flex justify-center mt-8"><button onClick={loadMore} disabled={loading} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-3 rounded-xl font-semibold transition-all">{loading ? 'Yükleniyor...' : 'Daha Fazla Yükle'}</button></div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// 🔥 HİBRİT KART BİLEŞENİ (ÇİFT PUANLI)
const MovieCard = ({ item, imageBaseUrl, mediaType, navigate }) => {
  const title = item.title || item.name;
  const releaseDate = item.release_year || item.release_date || item.first_air_date;
  const year = releaseDate ? (String(releaseDate).length > 4 ? new Date(releaseDate).getFullYear() : releaseDate) : 'Bilinmiyor';
  
  // Poster
  const posterSrc = item.poster_url 
    ? item.poster_url 
    : (item.poster_path ? `${imageBaseUrl}${item.poster_path}` : null);

  // Puanlar
  const tmdbRating = item.vote_average ? Number(item.vote_average) : 0;
  const siteRating = item.avg_rating ? Number(item.avg_rating) : 0;     

  const handleClick = () => {
    navigate(`/main/detail/${item.id}`);
  };

  return (
    <div onClick={handleClick} className="group bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:scale-105 cursor-pointer border border-gray-700 hover:border-gray-600 relative">
      <div className="relative aspect-[2/3] bg-gray-700">
        {posterSrc ? (
          <img src={posterSrc} alt={title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Film size={48} className="text-gray-600" /></div>
        )}
        
        {/* 🔥 PUAN ROZETLERİ (SAĞ ÜST) */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
            {tmdbRating > 0 && (
              <div className="bg-black/80 px-2 py-1 rounded-md flex items-center gap-1 backdrop-blur-sm border border-yellow-500/30 shadow-lg">
                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-bold text-white">{tmdbRating.toFixed(1)}</span>
              </div>
            )}
            {siteRating > 0 && (
              <div className="bg-purple-900/90 px-2 py-1 rounded-md flex items-center gap-1 backdrop-blur-sm border border-purple-500/50 shadow-lg">
                 <Trophy size={12} className="text-purple-300 fill-purple-500" />
                 <span className="text-xs font-bold text-white">{siteRating.toFixed(1)}</span>
              </div>
            )}
        </div>
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-sm line-clamp-2 mb-1">{title}</h3>
        <p className="text-xs text-gray-400">{year}</p>
      </div>
    </div>
  );
};

export default Discover;