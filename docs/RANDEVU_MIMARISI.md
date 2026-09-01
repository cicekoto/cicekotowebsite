# Çiçek Otomotiv randevu sistemi

## Güncel production durumu — 1 Eylül 2026

- Randevu formu Vercel Functions üzerinden Supabase `appointments` tablosuna yazıyor.
- Günlük araç sayısı sınırı yok; aynı zaman aralığındaki çakışmalar işlem süresine göre engelleniyor.
- Randevu başlangıç saatleri 09:00–17:00, pazar günü kapalı.
- Admin paneli şifreyi tarayıcı depolamasında tutmuyor; `HttpOnly`, `Secure`, `SameSite=Strict` imzalı oturum çerezi kullanıyor.
- CallMeBot işletme sahibine yeni talep alarmı için hazır; müşteri mesajları Meta WhatsApp Cloud API şablonları için hazır.
- Google Places bağlantısı yapılandırıldığında puan ve en fazla beş gerçek yorum otomatik gösteriliyor; bağlantı yoksa doğrulanmış sabit yorumlar kalıyor.

### Production environment variables

| Değişken | Durum / amaç |
| --- | --- |
| `SUPABASE_URL` | Zorunlu, yapılandırıldı |
| `SUPABASE_SERVICE_ROLE_KEY` | Zorunlu, yalnızca sunucuda |
| `ADMIN_USERNAME` | Zorunlu, yapılandırıldı |
| `ADMIN_PASSWORD` | Zorunlu; aynı zamanda admin oturum imzası |
| `CALLMEBOT_PHONE` | İsteğe bağlı; yalnızca işletme sahibine bildirim |
| `CALLMEBOT_API_KEY` | İsteğe bağlı; CallMeBot aktivasyonundan gelir |
| `WHATSAPP_ACCESS_TOKEN` | Müşteri mesajları için Meta erişim anahtarı |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta WhatsApp gönderici numarası kimliği |
| `WHATSAPP_GRAPH_API_VERSION` | Kullanılacak Graph API sürümü; açıkça yapılandırılmalı |
| `WHATSAPP_TEMPLATE_LANGUAGE` | Varsayılan `tr` |
| `WHATSAPP_TEMPLATE_RECEIVED` | Dört gövdeli parametre: ad, takip kodu, tarih, saat |
| `WHATSAPP_TEMPLATE_CONFIRMED` | Dört gövdeli parametre: ad, takip kodu, tarih, saat |
| `WHATSAPP_TEMPLATE_RESCHEDULED` | Dört gövdeli parametre: ad, takip kodu, tarih, saat |
| `WHATSAPP_TEMPLATE_CANCELLED` | Dört gövdeli parametre: ad, takip kodu, tarih, saat |
| `GOOGLE_PLACES_API_KEY` | Google Places API anahtarı |
| `GOOGLE_PLACE_ID` | Çiçek Otomotiv Google işletme Place ID'si |

## Karar özeti

Yeni arayüz statik bir form gibi davranmayacak. Form doğrudan veritabanına yazmak yerine bir Supabase Edge Function'a istek gönderecek. Function veriyi doğrulayacak, randevu talebini oluşturacak ve bildirim kuyruğuna ekleyecek. Yönetim ekranı Supabase Auth ile korunacak.

CallMeBot yalnızca işletme sahibinin kendi WhatsApp numarasına yeni randevu uyarısı göndermek için kullanılabilir. Resmî sayfası ücretsiz API'nin kişisel kullanım için olduğunu ve başkalarına mesaj göndermediğini açıkça belirtiyor. Müşterilere otomatik onay ve hatırlatma göndermek için WhatsApp Business Platform (Cloud API) ya da Twilio gibi resmî bir sağlayıcı gerekir.

Kaynaklar:

