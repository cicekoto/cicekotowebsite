const ALLOWED_SERVICES = new Set(['Periyodik Bakım','DSG Şanzıman','Motor & Elektronik','Fren Sistemi','Kaporta & Boya','Genel Kontrol','Klima Bakımı','Süspansiyon','Elektrik Arızası']);
const ALLOWED_BRANDS = new Set(['Volkswagen','Audi','Škoda','SEAT','CUPRA']);
const { notifyCustomerWhatsApp, notifyOwnerCallMeBot } = require('../lib/notifications');
const { sameOrigin } = require('../lib/admin-auth');
const { applyRateLimit, clientIp, consumeRateLimit } = require('../lib/rate-limit');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return res.status(503).json({ error: 'Randevu servisi henüz yapılandırılmadı.', code: 'SETUP_REQUIRED' });
  if (req.method === 'GET') return getAvailability(req, res, supabaseUrl, serviceKey);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Yalnızca GET ve POST desteklenir.' });
  if (!sameOrigin(req)) return res.status(403).json({ error: 'Güvenlik doğrulaması başarısız.' });
  if (!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) return res.status(415).json({ error: 'JSON içerik türü gereklidir.' });
  if (Number(req.headers['content-length'] || 0) > 16384) return res.status(413).json({ error: 'İstek çok büyük.' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    if (!body || Array.isArray(body) || typeof body !== 'object') return res.status(400).json({ error: 'Geçersiz istek.' });
    const ipRate = await consumeRateLimit({ supabaseUrl, serviceKey, bucket:'appointment-create', subject:clientIp(req), limit:8, windowSeconds:1800 });
    if (!applyRateLimit(res, ipRate)) return res.status(429).json({ error:'Çok fazla randevu denemesi. Lütfen daha sonra tekrar deneyin.' });
    if (body.website) return res.status(200).json({ ok: true, reference: 'OK' });
    const started = Number(body.form_started_at || 0);
    if (!started || Date.now() - started < 1800 || Date.now() - started > 86400000) return res.status(400).json({ error: 'Form oturumu geçersiz. Lütfen sayfayı yenileyin.' });
    const phone = normalizePhone(body.phone);
    const services = normalizeServices(body.services || body.service);
    const selectedBrand = clean(body.brand, 60);
    const customBrand = clean(body.custom_brand, 60);
    const brand = selectedBrand === 'other' || selectedBrand === 'Diğer' ? customBrand : selectedBrand;
    const date = clean(body.date, 10);
    const time = clean(body.time, 5);
    const durationMinutes = appointmentDuration(services);
    const name=clean(body.name,90),model=clean(body.model,60),email=clean(body.email,120),year=clean(body.year,4),plate=clean(body.plate,12).toLocaleUpperCase('tr-TR');
    if (!services.length || services.length > ALLOWED_SERVICES.size) return res.status(400).json({ error: 'En az bir geçerli hizmet seçin.' });
    const validBrand = validVehicleBrand(brand, customBrand);
    if (name.length<2 || !phone || !validBrand || model.length<1 || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time) || body.kvkk !== true) return res.status(400).json({ error: 'Zorunlu alanları ve araç marka seçimini kontrol edin.' });
    if(email&&!/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/.test(email))return res.status(400).json({error:'Geçerli bir e-posta adresi girin.'});
    if(year&&(!/^\d{4}$/.test(year)||Number(year)<1950||Number(year)>new Date().getFullYear()+1))return res.status(400).json({error:'Geçerli bir model yılı girin.'});
    if(plate&&!/^[0-9A-ZÇĞİÖŞÜ ]{5,12}$/.test(plate))return res.status(400).json({error:'Geçerli bir plaka girin.'});
    const appointmentDate = new Date(`${date}T${time}:00+03:00`);
    if (Number.isNaN(appointmentDate.getTime()) || appointmentDate.getDay() === 0 || appointmentDate.getTime() < Date.now() - 60000 || date>todayYmd(90)) return res.status(400).json({ error: 'Önümüzdeki 90 gün içinde geçerli bir randevu zamanı seçin.' });
    if (!allowedTimes(durationMinutes).includes(time)) return res.status(400).json({ error: 'Randevular 09:00–17:00 arasında alınabilir.' });
    const phoneRate=await consumeRateLimit({supabaseUrl,serviceKey,bucket:'appointment-phone',subject:phone,limit:3,windowSeconds:86400});
    if(!applyRateLimit(res,phoneRate))return res.status(429).json({error:'Bu telefon numarası için günlük randevu deneme sınırına ulaşıldı.'});
    const reference = makeReference();
    const record = { reference, status:'pending', service:services.join(', '), services, duration_minutes:durationMinutes, vehicle_brand:brand, vehicle_model:model, vehicle_year:year||null, plate:plate||null, requested_date:date, requested_time:time, customer_name:name, customer_phone:phone, customer_email:email||null, notes:clean(body.notes,600)||null, kvkk_consent:true, whatsapp_consent:body.whatsapp_consent===true, source:'website' };
    const insert = await fetch(`${supabaseUrl}/rest/v1/rpc/create_website_appointment`, { method:'POST', headers:{ apikey:serviceKey, Authorization:`Bearer ${serviceKey}`, 'Content-Type':'application/json' }, body:JSON.stringify({ p_record:record }) });
    if (!insert.ok) {
      const failure = await insert.json().catch(() => ({}));
      if (String(failure.message || '').includes('SLOT_UNAVAILABLE')) return res.status(409).json({ error:'Bu saat az önce doldu. Lütfen başka bir saat seçin.', code:'SLOT_UNAVAILABLE' });
      throw new Error(`Supabase appointment RPC failed: ${insert.status}`);
    }
    await Promise.allSettled([notifyOwnerCallMeBot(record), notifyCustomerWhatsApp(record, 'received')]);
    return res.status(201).json({ ok:true, reference, status:'pending' });
  } catch (error) {
    console.error('appointment_create_failed', error.message);
    return res.status(500).json({ error:'Randevu talebi şu anda oluşturulamadı. Lütfen bizi arayın.' });
  }
};

