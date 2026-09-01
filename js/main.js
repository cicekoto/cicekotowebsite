'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let currentLanguage = 'tr';

const EN_TEXT = {
  'İçeriğe geç': 'Skip to content', 'Ana menü': 'Main navigation', 'Hizmetler': 'Services', 'Süreç': 'Process',
  'Neden Biz?': 'Why us?', 'Yorumlar': 'Reviews', 'İletişim': 'Contact', 'Randevu Al': 'Book now',
  'Servis Süreci': 'Service process', 'VAG araçlara': 'For VAG vehicles', 'uzman servis.': 'specialist service.',
  'VAG grubu araçlarda doğru teşhis, şeffaf fiyat ve garantili işçilik. Aracınızı teknolojiyle, işimizi marka uzmanlığıyla koruyoruz.': 'Accurate diagnostics, transparent pricing and guaranteed workmanship for VAG vehicles. We protect your car with technology and brand expertise.',
  'Online randevu': 'Book online', 'Hizmetleri keşfet': 'Explore services', 'UZMANI': 'SPECIALIST',
  'Google müşteri puanı': 'Google customer rating', 'Doğrulanmış Google yorumu': 'Verified Google reviews',
  'VAG markasında uzmanlık': 'VAG brands covered', 'İşçilik garantisi': 'Workmanship warranty',
  'Doğru teşhis': 'Accurate diagnostics', 'Gereksiz': 'No unnecessary', 'masraf yok.': 'expense.',
  'Güncel OBD cihazları ve deneyimli teknisyen kadromuzla arızayı noktasal olarak buluyoruz. Tahmine dayalı parça değişimi yapmıyor, işlem başlamadan fiyatı netleştiriyoruz.': 'With current OBD equipment and experienced technicians, we pinpoint the fault. We do not replace parts based on guesses and confirm the price before work begins.',
  'Onaysız işlem yok': 'No work without approval', 'Orijinal veya OEM parça': 'Genuine or OEM parts', 'Yazılı fiyat bilgisi': 'Written price information',
  'Aracınız için randevu alın': 'Book for your vehicle', 'Süreç takibi': 'Service tracking', 'Servis süreci': 'Your service journey', 'cebinde.': 'in your pocket.',
  'Aracınızı bıraktığınız andan teslimata kadar önemli gelişmeleri WhatsApp üzerinden takip edin. Ek ihtiyaç çıkarsa önce size sorulur, onayınız olmadan işlem yapılmaz.': 'Follow important updates on WhatsApp from drop-off to delivery. If additional work is needed, we ask first and never proceed without your approval.',
  '2 saat': '2 hours', 'ortalama bakım kabulü': 'average maintenance intake', 'Anlık': 'Instant', 'WhatsApp bilgilendirme': 'WhatsApp updates',
  'Sürecin nasıl işlediğini görün': 'See how the process works', 'Tek noktada': 'One team for', 'tam servis.': 'complete service.',
  'PERİYODİK BAKIM': 'SCHEDULED MAINTENANCE', 'DSG ŞANZIMAN': 'DSG TRANSMISSION', 'MOTOR TAMİRİ': 'ENGINE REPAIR', 'OBD TEŞHİS': 'OBD DIAGNOSTICS', 'KAPORTA & BOYA': 'BODY & PAINT', 'PDR GÖÇÜK': 'PAINTLESS DENT REPAIR',
  'Bakım, mekanik, elektronik ve kaporta işlemleri tek ekip tarafından yönetilir.': 'Maintenance, mechanical, electronic and bodywork services are managed by one team.',
  'Periyodik Bakım': 'Scheduled Maintenance', 'Yağ, filtre, sıvılar ve tüm kilometre bakımları fabrika reçetesiyle.': 'Oil, filters, fluids and mileage services carried out to factory specifications.',
  'DSG Şanzıman': 'DSG Transmission', 'DQ200, DQ250, kavrama ve mekatronik sistemlerinde uzman onarım.': 'Specialist repair for DQ200, DQ250, clutch and mechatronic systems.',
  'Motor & Elektronik': 'Engine & Electronics', 'Motor revizyonu, ECU işlemleri ve kapsamlı elektronik arıza tespiti.': 'Engine rebuilds, ECU work and comprehensive electronic diagnostics.',
  'Kaporta & Boya': 'Body & Paint', 'Kaza onarımı, spot boya ve boyasız göçük düzeltme hizmetleri.': 'Collision repair, spot paint and paintless dent removal.',
  '30–120 dk': '30–120 min', 'Teşhis sonrası': 'After diagnosis', '1–3 gün': '1–3 days', '1–5 gün': '1–5 days', 'Fren Sistemi': 'Brake System', 'Klima Bakımı': 'A/C Service', 'Süspansiyon': 'Suspension', 'Elektrik Arızası': 'Electrical Fault', 'Genel Kontrol': 'General Inspection',
  'Nasıl çalışıyoruz?': 'How we work', 'Dört adımda': 'Clear service', 'net servis.': 'in four steps.',
  'Aracınızı teslim ederken ne olacağını, ne kadar süreceğini ve ne ödeyeceğinizi bilirsiniz.': 'When you leave your vehicle, you know what will happen, how long it will take and what you will pay.',
  'Randevu': 'Appointment', 'Hizmeti, aracınızı ve size uygun zamanı seçin.': 'Choose services, your vehicle and a convenient time.',
  'Teşhis': 'Diagnosis', 'Aracınız uzman ekip ve güncel cihazlarla kontrol edilir.': 'Your vehicle is inspected by specialists using current equipment.',
  'Onay': 'Approval', 'İşlem ve fiyat bilgisi size iletilir; onayınız alınır.': 'Work and pricing details are shared for your approval.',
  'Teslim': 'Delivery', 'Kontrol sonrası garantili şekilde aracınızı teslim alın.': 'Collect your vehicle after final checks with workmanship assurance.',
  'Neden Çiçek Otomotiv?': 'Why Çiçek Otomotiv?', 'Şeffaf Fiyat': 'Transparent Pricing', 'İşlemden önce yazılı teklif. Onaysız işlem ve sürpriz fatura yok.': 'A written quote before work. No unapproved jobs or surprise bills.',
  'Doğru Teknoloji': 'Right Technology', 'Güncel arıza tespit cihazları, OEM parçalar ve deneyimli teknisyenler.': 'Current diagnostic equipment, OEM parts and experienced technicians.',
  'Garantili İşçilik': 'Guaranteed Workmanship', 'Yapılan işlemler kayıt altındadır ve işçilik garantisiyle teslim edilir.': 'Every operation is recorded and delivered with workmanship assurance.',
  'VAG uzman servisi · Online randevu': 'VAG specialist · Online booking', 'Servis saatin': 'Your service time', 'hazır.': 'is ready.',
  'Volkswagen, Audi, Škoda, SEAT veya CUPRA aracınız için ihtiyaç duyduğunuz tüm işlemleri birlikte seçin. Talebiniz doğrudan servis kayıt sistemimize ulaşır.': 'Select all the services your Volkswagen, Audi, Škoda, SEAT or CUPRA needs. Your request goes directly to our service booking system.',
  'Pzt–Cmt': 'Mon–Sat', 'Pazar': 'Sunday', 'Kapalı': 'Closed', 'VAG Araç': 'VAG Vehicle', 'Zaman': 'Time',
  '01 / Çoklu hizmet seçimi': '01 / Multiple service selection', 'Bir veya daha fazla hizmet seç.': 'Select one or more services.',
  'En az 1 hizmet seçin': 'Select at least 1 service', 'Notun (isteğe bağlı)': 'Note (optional)', 'Sorunu veya isteğini kısaca anlat': 'Briefly describe the issue or request',
  '02 / VAG aracı': '02 / VAG vehicle', 'Aracını tanıyalım.': 'Tell us about your vehicle.', 'VAG markası': 'VAG brand', 'Marka seçin': 'Select brand',
  'Model yılı': 'Model year', 'Plaka': 'License plate', 'Örn. Golf 7, A3, Octavia': 'E.g. Golf 7, A3, Octavia',
  '03 / Zaman': '03 / Time', 'Sana uygun zamanı seç.': 'Choose a convenient time.', 'Tarih': 'Date', 'Saat': 'Time', 'Saat seçin': 'Select time',
  'Bilgi': 'Note', 'Bu bir randevu talebidir. Servis kapasitesi kontrol edildikten sonra kesin onay size iletilir.': 'This is a booking request. Final confirmation is sent after service capacity is checked.',
  '04 / İletişim': '04 / Contact', 'Sana nasıl ulaşalım?': 'How can we reach you?', 'Ad soyad': 'Full name', 'Adınız Soyadınız': 'Your full name', 'Telefon': 'Phone',
  'E-posta (isteğe bağlı)': 'Email (optional)', 'Randevu talebimin işlenmesi için kişisel verilerimin': 'For processing my booking request, I accept the use of my personal data under the',
  'KVKK aydınlatma metni': 'privacy notice', 'kapsamında kullanılmasını kabul ediyorum.': '.',
  'Randevu onayı ve servis güncellemelerinin WhatsApp üzerinden iletilmesini istiyorum.': 'I would like booking confirmations and service updates via WhatsApp.',
  '← Geri': '← Back', 'Devam Et →': 'Continue →', 'Randevu Talebi Oluştur →': 'Submit Booking Request →',
  "Google'da gerçek müşteri deneyimleri": 'Real customer experiences on Google', 'Sözü araç': 'Let our customers', 'sahiplerine bırakalım.': 'tell the story.', '168 Google yorumu': '168 Google reviews',
  '“Turan Usta çok yardımcı oldu. Bir saat içinde aracımın bakımını yaptılar.”': '“Turan Usta was very helpful. They completed my vehicle maintenance within an hour.”',
  '“Çiçek Otomotive uğradım ve çok memnun kaldım. Turan Usta ve ekibine teşekkürlerimi sunarım.”': '“I visited Çiçek Otomotiv and was very satisfied. My thanks to Turan Usta and his team.”',
  '“Çok ilgiliydiler ve yardımcı oldular; aracımı işlemleri yapılmış hâlde teslim aldım.”': '“They were attentive and helpful; I received my vehicle with the requested work completed.”',
  'Google yorumu · 5/5': 'Google review · 5/5', 'Sık sorulanlar': 'Frequently asked', 'Aklındaki': 'Your questions,', 'sorular.': 'answered.',
  "Bulamadığın bir cevap varsa bizi arayabilir veya WhatsApp'tan yazabilirsin.": 'If you cannot find an answer, call us or message us on WhatsApp.',
  'Randevu almadan gelebilir miyim?': 'Can I visit without an appointment?', 'Gelebilirsiniz; ancak yoğunlukta beklememek için online randevu oluşturmanızı öneririz.': 'Yes, but we recommend booking online to avoid waiting during busy periods.',
  'Hangi markalara servis veriyorsunuz?': 'Which brands do you service?', 'Volkswagen, Audi, Škoda, SEAT ve CUPRA araçlara; VAG motor, DSG, elektronik ve platform teknolojilerinde uzman servis veriyoruz.': 'We specialise in VAG engines, DSG, electronics and platforms for Volkswagen, Audi, Škoda, SEAT and CUPRA.',
  'Birden fazla işlem seçebilir miyim?': 'Can I select multiple services?', 'Evet. Randevu formunda bakım, DSG, motor-elektronik, fren, kaporta ve genel kontrol seçeneklerinden birden fazlasını birlikte seçebilirsiniz.': 'Yes. You can select several maintenance, DSG, engine-electronics, brake, bodywork and inspection services in one booking.',
  'Fiyat onayı olmadan işlem yapılır mı?': 'Will work begin without price approval?', 'Hayır. Teşhis sonrası işlem ve fiyat bilgisi iletilir; onayınız olmadan ek işleme başlanmaz.': 'No. Work and pricing are shared after diagnosis, and nothing additional begins without your approval.',
  'İşçilik garantisi var mı?': 'Is workmanship guaranteed?', 'Evet. Yapılan işlemin kapsamına göre garanti koşulları işleme başlamadan önce yazılı olarak paylaşılır.': 'Yes. Warranty terms are shared in writing before work begins, according to the scope of the job.',
  'Bize': 'Get in', 'ulaşın.': 'touch.', 'Yol Tarifi →': 'Directions →', 'Hemen Ara': 'Call now', 'Mesaj Gönder →': 'Send a message →', 'Çiçek Otomotiv Google Haritası': 'Çiçek Otomotiv on Google Maps',
  "2001'den beri Başakşehir'de doğru teşhis, şeffaf fiyat ve garantili işçilik.": 'Accurate diagnostics, transparent pricing and guaranteed workmanship in Başakşehir since 2001.',
  'SSS': 'FAQ', 'Yönetim': 'Admin', 'Çalışma saatleri': 'Opening hours', 'Pazartesi–Cumartesi': 'Monday–Saturday', 'Ara': 'Call',
  'KVKK · Gizlilik · Kullanım Koşulları': 'Privacy · Data Protection · Terms', 'RANDEVU TALEBİ': 'BOOKING REQUEST', 'Talebin alındı.': 'Request received.',
  'Randevunu kontrol edip en kısa sürede sana dönüş yapacağız.': 'We will review your booking and contact you shortly.', 'Takip kodu': 'Reference code', "WhatsApp'ta Aç": 'Open in WhatsApp', 'Tamam': 'Done',
  'Menüyü aç': 'Open menu', 'Açık temaya geç': 'Switch to light theme', 'Önceki yorum': 'Previous review', 'Sonraki yorum': 'Next review', 'Sayfanın başına dön': 'Back to top', 'Mobil hızlı erişim': 'Mobile quick access'
};
Object.assign(EN_TEXT, {
  'Araç':'Vehicle','02 / Araç':'02 / Vehicle','Araç markası':'Vehicle brand','Diğer / Genel':'Other / General','Markayı yazın':'Enter the brand','Gerçek müşteri yorumları':'Real customer reviews',
  'VAG grubu araçlarda uzmanız; diğer markalar için de bakım ve onarım talebi oluşturabilirsiniz. İhtiyacınız olan tüm işlemleri birlikte seçin. Talebiniz doğrudan servis kayıt sistemimize ulaşır.':'We specialise in VAG vehicles, and you can also request maintenance or repairs for other brands. Select every service you need; your request goes directly to our booking system.',
  'Google işletme profili':'Google Business Profile','Canlı Google bağlantısı bekleniyor':'Live Google connection pending','Uydurma yorum göstermiyoruz. Tüm gerçek değerlendirmeleri Google işletme profilimizde görebilirsiniz.':'We do not display fabricated reviews. You can view every real review on our Google Business Profile.','Tüm gerçek yorumları Google’da gör →':'View all real reviews on Google →'
});

