'use strict';

const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
const STATUS_LABELS={pending:'Bekleyen',confirmed:'Onaylandı',rescheduled:'Saat değişti',completed:'Tamamlandı',cancelled:'İptal'};
const STATUS_COLORS={pending:'#f0ab57',confirmed:'#32c5d4',rescheduled:'#6696ff',completed:'#38c990',cancelled:'#d24c5b'};
const EVENT_LABELS={created:'Randevu talebi oluşturuldu',status_changed:'Durum değiştirildi',appointment_updated:'Randevu bilgileri güncellendi'};
const state={rows:[],events:[],activeView:'overview',scheduleDate:todayYmd(),currentId:null,lastLoaded:null,csrfToken:''};

function todayYmd(offset=0){const d=new Date();d.setDate(d.getDate()+offset);return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(d)}
function dateFromYmd(value){const [y,m,d]=String(value).split('-').map(Number);return new Date(y,m-1,d,12)}
function addDays(value,days){const d=dateFromYmd(value);d.setDate(d.getDate()+days);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function longDate(value){return new Intl.DateTimeFormat('tr-TR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(dateFromYmd(value))}
function shortDate(value){return new Intl.DateTimeFormat('tr-TR',{day:'2-digit',month:'short',year:'numeric'}).format(dateFromYmd(value))}
function timeOf(row){return String(row.requested_time||'').slice(0,5)}
function servicesOf(row){return row.services?.length?row.services:String(row.service||'').split(',').map(x=>x.trim()).filter(Boolean)}
function statusChip(status){return `<span class="status-chip ${esc(status)}">${esc(STATUS_LABELS[status]||status)}</span>`}
function initials(name){return String(name||'?').split(/\s+/).slice(0,2).map(x=>x[0]).join('').toLocaleUpperCase('tr-TR')}
function esc(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}
function appointmentStamp(row){return `${row.requested_date}T${timeOf(row)}`}
function activeRows(){return state.rows.filter(row=>row.status!=='cancelled')}
function setSync(mode,text){const el=$('#syncState');el.classList.toggle('loading',mode==='loading');$('span',el).textContent=text}
function showToast(message,type='success'){const item=document.createElement('div');item.className=`toast ${type}`;item.textContent=message;$('#toastRegion').append(item);setTimeout(()=>item.remove(),3600)}

$('#loginForm').addEventListener('submit',async event=>{
  event.preventDefault();const form=event.currentTarget;const data=new FormData(form);const button=$('button[type="submit"]',form);button.disabled=true;$('#loginError').textContent='';
  try{const response=await fetch('/api/admin/session',{method:'POST',headers:{'Content-Type':'application/json','X-Requested-With':'cicek-admin'},body:JSON.stringify({username:data.get('username'),password:data.get('password')})});const result=await response.json().catch(()=>({}));if(!response.ok){$('#loginError').textContent=result.error||(response.status===401?'Kullanıcı adı veya şifre hatalı.':'Yönetim servisine ulaşılamadı.');return}state.csrfToken=result.csrfToken||'';form.reset();if(await loadData())showDashboard()}catch{$('#loginError').textContent='Yönetim servisine ulaşılamadı.'}finally{button.disabled=false}
});

async function loadData(){
  setSync('loading','Güncelleniyor');
  try{
    const response=await fetch('/api/admin/appointments');
    if(response.status===401)return false;
    if(response.status===503){showDashboard();$('#setup').hidden=false;$('#loader').innerHTML='<p>Kurulum bekleniyor.</p>';return true}
    if(!response.ok)throw new Error('Veri alınamadı');
    const result=await response.json();state.rows=result.appointments||[];state.events=result.events||[];state.lastLoaded=new Date();renderAll();setSync('ready','Canlı');return true;
  }catch(error){setSync('error','Bağlantı hatası');showToast('Randevu verileri alınamadı.','error');return false}
}

function showDashboard(){$('#login').hidden=true;$('#dashboard').hidden=false;document.body.classList.add('authenticated')}
function renderAll(){renderMetrics();renderOverview();renderSchedule();renderTable();renderSidebar();if(state.currentId)openDrawer(state.currentId,false);$('#lastUpdated').textContent=`Son güncelleme ${state.lastLoaded?.toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})||''}`}

function renderMetrics(){
  const today=todayYmd(),weekEnd=addDays(today,6),now=new Date(),month=now.getMonth(),year=now.getFullYear();
  const todayRows=activeRows().filter(row=>row.requested_date===today),pending=state.rows.filter(row=>row.status==='pending');
  const week=activeRows().filter(row=>row.requested_date>=today&&row.requested_date<=weekEnd);
  const monthRows=state.rows.filter(row=>{const d=dateFromYmd(row.requested_date);return d.getMonth()===month&&d.getFullYear()===year&&row.status!=='cancelled'});
  const completed=monthRows.filter(row=>row.status==='completed').length,rate=monthRows.length?Math.round(completed/monthRows.length*100):0;
  $('#metricToday').textContent=todayRows.length;$('#metricTodayText').textContent=todayRows.length?`${todayRows.reduce((sum,row)=>sum+(Number(row.duration_minutes)||120),0)/60} saat planlandı`:'Planlanmış iş yok';
  $('#metricPending').textContent=pending.length;$('#metricPendingText').textContent=pending.length?`${pending.filter(row=>row.requested_date<=today).length} acil yanıt`:'Yeni talep yok';
  $('#metricWeek').textContent=week.length;$('#metricWeekText').textContent=`${week.reduce((sum,row)=>sum+(Number(row.duration_minutes)||120),0)/60} saat iş yükü`;
  $('#metricCompletion').textContent=`${rate}%`;$('#metricCompletionText').textContent=`Bu ay ${completed} iş tamamlandı`;$('#metricTotal').textContent=state.rows.length;
  $('#navTodayCount').textContent=todayRows.length;$('#navPendingCount').textContent=pending.length;
}

function renderSidebar(){const rows=activeRows().filter(row=>row.requested_date===todayYmd()),minutes=rows.reduce((sum,row)=>sum+(Number(row.duration_minutes)||120),0),hours=minutes/60;$('#sidebarHours').textContent=`${hours} saat`;$('#sidebarProgress').style.width=`${Math.min(100,Math.round(minutes/480*100))}%`;$('#sidebarLoadText').textContent=rows.length?`${rows.length} araç planlandı`:'Bugün plan boş'}

function renderOverview(){
  const todayRows=activeRows().filter(row=>row.requested_date===todayYmd()).sort((a,b)=>timeOf(a).localeCompare(timeOf(b)));
  $('#overviewSchedule').innerHTML=todayRows.length?todayRows.slice(0,6).map(row=>`<button class="compact-row plain-button" data-open="${esc(row.id)}" type="button"><time>${esc(timeOf(row))}</time><i class="${esc(row.status)}"></i><span><strong>${esc(row.customer_name)}</strong><small>${esc(row.vehicle_brand)} ${esc(row.vehicle_model)} · ${esc(servicesOf(row).join(', '))}</small></span>${statusChip(row.status)}</button>`).join(''):'<div class="empty-mini">Bugün için planlanmış randevu bulunmuyor.</div>';
  const pending=state.rows.filter(row=>row.status==='pending').sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));$('#pendingBadge').textContent=pending.length;
  $('#pendingList').innerHTML=pending.length?pending.slice(0,6).map(row=>`<button class="request-item plain-button" data-open="${esc(row.id)}" type="button"><span class="avatar">${esc(initials(row.customer_name))}</span><span><strong>${esc(row.customer_name)}</strong><small>${esc(row.reference)} · ${esc(shortDate(row.requested_date))} ${esc(timeOf(row))}</small></span><time>${esc(relativeTime(row.created_at))}</time></button>`).join(''):'<div class="empty-mini">Yanıt bekleyen yeni talep yok.</div>';
  renderStatusAnalytics();renderServiceBars();renderCustomerInsights();bindOpenButtons();
}

function renderStatusAnalytics(){
  const entries=Object.keys(STATUS_LABELS).map(status=>[status,state.rows.filter(row=>row.status===status).length]);const total=Math.max(1,state.rows.length);let cursor=0;const stops=[];
  entries.forEach(([status,count])=>{const next=cursor+count/total*100;stops.push(`${STATUS_COLORS[status]} ${cursor}% ${next}%`);cursor=next});if(!state.rows.length)stops.push('var(--surface-3) 0 100%');
  $('#statusDonut').style.background=`conic-gradient(${stops.join(',')})`;$('#donutTotal').textContent=state.rows.length;
  $('#statusLegend').innerHTML=entries.map(([status,count])=>`<div class="legend-row"><i style="background:${STATUS_COLORS[status]}"></i><span>${STATUS_LABELS[status]}</span><b>${count}</b></div>`).join('');
}
function renderServiceBars(){const counts={};state.rows.forEach(row=>servicesOf(row).forEach(service=>counts[service]=(counts[service]||0)+1));const entries=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5),max=entries[0]?.[1]||1;$('#serviceBars').innerHTML=entries.length?entries.map(([service,count])=>`<div class="service-row"><span>${esc(service)}</span><b>${count}</b><div><i style="width:${Math.round(count/max*100)}%"></i></div></div>`).join(''):'<div class="empty-mini">Hizmet verisi bulunmuyor.</div>'}
function renderCustomerInsights(){const phones=new Map();state.rows.forEach(row=>{const phone=String(row.customer_phone||'').replace(/\D/g,'');if(phone)phones.set(phone,(phones.get(phone)||0)+1)});const unique=phones.size,returning=[...phones.values()].filter(count=>count>1).length,optIn=state.rows.length?Math.round(state.rows.filter(row=>row.whatsapp_consent).length/state.rows.length*100):0,average=state.rows.length?Math.round(state.rows.reduce((sum,row)=>sum+(Number(row.duration_minutes)||120),0)/state.rows.length):0;$('#uniqueCustomers').textContent=unique;$('#returningCustomers').textContent=returning;$('#whatsappOptIn').textContent=`${optIn}%`;$('#averageDuration').textContent=`${average} dk`}

