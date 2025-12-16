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


