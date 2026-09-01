const { isAdminRequest, verifyCsrf, verifySession } = require('../../lib/admin-auth');
const { notifyCustomerWhatsApp } = require('../../lib/notifications');
const { applyRateLimit, clientIp, consumeRateLimit } = require('../../lib/rate-limit');

const ALLOWED_STATUSES = new Set(['pending','confirmed','rescheduled','completed','cancelled']);

module.exports = async function handler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('Pragma','no-cache');
  res.setHeader('Vary','Cookie');
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY,user=process.env.ADMIN_USERNAME,pass=process.env.ADMIN_PASSWORD;
  const secret=process.env.ADMIN_SESSION_SECRET||pass;
  if(!url||!key||!user||!pass||pass.length<14||!secret||secret.length<14) return res.status(503).json({error:'Yönetim güvenlik yapılandırması eksik.'});
  if(!verifySession(req.headers.cookie,user,secret,req.headers['user-agent']||'')) return res.status(401).json({error:'Yönetici oturumu gerekli.'});
  const headers={apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'};
  try{
    if(req.method==='GET') return listAppointments(res,url,headers);
    if(req.method==='PATCH'){
      if(!isAdminRequest(req)||!verifyCsrf(req,user,secret)) return res.status(403).json({error:'Güvenlik doğrulaması başarısız.'});
      if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json')) return res.status(415).json({error:'JSON içerik türü gereklidir.'});
      if(Number(req.headers['content-length']||0)>8192) return res.status(413).json({error:'İstek çok büyük.'});
      const rate=await consumeRateLimit({supabaseUrl:url,serviceKey:key,bucket:'admin-write',subject:clientIp(req),limit:80,windowSeconds:600});
      if(!applyRateLimit(res,rate)) return res.status(429).json({error:'Çok fazla yönetim işlemi. Lütfen kısa süre sonra tekrar deneyin.'});
      let body;try{body=typeof req.body==='string'?JSON.parse(req.body):req.body}catch{return res.status(400).json({error:'Geçersiz istek.'})}
      return updateAppointment(res,url,headers,body||{});
    }
    return res.status(405).json({error:'Desteklenmeyen metod.'});
  }catch(error){console.error('admin_appointments_failed',error.message);return res.status(500).json({error:'İşlem tamamlanamadı.'})}
};

async function listAppointments(res,url,headers){
  const [appointmentResponse,eventResponse]=await Promise.all([
    fetch(`${url}/rest/v1/appointments?select=*&order=requested_date.asc,requested_time.asc&limit=1000`,{headers}),
    fetch(`${url}/rest/v1/appointment_events?select=id,appointment_id,event_type,metadata,created_at&order=created_at.desc&limit=2500`,{headers})
  ]);
  if(!appointmentResponse.ok) throw new Error(`list ${appointmentResponse.status}`);
  const appointments=await appointmentResponse.json();
  const events=eventResponse.ok?await eventResponse.json():[];
  return res.status(200).json({appointments,events});
}