const AR_TEXT = {
  'İçeriğe geç':'انتقل إلى المحتوى','Ana menü':'القائمة الرئيسية','Hizmetler':'الخدمات','Süreç':'الخطوات','Neden Biz?':'لماذا نحن؟','Yorumlar':'التقييمات','İletişim':'اتصل بنا','Randevu Al':'احجز موعداً','Servis Süreci':'مراحل الصيانة',
  'VAG araçlara':'خدمة متخصصة','uzman servis.':'لسيارات VAG.','VAG grubu araçlarda doğru teşhis, şeffaf fiyat ve garantili işçilik. Aracınızı teknolojiyle, işimizi marka uzmanlığıyla koruyoruz.':'تشخيص دقيق وأسعار واضحة وخدمة احترافية لسيارات مجموعة VAG. نحمي سيارتك بالتقنية والخبرة المتخصصة.','Online randevu':'حجز موعد','Hizmetleri keşfet':'اكتشف الخدمات',
  'Google müşteri puanı':'تقييم العملاء على Google','Doğrulanmış Google yorumu':'تقييمات Google الموثقة','VAG markasında uzmanlık':'خبرة في علامات VAG','Doğru teşhis':'تشخيص دقيق','Gereksiz':'لا مصاريف','masraf yok.':'غير ضرورية.',
  'Güncel OBD cihazları ve deneyimli teknisyen kadromuzla arızayı noktasal olarak buluyoruz. Tahmine dayalı parça değişimi yapmıyor, işlem başlamadan fiyatı netleştiriyoruz.':'نحدد العطل بدقة بأجهزة OBD الحديثة وفريق فني خبير. لا نبدّل القطع بالتخمين ونوضح السعر قبل بدء العمل.','Onaysız işlem yok':'لا عمل دون موافقة','Orijinal veya OEM parça':'قطع أصلية أو OEM','Yazılı fiyat bilgisi':'سعر مكتوب','Aracınız için randevu alın':'احجز موعداً لسيارتك',
  'Süreç takibi':'متابعة الصيانة','Servis süreci':'مراحل الصيانة','cebinde.':'بين يديك.','Aracınızı bıraktığınız andan teslimata kadar önemli gelişmeleri WhatsApp üzerinden takip edin. Ek ihtiyaç çıkarsa önce size sorulur, onayınız olmadan işlem yapılmaz.':'تابع أهم التطورات عبر واتساب من تسليم السيارة حتى استلامها. نستأذنك أولاً عند الحاجة إلى عمل إضافي.','2 saat':'ساعتان','ortalama bakım kabulü':'متوسط استقبال الصيانة','Anlık':'فوري','WhatsApp bilgilendirme':'تحديثات واتساب','Sürecin nasıl işlediğini görün':'شاهد كيف تسير العملية',
  'Tek noktada':'كل الخدمات','tam servis.':'في مكان واحد.','Bakım, mekanik, elektronik ve kaporta işlemleri tek ekip tarafından yönetilir.':'يدير فريق واحد أعمال الصيانة والميكانيك والإلكترونيات والهيكل.','Periyodik Bakım':'الصيانة الدورية','DSG Şanzıman':'ناقل DSG','Motor & Elektronik':'المحرك والإلكترونيات','Kaporta & Boya':'الهيكل والطلاء','Fren Sistemi':'نظام الفرامل','Klima Bakımı':'صيانة المكيّف','Süspansiyon':'نظام التعليق','Elektrik Arızası':'أعطال كهربائية','Genel Kontrol':'فحص عام',
  'Yağ, filtre, sıvılar ve tüm kilometre bakımları fabrika reçetesiyle.':'الزيوت والفلاتر والسوائل وجميع صيانة الكيلومترات وفق مواصفات المصنع.','DQ200, DQ250, kavrama ve mekatronik sistemlerinde uzman onarım.':'إصلاح متخصص لأنظمة DQ200 وDQ250 والقابض والميكاترونيك.','Motor revizyonu, ECU işlemleri ve kapsamlı elektronik arıza tespiti.':'توضيب المحرك وأعمال ECU وتشخيص شامل للأعطال الإلكترونية.','Kaza onarımı, spot boya ve boyasız göçük düzeltme hizmetleri.':'إصلاح الحوادث والطلاء الموضعي وإزالة الانبعاجات دون طلاء.','30–120 dk':'30–120 دقيقة','Teşhis sonrası':'بعد التشخيص','1–3 gün':'1–3 أيام','1–5 gün':'1–5 أيام',
  'Nasıl çalışıyoruz?':'كيف نعمل؟','Dört adımda':'خدمة واضحة','net servis.':'في أربع خطوات.','Aracınızı teslim ederken ne olacağını, ne kadar süreceğini ve ne ödeyeceğinizi bilirsiniz.':'عند تسليم السيارة تعرف ما الذي سيحدث والمدة والتكلفة.','Randevu':'الموعد','Hizmeti, aracınızı ve size uygun zamanı seçin.':'اختر الخدمات وسيارتك والوقت المناسب.','Teşhis':'التشخيص','Aracınız uzman ekip ve güncel cihazlarla kontrol edilir.':'يفحص فريق مختص سيارتك بأجهزة حديثة.','Onay':'الموافقة','İşlem ve fiyat bilgisi size iletilir; onayınız alınır.':'نرسل تفاصيل العمل والسعر ونحصل على موافقتك.','Teslim':'التسليم','Kontrol sonrası garantili şekilde aracınızı teslim alın.':'استلم سيارتك بعد الفحص النهائي.',
  'Neden Çiçek Otomotiv?':'لماذا Çiçek Otomotiv؟','Şeffaf Fiyat':'سعر واضح','İşlemden önce yazılı teklif. Onaysız işlem ve sürpriz fatura yok.':'عرض سعر مكتوب قبل العمل، بلا أعمال غير معتمدة أو فواتير مفاجئة.','Doğru Teknoloji':'تقنية صحيحة','Güncel arıza tespit cihazları, OEM parçalar ve deneyimli teknisyenler.':'أجهزة تشخيص حديثة وقطع OEM وفنيون ذوو خبرة.','Garantili İşçilik':'عمل موثوق','Yapılan işlemler kayıt altındadır ve işçilik garantisiyle teslim edilir.':'كل الأعمال مسجلة وتُسلّم بضمان الصيانة.',
  'VAG uzman servisi · Online randevu':'خدمة VAG متخصصة · حجز إلكتروني','Servis saatin':'موعد صيانة','hazır.':'جاهز.','Pzt–Cmt':'الإثنين–السبت','Pazar':'الأحد','Kapalı':'مغلق','Hizmetler':'الخدمات','Araç':'السيارة','Zaman':'الوقت','01 / Çoklu hizmet seçimi':'01 / اختيار عدة خدمات','Bir veya daha fazla hizmet seç.':'اختر خدمة واحدة أو أكثر.','En az 1 hizmet seçin':'اختر خدمة واحدة على الأقل','Notun (isteğe bağlı)':'ملاحظات (اختياري)','Sorunu veya isteğini kısaca anlat':'اشرح المشكلة أو الطلب باختصار','02 / Araç':'02 / السيارة','Aracını tanıyalım.':'أخبرنا عن سيارتك.','Araç markası':'ماركة السيارة','Marka seçin':'اختر الماركة','Diğer / Genel':'أخرى / عامة','Markayı yazın':'اكتب الماركة','Model':'الموديل','Model yılı':'سنة الموديل','Plaka':'لوحة السيارة','03 / Zaman':'03 / الوقت','Sana uygun zamanı seç.':'اختر الوقت المناسب.','Tarih':'التاريخ','Saat':'الوقت','Saat seçin':'اختر الوقت','Bilgi':'معلومة','Bu bir randevu talebidir. Servis kapasitesi kontrol edildikten sonra kesin onay size iletilir.':'هذا طلب موعد. نرسل التأكيد النهائي بعد التحقق من سعة المركز.','04 / İletişim':'04 / التواصل','Sana nasıl ulaşalım?':'كيف نتواصل معك؟','Ad soyad':'الاسم الكامل','Adınız Soyadınız':'الاسم الكامل','Telefon':'الهاتف','E-posta (isteğe bağlı)':'البريد الإلكتروني (اختياري)','← Geri':'رجوع →','Devam Et →':'متابعة ←','Randevu Talebi Oluştur →':'إرسال طلب الموعد ←',
  "Google'da gerçek müşteri deneyimleri":'تجارب حقيقية على Google','Sözü araç':'نترك الكلمة','sahiplerine bırakalım.':'لأصحاب السيارات.','Sık sorulanlar':'الأسئلة الشائعة','Aklındaki':'إجابات','sorular.':'لأسئلتك.','Bize':'تواصل','ulaşın.':'معنا.','Yol Tarifi →':'الاتجاهات ←','Hemen Ara':'اتصل الآن','Mesaj Gönder →':'أرسل رسالة ←','Çalışma saatleri':'ساعات العمل','Pazartesi–Cumartesi':'الإثنين–السبت','SSS':'الأسئلة الشائعة','Yönetim':'الإدارة','Ara':'اتصال','Tamam':'تم','Takip kodu':'رمز المتابعة','Menüyü aç':'افتح القائمة','Açık temaya geç':'انتقل إلى الوضع الفاتح','Önceki yorum':'التقييم السابق','Sonraki yorum':'التقييم التالي','Sayfanın başına dön':'العودة إلى أعلى الصفحة','Mobil hızlı erişim':'وصول سريع'
};
Object.assign(AR_TEXT, {
  'Gerçek müşteri yorumları':'تقييمات عملاء حقيقية',
  'VAG grubu araçlarda uzmanız; diğer markalar için de bakım ve onarım talebi oluşturabilirsiniz. İhtiyacınız olan tüm işlemleri birlikte seçin. Talebiniz doğrudan servis kayıt sistemimize ulaşır.':'نحن متخصصون في سيارات VAG، ويمكنك أيضاً طلب الصيانة والإصلاح للعلامات الأخرى. اختر كل الخدمات التي تحتاجها وسيصل الطلب مباشرة إلى نظام الحجز.',
  'Google işletme profili':'ملف النشاط على Google','Canlı Google bağlantısı bekleniyor':'بانتظار اتصال Google المباشر','Uydurma yorum göstermiyoruz. Tüm gerçek değerlendirmeleri Google işletme profilimizde görebilirsiniz.':'لا نعرض تقييمات مختلقة. يمكنك مشاهدة جميع التقييمات الحقيقية في ملف نشاطنا على Google.','Tüm gerçek yorumları Google’da gör →':'شاهد كل التقييمات الحقيقية على Google ←',
  'Örn. Golf 7, A3, Octavia':'مثال: Golf 7 أو A3 أو Octavia','Örn. BMW, Mercedes-Benz, Renault':'مثال: BMW أو Mercedes-Benz أو Renault','Randevu talebimin işlenmesi için kişisel verilerimin':'أوافق على استخدام بياناتي الشخصية لمعالجة طلب الموعد وفق','KVKK aydınlatma metni':'بيان الخصوصية','kapsamında kullanılmasını kabul ediyorum.':'.','Randevu onayı ve servis güncellemelerinin WhatsApp üzerinden iletilmesini istiyorum.':'أرغب في تلقي تأكيد الموعد وتحديثات الصيانة عبر واتساب.',
  'Bulamadığın bir cevap varsa bizi arayabilir veya WhatsApp\'tan yazabilirsin.':'إذا لم تجد الإجابة، اتصل بنا أو راسلنا عبر واتساب.','Randevu almadan gelebilir miyim?':'هل يمكنني الحضور دون موعد؟','Gelebilirsiniz; ancak yoğunlukta beklememek için online randevu oluşturmanızı öneririz.':'يمكنك الحضور، لكن ننصح بالحجز الإلكتروني لتجنب الانتظار.','Hangi markalara servis veriyorsunuz?':'ما العلامات التي تخدمونها؟','Volkswagen, Audi, Škoda, SEAT ve CUPRA araçlara; VAG motor, DSG, elektronik ve platform teknolojilerinde uzman servis veriyoruz.':'نقدم خدمة متخصصة لمحركات VAG وناقل DSG والإلكترونيات والمنصات لسيارات Volkswagen وAudi وŠkoda وSEAT وCUPRA، ونقبل طلبات العلامات الأخرى أيضاً.','Birden fazla işlem seçebilir miyim?':'هل يمكن اختيار أكثر من خدمة؟','Evet. Randevu formunda bakım, DSG, motor-elektronik, fren, kaporta ve genel kontrol seçeneklerinden birden fazlasını birlikte seçebilirsiniz.':'نعم، يمكنك اختيار عدة خدمات معاً في طلب واحد.','Fiyat onayı olmadan işlem yapılır mı?':'هل يبدأ العمل دون موافقة على السعر؟','Hayır. Teşhis sonrası işlem ve fiyat bilgisi iletilir; onayınız olmadan ek işleme başlanmaz.':'لا. نرسل تفاصيل العمل والسعر بعد التشخيص ولا نبدأ عملاً إضافياً دون موافقتك.','İşçilik garantisi var mı?':'هل توجد كفالة على العمل؟','Evet. Yapılan işlemin kapsamına göre garanti koşulları işleme başlamadan önce yazılı olarak paylaşılır.':'نعم، تُشارك شروط الكفالة كتابياً قبل بدء العمل حسب نطاقه.',
  "2001'den beri Başakşehir'de doğru teşhis, şeffaf fiyat ve garantili işçilik.":'تشخيص دقيق وأسعار واضحة وخدمة موثوقة في باشاك شهير منذ 2001.','KVKK · Gizlilik · Kullanım Koşulları':'الخصوصية · حماية البيانات · شروط الاستخدام','RANDEVU TALEBİ':'طلب موعد','Talebin alındı.':'تم استلام طلبك.','Randevunu kontrol edip en kısa sürede sana dönüş yapacağız.':'سنراجع موعدك ونتواصل معك في أقرب وقت.','WhatsApp\'ta Aç':'افتح في واتساب','Kapat':'إغلاق'
});
const EN_TO_TR = Object.fromEntries(Object.entries(EN_TEXT).map(([tr, en]) => [en, tr]));
const AR_TO_TR = Object.fromEntries(Object.entries(AR_TEXT).map(([tr, ar]) => [ar, tr]));

