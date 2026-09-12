# Çiçek Otomotiv randevu sistemi

## Production mimarisi — 12 Eylül 2026

Randevu formu tarayıcıdan doğrudan Supabase'e bağlanmaz. İstek önce Vercel Function'a gelir; alanlar, marka, hizmetler, tarih/saat, KVKK onayı, bal küpü alanı ve form doldurma süresi doğrulanır. Sunucu yalnızca kendi ortamında bulunan service-role anahtarıyla güvenli RPC fonksiyonunu çağırır.

### Çalışma kuralları

- Günlük araç sayısı sınırı yoktur.
- Aynı zaman aralığındaki çakışmalar işlem süresine göre engellenir.
- Tek başına periyodik bakım 60 dakika, diğer hizmet kombinasyonları 120 dakikadır.
- Randevu başlangıç saatleri 09:00–17:00 arasındadır; pazar günü kapalıdır.
- Bir talepte 1–9 benzersiz hizmet kabul edilir.
- VAG markalarının yanında “Diğer / Genel” seçeneğiyle başka markalar da kaydedilebilir.

### Veri modeli

| Tablo | Amaç |
| --- | --- |
| `appointments` | Randevu, müşteri, araç, izin ve durum bilgileri |
| `appointment_events` | Oluşturma, durum değişikliği, bildirim denemesi ve yönetici güncelleme kaydı |
| `api_rate_limits` | IP ve telefon gibi öznelerin HMAC özetiyle kalıcı hız sınırı |

`appointments`, `appointment_events` ve `api_rate_limits` tablolarında RLS açıktır. `anon` ve `authenticated` rolleri doğrudan erişemez. `create_website_appointment` ve `consume_api_rate_limit` fonksiyonlarını yalnızca `service_role` çalıştırabilir.

### Yönetim güvenliği

- Parola tarayıcı depolamasında tutulmaz.
- Oturum çerezi `HttpOnly`, `Secure`, `SameSite=Strict` ve dört saat ömürlüdür.
- Oturum kullanıcı aracısına bağlanır ve HMAC ile imzalanır.
- Yazma işlemleri same-origin, özel istek başlığı ve oturuma bağlı CSRF belirteci gerektirir.
- Giriş ve yönetim yazmaları hız sınırına tabidir.
- CSV çıktısında formül enjeksiyonu engellenir.
- CSP, clickjacking, MIME sniffing, HSTS, referrer ve izin politikaları Vercel katmanında uygulanır.

### Bildirimler

- CallMeBot yalnızca işletme sahibinin numarasına yeni talep uyarısı göndermek için kullanılır.
- Müşteriye mesaj yalnızca WhatsApp izni verilmişse ve ilgili Meta WhatsApp Cloud API şablonu yapılandırılmışsa gönderilir.
- Alındı, onaylandı, saat değişti ve iptal şablonları desteklenir.
- Her bildirim denemesi `appointment_events` tablosuna başarılı/başarısız sonucu ile kaydedilir.

### Google yorumları

Google Places API yapılandırıldığında puan, toplam yorum sayısı ve API'nin döndürdüğü en fazla beş yorum otomatik gösterilir. Bağlantı yoksa Google işletme sayfasına bağlanan, elle doğrulanmış yorumlar görünür. Google'ın tüm yorumlarını programatik olarak almak için işletme profilinin sahiplenilmesi ve Google Business Profile API erişimi gerekir.

### Production değişkenleri

Tam liste ve örnek değer biçimleri kökteki `.env.example` dosyasındadır. Zorunlu değişkenler:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `RATE_LIMIT_SECRET`

Son iki değişken teknik olarak geriye dönük varsayılanlara sahiptir; production'da admin parolasından ayrı tutulmaları gerekir.

### Kurulum doğrulaması

1. `supabase/migrations` dosyalarını sırayla çalıştırın.
2. Yarım/eski kurulumlarda `202609120001_production_reconcile.sql` dosyasını son kez çalıştırın.
3. Vercel ortam değişkenlerini Production ve Preview'a ekleyip redeploy yapın.
4. Admin → Sistem durumu ekranında Supabase kartının `HAZIR` olduğunu doğrulayın.
5. Ana sayfada hizmet, araç ve tarih seçerek uygun saatlerin geldiğini kontrol edin.