- [CallMeBot ücretsiz WhatsApp API](https://www.callmebot.com/blog/free-api-whatsapp-messages/)
- [Supabase veritabanı ve RLS](https://supabase.com/docs/guides/database/overview)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase zamanlanmış Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions)
- [Supabase secret yönetimi](https://supabase.com/docs/guides/functions/secrets)

## Önerilen akış

1. Müşteri hizmet, araç, tarih/saat ve iletişim bilgilerini girer.
2. Edge Function alanları doğrular; KVKK açık rızasını ve spam kontrolünü denetler.
3. `appointments` tablosuna `pending` durumunda kayıt açılır.
4. İşletme sahibine CallMeBot ile "yeni talep" bildirimi gönderilir.
5. Yönetim panelinde randevu onaylanır veya yeni saat önerilir.
6. Müşteriye onaylı WhatsApp şablonuyla mesaj gönderilir.
7. Supabase Cron, randevudan 24 saat ve 2 saat önce hatırlatma kuyruğu oluşturur.
8. Her gönderim `notification_outbox` tablosunda idempotency anahtarıyla kaydedilir; aynı mesaj iki kez gitmez.

## Veri modeli

| Tablo | Amaç | Önemli alanlar |
| --- | --- | --- |
| `services` | Randevuya açık hizmetler | `slug`, `name`, `duration_minutes`, `active` |
| `appointments` | Müşteri randevu talepleri | `public_code`, `service_id`, `starts_at`, `status`, araç ve iletişim alanları |
| `appointment_events` | Durum değişikliklerinin denetim kaydı | `appointment_id`, `event_type`, `actor_id`, `metadata` |
| `business_hours` | Haftalık çalışma planı | `weekday`, `opens_at`, `closes_at`, `slot_minutes` |
| `closures` | Tatil ve özel kapalı günler | `starts_at`, `ends_at`, `reason` |
| `notification_outbox` | WhatsApp/e-posta gönderim kuyruğu | `provider`, `template`, `status`, `attempts`, `idempotency_key` |

## Güvenlik

- `appointments`, `appointment_events` ve `notification_outbox` istemciden okunamaz.
- Tarayıcıda Supabase secret/service-role anahtarı bulunmaz; bu anahtar yalnızca Edge Function secret'ı olur.
- Yönetim ekranı sabit JavaScript şifresi kullanmaz; Supabase Auth ve rol kontrolü kullanır.
- Telefon, plaka ve müşteri notları kişisel veri kabul edilir. Loglara açık biçimde yazılmaz.
- Formda hız sınırlama ve bot koruması bulunur. Aynı telefon/tarih için tekrarlı talepler engellenir.
- KVKK aydınlatma metni ve açık iletişim izni randevu onayından ayrı tutulur.

## Bildirim stratejisi

### Aşama 1 — hızlı ve düşük maliyetli

- CallMeBot: yalnızca servis sahibinin numarasına yeni randevu alarmı.
- Müşteri: form sonunda önceden doldurulmuş WhatsApp konuşması veya telefonla manuel onay.

### Aşama 2 — önerilen üretim çözümü

- WhatsApp Business Platform Cloud API.
- Onaylı mesaj şablonları: `appointment_received`, `appointment_confirmed`, `appointment_reminder`, `appointment_rescheduled`, `appointment_cancelled`.
- Webhook ile teslim edildi/okundu/hata durumlarının kaydı.
- İşletme panelinden yanıt ve saat değişikliği.

## Uygulama sırası

1. Tasarım yönü seçilir ve mobil/masaüstü üretim arayüzü tamamlanır.
2. Supabase projesi açılır; migration, RLS ve Auth kurulur.
3. Randevu oluşturma Edge Function'ı ve yönetim paneli bağlanır.
4. CallMeBot işletme alarmı devreye alınır.
5. WhatsApp Business hesabı hazırsa müşteri şablonları eklenir; hazır değilse manuel WhatsApp akışı geçici olarak kullanılır.
6. Cron hatırlatmaları, webhook ve hata/tekrar deneme mekanizması açılır.
7. Uçtan uca test, KVKK kontrolü ve Vercel üretim dağıtımı yapılır.

## Kurulum sırasında gerekecek bilgiler

- Supabase proje erişimi veya yeni proje açma izni
- Vercel proje erişimi ve environment variable yetkisi
- CallMeBot API anahtarı ve bildirim alacak işletme numarası
- Müşteriye otomatik mesaj isteniyorsa Meta Business hesabı, doğrulanmış işletme numarası ve onaylı WhatsApp şablonları
- Gerçek hizmet süreleri, günlük araç kapasitesi, resmi tatil/kapalı gün kuralları
- KVKK aydınlatma metni ve ticari ileti izni tercihi