function languageText(tr, en, ar) { return currentLanguage === 'ar' ? ar : currentLanguage === 'en' ? en : tr; }

function localized(text) {
  return currentLanguage === 'ar' ? (AR_TEXT[text] || text) : currentLanguage === 'en' ? (EN_TEXT[text] || text) : text;
}

function translateValue(value, language) {
  const clean = value.trim();
  if (!clean) return value;
  const turkish = EN_TO_TR[clean] || AR_TO_TR[clean] || clean;
  let translated = language === 'ar' ? AR_TEXT[turkish] : language === 'en' ? EN_TEXT[turkish] : turkish;
  const count = clean.match(/^(\d+) (?:hizmet seçildi|services selected|خدمات مختارة)$/)?.[1];
  if (count) translated = language === 'ar' ? `${count} خدمات مختارة` : language === 'en' ? `${count} services selected` : `${count} hizmet seçildi`;
  if (!translated) return value;
  return value.replace(clean, translated);
}

function translateDocument(language) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) { return node.parentElement?.closest('script,style') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => { node.nodeValue = translateValue(node.nodeValue, language); });
  $$('[placeholder],[aria-label],[title]').forEach(element => ['placeholder', 'aria-label', 'title'].forEach(attribute => {
    if (element.hasAttribute(attribute)) element.setAttribute(attribute, translateValue(element.getAttribute(attribute), language));
  }));
  $$('blockquote[lang]').forEach(quote => quote.lang = language);
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  document.title = language === 'ar' ? 'Çiçek Otomotiv | مركز صيانة سيارات متخصص · باشاك شهير' : language === 'en'
    ? (document.body.dataset.titleEn || 'Çiçek Otomotiv | VAG Specialist Service · Başakşehir')
    : (document.body.dataset.titleTr || 'Çiçek Otomotiv | Profesyonel Oto Servis · Başakşehir');
}

