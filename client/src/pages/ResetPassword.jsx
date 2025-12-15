// pages/ResetPassword.jsx
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { authAPI } from '../services/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // URL'den token'ı al (http://localhost:5173/reset-password?token=XYZ)
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  // Eğer URL'de token yoksa hata göster
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center p-8 bg-gray-800 rounded-xl border border-red-500/30">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Geçersiz Bağlantı</h2>
          <p className="text-gray-400 mb-6">Şifre sıfırlama bağlantısı hatalı veya eksik.</p>
          <button onClick={() => navigate('/login')} className="bg-gray-700 px-6 py-2 rounded-lg">Giriş Ekranına Dön</button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    if (formData.newPassword.length < 6) {
      setStatus({ type: 'error', message: 'Şifre en az 6 karakter olmalıdır.' });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setStatus({ type: 'error', message: 'Şifreler eşleşmiyor.' });
      return;
    }

    setLoading(true);

    try {
      // Backend'e istek at (Token + Yeni Şifre)
      const response = await authAPI.resetPassword(token, formData.newPassword);
      
      if (response.success) {
        setStatus({ type: 'success', message: 'Şifreniz başarıyla güncellendi! Giriş sayfasına yönlendiriliyorsunuz...' });
        
        // 3 saniye sonra login sayfasına at
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: error.message || 'Şifre sıfırlama başarısız. Linkin süresi dolmuş olabilir.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Yeni Şifre Belirle</h2>
          <p className="text-gray-400 text-sm">Lütfen hesabınız için yeni bir şifre girin.</p>
        </div>

        {/* Durum Mesajları */}
        {status.message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            status.type === 'success' 
              ? 'bg-green-500/20 border border-green-500 text-green-300' 
              : 'bg-red-500/20 border border-red-500 text-red-300'
          }`}>
            {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <p className="text-sm">{status.message}</p>
          </div>
        )}

        {/* Form - Başarılıysa gizle */}
        {status.type !== 'success' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Yeni Şifre */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                placeholder="Yeni Şifre"
                className="w-full pl-12 pr-12 py-3 rounded-lg bg-gray-900/50 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Şifre Tekrar */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Yeni Şifre (Tekrar)"
                className="w-full pl-12 pr-12 py-3 rounded-lg bg-gray-900/50 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="animate-spin" size={20} />}
              {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;