function renderSchedule(){
  $('#scheduleDate').value=state.scheduleDate;$('#scheduleDateLong').textContent=capitalize(longDate(state.scheduleDate));
  const rows=state.rows.filter(row=>row.requested_date===state.scheduleDate).sort((a,b)=>timeOf(a).localeCompare(timeOf(b))),active=rows.filter(row=>row.status!=='cancelled'),minutes=active.reduce((sum,row)=>sum+(Number(row.duration_minutes)||120),0);
  $('#scheduleSummary').innerHTML=[['Toplam araç',rows.length],['Planlanan süre',`${minutes/60} saat`],['Bekleyen',rows.filter(row=>row.status==='pending').length],['Tamamlanan',rows.filter(row=>row.status==='completed').length]].map(([label,value])=>`<div class="summary-card"><span>${label}</span><b>${value}</b></div>`).join('');
  const times=['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
  $('#timeline').innerHTML=times.map(time=>{const slot=rows.filter(row=>timeOf(row)===time);return `<div class="time-slot"><time class="time-label">${time}</time><div class="slot-content">${slot.length?slot.map(row=>`<button class="schedule-card ${esc(row.status)} plain-button" data-open="${esc(row.id)}" type="button"><span><strong>${esc(row.customer_name)} · ${esc(row.plate||row.reference)}</strong><small>${esc(row.vehicle_brand)} ${esc(row.vehicle_model)} · ${esc(servicesOf(row).join(', '))}</small></span><time>${Number(row.duration_minutes)||120} dk</time></button>`).join(''):'<span class="slot-empty">Uygun zaman</span>'}</div></div>`}).join('');bindOpenButtons();
}

function filteredRows(){
  const q=$('#tableSearch').value.trim().toLocaleLowerCase('tr-TR'),status=$('#statusFilter').value,dateFilter=$('#dateFilter').value,today=todayYmd(),tomorrow=todayYmd(1),weekEnd=addDays(today,6);
  const data=state.rows.filter(row=>{const haystack=[row.reference,row.customer_name,row.customer_phone,row.customer_email,row.plate,row.vehicle_brand,row.vehicle_model,row.vehicle_year,...servicesOf(row)].join(' ').toLocaleLowerCase('tr-TR');let dateOk=true;if(dateFilter==='today')dateOk=row.requested_date===today;if(dateFilter==='tomorrow')dateOk=row.requested_date===tomorrow;if(dateFilter==='week')dateOk=row.requested_date>=today&&row.requested_date<=weekEnd;if(dateFilter==='past')dateOk=row.requested_date<today;return(!q||haystack.includes(q))&&(!status||row.status===status)&&dateOk});
  const sort=$('#sortFilter').value;return data.sort((a,b)=>sort==='newest'?new Date(b.created_at)-new Date(a.created_at):sort==='customer'?a.customer_name.localeCompare(b.customer_name,'tr'):appointmentStamp(a).localeCompare(appointmentStamp(b)));
}
function renderTable(){
  const data=filteredRows(),table=$('#appointmentsTable'),empty=$('#tableEmpty');$('#loader').hidden=true;table.hidden=!data.length;empty.hidden=!!data.length;$('#resultCount').textContent=`${data.length} kayıt`;
  $('tbody',table).innerHTML=data.map(row=>`<tr data-open="${esc(row.id)}" tabindex="0"><td><span class="cell-main">${esc(row.reference)}</span><span class="cell-sub">${esc(relativeTime(row.created_at))}</span></td><td><span class="cell-main">${esc(row.customer_name)}</span><span class="cell-sub">${esc(row.customer_phone)}</span></td><td><div class="vehicle-cell"><span class="brand-mark">${esc(String(row.vehicle_brand||'—').slice(0,2).toUpperCase())}</span><span><span class="cell-main">${esc(row.vehicle_brand)} ${esc(row.vehicle_model)}</span><span class="cell-sub">${esc(row.plate||'Plaka belirtilmedi')}</span></span></div></td><td><div class="service-tags">${servicesOf(row).slice(0,3).map(service=>`<span class="service-tag">${esc(service)}</span>`).join('')}${servicesOf(row).length>3?`<span class="service-tag">+${servicesOf(row).length-3}</span>`:''}</div></td><td><span class="cell-main">${esc(shortDate(row.requested_date))}</span><span class="cell-sub">${esc(timeOf(row))} · ${Number(row.duration_minutes)||120} dk</span></td><td>${statusChip(row.status)}</td><td><button class="row-action" data-open="${esc(row.id)}" aria-label="Ayrıntıyı aç" type="button">→</button></td></tr>`).join('');
  bindOpenButtons();$$('tbody tr',table).forEach(row=>row.addEventListener('keydown',event=>{if(event.key==='Enter')openDrawer(row.dataset.open)}));
}

function bindOpenButtons(){$$('[data-open]').forEach(button=>{if(button.dataset.bound)return;button.dataset.bound='1';button.addEventListener('click',event=>{event.stopPropagation();openDrawer(button.dataset.open)})})}
function openDrawer(id,focus=true){
  const row=state.rows.find(item=>item.id===id);if(!row)return;state.currentId=id;const layer=$('#drawerLayer');layer.hidden=false;document.body.style.overflow='hidden';$('#drawerTitle').textContent=row.reference;
  const phoneDigits=String(row.customer_phone||'').replace(/\D/g,''),waText=encodeURIComponent(`Merhaba ${row.customer_name}, ${row.reference} kodlu Çiçek Oto randevunuz hakkında yazıyoruz.`),times=allowedTimes(Number(row.duration_minutes)||120);
  $('#drawerContent').innerHTML=`
    <section class="drawer-hero"><div><span class="cell-sub">${esc(shortDate(row.requested_date))} · ${esc(timeOf(row))}</span><h3>${esc(row.customer_name)}</h3><p>${esc(row.vehicle_brand)} ${esc(row.vehicle_model)} ${row.vehicle_year?`· ${esc(row.vehicle_year)}`:''} · ${esc(row.plate||'Plaka belirtilmedi')}</p></div>${statusChip(row.status)}</section>
    <section class="drawer-section"><h4>Müşteri iletişimi</h4><div class="contact-actions"><a href="tel:${phoneDigits}"><b>☎</b>Hemen ara</a><a href="https://wa.me/${phoneDigits}?text=${waText}" target="_blank" rel="noopener"><b>◉</b>WhatsApp</a>${row.customer_email?`<a href="mailto:${esc(row.customer_email)}"><b>@</b>E-posta</a>`:'<button type="button" disabled><b>@</b>E-posta yok</button>'}<button type="button" id="copySummary"><b>□</b>Bilgiyi kopyala</button></div></section>
    <section class="drawer-section"><h4>Araç ve hizmet</h4><div class="info-grid"><div class="info-box"><span>Araç</span><b>${esc(row.vehicle_brand)} ${esc(row.vehicle_model)}</b></div><div class="info-box"><span>Plaka</span><b>${esc(row.plate||'—')}</b></div><div class="info-box"><span>Model yılı</span><b>${esc(row.vehicle_year||'—')}</b></div><div class="info-box"><span>Tahmini süre</span><b>${Number(row.duration_minutes)||120} dakika</b></div></div><div class="drawer-services">${servicesOf(row).map(service=>`<span class="service-tag">${esc(service)}</span>`).join('')}</div><div class="consent-line"><span class="${row.kvkk_consent?'yes':''}">KVKK ${row.kvkk_consent?'✓':'—'}</span><span class="${row.whatsapp_consent?'yes':''}">WhatsApp bildirimi ${row.whatsapp_consent?'✓':'—'}</span><span>Kaynak: ${esc(row.source||'website')}</span></div></section>
    <section class="drawer-section"><h4>Randevuyu yönet</h4><form class="drawer-form" id="appointmentForm"><label><span>Durum</span><select name="status">${Object.entries(STATUS_LABELS).map(([value,label])=>`<option value="${value}" ${row.status===value?'selected':''}>${label}</option>`).join('')}</select></label><label><span>Tarih</span><input type="date" name="requested_date" value="${esc(row.requested_date)}" required></label><label><span>Saat</span><select name="requested_time">${times.map(time=>`<option value="${time}" ${timeOf(row)===time?'selected':''}>${time}</option>`).join('')}</select></label><label><span>Süre</span><input value="${Number(row.duration_minutes)||120} dakika" disabled></label><label class="wide"><span>Servis notu</span><textarea name="notes" maxlength="600" placeholder="Müşteri talebi veya servis iç notu">${esc(row.notes||'')}</textarea></label><div class="save-row"><button class="button primary" type="submit">Değişiklikleri kaydet <span>→</span></button></div></form><div class="quick-status"><button class="button secondary" data-quick-status="confirmed" type="button">Randevuyu onayla</button><button class="button success" data-quick-status="completed" type="button">İşi tamamlandı yap</button><button class="button danger" data-quick-status="cancelled" type="button">Randevuyu iptal et</button></div></section>
    <section class="drawer-section"><h4>İşlem geçmişi</h4><div class="event-list">${renderEvents(row)}</div></section>`;
  $('#appointmentForm').addEventListener('submit',event=>{event.preventDefault();const data=Object.fromEntries(new FormData(event.currentTarget));updateAppointment(row.id,data,event.currentTarget.querySelector('button[type="submit"]'))});
  $$('[data-quick-status]',$('#drawerContent')).forEach(button=>button.addEventListener('click',()=>updateAppointment(row.id,{status:button.dataset.quickStatus},button)));
  $('#copySummary').addEventListener('click',()=>copySummary(row));if(focus)setTimeout(()=>$('#closeDrawer').focus(),30);
}
function closeDrawer(){$('#drawerLayer').hidden=true;document.body.style.overflow='';state.currentId=null}
function renderEvents(row){const events=state.events.filter(event=>event.appointment_id===row.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));if(!events.length)events.push({event_type:'created',created_at:row.created_at,metadata:{}});return events.map(event=>{let detail='';const meta=event.metadata||{};if(event.event_type==='status_changed')detail=`${STATUS_LABELS[meta.from]||meta.from||'—'} → ${STATUS_LABELS[meta.to]||meta.to||'—'}`;if(event.event_type==='appointment_updated')detail=[meta.requested_date&&shortDate(meta.requested_date),meta.requested_time,meta.notes_changed?'Not güncellendi':''].filter(Boolean).join(' · ');return `<div class="event"><strong>${esc(EVENT_LABELS[event.event_type]||'Randevu güncellendi')}</strong><span>${esc(detail||new Date(event.created_at).toLocaleString('tr-TR'))}</span><span>${esc(relativeTime(event.created_at))}</span></div>`}).join('')}

