import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Book, TrendingUp, Award, BookOpen, X, SlidersHorizontal, Trophy } from 'lucide-react';
import { mediaAPI } from '../services/api';

const BookDiscover = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [category, setCategory] = useState('bestseller');
  const [startIndex, setStartIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const maxResults = 20;

  const languages = [
    { code: '', name: 'Tümü' }, { code: 'tr', name: 'Türkçe' }, { code: 'en', name: 'İngilizce' },
    { code: 'fr', name: 'Fransızca' }, { code: 'de', name: 'Almanca' }, { code: 'es', name: 'İspanyolca' }
  ];

  const subjects = [
    { value: '', name: 'Tümü' }, { value: 'fiction', name: 'Kurgu' }, { value: 'science', name: 'Bilim' },
    { value: 'history', name: 'Tarih' }, { value: 'biography', name: 'Biyografi' }, { value: 'philosophy', name: 'Felsefe' },
    { value: 'psychology', name: 'Psikoloji' }, { value: 'business', name: 'İş & Ekonomi' }, { value: 'self-help', name: 'Kişisel Gelişim' },
    { value: 'technology', name: 'Teknoloji' }, { value: 'art', name: 'Sanat' }, { value: 'poetry', name: 'Şiir' },
    { value: 'drama', name: 'Drama' }, { value: 'mystery', name: 'Gizem & Gerilim' }, { value: 'romance', name: 'Romantik' }, { value: 'fantasy', name: 'Fantastik' }
  ];

  const fetchBooks = async () => {
    setLoading(true);
    try {
      // DURUM 1: CINEBOOK EN İYİLER (YEREL DB)
      if (category === 'cinebook_best' && !searchQuery) {
         const response = await mediaAPI.getTopRated('book', 20);
         if (response.success) {
            setBooks(response.data.media || []);
         }
      } 
      // DURUM 2: Google Books API (Diğerleri)
      else {
        let query = '';
        if (searchQuery) {
          query = searchQuery;
        } else {
          if (category === 'bestseller') query = 'bestseller';
          else if (category === 'classics') query = 'classics literature';
          else if (category === 'new') query = 'new releases';
        }

        if (selectedSubject) query += ` subject:${selectedSubject}`;

        let url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${maxResults}&startIndex=${startIndex}&orderBy=relevance`;
        
        if (selectedLanguage) url += `&langRestrict=${selectedLanguage}`;

        const response = await fetch(url);
        const data = await response.json();
        
        if (startIndex === 0) {
          setBooks(data.items || []);
        } else {
          setBooks(prev => [...prev, ...(data.items || [])]);
        }
      }
    } catch (error) {
      console.error('Kitap yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 DÜZELTME BURADA YAPILDI 🔥
  // category, selectedLanguage veya selectedSubject değiştiğinde çalışır.
  useEffect(() => {
    setBooks([]);     // Listeyi temizle
    setStartIndex(0); // Sayfayı başa al
    fetchBooks();     // Veriyi çek
  }, [category, selectedLanguage, selectedSubject]); 

  // Arama sorgusu için debounce (bekletme)
  useEffect(() => {
     const timer = setTimeout(() => {
        if (searchQuery) {
            setCategory('search');
            setStartIndex(0);
            fetchBooks();
        } else if (category === 'search') {
            setCategory('bestseller');
        }
     }, 500);
     return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Sayfalama (Daha fazla yükle) için
  useEffect(() => {
    if (startIndex > 0 && category !== 'cinebook_best') fetchBooks();
  }, [startIndex]);

  const handleCategoryChange = (newCategory) => { setCategory(newCategory); setSearchQuery(''); setStartIndex(0); };
  const loadMore = () => { setStartIndex(prev => prev + maxResults); };
  const clearFilters = () => { setSelectedLanguage(''); setSelectedSubject(''); setStartIndex(0); };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Kitap Keşfet</h2>
              <p className="text-gray-400">
                 {category === 'cinebook_best' ? 'CineBook topluluğunun en sevdikleri' : 'Binlerce kitap arasından keşfet'}
              </p>
            </div>
            {category !== 'cinebook_best' && (
              <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700">
                <SlidersHorizontal size={20} /> <span className="font-medium">Filtreler</span>
                {(selectedLanguage || selectedSubject) && <span className="bg-purple-600 text-xs px-2 py-1 rounded-full">{(selectedLanguage ? 1 : 0) + (selectedSubject ? 1 : 0)}</span>}
              </button>
            )}
          </div>
        </div>

        <div className="mb-6 relative">
           <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
           <input type="text" placeholder="Kitap, yazar veya konu ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400" />
        </div>

        {/* Filtre Paneli */}
        {showFilters && category !== 'cinebook_best' && (
          <div className="mb-6 p-6 bg-gray-800 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold">Filtreler</h3><button onClick={clearFilters} className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"><X size={16} /> Temizle</button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Dil Seçimi - onChange sadeleştirildi çünkü useEffect hallediyor */}
              <div>
                <label className="block text-sm font-semibold mb-3 flex items-center gap-2"><BookOpen size={16} className="text-blue-400" /> Dil</label>
                <select 
                  value={selectedLanguage} 
                  onChange={(e) => setSelectedLanguage(e.target.value)} 
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {languages.map((lang) => (<option key={lang.code} value={lang.code}>{lang.name}</option>))}
                </select>
              </div>

              {/* Konu Seçimi - onChange sadeleştirildi çünkü useEffect hallediyor */}
              <div>
                <label className="block text-sm font-semibold mb-3 flex items-center gap-2"><Book size={16} className="text-green-400" /> Konu</label>
                <select 
                  value={selectedSubject} 
                  onChange={(e) => setSelectedSubject(e.target.value)} 
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {subjects.map((subject) => (<option key={subject.value} value={subject.value}>{subject.name}</option>))}
                </select>
              </div>

            </div>
          </div>
        )}

        {/* Kategori Butonları */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          <button onClick={() => handleCategoryChange('bestseller')} className={`flex items-center gap-2 px-5 py-2 rounded-full font-medium whitespace-nowrap transition-all ${category === 'bestseller' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}><TrendingUp size={16} /> Çok Satanlar</button>
          <button onClick={() => handleCategoryChange('classics')} className={`flex items-center gap-2 px-5 py-2 rounded-full font-medium whitespace-nowrap transition-all ${category === 'classics' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}><Award size={16} /> Klasikler</button>
          <button onClick={() => handleCategoryChange('new')} className={`flex items-center gap-2 px-5 py-2 rounded-full font-medium whitespace-nowrap transition-all ${category === 'new' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}><BookOpen size={16} /> Yeni Çıkanlar</button>
          <button 
              onClick={() => handleCategoryChange('cinebook_best')} 
              className={`flex items-center gap-2 px-5 py-2 rounded-full font-medium whitespace-nowrap transition-all ${category === 'cinebook_best' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-900/20' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          >
              <Trophy size={16} /> CineBook En İyiler
          </button>
        </div>

        {/* Grid */}
        {loading && startIndex === 0 ? (
          <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-500"></div></div>
        ) : (
          <>
            {books.length === 0 ? (
              <div className="text-center py-20"><Book size={64} className="mx-auto text-gray-600 mb-4" /><p className="text-xl text-gray-400">Sonuç bulunamadı</p><p className="text-sm text-gray-500 mt-2">Bu kategoride henüz veri yok.</p></div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {books.map((book) => (
                  <BookCard 
                    key={book.id} 
                    book={book} 
                    navigate={navigate} 
                  />
                ))}
              </div>
            )}

            {category !== 'cinebook_best' && books.length > 0 && (
              <div className="flex justify-center mt-8">
                <button onClick={loadMore} disabled={loading} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 px-8 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed">{loading ? 'Yükleniyor...' : 'Daha Fazla Yükle'}</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// HİBRİT KART BİLEŞENİ
const BookCard = ({ book, navigate }) => {
  const isLocal = !book.volumeInfo;
  const title = isLocal ? book.title : (book.volumeInfo?.title || 'Başlık Yok');
  const authors = isLocal ? (book.author || 'Yazar Bilinmiyor') : (book.volumeInfo?.authors?.join(', ') || 'Yazar Bilinmiyor');
  const thumbnail = isLocal 
    ? book.poster_url 
    : (book.volumeInfo?.imageLinks?.thumbnail || book.volumeInfo?.imageLinks?.smallThumbnail);
  const googleRating = isLocal ? 0 : (book.volumeInfo?.averageRating || 0);
  const siteRating = isLocal ? Number(book.avg_rating || 0) : 0;
  const publishedDate = isLocal ? book.release_year : book.volumeInfo?.publishedDate?.split('-')[0];

  const handleClick = () => {
    navigate(`/main/book/${book.id}`);
  };

  return (
    <div onClick={handleClick} className="group bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all hover:scale-105 cursor-pointer border border-gray-700 hover:border-gray-600 relative">
      <div className="relative aspect-[2/3] bg-gray-700">
        {thumbnail ? (
          <img src={thumbnail.replace('http://', 'https://')} alt={title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Book size={48} className="text-gray-600" /></div>
        )}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
           {Number(googleRating) > 0 && (
             <div className="bg-black/80 px-2 py-1 rounded-md flex items-center gap-1 backdrop-blur-sm border border-yellow-500/30 shadow-lg">
               <Star size={12} className="text-yellow-400 fill-yellow-400" />
               <span className="text-xs font-bold text-white">{Number(googleRating).toFixed(1)}</span>
             </div>
           )}
           {Number(siteRating) > 0 && (
             <div className="bg-purple-900/90 px-2 py-1 rounded-md flex items-center gap-1 backdrop-blur-sm border border-purple-500/50 shadow-lg">
                <Trophy size={12} className="text-purple-300 fill-purple-500" />
                <span className="text-xs font-bold text-white">{Number(siteRating).toFixed(1)}</span>
             </div>
           )}
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm line-clamp-2 mb-1">{title}</h3>
        <p className="text-xs text-gray-400 line-clamp-1 mb-1">{authors}</p>
        {publishedDate && <p className="text-xs text-gray-500">{publishedDate}</p>}
      </div>
    </div>
  );
};

export default BookDiscover;