function initPreferences() {
  const themeToggle = $('#themeToggle');
  const languageToggle = $('#languageToggle');
  currentLanguage = ['tr','en','ar'].includes(localStorage.getItem('cicekLanguage')) ? localStorage.getItem('cicekLanguage') : 'tr';
  let theme = document.documentElement.dataset.theme || 'dark';
  const sync = () => {
    document.documentElement.dataset.theme = theme;
    $('#themeColor')?.setAttribute('content', theme === 'light' ? '#f4f7fb' : '#000105');
    if (themeToggle) {
      const goLight = theme === 'dark';
      themeToggle.setAttribute('aria-pressed', String(theme === 'light'));
      themeToggle.setAttribute('aria-label', languageText(`${goLight ? 'Açık' : 'Koyu'} temaya geç`, `Switch to ${goLight ? 'light' : 'dark'} theme`, `الانتقال إلى الوضع ${goLight ? 'الفاتح' : 'الداكن'}`));
      $('span', themeToggle).textContent = goLight ? '☼' : '☾';
      $('.theme-label', themeToggle).textContent = languageText(goLight ? 'Açık' : 'Koyu', goLight ? 'Light' : 'Dark', goLight ? 'فاتح' : 'داكن');
    }
    if (languageToggle) {
      const nextLanguage = currentLanguage === 'tr' ? 'en' : currentLanguage === 'en' ? 'ar' : 'tr';
      $('b', languageToggle).textContent = nextLanguage.toUpperCase();
      languageToggle.setAttribute('aria-label', nextLanguage === 'tr' ? 'Türkçeye geç' : nextLanguage === 'en' ? 'Switch to English' : 'التبديل إلى العربية');
    }
    const hours = $('.appointment-intro .hours');
    if (hours) hours.dataset.hoursLabel = languageText('RANDEVU BAŞLANGIÇ SAATLERİ · 09:00–17:00','BOOKING START TIMES · 09:00–17:00','مواعيد بدء الحجز · 09:00–17:00');
    const panel = $('.appointment-panel');
    if (panel) panel.dataset.loadingLabel = languageText('Talebiniz oluşturuluyor…','Submitting your request…','جارٍ إرسال طلبك…');
  };
  translateDocument(currentLanguage);
  sync();
  themeToggle?.addEventListener('click', () => { theme = theme === 'dark' ? 'light' : 'dark'; localStorage.setItem('cicekTheme', theme); sync(); });
  languageToggle?.addEventListener('click', () => {
    currentLanguage = currentLanguage === 'tr' ? 'en' : currentLanguage === 'en' ? 'ar' : 'tr';
    localStorage.setItem('cicekLanguage', currentLanguage);
    translateDocument(currentLanguage);
    sync();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initNavigation();
  initScrollEffects();
  initReveal();
  initServices();
  initAppointmentForm();
  initReviews();
  initFaq();
  initDialog();
  initPreferences();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('/sw.js').catch(() => {});
});

function initLoader() {
  const loader = $('#pageLoader');
  const count = $('#loaderCount');
  const bar = $('.loader-track i');
  if (!loader) return;
  if (prefersReducedMotion) { loader.classList.add('done'); return; }
  let value = 0;
  let timer;
  let safety;
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    value = 100;
    count.textContent = value;
    bar.style.width = '100%';
    clearInterval(timer);
    clearTimeout(safety);
    setTimeout(() => loader.classList.add('done'), 180);
  };
  timer = setInterval(() => {
    value = Math.min(100, value + Math.ceil(Math.random() * 14));
    count.textContent = value;
    bar.style.width = `${value}%`;
    if (value === 100) finish();
  }, 55);
  safety = setTimeout(finish, 1400);
}

