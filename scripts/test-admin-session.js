const assert = require('node:assert/strict');
const { COOKIE_NAME, createSession, csrfToken, sameOrigin, verifySession } = require('../lib/admin-auth');
const sessionHandler = require('../api/admin/session');
const appointmentsHandler = require('../api/admin/appointments');

process.env.ADMIN_USERNAME = 'test-admin';
process.env.ADMIN_PASSWORD = 'test-password-with-enough-entropy';
process.env.ADMIN_SESSION_SECRET = 'test-session-secret-with-enough-entropy';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

function response() {
  return { headers:{}, setHeader(name,value){this.headers[name]=value}, status(code){this.statusCode=code;return this}, json(value){this.body=value;return value} };
}

const browserHeaders={
  origin:'https://example.com',host:'example.com','x-forwarded-proto':'https','sec-fetch-site':'same-origin',
  'x-requested-with':'cicek-admin','content-type':'application/json','user-agent':'security-test-agent','x-forwarded-for':'203.0.113.10'
};

(async()=>{
  const token=createSession(process.env.ADMIN_USERNAME,process.env.ADMIN_SESSION_SECRET,browserHeaders['user-agent']);
  const cookie=`${COOKIE_NAME}=${encodeURIComponent(token)}`;
  assert.equal(verifySession(cookie,process.env.ADMIN_USERNAME,process.env.ADMIN_SESSION_SECRET,browserHeaders['user-agent']),true);
  assert.equal(verifySession(cookie,process.env.ADMIN_USERNAME,process.env.ADMIN_SESSION_SECRET,'different-agent'),false);
  assert.equal(verifySession(cookie+'x',process.env.ADMIN_USERNAME,process.env.ADMIN_SESSION_SECRET,browserHeaders['user-agent']),false);
  assert.equal(sameOrigin({headers:browserHeaders}),true);
  assert.equal(sameOrigin({headers:{...browserHeaders,origin:'https://evil.example'}}),false);
  assert.equal(sameOrigin({headers:{...browserHeaders,'sec-fetch-site':'cross-site'}}),false);

  global.fetch=async url=>String(url).includes('consume_api_rate_limit')
    ?{ok:true,json:async()=>({allowed:true,retry_after:900})}
    :{ok:true,json:async()=>[]};

  const loginRes=response();
  await sessionHandler({method:'POST',body:{username:'test-admin',password:'test-password-with-enough-entropy'},headers:browserHeaders},loginRes);
  assert.equal(loginRes.statusCode,200);
  assert.ok(loginRes.body.csrfToken);
  const setCookies=loginRes.headers['Set-Cookie'];
  assert.ok(Array.isArray(setCookies));
  const activeCookie=setCookies.find(value=>value.startsWith(`${COOKIE_NAME}=`)&&!value.includes('Max-Age=0'));
  assert.match(activeCookie,/HttpOnly/);assert.match(activeCookie,/SameSite=Strict/);assert.match(activeCookie,/Priority=High/);
  const sessionCookie=activeCookie.split(';')[0];

  const sessionRes=response();
  await sessionHandler({method:'GET',headers:{cookie:sessionCookie,'user-agent':browserHeaders['user-agent']}},sessionRes);
  assert.equal(sessionRes.statusCode,200);assert.equal(sessionRes.body.csrfToken,csrfToken(sessionCookie,process.env.ADMIN_USERNAME,process.env.ADMIN_SESSION_SECRET,browserHeaders['user-agent']));

  const listRes=response();
  await appointmentsHandler({method:'GET',headers:{cookie:sessionCookie,'user-agent':browserHeaders['user-agent']}},listRes);
  assert.equal(listRes.statusCode,200);assert.deepEqual(listRes.body,{appointments:[],events:[]});

  const csrfRes=response();
  await appointmentsHandler({method:'PATCH',headers:{...browserHeaders,cookie:sessionCookie},body:{id:'123'}},csrfRes);
  assert.equal(csrfRes.statusCode,403);

  const unauthorizedRes=response();
  await appointmentsHandler({method:'GET',headers:{}},unauthorizedRes);
  assert.equal(unauthorizedRes.statusCode,401);
  console.log('admin-session security tests passed');
})().catch(error=>{console.error(error);process.exitCode=1});
