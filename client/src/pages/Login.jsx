// pages/Login.jsx - Şifre Sıfırlama Eklenmiş Hali
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Book, User, Mail, Lock, Eye, EyeOff, Loader2, X, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api'; // authAPI'yi import ettik

const Login = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Şifre Sıfırlama State'leri
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState({ type: '', text: '' });

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: ''
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.email || !formData.password) {
      setError('E-posta ve şifre gereklidir');
      setLoading(false);
      return;
    }

    try {
      const result = await login({
        email: formData.email,
        password: formData.password
      });

      if (result.success) {
        navigate('/main');
      } else {
        setError(result.message || 'Giriş başarısız');
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.username || !formData.email || !formData.password) {
      setError('Tüm alanları doldurun');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor!');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      setLoading(false);
      return;
    }

    try {
      const result = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name 
      });

      if (result.success) {
        navigate('/main');
      } else {
        setError(result.message || 'Kayıt başarısız');
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // Şifre Sıfırlama İsteği Gönder
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;

    setForgotLoading(true);
    setForgotMessage({ type: '', text: '' });

    try {
      await authAPI.forgotPassword(forgotEmail);
      setForgotMessage({ 
        type: 'success', 
        text: 'Sıfırlama bağlantısı e-posta adresinize gönderildi.' 
      });
      setForgotEmail(''); // Email alanını temizle
    } catch (error) {
      setForgotMessage({ 
        type: 'error', 
        text: error.message || 'İşlem başarısız oldu. Lütfen e-posta adresinizi kontrol edin.' 
      });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-gray-900 overflow-hidden">
      {/* Video arka plan */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="../src/assets/kedi.mp4" type="video/mp4" />
      </video>
      
      {/* Füme overlay */}
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />

      {/* Logo/Başlık */}
      <div className="absolute top-8 left-8 z-10">
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <Film className="text-blue-400" size={32} />
            <Book className="text-purple-400" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">CineBook</h1>
            <p className="text-sm text-gray-300">Film & Kitap Sosyal Ağı</p>
          </div>
        </div>
      </div>

      {/* Ana Container */}
      <div className="relative flex justify-end items-center min-h-screen pr-20">
        
        {/* ŞİFREMİ UNUTTUM MODALI */}
        {showForgotPassword ? (
            <div className="bg-gray-800/90 p-10 rounded-2xl shadow-2xl w-[500px] border border-gray-700 backdrop-blur-md relative animate-in fade-in zoom-in duration-300">
                <button 
                    onClick={() => {
                        setShowForgotPassword(false);
                        setForgotMessage({ type: '', text: '' });
                    }}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                <h2 className="text-white text-2xl font-bold text-center mb-2">Şifremi Unuttum</h2>
                <p className="text-gray-400 text-center mb-6 text-sm">
                    Hesabınıza ait e-posta adresinizi girin, size sıfırlama bağlantısı gönderelim.
                </p>

                {forgotMessage.text && (
                    <div className={`mb-6 p-3 rounded-lg text-sm border ${
                        forgotMessage.type === 'success' 
                            ? 'bg-green-500/20 border-green-500 text-green-300' 
                            : 'bg-red-500/20 border-red-500 text-red-300'
                    }`}>
                        {forgotMessage.text}
                    </div>
                )}

                <form onSubmit={handleForgotPassword} className="space-y-6">
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="email"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            placeholder="E-posta Adresi"
                            className="w-full pl-12 pr-4 py-3 rounded-lg bg-gray-900/50 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={forgotLoading}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {forgotLoading && <Loader2 className="animate-spin" size={20} />}
                        {forgotLoading ? 'Gönderiliyor...' : 'Sıfırlama Linki Gönder'}
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowForgotPassword(false)}
                        className="w-full text-gray-400 hover:text-white text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                        <ArrowLeft size={16} /> Giriş ekranına dön
                    </button>
                </form>
            </div>
        ) : (
            /* LOGIN / REGISTER FORM */
            <div className="bg-gray-800/80 p-10 rounded-2xl shadow-2xl w-[500px] border border-gray-700 backdrop-blur-md animate-in fade-in zoom-in duration-300">
          
          {/* Tab Geçişi */}
          <div className="flex gap-2 mb-8 bg-gray-900/50 p-1 rounded-lg">
            <button
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                isLogin
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Giriş Yap
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                !isLogin
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Kayıt Ol
            </button>
          </div>

          {/* Hata Mesajı */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <h2 className="text-white text-2xl font-bold text-center mb-6">
                Hoş Geldiniz!
              </h2>

              <div className="space-y-4">
                {/* Email */}
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="E-posta"
                    className="w-full pl-12 pr-4 py-3 rounded-lg bg-gray-900/50 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
                    required
                  />
                </div>

                {/* Şifre */}
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Şifre"
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

                {/* Şifremi Unuttum Linki */}
                <div className="flex justify-end">
                    <button 
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        Şifremi Unuttum?
                    </button>
                </div>

                {/* Giriş Butonu */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg shadow-lg transition-all mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="animate-spin" size={20} />}
                  {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                </button>
              </div>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-6">
              <h2 className="text-white text-2xl font-bold text-center mb-6">
                Hesap Oluştur
              </h2>

              <div className="space-y-4">
                {/* Kullanıcı Adı */}
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Kullanıcı adı"
                    className="w-full pl-12 pr-4 py-3 rounded-lg bg-gray-900/50 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
                    required
                  />
                </div>

                 {/* full Adı */}
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"   
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="İsim Soyisim"
                    className="w-full pl-12 pr-4 py-3 rounded-lg bg-gray-900/50 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
                    required
                  />
                </div>

                {/* Email */}
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="E-posta"
                    className="w-full pl-12 pr-4 py-3 rounded-lg bg-gray-900/50 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
                    required
                  />
                </div>

                {/* Şifre */}
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Şifre (min. 6 karakter)"
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
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Şifre Tekrar"
                    className="w-full pl-12 pr-12 py-3 rounded-lg bg-gray-900/50 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {/* Kayıt Ol Butonu */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg shadow-lg transition-all mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="animate-spin" size={20} />}
                  {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
                </button>
              </div>
            </form>
          )}
        </div>
        )}

      </div>
    </div>
  );
};

export default Login;