const ALLOWED_SERVICES = new Set(['Periyodik Bakım','DSG Şanzıman','Motor & Elektronik','Fren Sistemi','Kaporta & Boya','Genel Kontrol','Klima Bakımı','Süspansiyon','Elektrik Arızası']);
const ALLOWED_BRANDS = new Set(['Volkswagen','Audi','Škoda','SEAT','CUPRA']);

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return res.status(503).json({ error: 'Randevu servisi henüz yapılandırılmadı.', code: 'SETUP_REQUIRED' });
  if (req.method === 'GET') return getAvailability(req, res, supabaseUrl, serviceKey);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Yalnızca GET ve POST desteklenir.' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    if (body.website) return res.status(200).json({ ok: true, reference: 'OK' });
    const started = Number(body.form_started_at || 0);
    if (!started || Date.now() - started < 1800) return res.status(400).json({ error: 'Form çok hızlı gönderildi.' });
    const phone = normalizePhone(body.phone);
    const services = normalizeServices(body.services || body.service);
    const brand = clean(body.brand, 60);
    const date = clean(body.date, 10);
    const time = clean(body.time, 5);
    const durationMinutes = appointmentDuration(services);
    if (!services.length || services.length > 6) return res.status(400).json({ error: 'En az bir, en fazla altı geçerli hizmet seçin.' });
    if (!clean(body.name, 90) || !phone || !ALLOWED_BRANDS.has(brand) || !clean(body.model, 60) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time) || body.kvkk !== true) return res.status(400).json({ error: 'Zorunlu alanları ve VAG marka seçimini kontrol edin.' });
    const appointmentDate = new Date(`${date}T${time}:00+03:00`);
    if (Number.isNaN(appointmentDate.getTime()) || appointmentDate.getDay() === 0 || appointmentDate.getTime() < Date.now() - 60000) return res.status(400).json({ error: 'Geçerli bir randevu zamanı seçin.' });
    if (!allowedTimes(durationMinutes).includes(time)) return res.status(400).json({ error: 'Randevular 09:00–17:00 arasında alınabilir.' });
    const reference = makeReference();
    const record = { reference, status:'pending', service:services.join(', '), services, duration_minutes:durationMinutes, vehicle_brand:brand, vehicle_model:clean(body.model,60), vehicle_year:clean(body.year,4)||null, plate:clean(body.plate,12).toLocaleUpperCase('tr-TR')||null, requested_date:date, requested_time:time, customer_name:clean(body.name,90), customer_phone:phone, customer_email:clean(body.email,120)||null, notes:clean(body.notes,600)||null, kvkk_consent:true, whatsapp_consent:body.whatsapp_consent===true, source:'website' };
    const insert = await fetch(`${supabaseUrl}/rest/v1/rpc/create_website_appointment`, { method:'POST', headers:{ apikey:serviceKey, Authorization:`Bearer ${serviceKey}`, 'Content-Type':'application/json' }, body:JSON.stringify({ p_record:record }) });
    if (!insert.ok) {
      const failure = await insert.json().catch(() => ({}));
      if (String(failure.message || '').includes('SLOT_UNAVAILABLE')) return res.status(409).json({ error:'Bu saat az önce doldu. Lütfen başka bir saat seçin.', code:'SLOT_UNAVAILABLE' });
      throw new Error(`Supabase appointment RPC failed: ${insert.status}`);
    }
    notifyOwner(record).catch(() => {});
    return res.status(201).json({ ok:true, reference, status:'pending' });
  } catch (error) {
    console.error('appointment_create_failed', error.message);
    return res.status(500).json({ error:'Randevu talebi şu anda oluşturulamadı. Lütfen bizi arayın.' });
  }
};

async function getAvailability(req,res,supabaseUrl,serviceKey){
  try{
    const date=clean(req.query?.date,10);
    const services=parseServicesQuery(req.query?.services);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!services.length)return res.status(400).json({error:'Tarih ve hizmet seçimi gereklidir.'});
    const day=new Date(`${date}T12:00:00+03:00`);
    if(Number.isNaN(day.getTime())||day.getDay()===0)return res.status(400).json({error:'Pazar günleri servisimiz kapalıdır.'});
    const durationMinutes=appointmentDuration(services);
    const query=`requested_date=eq.${encodeURIComponent(date)}&status=neq.cancelled&select=requested_time,duration_minutes&order=requested_time.asc`;
    const response=await fetch(`${supabaseUrl}/rest/v1/appointments?${query}`,{headers:{apikey:serviceKey,Authorization:`Bearer ${serviceKey}`}});
    if(!response.ok)throw new Error(`Supabase availability failed: ${response.status}`);
    const existing=await response.json();
    const available=allowedTimes(durationMinutes).filter(time=>!existing.some(item=>overlaps(time,durationMinutes,String(item.requested_time).slice(0,5),Number(item.duration_minutes)||120)));
    return res.status(200).json({available,duration_minutes:durationMinutes});
  }catch(error){console.error('appointment_availability_failed',error.message);return res.status(500).json({error:'Uygun saatler şu anda alınamadı.'})}
}

async function notifyOwner(record) {
  const phone = process.env.CALLMEBOT_PHONE;
  const apikey = process.env.CALLMEBOT_API_KEY;
  if (!phone || !apikey) return;
  const text = `Yeni randevu talebi\nKod: ${record.reference}\n${record.customer_name} · ${record.customer_phone}\n${record.vehicle_brand} ${record.vehicle_model}\n${record.services.join(' · ')}\n${record.requested_date} ${record.requested_time}`;
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apikey)}`;
  await fetch(url, { signal:AbortSignal.timeout(7000) });
}
function clean(value,max){return String(value||'').trim().replace(/[<>]/g,'').slice(0,max)}
function normalizeServices(value){const values=Array.isArray(value)?value:[value];return [...new Set(values.map(item=>clean(item,80)).filter(item=>ALLOWED_SERVICES.has(item)))]}
function parseServicesQuery(value){try{return normalizeServices(JSON.parse(String(value||'[]')))}catch{return []}}
function appointmentDuration(services){return services.length===1&&services[0]==='Periyodik Bakım'?60:120}
function allowedTimes(duration){return duration===60?['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00']:['09:00','11:00','13:00','15:00','17:00']}
function overlaps(aStart,aDuration,bStart,bDuration){const toMinutes=value=>{const [h,m]=value.split(':').map(Number);return h*60+m};const a=toMinutes(aStart),b=toMinutes(bStart);return a<b+bDuration&&b<a+aDuration}
function normalizePhone(value){const digits=String(value||'').replace(/\D/g,'').replace(/^90/,'').replace(/^0/,'');return digits.length===10?`+90${digits}`:''}
function makeReference(){return `CO-${new Date().getFullYear().toString().slice(-2)}${Math.random().toString(36).slice(2,7).toUpperCase()}`}
