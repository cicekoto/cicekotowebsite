# Section edit: VAG uzmanlığı ve çoklu hizmet randevusu

## Hedef
- Ana sayfa ve randevu alanında Volkswagen, Audi, Škoda, SEAT ve CUPRA uzmanlığını açıkça anlatmak.
- Randevu formunda birden fazla hizmet seçilebilmesini sağlamak.
- Seçimleri API üzerinden `services[]` olarak Supabase'e kaydetmek ve yönetim panelinde eksiksiz göstermek.
- Günlük kapasiteyi 5 araçla sınırlamak; yalnız bakım için 60, diğer talepler için 120 dakika ayırmak.

## Etkilenen alanlar
- `index.html`: hero metni, VAG marka şeridi, çoklu hizmet seçenekleri ve VAG marka seçimi.
- `css/style.css`: marka şeridi, checkbox seçim durumu ve mobil düzen.
- `js/main.js`: çoklu seçim, doğrulama, gönderim ve WhatsApp özeti.
- `api/appointments.js`: dizi doğrulama ve Supabase kaydı.
- `admin.html`: çoklu hizmet gösterimi ve CSV dışa aktarımı.
- `supabase/migrations/202608310002_appointment_services.sql`: `services text[]` sütunu ve mevcut kayıtların taşınması.
- `supabase/migrations/202608310003_appointment_capacity.sql`: süre, günlük kapasite ve çakışmasız atomik kayıt fonksiyonu.

## Etkileşim ve responsive beklentisi
- En az bir, en fazla altı hizmet seçilebilmeli; seçili hizmet sayısı görünmeli.
- Marka seçimi yalnızca VAG markalarını içermeli ve tek seçim olmalı.
- Tarih seçilince dolu saatler API'den alınmalı; günlük 5 kayıt dolduğunda saat sunulmamalı.
- Masaüstünde iki sütun, mobilde tek sütun düzen korunmalı.
- Klavye kullanımı ve hata görünümü çalışmalı.

## Doğrulama
- [ ] Çoklu hizmet seçimi FormData'da dizi olarak oluşuyor.
- [ ] API geçersiz/boş hizmet dizisini reddediyor.
- [ ] Supabase'de `services` sütununa dizi kaydediliyor.
- [ ] Yönetim paneli tüm hizmetleri gösteriyor.
- [ ] Masaüstü ve mobilde taşma yok.
- [ ] Canlı form gerçek bir test kaydı oluşturuyor ve kayıt geri okunabiliyor.
- [ ] Altıncı günlük kayıt ve çakışan saat veritabanı tarafından reddediliyor.
