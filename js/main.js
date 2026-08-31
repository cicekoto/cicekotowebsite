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
const TR_TEXT = Object.fromEntries(Object.entries(EN_TEXT).map(([tr, en]) => [en, tr]));

function localized(text) {
  if (currentLanguage !== 'en') return text;
  return EN_TEXT[text] || text;
}

function translateValue(value, language) {
  const clean = value.trim();
  if (!clean) return value;
  let translated = language === 'en' ? EN_TEXT[clean] : TR_TEXT[clean];
  if (!translated && language === 'en' && /^(\d+) hizmet seçildi$/.test(clean)) translated = `${clean.match(/\d+/)[0]} services selected`;
  if (!translated && language === 'tr' && /^(\d+) services selected$/.test(clean)) translated = `${clean.match(/\d+/)[0]} hizmet seçildi`;
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
  document.title = language === 'en' ? 'Çiçek Otomotiv | VAG Specialist Service · Başakşehir' : 'Çiçek Otomotiv | Profesyonel Oto Servis · Başakşehir';
}

function initPreferences() {
  const themeToggle = $('#themeToggle');
  const languageToggle = $('#languageToggle');
  currentLanguage = localStorage.getItem('cicekLanguage') === 'en' ? 'en' : 'tr';
  let theme = document.documentElement.dataset.theme || 'dark';
  const sync = () => {
    document.documentElement.dataset.theme = theme;
    $('#themeColor')?.setAttribute('content', theme === 'light' ? '#f4f7fb' : '#000105');
    if (themeToggle) {
      const goLight = theme === 'dark';
      themeToggle.setAttribute('aria-pressed', String(theme === 'light'));
      themeToggle.setAttribute('aria-label', currentLanguage === 'en' ? `Switch to ${goLight ? 'light' : 'dark'} theme` : `${goLight ? 'Açık' : 'Koyu'} temaya geç`);
      $('span', themeToggle).textContent = goLight ? '☼' : '☾';
      $('.theme-label', themeToggle).textContent = currentLanguage === 'en' ? (goLight ? 'Light' : 'Dark') : (goLight ? 'Açık' : 'Koyu');
    }
    if (languageToggle) {
      $('b', languageToggle).textContent = currentLanguage === 'tr' ? 'EN' : 'TR';
      languageToggle.setAttribute('aria-label', currentLanguage === 'tr' ? 'Switch to English' : 'Türkçeye geç');
    }
    const hours = $('.appointment-intro .hours');
    if (hours) hours.dataset.hoursLabel = currentLanguage === 'en' ? 'BOOKING START TIMES · 09:00–17:00' : 'RANDEVU BAŞLANGIÇ SAATLERİ · 09:00–17:00';
    const panel = $('.appointment-panel');
    if (panel) panel.dataset.loadingLabel = currentLanguage === 'en' ? 'Submitting your request…' : 'Talebiniz oluşturuluyor…';
  };
  translateDocument(currentLanguage);
  sync();
  themeToggle?.addEventListener('click', () => { theme = theme === 'dark' ? 'light' : 'dark'; localStorage.setItem('cicekTheme', theme); sync(); });
  languageToggle?.addEventListener('click', () => {
    currentLanguage = currentLanguage === 'tr' ? 'en' : 'tr';
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
    if (serviceCount) serviceCount.textContent = count ? (currentLanguage === 'en' ? `${count} services selected` : `${count} hizmet seçildi`) : localized('En az 1 hizmet seçin');
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
      if (new Date(`${date.value}T12:00:00`).getDay() === 0) { date.value = ''; resetTime(currentLanguage === 'en' ? 'Select a date first' : 'Önce tarih seçin'); showError(currentLanguage === 'en' ? 'Our service is closed on Sundays. Please choose another day.' : 'Pazar günleri servisimiz kapalıdır. Lütfen başka bir gün seçin.'); return; }
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
    if (!date.value || !services.length) { resetTime(currentLanguage === 'en' ? 'Select a date and service first' : 'Önce tarih ve hizmet seçin'); return; }
    resetTime(currentLanguage === 'en' ? 'Loading available times…' : 'Uygun saatler yükleniyor…');
    const duration = services.length === 1 && services[0] === 'Periyodik Bakım' ? 60 : 120;
    const fallback = duration === 60 ? ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'] : ['09:00','11:00','13:00','15:00','17:00'];
    try {
      const response = await fetch(`/api/appointments?date=${encodeURIComponent(date.value)}&services=${encodeURIComponent(JSON.stringify(services))}`);
      if (!response.ok) throw new Error(currentLanguage === 'en' ? 'Available times could not be loaded.' : 'Uygun saatler alınamadı.');
      const result = await response.json();
      const available = result.available || [];
      const availabilityLabel = currentLanguage === 'en'
        ? (available.length ? `Select time · capacity for ${result.remaining} vehicles remains` : 'Daily capacity of 5 vehicles is full')
        : (available.length ? `Saat seçin · ${result.remaining} araçlık kapasite kaldı` : 'Bu gün için 5 araçlık kapasite dolu');
      time.innerHTML = `<option value="">${availabilityLabel}</option>${available.map(value => `<option>${value}</option>`).join('')}`;
      time.disabled = !available.length;
    } catch (availabilityError) {
      if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        time.innerHTML = `<option value="">${currentLanguage === 'en' ? 'Select time · local preview' : 'Saat seçin · yerel önizleme'}</option>${fallback.map(value => `<option>${value}</option>`).join('')}`;
        time.disabled = false;
      } else {
        resetTime(currentLanguage === 'en' ? 'Times are currently unavailable' : 'Saatler şu anda alınamıyor');
        showError(currentLanguage === 'en' ? 'Available times could not be loaded. Please try again shortly.' : 'Uygun saatler alınamadı. Lütfen kısa süre sonra tekrar deneyin.');
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
    if (!valid) showError(currentLanguage === 'en' ? 'Complete the required fields to continue.' : 'Devam etmek için zorunlu alanları tamamlayın.');
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
      showError(requestError.message || (currentLanguage === 'en' ? 'Your request could not be sent. Please call or message us on WhatsApp.' : 'Talebiniz gönderilemedi. Lütfen bizi arayın veya WhatsApp üzerinden yazın.'));
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
    if (response.status !== 404 && response.status !== 503) throw new Error(body.error || (currentLanguage === 'en' ? 'The booking request could not be created.' : 'Randevu talebi oluşturulamadı.'));
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
  $('#successText').textContent = currentLanguage === 'en'
    ? (result.storage === 'local-demo' ? 'A local preview record was created. On the live site, your request will be sent directly to the service.' : 'We will review your booking and contact you shortly by phone or WhatsApp.')
    : (result.storage === 'local-demo' ? 'Yerel önizleme kaydı oluşturuldu. Canlı sitede talebiniz doğrudan servise iletilecek.' : 'Randevunuzu kontrol edip en kısa sürede telefon veya WhatsApp üzerinden dönüş yapacağız.');
  const serviceSummary = Array.isArray(data.services) ? data.services.join(' · ') : data.service;
  const message = currentLanguage === 'en'
    ? `Hello, I created a booking request with reference ${reference}.\nServices: ${serviceSummary}\nVehicle: ${data.brand} ${data.model}\nDate: ${data.date} ${data.time}`
    : `Merhaba, ${reference} takip kodlu randevu talebimi oluşturdum.\nHizmetler: ${serviceSummary}\nAraç: ${data.brand} ${data.model}\nTarih: ${data.date} ${data.time}`;
  $('#successWhatsapp').href = `https://wa.me/902125491763?text=${encodeURIComponent(message)}`;
  dialog.showModal();
}

function initReviews() {
  const track = $('#reviewTrack');
  if (!track) return;
  let index = 0;
  const cards = $$('.review', track);
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
