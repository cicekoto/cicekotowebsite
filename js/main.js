'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('/sw.js').catch(() => {});
});

function initLoader() {
  const loader = $('#pageLoader');
  const count = $('#loaderCount');
  const bar = $('.loader-track i');
  if (!loader) return;
  if (prefersReducedMotion) { loader.classList.add('done'); return; }
  let value = 0;
  const timer = setInterval(() => {
    value = Math.min(100, value + Math.ceil(Math.random() * 14));
    count.textContent = value;
    bar.style.width = `${value}%`;
    if (value === 100) {
      clearInterval(timer);
      setTimeout(() => loader.classList.add('done'), 180);
    }
  }, 55);
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
      car.style.backgroundPosition = `center calc(100% + ${offset}px)`;
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
  const radio = $(`input[name="service"][value="${CSS.escape(service)}"]`);
  if (radio) radio.checked = true;
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
  let step = 0;
  $('#formStartedAt').value = String(Date.now());
  $$('.service-options label', form).forEach(label => label.addEventListener('click', () => {
    const radio = $('input[type="radio"]', label);
    if (radio) setTimeout(() => { radio.checked = true; }, 0);
  }));
  if (date) {
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    date.min = localDate(tomorrow);
    const max = new Date(); max.setMonth(max.getMonth() + 3);
    date.max = localDate(max);
    date.addEventListener('change', () => {
      if (new Date(`${date.value}T12:00:00`).getDay() === 0) { date.value = ''; showError('Pazar günleri servisimiz kapalıdır. Lütfen başka bir gün seçin.'); }
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
  }
  function validateCurrent() {
    const current = steps[step];
    const required = $$('[required]', current);
    let valid = true;
    required.forEach(field => {
      const empty = field.type === 'radio' ? !$(`[name="${field.name}"]:checked`, current) : field.type === 'checkbox' ? !field.checked : !String(field.value).trim();
      field.classList.toggle('invalid', empty);
      if (empty) valid = false;
    });
    if (step === 3 && phone.value.replace(/\D/g, '').length < 10) { phone.classList.add('invalid'); valid = false; }
    if (!valid) showError('Devam etmek için zorunlu alanları tamamlayın.');
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
    const data = Object.fromEntries(new FormData(form).entries());
    data.whatsapp_consent = form.elements.whatsapp_consent.checked;
    data.kvkk = form.elements.kvkk.checked;
    panel.classList.add('loading');
    submit.disabled = true;
    try {
      const result = await createAppointment(data);
      showSuccess(data, result);
      form.reset();
      step = 0;
      $('#formStartedAt').value = String(Date.now());
      render();
    } catch (requestError) {
      showError(requestError.message || 'Talebiniz gönderilemedi. Lütfen bizi arayın veya WhatsApp üzerinden yazın.');
    } finally {
      panel.classList.remove('loading');
      submit.disabled = false;
    }
  });
  render();
}

async function createAppointment(data) {
  try {
    const response = await fetch('/api/appointments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const body = await response.json().catch(() => ({}));
    if (response.ok) return body;
    if (response.status !== 404 && response.status !== 503) throw new Error(body.error || 'Randevu talebi oluşturulamadı.');
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
  $('#successText').textContent = result.storage === 'local-demo' ? 'Yerel önizleme kaydı oluşturuldu. Canlı sitede talebiniz doğrudan servise iletilecek.' : 'Randevunuzu kontrol edip en kısa sürede telefon veya WhatsApp üzerinden dönüş yapacağız.';
  const message = `Merhaba, ${reference} takip kodlu randevu talebimi oluşturdum.\nHizmet: ${data.service}\nAraç: ${data.brand} ${data.model}\nTarih: ${data.date} ${data.time}`;
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
