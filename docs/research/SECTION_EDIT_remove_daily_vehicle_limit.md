# Randevu günlük araç sınırını kaldırma

## İstenen değişiklik

- Günlük 5 araç üst sınırını kaldır.
- Arayüzde kalan araç sayısı veya 5 araç kapasitesi mesajı gösterme.
- 09:00–17:00 başlangıç saati, pazar kapalılığı ve çakışan saat korumasını sürdür.

## Etkilenen dosyalar

- `api/appointments.js`: günlük kayıt sayısı yerine yalnız saat çakışmasına göre uygunluk döndürür.
- `js/main.js`: araç kapasitesi metinlerini kaldırır.
- `supabase/migrations/202609010001_remove_daily_appointment_capacity.sql`: veritabanındaki `DAY_FULL` kontrolünü kaldırır.

## Doğrulama

- [x] Aynı tarihte beş kayıt olsa da boş ve çakışmayan saatler listelenir.
- [x] Aynı saatle çakışan kayıt reddedilir.
- [x] 17:00 son başlangıç saati ve pazar kapalılığı korunur.
- [x] Türkçe ve İngilizce arayüzde 5 araç mesajı kalmaz.
