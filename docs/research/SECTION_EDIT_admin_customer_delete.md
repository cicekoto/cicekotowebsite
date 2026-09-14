# Admin müşteri silme özelliği

## Hedef

- Yönetici, Müşteriler görünümünden bir müşteriye ait tüm randevu kayıtlarını kalıcı olarak silebilsin.
- Yanlışlıkla silmeyi zorlaştırmak için açık uyarı ve `SİL` doğrulaması kullanılsın.
- Silme öncesinde ilgili müşteri, randevu ve olay kayıtları otomatik JSON yedeği olarak indirilsin.

## Etkilenen alanlar

- `api/admin/appointments.js`: oturum, same-origin, CSRF ve hız sınırı korumalı `DELETE` işlemi.
- `js/admin.js`: müşteri kartı silme düğmesi, iki aşamalı onay, yedek indirme ve ekran durumunun güncellenmesi.
- `css/admin.css`: müşteri kartı aksiyonlarının masaüstü ve mobil yerleşimi.
- `admin.html`: değişen CSS/JS dosyaları için önbellek sürümü.
- `scripts/test-admin-delete.js`: yetkisiz/CSRF'siz istek, doğrulama metni ve başarılı toplu silme testleri.

## Güvenlik ve veri davranışı

- İstek yalnız geçerli yönetici oturumu ve CSRF belirteciyle kabul edilir.
- Telefon numarası sunucuda Türkiye formatına normalize edilir.
- İstemci `SİL` yazılmadan isteği göndermez; sunucu telefon numarasına bağlı doğrulama belirtecini ayrıca kontrol eder.
- `appointment_events` kayıtları veritabanındaki `ON DELETE CASCADE` ilişkisiyle birlikte silinir.
- Silme işlemi geri alınamaz; istemci işlemden hemen önce müşteri bazlı JSON yedeği indirir.

## Responsive beklenti

- Müşteri kartı aksiyonları geniş ekranda sağa hizalı, mobilde tam genişlikte ve dokunulabilir kalır.
- Uzun müşteri adı veya birden fazla kayıt düğmeleri taşırmaz.

## Doğrulama

- [x] DELETE isteği oturumsuzken `401` döndürür.
- [x] CSRF veya açık doğrulama belirteci yoksa silme gerçekleşmez.
- [x] Geçerli istek aynı telefona ait tüm randevuları siler ve silinen kimlikleri döndürür.
- [x] Silme öncesi müşteri JSON yedeği indirilir.
- [x] Başarılı silme sonrası sayaçlar, müşteri listesi ve randevu ekranı yeniden çizilir.
- [x] Masaüstü ve mobil müşteri kartlarında aksiyonlar taşmaz.

Otomatik API testleri `scripts/test-admin-delete.js` ile; gerçek tarayıcı akışı ise 390 px mobil ve masaüstü görünümünde Playwright ile doğrulandı.