async function getAvailability(req,res,supabaseUrl,serviceKey){
  try{
    const rate=await consumeRateLimit({supabaseUrl,serviceKey,bucket:'appointment-availability',subject:clientIp(req),limit:120,windowSeconds:600});
    if(!applyRateLimit(res,rate))return res.status(429).json({error:'Çok fazla uygunluk sorgusu. Lütfen kısa süre sonra tekrar deneyin.'});
    const date=clean(req.query?.date,10);
    const services=parseServicesQuery(req.query?.services);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!services.length)return res.status(400).json({error:'Tarih ve hizmet seçimi gereklidir.'});
    const day=new Date(`${date}T12:00:00+03:00`);
    if(Number.isNaN(day.getTime())||day.getDay()===0||date<todayYmd()||date>todayYmd(90))return res.status(400).json({error:'Önümüzdeki 90 gün içinde, pazar hariç bir tarih seçin.'});
    const durationMinutes=appointmentDuration(services);
    const query=`requested_date=eq.${encodeURIComponent(date)}&status=neq.cancelled&select=requested_time,duration_minutes&order=requested_time.asc`;
    const response=await fetch(`${supabaseUrl}/rest/v1/appointments?${query}`,{headers:{apikey:serviceKey,Authorization:`Bearer ${serviceKey}`}});
    if(!response.ok)throw new Error(`Supabase availability failed: ${response.status}`);
    const existing=await response.json();
    const available=allowedTimes(durationMinutes).filter(time=>!existing.some(item=>overlaps(time,durationMinutes,String(item.requested_time).slice(0,5),Number(item.duration_minutes)||120)));
    return res.status(200).json({available,duration_minutes:durationMinutes});
  }catch(error){console.error('appointment_availability_failed',error.message);return res.status(500).json({error:'Uygun saatler şu anda alınamadı.'})}
}

function clean(value,max){return String(value||'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().replace(/[<>]/g,'').slice(0,max)}
function normalizeServices(value){const values=Array.isArray(value)?value:[value];return [...new Set(values.map(item=>clean(item,80)).filter(item=>ALLOWED_SERVICES.has(item)))]}
function parseServicesQuery(value){try{return normalizeServices(JSON.parse(String(value||'[]')))}catch{return []}}
function appointmentDuration(services){return services.length===1&&services[0]==='Periyodik Bakım'?60:120}
function allowedTimes(duration){return duration===60?['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00']:['09:00','11:00','13:00','15:00','17:00']}
function overlaps(aStart,aDuration,bStart,bDuration){const toMinutes=value=>{const [h,m]=value.split(':').map(Number);return h*60+m};const a=toMinutes(aStart),b=toMinutes(bStart);return a<b+bDuration&&b<a+aDuration}
function normalizePhone(value){const digits=String(value||'').replace(/\D/g,'').replace(/^90/,'').replace(/^0/,'');return digits.length===10?`+90${digits}`:''}
function validVehicleBrand(brand,customBrand=''){return ALLOWED_BRANDS.has(brand)||(/^[\p{L}\p{N}][\p{L}\p{N} .&'’/-]{1,59}$/u.test(brand)&&customBrand===brand)}
function makeReference(){return `CO-${new Date().getFullYear().toString().slice(-2)}${Math.random().toString(36).slice(2,7).toUpperCase()}`}
function todayYmd(offset=0){const date=new Date();date.setDate(date.getDate()+offset);return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(date)}

module.exports._test={allowedTimes,appointmentDuration,clean,normalizePhone,overlaps,todayYmd,validVehicleBrand};
