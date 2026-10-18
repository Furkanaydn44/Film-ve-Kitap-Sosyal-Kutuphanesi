# 📚🎬 Book & Movie Social Platform (Film & Kitap Sosyal Kütüphanesi)

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

**Kullanıcıların okudukları kitapları ve izledikleri filmleri/dizileri kaydedebileceği, inceleme yazıp puanlayabileceği ve diğer kullanıcılarla etkileşime geçebileceği full-stack modern bir sosyal platform.**

[Özellikler](#-özellikler) • [Teknolojiler](#-kullanılan-teknolojiler) • [Kurulum](#️-kurulum-ve-çalıştırma) • [Ortam Değişkenleri](#-ortam-değişkenleri-env) • [API Endpoint'leri](#-api-endpointleri)

</div>

---

## 🚀 Proje Hakkında

Bu proje, sinema ve edebiyat tutkunlarını tek bir çatı altında toplayan sosyal bir ağdır. Kullanıcılar kişisel kütüphanelerini yönetebilir, TMDb ve Google Books API entegrasyonu sayesinde milyonlarca film, dizi ve kitaba anında ulaşıp detaylarını inceleyebilir, favori listelerini oluşturabilir ve arkadaşlarıyla etkileşimde bulunabilirler.

Uygulama modern web mimarisine uygun olarak **Frontend (İstemci)** ve **Backend (Sunucu/API)** olmak üzere iki bağımsız katmandan oluşmaktadır.

---

## ✨ Özellikler

- 🔐 **Gelişmiş Kimlik Doğrulama:**
  - JWT tabanlı güvenli oturum yönetimi (Register, Login, Token Refresh/Verify).
  - Şifremi unuttum akışı ve Nodemailer ile e-posta üzerinden şifre sıfırlama bağlantısı.
  - Şifre değiştirme ve güvenli parola hashleme (`bcryptjs`).

- 🔍 **Zengin İçerik Keşfi (Search & Discover):**
  - **TMDb Entegrasyonu:** Popüler, trend filmler/diziler, detaylar, oyuncu kadrosu, fragmanlar ve afişler.
  - **Google Books Entegrasyonu:** Kitap arama, yazar bilgileri, kapak görselleri, yayın yılı ve açıklamalar.

- 📖 **Kütüphane & Takip Yönetimi:**
  - İzleme / Okuma durumları (İzlendi, İzlenecek, Okundu, Okunuyor, Bırakıldı).
  - Medyaları kişisel koleksiyona hızlıca ekleme ve çıkarma.

- ⭐ **Puanlama ve İnceleme Sistemi:**
  - 1-10 arası yıldızla puanlama.
  - Detaylı inceleme/yorum metni yazma ve düzenleme.
  - Yorumlara beğeni (Like) bırakabilme.

- 📋 **Özel Listeler (Custom Lists):**
  - Kullanıcıların kendi tematik listelerini oluşturabilmesi (örn. *"En İyi Bilim Kurgular"*, *"2025'te Okunacaklar"*).
  - Listelere dilediği film veya kitabı ekleyip paylaşabilme.

- 👥 **Sosyal Ağ & Etkileşim:**
  - Kullanıcı arama ve profillerini ziyaret etme.
  - Takip et / Takipten çık (Follow / Unfollow) mekanizması.
  - Takipçi ve takip edilen kullanıcı listeleri.
  - Ana akış (Feed): Takip edilen kişilerin son aktivitelerini (izledi, puanladı, yorum yaptı) kronolojik olarak görme.

- 👤 **Profil & Özelleştirme:**
  - Kullanıcı istatistikleri (izlenen film, okunan kitap, toplam inceleme sayısı).
  - Multer ile yerel dosya yükleme desteğiyle profil fotoğrafı (Avatar) güncelleme.
  - Kullanıcının kütüphanesini, incelemelerini ve özel listelerini sekme sekme görüntüleme.

---

## 🛠️ Kullanılan Teknolojiler

### Backend (Sunucu Tarafı)
* **Çalışma Ortamı:** Node.js
* **Framework:** Express.js (v5)
* **Veritabanı:** MySQL (bağlantı havuzu için `mysql2`)
* **Kimlik Doğrulama & Güvenlik:** JSON Web Token (JWT), `bcryptjs`, `helmet`, `cors`
* **Girdi Doğrulama:** `express-validator`
* **Dosya Yükleme:** `multer` (Avatar / profil görselleri)
* **E-posta Servisi:** `nodemailer` (Şifre sıfırlama)
* **HTTP İstemcisi:** `axios` (Harici API istekleri için)
* **Geliştirme Aracı:** `nodemon`

### Frontend (İstemci Tarafı)
* **Kütüphane / Framework:** React 19
* **Build Aracı:** Vite
* **Yönlendirme:** React Router DOM (v7)
* **Stil:** Tailwind CSS (v4)
* **İkonlar:** Lucide React
* **HTTP İstekleri:** Axios (İstek interceptor'ları ve token yönetimi ile)

### Harici API'ler
* **The Movie Database (TMDb) API:** Film ve dizi metaverileri, posterler.
* **Google Books API:** Kitap bilgileri ve kapak resimleri.

---

## 📂 Proje Yapısı

```text
Film-ve-Kitap-Sosyal-Kutuphanesi/
├── backend/
│   ├── config/             # Veritabanı bağlantı havuzu yapılandırması
│   ├── controllers/        # İstekleri karşılayan iş mantığı katmanı
│   │   ├── activityController.js
│   │   ├── authController.js
│   │   ├── collectionController.js
│   │   ├── likeController.js
│   │   ├── listController.js
│   │   ├── mediaController.js
│   │   └── userController.js
│   ├── middleware/         # Ara yazılımlar (Auth, Upload, Validation, Error Handler)
│   ├── models/             # MySQL veritabanı sorguları ve veri modelleri
│   ├── routes/             # Express API uç nokta tanımları
│   ├── services/           # TMDb ve Google Books harici servis çağrıları
│   ├── uploads/            # Yüklenen profil fotoğrafları
│   ├── server.js           # Express sunucu giriş noktası
│   └── package.json
│
├── client/
│   ├── public/             # Statik dosyalar
│   ├── src/
│   │   ├── components/     # Yeniden kullanılabilir bileşenler (ProtectedRoute vb.)
│   │   ├── context/        # React Context (AuthContext vb.)
│   │   ├── pages/          # Sayfa bileşenleri (Login, Discover, Profile, Detail...)
│   │   ├── services/       # Axios API servis katmanı
│   │   ├── App.jsx         # Rota hiyerarşisi
│   │   ├── main.jsx        # React DOM render noktası
│   │   └── index.css       # Tailwind CSS stilleri
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## ⚙️ Kurulum ve Çalıştırma

Projeyi yerel makinenizde sorunsuz çalıştırmak için aşağıdaki adımları sırasıyla takip edin.

### Ön Koşullar
* **Node.js:** v18 veya üzeri
* **MySQL:** v8 veya üzeri kurulu ve çalışıyor olmalıdır.
* **TMDb API Key:** [themoviedb.org](https://www.themoviedb.org/) üzerinden ücretsiz alınabilir.
* **Google Books API Key:** (Opsiyonel / İsteğe bağlı) [Google Cloud Console](https://console.cloud.google.com/) üzerinden alınabilir.

---

### 1. Projeyi Klonlayın

```bash
git clone https://github.com/Furkanaydn44/Film-ve-Kitap-Sosyal-Kutuphanesi.git
cd Film-ve-Kitap-Sosyal-Kutuphanesi
```

---

### 2. Veritabanı Kurulumu

MySQL sunucunuzda yeni bir veritabanı oluşturun ve tabloları hazırlayın:

```sql
CREATE DATABASE web_service CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE web_service;
```

* Varsa `backend` klasöründeki SQL script'ini (`database.sql`) veya model şemalarını çalıştırarak kullanıcı, medya, koleksiyon, inceleme, liste ve beğeni tablolarınızı oluşturun.

---

### 3. Backend Kurulumu ve Başlatma (1. Terminal)

1. `backend` klasörüne gidin ve bağımlılıkları yükleyin:
   ```bash
   cd backend
   npm install
   ```

2. `backend` klasörü içinde bir `.env` dosyası oluşturun ve aşağıdaki değişkenleri kendinize göre doldurun:
   ```env
   # Server Yapılandırması
   PORT=5000
   NODE_ENV=development
   BASE_URL=http://localhost:5000

   # Veritabanı Bağlantısı
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=veritabani_sifreniz
   DB_NAME=web_service

   # JWT Güvenliği
   JWT_SECRET=super_gizli_jwt_anahtariniz_buraya
   JWT_EXPIRE=7d

   # TMDb API (Film & Dizi)
   TMDB_API_KEY=tmdb_api_anahtariniz
   TMDB_BASE_URL=https://api.themoviedb.org/3

   # Google Books API (Kitap)
   GOOGLE_BOOKS_API_KEY=google_books_api_anahtariniz
   GOOGLE_BOOKS_BASE_URL=https://www.googleapis.com/books/v1

   # E-Posta Ayarları (Şifre sıfırlama için)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=ornek_mail@gmail.com
   EMAIL_PASSWORD=uygulama_sifresi

   # Frontend URL (CORS İzinleri)
   FRONTEND_URL=http://localhost:5173

   # Dosya Yükleme Ayarları
   MAX_FILE_SIZE=5242880
   UPLOAD_PATH=./uploads
   ```

3. Backend sunucusunu geliştirici modunda başlatın:
   ```bash
   npm run dev
   ```
   > 🟢 Sunucu başarıyla çalıştığında konsolda `Server 5000 portunda çalışıyor` çıktısını göreceksiniz. **Bu terminali kapatmayın.**

---

### 4. Frontend Kurulumu ve Başlatma (2. Terminal)

Yeni bir terminal penceresi açın ve proje ana dizinindeyken `client` klasörüne geçin:

1. Bağımlılıkları yükleyin:
   ```bash
   cd client
   npm install
   ```

2. İsteğe bağlı olarak `client` klasöründe `.env` dosyanızı kontrol edin:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

3. Frontend geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

4. Tarayıcınızda terminalde verilen adrese (genellikle `http://localhost:5173`) giderek uygulamayı kullanmaya başlayabilirsiniz! 🎉

---

## 🌐 API Endpoint'leri

Backend tarafından sunulan başlıca REST API rotaları:

| Kategori | Metot | Endpoint | Açıklama | Yetki |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/register` | Yeni kullanıcı kaydı | Herkese Açık |
| **Auth** | `POST` | `/api/auth/login` | Kullanıcı girişi & Token alma | Herkese Açık |
| **Auth** | `GET` | `/api/auth/me` | Oturum açan kullanıcının bilgileri | Giriş Zorunlu |
| **Auth** | `POST` | `/api/auth/forgot-password` | Şifre sıfırlama maili gönderme | Herkese Açık |
| **Auth** | `POST` | `/api/auth/reset-password` | Şifre sıfırlama işlemi | Herkese Açık |
| **Users** | `GET` | `/api/users/:username` | Kullanıcı profili görüntüleme | Giriş Zorunlu |
| **Users** | `PUT` | `/api/users/profile` | Profil bilgilerini ve avatarı güncelleme | Giriş Zorunlu |
| **Users** | `POST` | `/api/users/:id/follow` | Kullanıcıyı takip et / takipten çık | Giriş Zorunlu |
| **Media** | `GET` | `/api/media/search` | Film & Kitap arama (TMDb / Google Books) | Giriş Zorunlu |
| **Media** | `GET` | `/api/media/:type/:id` | İçerik detaylarını getirme | Giriş Zorunlu |
| **Collections**| `POST` | `/api/collections` | Kütüphaneye ekleme / durum güncelleme | Giriş Zorunlu |
| **Collections**| `GET` | `/api/collections/user/:userId`| Kullanıcı kütüphanesini listeleme | Giriş Zorunlu |
| **Activities** | `GET` | `/api/activities/feed` | Ana sayfa sosyal akışı (Feed) | Giriş Zorunlu |
| **Lists** | `GET` | `/api/lists` | Özel listeleri görüntüleme | Giriş Zorunlu |
| **Lists** | `POST` | `/api/lists` | Yeni özel liste oluşturma | Giriş Zorunlu |
| **Likes** | `POST` | `/api/likes/toggle` | Yorum/aktivite beğen veya beğeniyi kaldır | Giriş Zorunlu |

---

## 🤝 Katkıda Bulunma

Katkı sağlamak isterseniz adımlar:

1. Projeyi Fork'layın (`Fork` butonuna tıklayın).
2. Yeni bir özellik dalı oluşturun:
   ```bash
   git checkout -b feature/YeniOzellik
   ```
3. Değişikliklerinizi commit edin:
   ```bash
   git commit -m 'feat: Yeni özellik eklendi'
   ```
4. Dalınıza push edin:
   ```bash
   git push origin feature/YeniOzellik
   ```
5. Bir **Pull Request (PR)** açın.

---

## 📄 Lisans

Bu proje [MIT](LICENSE) lisansı altında korunmaktadır. İstediğiniz gibi geliştirebilir ve kullanabilirsiniz.

---
