const ALLOWED_SERVICES = new Set(['Periyodik Bakım','DSG Şanzıman','Motor & Elektronik','Fren Sistemi','Kaporta & Boya','Genel Kontrol','Klima Bakımı','Süspansiyon','Elektrik Arızası']);

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Yalnızca POST desteklenir.' });
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return res.status(503).json({ error: 'Randevu servisi henüz yapılandırılmadı.', code: 'SETUP_REQUIRED' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    if (body.website) return res.status(200).json({ ok: true, reference: 'OK' });
    const started = Number(body.form_started_at || 0);
    if (!started || Date.now() - started < 1800) return res.status(400).json({ error: 'Form çok hızlı gönderildi.' });
    const phone = normalizePhone(body.phone);
    const service = clean(body.service, 80);
    const date = clean(body.date, 10);
    const time = clean(body.time, 5);
    if (!ALLOWED_SERVICES.has(service)) return res.status(400).json({ error: 'Geçerli bir hizmet seçin.' });
    if (!clean(body.name, 90) || !phone || !clean(body.brand, 60) || !clean(body.model, 60) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time) || body.kvkk !== true) return res.status(400).json({ error: 'Zorunlu alanları kontrol edin.' });
    const appointmentDate = new Date(`${date}T${time}:00+03:00`);
    if (Number.isNaN(appointmentDate.getTime()) || appointmentDate.getDay() === 0 || appointmentDate.getTime() < Date.now() - 60000) return res.status(400).json({ error: 'Geçerli bir randevu zamanı seçin.' });
    const reference = makeReference();
    const record = { reference, status:'pending', service, vehicle_brand:clean(body.brand,60), vehicle_model:clean(body.model,60), vehicle_year:clean(body.year,4)||null, plate:clean(body.plate,12).toLocaleUpperCase('tr-TR')||null, requested_date:date, requested_time:time, customer_name:clean(body.name,90), customer_phone:phone, customer_email:clean(body.email,120)||null, notes:clean(body.notes,600)||null, kvkk_consent:true, whatsapp_consent:body.whatsapp_consent===true, source:'website' };
    const insert = await fetch(`${supabaseUrl}/rest/v1/appointments`, { method:'POST', headers:{ apikey:serviceKey, Authorization:`Bearer ${serviceKey}`, 'Content-Type':'application/json', Prefer:'return=representation' }, body:JSON.stringify(record) });
    if (!insert.ok) throw new Error(`Supabase insert failed: ${insert.status}`);
    notifyOwner(record).catch(() => {});
    return res.status(201).json({ ok:true, reference, status:'pending' });
  } catch (error) {
    console.error('appointment_create_failed', error.message);
    return res.status(500).json({ error:'Randevu talebi şu anda oluşturulamadı. Lütfen bizi arayın.' });
  }
};

async function notifyOwner(record) {
  const phone = process.env.CALLMEBOT_PHONE;
  const apikey = process.env.CALLMEBOT_API_KEY;
  if (!phone || !apikey) return;
  const text = `Yeni randevu talebi\nKod: ${record.reference}\n${record.customer_name} · ${record.customer_phone}\n${record.vehicle_brand} ${record.vehicle_model}\n${record.service}\n${record.requested_date} ${record.requested_time}`;
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apikey)}`;
  await fetch(url, { signal:AbortSignal.timeout(7000) });
}
function clean(value,max){return String(value||'').trim().replace(/[<>]/g,'').slice(0,max)}
function normalizePhone(value){const digits=String(value||'').replace(/\D/g,'').replace(/^90/,'').replace(/^0/,'');return digits.length===10?`+90${digits}`:''}
function makeReference(){return `CO-${new Date().getFullYear().toString().slice(-2)}${Math.random().toString(36).slice(2,7).toUpperCase()}`}