function initNavigation() {
  const header = $('#siteHeader');
  const toggle = $('#menuToggle');
  const menu = $('#mobileMenu');
  const links = $$('.mobile-menu a');
  const closeMenu = () => {
    toggle?.classList.remove('open');
    menu?.classList.remove('open');
    toggle?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  };
  toggle?.addEventListener('click', () => {
    const open = !menu.classList.contains('open');
    toggle.classList.toggle('open', open);
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
  });
  links.forEach(link => link.addEventListener('click', closeMenu));
  addEventListener('resize', () => { if (innerWidth > 1020) closeMenu(); }, { passive: true });
  const updateHeader = () => header?.classList.toggle('scrolled', scrollY > 24);
  updateHeader();
  addEventListener('scroll', updateHeader, { passive: true });

  const navLinks = $$('.desktop-nav a');
  const sectionObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navLinks.forEach(link => link.classList.toggle('active', link.hash === `#${entry.target.id}`));
  }), { rootMargin: '-35% 0px -55%', threshold: 0 });
  $$('main section[id]').forEach(section => sectionObserver.observe(section));
}

function initScrollEffects() {
  const progress = $('#scrollProgress');
  const toTop = $('#toTop');
  const car = $('#carStage');
  const glow = $('#cursorGlow');
  let ticking = false;
  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
    toTop?.classList.toggle('show', scrollY > 650);
    if (car && !prefersReducedMotion && innerWidth > 760) {
      const rect = car.getBoundingClientRect();
      const offset = Math.max(-30, Math.min(30, (innerHeight / 2 - rect.top) * .025));
      car.style.setProperty('--car-parallax', `${offset}px`);
    }
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
  update();
  toTop?.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
  if (glow && matchMedia('(pointer:fine)').matches && !prefersReducedMotion) {
    addEventListener('mousemove', event => {
      glow.style.left = `${event.clientX}px`;
      glow.style.top = `${event.clientY}px`;
      glow.style.opacity = '1';
    }, { passive: true });
    document.documentElement.addEventListener('mouseleave', () => glow.style.opacity = '0');
  }
}

