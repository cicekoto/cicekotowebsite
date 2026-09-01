const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const {consumeMemory}=require('../lib/rate-limit');

const config=JSON.parse(fs.readFileSync('vercel.json','utf8'));
const headers=config.headers.find(item=>item.source==='/(.*)').headers;
const byName=Object.fromEntries(headers.map(item=>[item.key,item.value]));
assert.equal(byName['X-Frame-Options'],'DENY');
assert.equal(byName['Cross-Origin-Opener-Policy'],'same-origin');
assert.match(byName['Content-Security-Policy'],/frame-ancestors 'none'/);
assert.match(byName['Content-Security-Policy'],/script-src-attr 'none'/);
assert.doesNotMatch(byName['Content-Security-Policy'],/script-src[^;]*'unsafe-inline'/);

for(const file of ['index.html','hizmetler.html']){
  const html=fs.readFileSync(file,'utf8');
  for(const match of html.matchAll(/<script(?: [^>]*)?>([\s\S]*?)<\/script>/g)){
    if(!match[1])continue;
    const hash=crypto.createHash('sha256').update(match[1]).digest('base64');
    assert.ok(byName['Content-Security-Policy'].includes(`'sha256-${hash}'`),`${file} inline script hash missing`);
  }
}

assert.equal(consumeMemory('security-test',2,60,1000).allowed,true);
assert.equal(consumeMemory('security-test',2,60,1000).allowed,true);
assert.equal(consumeMemory('security-test',2,60,1000).allowed,false);
const worker=fs.readFileSync('sw.js','utf8');
assert.match(worker,/requestUrl\.pathname === '\/admin'/);
assert.match(worker,/pathname\.startsWith\('\/api\/'\)/);
const admin=fs.readFileSync('js/admin.js','utf8');
assert.match(admin,/X-Cicek-CSRF/);
assert.match(admin,/function csvCell/);
console.log('security hardening tests passed');
