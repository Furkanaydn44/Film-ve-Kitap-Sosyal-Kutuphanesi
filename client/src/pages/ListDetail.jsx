import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Star, Film, Book, Loader2 } from 'lucide-react';
import { listAPI } from '../services/api';

const ListDetail = () => {
  const { listId } = useParams();
  const navigate = useNavigate();
  
  const [list, setList] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchList = async () => {
      try {
        setLoading(true);
        const response = await listAPI.getListById(listId);
        if (response.success) {
          setList(response.data.list);
          setItems(response.data.items || []);
        }
      } catch (error) {
        console.error('Liste yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    if (listId) {
      fetchList();
    }
  }, [listId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-500" size={48} />
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
        <p className="text-xl mb-4">Liste bulunamadı</p>
        <button 
          onClick={() => navigate(-1)} 
          className="px-6 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Geri Dön
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-black/20 hover:bg-black/40 rounded-lg transition-colors mb-6 text-gray-300 hover:text-white w-fit"
          >
            <ArrowLeft size={20} /> Geri
          </button>

          <h1 className="text-4xl font-bold mb-2">{list.list_name}</h1>
          {list.description && (
            <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">
              {list.description}
            </p>
          )}
          
          <div className="flex gap-4 mt-6 text-sm text-gray-500">
            <span>{items.length} içerik</span>
            <span>•</span>
            <span>{new Date(list.created_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })} oluşturuldu</span>
          </div>
        </div>
      </div>

      {/* Liste İçeriği */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {items.length === 0 ? (
          <div className="text-center py-20 bg-gray-800/50 rounded-xl border border-gray-700 border-dashed">
            <Film size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 text-lg">Bu listede henüz içerik yok.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {items.map((item) => (
              <div 
                key={item.id} 
                onClick={() => navigate(`/main/book/${item.media_id}`)}
                className="group bg-gray-800 rounded-xl overflow-hidden shadow-lg cursor-pointer border border-gray-700 hover:border-purple-500 transition-all hover:-translate-y-1 relative"
              >
                {/* Poster */}
                <div className="aspect-[2/3] relative">
                  <img
                    src={item.poster_url || 'https://via.placeholder.com/200x300'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-xs font-bold bg-purple-600 px-2 py-1 rounded text-white">Detaylar</span>
                  </div>
                  
                  {/* Sıra Numarası (Opsiyonel) */}
                  <div className="absolute top-2 left-2 bg-black/60 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold border border-gray-600">
                    {item.list_order || '#'}
                  </div>
                </div>

                {/* Bilgiler */}
                <div className="p-3">
                  <h3 className="font-bold text-sm text-gray-100 line-clamp-1 mb-1">{item.title}</h3>
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>{item.release_year}</span>
                    {item.avg_rating > 0 && (
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star size={10} fill="currentColor" />
                        <span>{item.avg_rating}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Varsa Kullanıcı Notu */}
                  {item.note && (
                    <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-400 italic line-clamp-2">
                      "{item.note}"
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListDetail;