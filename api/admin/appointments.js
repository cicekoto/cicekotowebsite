const { sameOrigin, verifySession } = require('../../lib/admin-auth');
const { notifyCustomerWhatsApp } = require('../../lib/notifications');

module.exports = async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY,user=process.env.ADMIN_USERNAME,pass=process.env.ADMIN_PASSWORD;
  if(!url||!key||!user||!pass) return res.status(503).json({error:'Yönetim servisi yapılandırılmadı.'});
  if(!verifySession(req.headers.cookie,user,pass)) return res.status(401).json({error:'Yönetici oturumu gerekli.'});
  const headers={apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'};
  try{
    if(req.method==='GET'){
      const response=await fetch(`${url}/rest/v1/appointments?select=*&order=created_at.desc&limit=500`,{headers});
      if(!response.ok) throw new Error(`list ${response.status}`);
      return res.status(200).json({appointments:await response.json()});
    }
    if(req.method==='PATCH'){
      if(!sameOrigin(req)) return res.status(403).json({error:'Güvenlik doğrulaması başarısız.'});
      const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
      if(!body?.id||!['pending','confirmed','rescheduled','completed','cancelled'].includes(body.status)) return res.status(400).json({error:'Geçersiz durum.'});
      const response=await fetch(`${url}/rest/v1/appointments?id=eq.${encodeURIComponent(body.id)}`,{method:'PATCH',headers:{...headers,Prefer:'return=representation'},body:JSON.stringify({status:body.status})});
      if(!response.ok) throw new Error(`update ${response.status}`);
      const appointment=(await response.json())[0];
      if(['confirmed','rescheduled','cancelled'].includes(body.status)) await notifyCustomerWhatsApp(appointment,body.status).catch(()=>false);
      return res.status(200).json({ok:true,appointment});
    }
    return res.status(405).json({error:'Desteklenmeyen metod.'});
  }catch(error){console.error('admin_appointments_failed',error.message);return res.status(500).json({error:'İşlem tamamlanamadı.'})}
};