async function updateAppointment(res,url,headers,body){
  if(!body||Array.isArray(body)||typeof body!=='object'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(body.id||''))) return res.status(400).json({error:'Geçerli bir randevu kimliği gereklidir.'});
  const currentResponse=await fetch(`${url}/rest/v1/appointments?id=eq.${encodeURIComponent(body.id)}&select=*&limit=1`,{headers});
  if(!currentResponse.ok) throw new Error(`read ${currentResponse.status}`);
  const current=(await currentResponse.json())[0];
  if(!current) return res.status(404).json({error:'Randevu bulunamadı.'});

  const patch={};
  if(body.status!==undefined){if(!ALLOWED_STATUSES.has(body.status))return res.status(400).json({error:'Geçersiz durum.'});patch.status=body.status}
  if(body.notes!==undefined)patch.notes=clean(body.notes,600)||null;
  const requestedDate=body.requested_date===undefined?current.requested_date:clean(body.requested_date,10);
  const requestedTime=body.requested_time===undefined?String(current.requested_time).slice(0,5):clean(body.requested_time,5);
  const scheduleChanged=requestedDate!==current.requested_date||requestedTime!==String(current.requested_time).slice(0,5);

  if(scheduleChanged){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)||!/^\d{2}:\d{2}$/.test(requestedTime))return res.status(400).json({error:'Geçerli bir tarih ve saat seçin.'});
    const day=new Date(`${requestedDate}T12:00:00+03:00`);
    if(Number.isNaN(day.getTime())||day.getDay()===0||requestedDate<todayYmd()||requestedDate>todayYmd(120))return res.status(400).json({error:'Bugünden sonraki 120 gün içinde, pazar hariç bir tarih seçin.'});
    const duration=Number(current.duration_minutes)||120;
    if(!allowedTimes(duration).includes(requestedTime))return res.status(400).json({error:'Seçilen süre için 09.00–17.00 arasında geçerli bir başlangıç saati seçin.'});
    const conflictQuery=`requested_date=eq.${encodeURIComponent(requestedDate)}&status=neq.cancelled&id=neq.${encodeURIComponent(body.id)}&select=requested_time,duration_minutes`;
    const conflictResponse=await fetch(`${url}/rest/v1/appointments?${conflictQuery}`,{headers});
    if(!conflictResponse.ok)throw new Error(`availability ${conflictResponse.status}`);
    const conflicts=await conflictResponse.json();
    if(conflicts.some(item=>overlaps(requestedTime,duration,String(item.requested_time).slice(0,5),Number(item.duration_minutes)||120)))return res.status(409).json({error:'Bu saat başka bir randevuyla çakışıyor. Lütfen farklı bir saat seçin.'});
    patch.requested_date=requestedDate;patch.requested_time=requestedTime;patch.status='rescheduled';
  }
  if(!Object.keys(patch).length)return res.status(400).json({error:'Güncellenecek bir alan bulunamadı.'});

  const response=await fetch(`${url}/rest/v1/appointments?id=eq.${encodeURIComponent(body.id)}`,{method:'PATCH',headers:{...headers,Prefer:'return=representation'},body:JSON.stringify(patch)});
  if(!response.ok)throw new Error(`update ${response.status}`);
  const appointment=(await response.json())[0];
  let event=null;
  if(scheduleChanged||body.notes!==undefined){
    const metadata={};if(scheduleChanged){metadata.requested_date=requestedDate;metadata.requested_time=requestedTime}if(body.notes!==undefined)metadata.notes_changed=true;
    const eventResponse=await fetch(`${url}/rest/v1/appointment_events`,{method:'POST',headers:{...headers,Prefer:'return=representation'},body:JSON.stringify({appointment_id:body.id,event_type:'appointment_updated',metadata})});
    if(eventResponse.ok)event=(await eventResponse.json())[0]||null;
  }
  const statusChanged=body.status!==undefined&&body.status!==current.status;
  if((statusChanged||scheduleChanged)&&['confirmed','rescheduled','cancelled'].includes(appointment.status))await notifyCustomerWhatsApp(appointment,appointment.status).catch(()=>false);
  return res.status(200).json({ok:true,appointment,event});
}

function clean(value,max){return String(value||'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().replace(/[<>]/g,'').slice(0,max)}
function todayYmd(offset=0){const date=new Date();date.setDate(date.getDate()+offset);return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(date)}
function allowedTimes(duration){return duration===60?['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00']:['09:00','11:00','13:00','15:00','17:00']}
function overlaps(aStart,aDuration,bStart,bDuration){const toMinutes=value=>{const [h,m]=value.split(':').map(Number);return h*60+m};const a=toMinutes(aStart),b=toMinutes(bStart);return a<b+bDuration&&b<a+aDuration}

module.exports._test={allowedTimes,overlaps,clean,todayYmd};
