async function notifyOwnerCallMeBot(record) {
  const phone = process.env.CALLMEBOT_PHONE;
  const apikey = process.env.CALLMEBOT_API_KEY;
  if (!phone || !apikey) return false;
  const text = `Yeni randevu talebi\nKod: ${record.reference}\n${record.customer_name} · ${record.customer_phone}\n${record.vehicle_brand} ${record.vehicle_model}\n${record.services.join(' · ')}\n${record.requested_date} ${record.requested_time}`;
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apikey)}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(7000) });
  return response.ok;
}

async function notifyCustomerEmail(record, event = 'received') {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = String(record.customer_email || '').trim();
  const content = emailContent(record, event);
  if (!apiKey || !from || !to || !content) return false;
  const payload = {
    from,
    to: [to],
    subject: content.subject,
    text: content.text,
    html: content.html
  };
  const replyTo = String(process.env.RESEND_REPLY_TO || '').trim();
  if (replyTo) payload.reply_to = replyTo;
  const idempotencyKey = `appointment-${String(record.reference || 'unknown').replace(/[^a-z0-9_-]/gi, '-')}-${event}`.slice(0, 256);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(9000)
  });
  return response.ok;
}

function emailContent(record, event) {
  const copy = {
    received: ['Randevu talebiniz alındı', 'Talebinizi aldık. Servis kapasitesi kontrol edildikten sonra kesin onayınızı ayrıca ileteceğiz.'],
    confirmed: ['Randevunuz onaylandı', 'Randevunuz onaylandı. Belirtilen tarih ve saatte sizi bekliyoruz.'],
    rescheduled: ['Randevu saatiniz güncellendi', 'Randevunuzun tarih veya saat bilgisi güncellendi. Yeni bilgileri aşağıda görebilirsiniz.'],
    cancelled: ['Randevunuz iptal edildi', 'Randevunuz iptal edildi. Yeni bir randevu için web sitemizi kullanabilir veya bizi arayabilirsiniz.']
  }[event];
  if (!copy) return null;
  const name = String(record.customer_name || 'Değerli müşterimiz');
  const reference = String(record.reference || '—');
  const date = formatDate(record.requested_date);
  const time = String(record.requested_time || '').slice(0, 5) || '—';
  const vehicle = [record.vehicle_brand, record.vehicle_model].filter(Boolean).join(' ') || '—';
  const services = Array.isArray(record.services) ? record.services.join(' · ') : String(record.service || '—');
  const subject = `${copy[0]} · ${reference}`;
  const text = `Merhaba ${name},\n\n${copy[1]}\n\nRandevu kodu: ${reference}\nTarih: ${date}\nSaat: ${time}\nAraç: ${vehicle}\nHizmet: ${services}\n\nÇiçek Otomotiv\n0212 549 17 63`;
  const html = `<!doctype html><html lang="tr"><body style="margin:0;background:#f4f7f8;color:#102126;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7f8;padding:28px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #dce7e9;border-radius:16px;overflow:hidden"><tr><td style="background:#07171b;color:#ffffff;padding:24px 28px"><strong style="font-size:20px">ÇİÇEK OTO</strong><div style="color:#55d8e7;font-size:12px;margin-top:5px">Servis randevu bilgilendirmesi</div></td></tr><tr><td style="padding:30px 28px"><h1 style="font-size:24px;margin:0 0 12px">${escapeHtml(copy[0])}</h1><p style="font-size:15px;line-height:1.65;margin:0 0 22px">Merhaba ${escapeHtml(name)},<br>${escapeHtml(copy[1])}</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6fafb;border-radius:12px;padding:18px"><tr><td style="padding:6px;color:#587078">Randevu kodu</td><td style="padding:6px;text-align:right;font-weight:bold">${escapeHtml(reference)}</td></tr><tr><td style="padding:6px;color:#587078">Tarih</td><td style="padding:6px;text-align:right;font-weight:bold">${escapeHtml(date)}</td></tr><tr><td style="padding:6px;color:#587078">Saat</td><td style="padding:6px;text-align:right;font-weight:bold">${escapeHtml(time)}</td></tr><tr><td style="padding:6px;color:#587078">Araç</td><td style="padding:6px;text-align:right;font-weight:bold">${escapeHtml(vehicle)}</td></tr><tr><td style="padding:6px;color:#587078">Hizmet</td><td style="padding:6px;text-align:right;font-weight:bold">${escapeHtml(services)}</td></tr></table><p style="font-size:13px;color:#587078;line-height:1.6;margin:22px 0 0">Sorularınız için 0212 549 17 63 numarasından bize ulaşabilirsiniz.</p></td></tr></table></td></tr></table></body></html>`;
  return { subject, text, html };
}

function formatDate(value) {
  const date = new Date(`${String(value || '')}T12:00:00+03:00`);
  return Number.isNaN(date.getTime()) ? String(value || '—') : new Intl.DateTimeFormat('tr-TR', { day:'2-digit', month:'long', year:'numeric', timeZone:'Europe/Istanbul' }).format(date);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
}

module.exports = { notifyCustomerEmail, notifyOwnerCallMeBot, _test:{ emailContent, escapeHtml, formatDate } };
