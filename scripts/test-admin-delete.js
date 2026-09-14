const assert = require('node:assert/strict');
const handler = require('../api/admin/appointments');
const { COOKIE_NAME, createSession, csrfToken } = require('../lib/admin-auth');

process.env.ADMIN_USERNAME = 'test-admin';
process.env.ADMIN_PASSWORD = 'test-password-with-enough-entropy';
process.env.ADMIN_SESSION_SECRET = 'test-session-secret-with-enough-entropy';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

function response() {
  return { headers:{}, setHeader(name,value){this.headers[name]=value}, status(code){this.statusCode=code;return this}, json(value){this.body=value;return value} };
}

const userAgent='delete-test-agent';
const token=createSession(process.env.ADMIN_USERNAME,process.env.ADMIN_SESSION_SECRET,userAgent);
const cookie=`${COOKIE_NAME}=${encodeURIComponent(token)}`;
const headers={origin:'https://example.com',host:'example.com','x-forwarded-proto':'https','sec-fetch-site':'same-origin','x-requested-with':'cicek-admin','content-type':'application/json','user-agent':userAgent,'x-forwarded-for':'203.0.113.25',cookie};
headers['x-cicek-csrf']=csrfToken(cookie,process.env.ADMIN_USERNAME,process.env.ADMIN_SESSION_SECRET,userAgent);
const phone='+905551112233';
const records=[
  {id:'11111111-1111-4111-8111-111111111111',customer_name:'Test Müşteri',customer_phone:phone},
  {id:'22222222-2222-4222-8222-222222222222',customer_name:'Test Müşteri',customer_phone:phone}
];

(async()=>{
  let deleteCalls=0;
  global.fetch=async(url,options={})=>{
    if(String(url).includes('consume_api_rate_limit')) return {ok:true,json:async()=>({allowed:true,retry_after:600})};
    if(options.method==='DELETE'){deleteCalls+=1;return {ok:true,json:async()=>records}}
    if(String(url).includes('customer_phone=eq.')) return {ok:true,json:async()=>records};
    return {ok:true,json:async()=>[]};
  };

  const unauthorized=response();
  await handler({method:'DELETE',headers:{},body:{}},unauthorized);
  assert.equal(unauthorized.statusCode,401);

  const noCsrf=response();
  await handler({method:'DELETE',headers:{...headers,'x-cicek-csrf':''},body:{customer_phone:phone,confirmation:`DELETE_CUSTOMER:${phone}`}},noCsrf);
  assert.equal(noCsrf.statusCode,403);

  const noConfirmation=response();
  await handler({method:'DELETE',headers,body:{customer_phone:phone,confirmation:'DELETE_CUSTOMER'}},noConfirmation);
  assert.equal(noConfirmation.statusCode,400);
  assert.equal(deleteCalls,0);

  const success=response();
  await handler({method:'DELETE',headers,body:{customer_phone:'0555 111 22 33',confirmation:`DELETE_CUSTOMER:${phone}`}},success);
  assert.equal(success.statusCode,200);
  assert.equal(success.body.deleted_count,2);
  assert.deepEqual(success.body.deleted_ids,records.map(item=>item.id));
  assert.equal(deleteCalls,1);
  console.log('admin customer delete tests passed');
})().catch(error=>{console.error(error);process.exitCode=1});
