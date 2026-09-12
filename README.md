# Çiçek Otomotiv web sitesi

Çiçek Otomotiv için VAG odaklı, mobil uyumlu servis sitesi; Supabase tabanlı online randevu sistemi, güvenli yönetim paneli ve isteğe bağlı WhatsApp/Google entegrasyonları içerir.

## Canlı adresler

- Site: <https://cicekotowebsite.vercel.app/>
- Yönetim: <https://cicekotowebsite.vercel.app/admin.html>
- Hizmet rehberi: <https://cicekotowebsite.vercel.app/hizmetler>

## Özellikler

- Volkswagen, Audi, Škoda, SEAT ve CUPRA uzmanlığı; diğer markalar için genel marka alanı
- Çoklu hizmet seçimi ve hizmet süresine göre çakışma kontrolü
- Pazartesi–cumartesi 09:00–17:00 randevu başlangıç saatleri; pazar kapalı
- Supabase üzerinde randevu, müşteri/araç geçmişi ve olay kaydı
- Dört saatlik `HttpOnly` yönetici oturumu, CSRF, same-origin ve kalıcı hız sınırı
- Randevu listesi, günlük plan, müşteri dizini, CSV dışa aktarma ve entegrasyon durumu
- Türkçe, İngilizce ve Arapça; açık/koyu tema; mobil menü ve hızlı erişim çubuğu
- KVKK, gizlilik ve kullanım koşulları sayfaları
- CallMeBot işletme bildirimi, Meta WhatsApp Cloud API müşteri şablonları ve Google Places desteği

## Production kurulumu

1. Supabase projesinde `supabase/migrations` dosyalarını tarih sırasıyla çalıştırın. Mevcut/yarım kurulumu tek adımda düzeltmek için son olarak `202609120001_production_reconcile.sql` dosyasını çalıştırın.
2. `.env.example` içindeki gerekli değişkenleri Vercel Project Settings → Environment Variables bölümüne ekleyin. Gerçek değerleri repoya commit etmeyin.
3. Değişkenleri Production ve Preview ortamlarına uygulayın; ardından production redeploy başlatın.
4. `/admin.html` üzerinden giriş yapıp “Sistem durumu” görünümünde Supabase ve bildirim durumlarını kontrol edin.
5. Ana sayfadaki randevu akışında hizmet → araç → tarih adımlarını ilerletip uygun saatlerin geldiğini doğrulayın.

## Yerel doğrulama

Proje bağımlılıksız statik sayfalar ve Vercel Functions kullanır. JavaScript söz dizimi ve regresyon testleri:

```powershell
Get-ChildItem api,lib,js,scripts -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }
Get-ChildItem scripts -Filter test-*.js | ForEach-Object { node $_.FullName }
```

Yerel statik önizleme için örneğin `npx http-server . -p 4173 -c-1` kullanılabilir. API fonksiyonlarının gerçek çalışması için Vercel ortam değişkenleri gerekir.

## Güvenlik notları

- `SUPABASE_SERVICE_ROLE_KEY`, admin parolası ve entegrasyon anahtarları yalnızca Vercel sunucu ortamında tutulur.
- Admin parolası en az 14 karakter; `ADMIN_SESSION_SECRET` ve `RATE_LIMIT_SECRET` ayrı, rastgele ve en az 32 karakter olmalıdır.
- Supabase tablolarında RLS açıktır; `anon` ve `authenticated` rolleri doğrudan randevu verisine erişemez.
- Production hesabında Vercel 2FA etkinleştirilmelidir.
- Anahtar değişikliklerinden sonra eski anahtarlar sağlayıcı panellerinden iptal edilmelidir.

## Entegrasyon davranışı

- CallMeBot yalnızca işletme sahibine yeni talep uyarısı gönderir.
- Müşteriye otomatik WhatsApp mesajı, açık rıza ve onaylı Meta şablonu varsa gönderilir.
- Google Places değişkenleri yoksa sayfa, Google bağlantısıyla doğrulanabilen sabit yorumları gösterir.
- Yönetim panelindeki “Sistem durumu” ekranı sırları göstermeden hangi entegrasyonların hazır olduğunu bildirir.
