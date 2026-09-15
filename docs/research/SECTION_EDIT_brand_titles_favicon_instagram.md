# Çiçek Oto — başlık, favicon ve üst Instagram butonu

## Kapsam

- Tarayıcı, Open Graph ve Twitter başlıklarında marka son ekini `Çiçek Oto` olarak standardize et.
- SVG/ICO favicon bağlantılarını PNG favicon setiyle değiştir; PWA ikonlarını PNG olarak koru.
- Ana sayfa, hizmetler ve yasal sayfaların üst menüsüne erişilebilir Instagram ikon butonu ekle.
- Sayaç animasyonunun metinsel Google değerlendirme değerini `NaN` olarak bozmasını engelle.

## Etkilenen dosyalar

- `index.html`, `hizmetler.html`, `kvkk.html`, `gizlilik.html`, `kullanim-kosullari.html`, `404.html`, `admin.html`
- `css/style.css`, `js/main.js`, `manifest.json`, `sw.js`
- `img/favicon-16.png`, `img/favicon-32.png`

## Davranış ve responsive beklenti

- Instagram butonu yeni sekmede `https://www.instagram.com/cicekoto/` adresini açar.
- Buton masaüstünde diğer üst aksiyonlarla aynı ritmi kullanır; mobilde ikon biçiminde görünür ve menü/logoyla çakışmaz.
- Başlıkların konu kısmı korunur, yalnızca marka adı `Çiçek Oto` olur.
- Tüm favicon bağlantıları `image/png` olur; Apple ve PWA ikonları çalışmaya devam eder.

## Doğrulama

- Statik bağlantı, SEO/GEO, güvenlik ve teslim tutarlılığı testlerini çalıştır.
- Masaüstü ve mobil üst menüyü tarayıcıda kontrol et.
- PNG faviconların 16×16 ve 32×32 ölçülerini doğrula.
- Google değerlendirme adedinin masaüstü ve mobilde `NaN` olmadığını doğrula.