function initReveal() {
  const items = $$('.reveal, .reveal-media, .split-heading');
  if (prefersReducedMotion) { items.forEach(item => item.classList.add('in-view')); return; }
  const revealVisible = () => items.forEach(item => {
    const rect = item.getBoundingClientRect();
    if (rect.top < innerHeight * .94 && rect.bottom > 0) item.classList.add('in-view');
  });
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('in-view');
    if (entry.target.matches('.stat')) animateCounter($('strong', entry.target));
    observer.unobserve(entry.target);
  }), { threshold: .16, rootMargin: '0px 0px -7%' });
  items.forEach((item, index) => {
    if (item.classList.contains('reveal')) item.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
    observer.observe(item);
  });
  $$('.stat').forEach(stat => observer.observe(stat));
  let revealTicking = false;
  addEventListener('scroll', () => {
    if (revealTicking) return;
    revealTicking = true;
    requestAnimationFrame(() => { revealVisible(); revealTicking = false; });
  }, { passive: true });
  requestAnimationFrame(revealVisible);
  setTimeout(revealVisible, 650);
  addEventListener('hashchange', () => setTimeout(revealVisible, 120));
}

function animateCounter(element) {
  if (!element || element.dataset.animated) return;
  element.dataset.animated = 'true';
  const target = Number(element.dataset.count);
  const prefix = element.dataset.prefix || '';
  const suffix = element.dataset.suffix || '';
  const decimal = String(target).includes('.');
  const start = performance.now();
  const duration = 1100;
  const frame = now => {
    const ratio = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - ratio, 3);
    const current = target * eased;
    element.textContent = `${prefix}${decimal ? current.toFixed(1) : Math.round(current)}${suffix}`;
    if (ratio < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function initServices() {
  const slices = $$('.service-slice');
  const activate = slice => {
    slices.forEach(item => item.classList.remove('active'));
    slice.classList.add('active');
  };
  slices.forEach(slice => {
    slice.addEventListener('mouseenter', () => activate(slice));
    slice.addEventListener('focus', () => activate(slice));
    slice.addEventListener('click', () => selectService(slice.dataset.service));
    slice.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectService(slice.dataset.service); } });
  });
  $$('.service-chip').forEach(chip => chip.addEventListener('click', () => selectService(chip.dataset.service)));
}