async function updateAppointment(id,changes,button){
  const original=state.rows.find(row=>row.id===id);if(!original)return;button.disabled=true;
  try{const response=await fetch('/api/admin/appointments',{method:'PATCH',headers:{'Content-Type':'application/json','X-Requested-With':'cicek-admin','X-Cicek-CSRF':state.csrfToken},body:JSON.stringify({id,...changes})});const result=await response.json().catch(()=>({}));if(!response.ok)throw new Error(result.error||'Randevu güncellenemedi.');const index=state.rows.findIndex(row=>row.id===id);state.rows[index]=result.appointment;if(result.event)state.events.unshift(result.event);renderAll();showToast('Randevu başarıyla güncellendi.')}catch(error){showToast(error.message,'error')}finally{button.disabled=false}
}

function renderQuickSearch(){const value=$('#globalSearch').value;$('#tableSearch').value=value;switchView('appointments');renderTable();$('#tableSearch').focus()}
function switchView(view){state.activeView=view;$$('[data-view-panel]').forEach(panel=>panel.classList.toggle('active',panel.dataset.viewPanel===view));$$('[data-view]').forEach(button=>button.classList.toggle('active',button.dataset.view===view));closeMenu();if(view==='schedule')renderSchedule();if(view==='appointments')renderTable();window.scrollTo({top:0,behavior:'smooth'})}
function toggleMenu(open){$('#sidebar').classList.toggle('open',open);$('#sidebarScrim').classList.toggle('open',open);$('#menuButton').setAttribute('aria-expanded',String(open))}
function closeMenu(){toggleMenu(false)}
function relativeTime(value){const diff=Date.now()-new Date(value).getTime(),minutes=Math.floor(diff/60000);if(minutes<1)return'Şimdi';if(minutes<60)return`${minutes} dk önce`;const hours=Math.floor(minutes/60);if(hours<24)return`${hours} sa önce`;const days=Math.floor(hours/24);return days<30?`${days} gün önce`:new Date(value).toLocaleDateString('tr-TR')}
function capitalize(value){return value.charAt(0).toLocaleUpperCase('tr-TR')+value.slice(1)}
function allowedTimes(duration){return duration===60?['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00']:['09:00','11:00','13:00','15:00','17:00']}
async function copySummary(row){const summary=`${row.reference} | ${row.customer_name} | ${row.customer_phone} | ${row.vehicle_brand} ${row.vehicle_model} ${row.plate||''} | ${servicesOf(row).join(', ')} | ${shortDate(row.requested_date)} ${timeOf(row)} | ${STATUS_LABELS[row.status]}`;try{await navigator.clipboard.writeText(summary);showToast('Randevu bilgileri kopyalandı.')}catch{showToast('Bilgiler kopyalanamadı.','error')}}
function csvCell(value){let text=String(value||'').replace(/[\r\n]+/g,' ');if(/^\s*[=+\-@＝＋－＠]/.test(text)||/^[\t\r\n]/.test(text))text=`\t${text}`;return `"${text.replace(/"/g,'""')}"`}
function exportCsv(){const data=filteredRows(),head=['Kod','Ad Soyad','Telefon','E-posta','Araç','Model Yılı','Plaka','Hizmetler','Tarih','Saat','Süre','Durum','Not'];const values=data.map(row=>[row.reference,row.customer_name,row.customer_phone,row.customer_email,`${row.vehicle_brand} ${row.vehicle_model}`,row.vehicle_year,row.plate,servicesOf(row).join(' · '),row.requested_date,timeOf(row),row.duration_minutes,STATUS_LABELS[row.status],row.notes]);const csv='\ufeff'+[head,...values].map(cols=>cols.map(csvCell).join(',')).join('\n');const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));link.download=`cicek-oto-randevular-${todayYmd()}.csv`;link.click();URL.revokeObjectURL(link.href);showToast(`${data.length} kayıt CSV olarak hazırlandı.`)}
function downloadBlob(content,type,name){const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([content],{type}));link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),0)}
function exportJson(){const data={exported_at:new Date().toISOString(),appointment_count:state.rows.length,appointments:state.rows,events:state.events};downloadBlob(JSON.stringify(data,null,2),'application/json;charset=utf-8',`cicek-oto-yedek-${todayYmd()}.json`);showToast(`${state.rows.length} randevu JSON yedeğine eklendi.`)}
async function copySchedule(){const rows=state.rows.filter(row=>row.requested_date===state.scheduleDate).sort((a,b)=>timeOf(a).localeCompare(timeOf(b)));const lines=[`ÇİÇEK OTO · ${capitalize(longDate(state.scheduleDate))}`,`${rows.length} araç`,...rows.map(row=>`${timeOf(row)} · ${row.customer_name} · ${row.vehicle_brand} ${row.vehicle_model} ${row.plate||''} · ${servicesOf(row).join(', ')} · ${STATUS_LABELS[row.status]||row.status}`)];try{await navigator.clipboard.writeText(lines.join('\n'));showToast('Günlük servis özeti kopyalandı.')}catch{showToast('Günlük özet kopyalanamadı.','error')}}

