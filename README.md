# 📚 🎬 Book & Movie Social Platform (Kitap ve Film Sosyal Kütüphanesi)

Bu proje, kullanıcıların okudukları kitapları ve izledikleri filmleri/dizileri kaydedebileceği, inceleme yazıp puanlayabileceği ve diğer kullanıcılarla etkileşime geçebileceği web tabanlı bir sosyal platformdur.

## 🚀 Proje Hakkında

Kullanıcılar kendi dijital kütüphanelerini oluşturabilir, içeriklere yorum yapabilir ve ana akış (feed) üzerinden arkadaşlarının aktivitelerini takip edebilirler. Proje, modern web mimarisine uygun olarak **Frontend** ve **Backend** olmak üzere iki ana parçadan oluşmaktadır.

## 🛠️ Kullanılan Teknolojiler

### Backend (Sunucu Tarafı)
* **Dil:** Node.js
* **Framework:** Express.js
* **Veritabanı:** MySQL

### Frontend (İstemci Tarafı)
* **Kütüphane:** React (Vite ile)
* **Stil:** CSS
* **HTTP İstekleri:** Axios / Fetch

## 📂 Proje Yapısı

Proje iki ana klasörden oluşur:
* `/backend`: Sunucu, API ve veritabanı bağlantıları.
* `/client`: React ile geliştirilen kullanıcı arayüzü.

## ⚙️ Kurulum ve Çalıştırma

Projeyi yerel makinenizde hatasız çalıştırmak için veritabanını kurmalı ve hem backend hem de frontend tarafını **iki ayrı terminalde** ayağa kaldırmalısınız.

### 1. Veritabanı Kurulumu
Öncelikle MySQL veritabanınızı hazırlayın:
* `backend/database.sql` dosyasındaki SQL komutlarını MySQL veritabanınızda çalıştırarak gerekli tabloları oluşturun.
* `backend` klasörü içinde bir `.env` dosyası oluşturup veritabanı bağlantı bilgilerinizi girmeyi unutmayın.

### 2. Projeyi Klonlayın
```bash
git clone [https://github.com/Furkanaydn44/Film-ve-Kitap-Sosyal-Kutuphanesi.git](https://github.com/Furkanaydn44/Film-ve-Kitap-Sosyal-Kutuphanesi.git)
cd Film-ve-Kitap-Sosyal-Kutuphanesi
3. Backend Kurulumu ve Çalıştırma (1. Terminal)
Sunucuyu başlatmak için proje ana dizinindeyken şu komutları sırasıyla uygulayın:
```
```bash

cd backend
npm install
```
Gerekli paketler yüklendikten sonra sunucuyu geliştirici modunda başlatın:


```bash

npm run dev
```
Önemli Not: Backend sunucusu çalışmaya başladığında terminali kapatmayın. Sunucu bu pencerede çalışmaya devam etmelidir.

4. Frontend Kurulumu ve Çalıştırma (2. Terminal)
Backend çalışırken, yeni bir terminal penceresi açın ve proje ana dizinine gelerek şu adımları izleyin:

```bash

cd client
npm install
```
Arayüzü başlatmak için:

```bash

npm run dev
```
Bilgi: Terminalde size verilen http://localhost:5173 (veya benzeri) linke tıklayarak projeyi tarayıcınızda görüntüleyebilirsiniz.

✨ Özellikler:

[x] Kullanıcı Kayıt ve Giriş

[x] Kitap/Film Arama ve Ekleme

[x] Kütüphane Yönetimi

[x] Puanlama ve Yorumlar

[x] Sosyal Akış