function selectService(service) {
  const checkbox = $(`input[name="services"][value="${CSS.escape(service)}"]`);
  if (checkbox) {
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
  }
  $('#randevu')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initAppointmentForm() {
  const form = $('#appointmentForm');
  if (!form) return;
  const serviceOptions = $('.service-options', form);
  if (serviceOptions && !$('input[value="Klima Bakımı"]', serviceOptions)) {
    const climate = document.createElement('label');
    climate.innerHTML = '<input type="checkbox" name="services" value="Klima Bakımı"><span>Klima Bakımı</span>';
    serviceOptions.append(climate);
  }
  const brandSelect = form.elements.brand;
  if (brandSelect && !$('option[value="other"]', brandSelect)) {
    const other = document.createElement('option');
    other.value = 'other';
    other.textContent = 'Diğer / Genel';
    brandSelect.append(other);
    const customField = document.createElement('label');
    customField.className = 'field custom-brand-field';
    customField.hidden = true;
    customField.innerHTML = '<span>Markayı yazın</span><input name="custom_brand" maxlength="60" autocomplete="off" placeholder="Örn. BMW, Mercedes-Benz, Renault">';
    brandSelect.closest('.field')?.after(customField);
    brandSelect.addEventListener('change', () => {
      const isOther = brandSelect.value === 'other';
      customField.hidden = !isOther;
      customField.querySelector('input').required = isOther;
      if (!isOther) customField.querySelector('input').value = '';
    });
  }
  const progressVehicle = $$('.form-progress>span')[1]?.querySelector('b');
  if (progressVehicle) progressVehicle.textContent = 'Araç';
  const vehicleStep = $('.form-step[data-step="2"]', form);
  const vehicleSmall = $('.form-heading small', vehicleStep);
  const brandLabel = brandSelect?.closest('.field')?.querySelector(':scope > span');
  if (vehicleSmall) vehicleSmall.textContent = '02 / Araç';
  if (brandLabel) brandLabel.textContent = 'Araç markası';
  const bookingIntro = $('.appointment-intro>p');
  if (bookingIntro) bookingIntro.textContent = 'VAG grubu araçlarda uzmanız; diğer markalar için de bakım ve onarım talebi oluşturabilirsiniz. İhtiyacınız olan tüm işlemleri birlikte seçin. Talebiniz doğrudan servis kayıt sistemimize ulaşır.';
  const steps = $$('.form-step', form);
  const indicators = $$('.form-progress>span');
  const progressBar = $('.form-progress>i b');
  const prev = $('#formPrev');
  const next = $('#formNext');
  const submit = $('#formSubmit');
  const error = $('#formError');
  const date = $('#appointmentDate');
  const time = form.elements.time;
  const serviceInputs = $$('input[name="services"]', form);
  const serviceCount = $('#serviceSelectionCount');
  let step = 0;
  $('#formStartedAt').value = String(Date.now());
  const updateServiceCount = () => {
    const count = serviceInputs.filter(input => input.checked).length;
    if (serviceCount) serviceCount.textContent = count ? languageText(`${count} hizmet seçildi`, `${count} services selected`, `${count} خدمات مختارة`) : localized('En az 1 hizmet seçin');
    if (date?.value) loadAvailability();
  };
  serviceInputs.forEach(input => input.addEventListener('change', updateServiceCount));
  resetTime(localized('Önce tarih seçin'));
  if (date) {
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    date.min = localDate(tomorrow);
    const max = new Date(); max.setMonth(max.getMonth() + 3);
    date.max = localDate(max);
    date.addEventListener('change', () => {
      if (new Date(`${date.value}T12:00:00`).getDay() === 0) { date.value = ''; resetTime(languageText('Önce tarih seçin','Select a date first','اختر التاريخ أولاً')); showError(languageText('Pazar günleri servisimiz kapalıdır. Lütfen başka bir gün seçin.','Our service is closed on Sundays. Please choose another day.','المركز مغلق يوم الأحد. يرجى اختيار يوم آخر.')); return; }
      loadAvailability();
    });
  }
  const phone = form.elements.phone;
  phone?.addEventListener('input', () => phone.value = formatPhone(phone.value));
  form.elements.plate?.addEventListener('input', event => event.target.value = event.target.value.toLocaleUpperCase('tr-TR').replace(/[^0-9A-ZÇĞİÖŞÜ ]/g, ''));
  form.elements.year?.addEventListener('input', event => event.target.value = event.target.value.replace(/\D/g, '').slice(0, 4));

  function render() {
    steps.forEach((item, index) => item.classList.toggle('active', index === step));
    indicators.forEach((item, index) => { item.classList.toggle('active', index === step); item.classList.toggle('done', index < step); });
    progressBar.style.width = `${((step + 1) / steps.length) * 100}%`;
    prev.hidden = step === 0;
    next.hidden = step === steps.length - 1;
    submit.hidden = step !== steps.length - 1;
    clearError();
    if (step === 2 && date.value) loadAvailability();
  }
  function resetTime(label) {
    time.innerHTML = `<option value="">${label}</option>`;
    time.disabled = true;
  }
  async function loadAvailability() {
    const services = serviceInputs.filter(input => input.checked).map(input => input.value);
    if (!date.value || !services.length) { resetTime(languageText('Önce tarih ve hizmet seçin','Select a date and service first','اختر التاريخ والخدمة أولاً')); return; }
    resetTime(languageText('Uygun saatler yükleniyor…','Loading available times…','جارٍ تحميل الأوقات المتاحة…'));
    const duration = services.length === 1 && services[0] === 'Periyodik Bakım' ? 60 : 120;
    const fallback = duration === 60 ? ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'] : ['09:00','11:00','13:00','15:00','17:00'];
    try {
      const response = await fetch(`/api/appointments?date=${encodeURIComponent(date.value)}&services=${encodeURIComponent(JSON.stringify(services))}`);
      if (!response.ok) throw new Error(currentLanguage === 'en' ? 'Available times could not be loaded.' : 'Uygun saatler alınamadı.');
      const result = await response.json();
      const available = result.available || [];
      const availabilityLabel = available.length ? languageText('Saat seçin','Select time','اختر الوقت') : languageText('Bu tarih için uygun saat kalmadı','No suitable time remains for this date','لا يوجد وقت متاح لهذا التاريخ');
      time.innerHTML = `<option value="">${availabilityLabel}</option>${available.map(value => `<option>${value}</option>`).join('')}`;
      time.disabled = !available.length;
    } catch (availabilityError) {
      if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        time.innerHTML = `<option value="">${languageText('Saat seçin · yerel önizleme','Select time · local preview','اختر الوقت · معاينة محلية')}</option>${fallback.map(value => `<option>${value}</option>`).join('')}`;
        time.disabled = false;
      } else {
        resetTime(languageText('Saatler şu anda alınamıyor','Times are currently unavailable','الأوقات غير متاحة حالياً'));
        showError(languageText('Uygun saatler alınamadı. Lütfen kısa süre sonra tekrar deneyin.','Available times could not be loaded. Please try again shortly.','تعذر تحميل الأوقات المتاحة. حاول مرة أخرى بعد قليل.'));
      }
    }
  }
  function validateCurrent() {
    const current = steps[step];
    const required = $$('[required]', current);
    let valid = true;
    if (step === 0) {
      const hasService = serviceInputs.some(input => input.checked);
      serviceInputs.forEach(input => input.classList.toggle('invalid', !hasService));
      if (!hasService) valid = false;
    }
    required.forEach(field => {
      const empty = field.type === 'radio' ? !$(`[name="${field.name}"]:checked`, current) : field.type === 'checkbox' ? !field.checked : !String(field.value).trim();
      field.classList.toggle('invalid', empty);
      if (empty) valid = false;
    });
    if (step === 3 && phone.value.replace(/\D/g, '').length < 10) { phone.classList.add('invalid'); valid = false; }
    if (!valid) showError(languageText('Devam etmek için zorunlu alanları tamamlayın.','Complete the required fields to continue.','أكمل الحقول المطلوبة للمتابعة.'));
    return valid;
  }
  function showError(message) { error.textContent = message; error.classList.add('show'); }
  function clearError() { error.textContent = ''; error.classList.remove('show'); $$('.invalid', form).forEach(field => field.classList.remove('invalid')); }
  next.addEventListener('click', () => { if (validateCurrent()) { step++; render(); $('.appointment-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); } });
  prev.addEventListener('click', () => { step--; render(); });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!validateCurrent()) return;
    const panel = $('.appointment-panel');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    if (data.brand === 'other') data.display_brand = data.custom_brand;
    data.services = formData.getAll('services');
    data.service = data.services.join(', ');
    data.whatsapp_consent = form.elements.whatsapp_consent.checked;
    data.kvkk = form.elements.kvkk.checked;
    panel.classList.add('loading');
    submit.disabled = true;
    try {
      const result = await createAppointment(data);
      showSuccess(data, result);
      form.reset();
      updateServiceCount();
      step = 0;
      $('#formStartedAt').value = String(Date.now());
      render();
    } catch (requestError) {
      showError(requestError.message || languageText('Talebiniz gönderilemedi. Lütfen bizi arayın veya WhatsApp üzerinden yazın.','Your request could not be sent. Please call or message us on WhatsApp.','تعذر إرسال طلبك. يرجى الاتصال بنا أو مراسلتنا عبر واتساب.'));
    } finally {
      panel.classList.remove('loading');
      submit.disabled = false;
    }
  });
  updateServiceCount();
  render();
}

async function createAppointment(data) {
  try {
    const response = await fetch('/api/appointments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const body = await response.json().catch(() => ({}));
    if (response.ok) return body;
    if (response.status !== 404 && response.status !== 503) throw new Error(body.error || languageText('Randevu talebi oluşturulamadı.','The booking request could not be created.','تعذر إنشاء طلب الموعد.'));
  } catch (error) {
    if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') throw error;
  }
  const record = { ...data, id: crypto.randomUUID?.() || `${Date.now()}`, reference: makeReference(), status: 'pending', created_at: new Date().toISOString(), storage_mode: 'local-demo' };
  const existing = JSON.parse(localStorage.getItem('cicekOtoApts') || '[]');
  existing.push(record);
  localStorage.setItem('cicekOtoApts', JSON.stringify(existing));
  return { ok: true, reference: record.reference, storage: 'local-demo' };
}

function showSuccess(data, result) {
  const dialog = $('#successDialog');
  const reference = result.reference || makeReference();
  $('#referenceCode').textContent = reference;
  $('#successText').textContent = result.storage === 'local-demo'
    ? languageText('Yerel önizleme kaydı oluşturuldu. Canlı sitede talebiniz doğrudan servise iletilecek.','A local preview record was created. On the live site, your request will be sent directly to the service.','تم إنشاء سجل معاينة محلي. في الموقع المنشور سيصل طلبك مباشرة إلى مركز الصيانة.')
    : languageText('Randevunuzu kontrol edip en kısa sürede telefon veya WhatsApp üzerinden dönüş yapacağız.','We will review your booking and contact you shortly by phone or WhatsApp.','سنراجع موعدك ونتواصل معك قريباً عبر الهاتف أو واتساب.');
  const serviceSummary = Array.isArray(data.services) ? data.services.join(' · ') : data.service;
  const message = currentLanguage === 'ar'
    ? `مرحباً، أنشأت طلب موعد بالرمز ${reference}.\nالخدمات: ${serviceSummary}\nالسيارة: ${data.display_brand || data.brand} ${data.model}\nالتاريخ: ${data.date} ${data.time}`
    : currentLanguage === 'en' ? `Hello, I created a booking request with reference ${reference}.\nServices: ${serviceSummary}\nVehicle: ${data.display_brand || data.brand} ${data.model}\nDate: ${data.date} ${data.time}`
    : `Merhaba, ${reference} takip kodlu randevu talebimi oluşturdum.\nHizmetler: ${serviceSummary}\nAraç: ${data.display_brand || data.brand} ${data.model}\nTarih: ${data.date} ${data.time}`;
  $('#successWhatsapp').href = `https://wa.me/902125491763?text=${encodeURIComponent(message)}`;
  dialog.showModal();
}

function initReviews() {
  const track = $('#reviewTrack');
  if (!track) return;
  const sourceUrl = 'https://share.google/Ku7rt8w8gclaphIJl';
  const pending = document.createElement('article');
  pending.className = 'review review-source-state';
  pending.innerHTML = `<div class="stars" aria-hidden="true">G</div><blockquote>${localized('Uydurma yorum göstermiyoruz. Tüm gerçek değerlendirmeleri Google işletme profilimizde görebilirsiniz.')}</blockquote><div><b>${localized('Canlı Google bağlantısı bekleniyor')}</b><a href="${sourceUrl}" target="_blank" rel="noopener">${localized('Tüm gerçek yorumları Google’da gör →')}</a></div>`;
  track.replaceChildren(pending);
  let index = 0;
  let cards = $$('.review', track);
  const update = () => {
    const visible = innerWidth <= 620 ? 1 : innerWidth <= 1020 ? 2 : 3;
    index = Math.min(index, Math.max(0, cards.length - visible));
    const gap = 18;
    const width = (track.parentElement.clientWidth - gap * (visible - 1)) / visible;
    track.style.transform = `translateX(-${index * (width + gap)}px)`;
  };
  $('#reviewNext')?.addEventListener('click', () => { index = Math.min(cards.length - 1, index + 1); update(); });
  $('#reviewPrev')?.addEventListener('click', () => { index = Math.max(0, index - 1); update(); });
  addEventListener('resize', update, { passive: true });
  update();
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return;
  fetch('/api/google-reviews').then(response => response.ok ? response.json() : null).then(data => {
    if (!data?.reviews?.length) return;
    const rating = $('.google-rating b');
    const count = $('.google-rating>span:not(.google-g)');
    const link = $('.google-rating');
    if (rating) rating.textContent = `${String(data.rating).replace('.', ',')} / 5`;
    if (count) count.textContent = `${data.count} Google yorumu`;
    const heroReviewValue = $('.hero-stats .stat:nth-child(2) strong');
    const heroReviewLabel = $('.hero-stats .stat:nth-child(2) span');
    if (heroReviewValue) heroReviewValue.textContent = String(data.count);
    if (heroReviewLabel) heroReviewLabel.textContent = localized('Doğrulanmış Google yorumu');
    if (link && data.url) link.href = data.url;
    track.replaceChildren(...data.reviews.map(review => {
      const article = document.createElement('article');
      article.className = 'review';
      const stars = document.createElement('div');
      stars.className = 'stars';
      stars.setAttribute('aria-label', `${review.rating} yıldız`);
      stars.textContent = '★'.repeat(Math.max(1, Math.min(5, Math.round(review.rating))));
      const quote = document.createElement('blockquote');
      quote.lang = 'tr';
      quote.textContent = `“${review.text}”`;
      const attribution = document.createElement('div');
      const author = document.createElement('b');
      author.textContent = review.author;
      const meta = document.createElement('span');
      meta.textContent = `Google yorumu · ${review.rating}/5${review.published ? ` · ${review.published}` : ''}`;
      attribution.append(author, meta);
      article.append(stars, quote, attribution);
      if (review.url) article.addEventListener('click', () => window.open(review.url, '_blank', 'noopener'));
      return article;
    }));
    cards = $$('.review', track);
    index = 0;
    update();
  }).catch(() => {});
}

function initFaq() {
  $$('.faq-list details').forEach(detail => detail.addEventListener('toggle', () => {
    if (!detail.open) return;
    $$('.faq-list details').forEach(other => { if (other !== detail) other.open = false; });
  }));
}

function initDialog() {
  const dialog = $('#successDialog');
  const close = () => dialog?.close();
  $('#dialogClose')?.addEventListener('click', close);
  $('#dialogDone')?.addEventListener('click', close);
  dialog?.addEventListener('click', event => { if (event.target === dialog) close(); });
}

function formatPhone(value) {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('90')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.slice(1);
  digits = digits.slice(0, 10);
  const parts = [];
  if (digits.length) parts.push(`0${digits.slice(0, 3)}`);
  if (digits.length > 3) parts.push(digits.slice(3, 6));
  if (digits.length > 6) parts.push(digits.slice(6, 8));
  if (digits.length > 8) parts.push(digits.slice(8, 10));
  return parts.join(' ');
}
function localDate(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function makeReference() { return `CO-${new Date().getFullYear().toString().slice(-2)}${Math.random().toString(36).slice(2, 7).toUpperCase()}`; }