$$('[data-view]').forEach(button=>button.addEventListener('click',()=>switchView(button.dataset.view)));$$('[data-go]').forEach(button=>button.addEventListener('click',()=>switchView(button.dataset.go)));
$('#refresh').addEventListener('click',loadData);$('#logout').addEventListener('click',async()=>{await fetch('/api/admin/session',{method:'DELETE',headers:{'X-Requested-With':'cicek-admin','X-Cicek-CSRF':state.csrfToken}}).catch(()=>{});location.reload()});
$('#menuButton').addEventListener('click',()=>toggleMenu(!$('#sidebar').classList.contains('open')));$('#sidebarScrim').addEventListener('click',closeMenu);
$('#themeToggle').addEventListener('click',()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;localStorage.setItem('cicek-admin-theme',next)});
$('#globalSearch').addEventListener('keydown',event=>{if(event.key==='Enter')renderQuickSearch()});document.addEventListener('keydown',event=>{if(event.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){event.preventDefault();$('#globalSearch').focus()}if(event.key==='Escape'){if(!$('#drawerLayer').hidden)closeDrawer();else closeMenu()}});
['tableSearch','statusFilter','dateFilter','sortFilter'].forEach(id=>$('#'+id).addEventListener(id==='tableSearch'?'input':'change',renderTable));
$('#clearFilters').addEventListener('click',()=>{$('#tableSearch').value='';$('#statusFilter').value='';$('#dateFilter').value='';$('#sortFilter').value='appointmentAsc';renderTable()});$('#exportCsv').addEventListener('click',exportCsv);$('#exportJson').addEventListener('click',exportJson);
$('#scheduleDate').addEventListener('change',event=>{state.scheduleDate=event.target.value;renderSchedule()});$('#prevDay').addEventListener('click',()=>{state.scheduleDate=addDays(state.scheduleDate,-1);renderSchedule()});$('#nextDay').addEventListener('click',()=>{state.scheduleDate=addDays(state.scheduleDate,1);renderSchedule()});$('#todayShortcut').addEventListener('click',()=>{state.scheduleDate=todayYmd();renderSchedule()});$('#printSchedule').addEventListener('click',()=>window.print());$('#copySchedule').addEventListener('click',copySchedule);
$('#drawerBackdrop').addEventListener('click',closeDrawer);$('#closeDrawer').addEventListener('click',closeDrawer);

const savedTheme=localStorage.getItem('cicek-admin-theme');if(savedTheme)document.documentElement.dataset.theme=savedTheme;$('#todayLabel').textContent=capitalize(new Intl.DateTimeFormat('tr-TR',{weekday:'long',day:'numeric',month:'long'}).format(new Date())).toLocaleUpperCase('tr-TR');
async function bootstrap(){try{const response=await fetch('/api/admin/session');if(!response.ok)return;const result=await response.json();state.csrfToken=result.csrfToken||'';if(state.csrfToken&&await loadData())showDashboard()}catch{}}
bootstrap();
