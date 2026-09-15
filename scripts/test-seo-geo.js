const assert = require('node:assert/strict');
const fs = require('node:fs');

function page(file) {
  const html = fs.readFileSync(file, 'utf8');
  const structured = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
  return { html, structured };
}

function graphTypes(document) {
  const graph = Array.isArray(document['@graph']) ? document['@graph'] : [document];
  return new Set(graph.flatMap(item => Array.isArray(item['@type']) ? item['@type'] : [item['@type']]).filter(Boolean));
}

for (const [file, canonical] of [
  ['index.html', 'https://www.cicekoto.com.tr/'],
  ['hizmetler.html', 'https://www.cicekoto.com.tr/hizmetler']
]) {
  const { html, structured } = page(file);
  assert.equal((html.match(/<title>/g) || []).length, 1, `${file} must have one title`);
  assert.match(html, /<title>[^<]*Çiçek Oto<\/title>/, `${file} title must use Çiçek Oto`);
  assert.match(html, /<link rel="icon" href="\/img\/favicon-32\.png\?v=4" type="image\/png" sizes="32x32">/, `${file} missing 32px PNG favicon`);
  assert.match(html, /<link rel="icon" href="\/img\/favicon-16\.png\?v=4" type="image\/png" sizes="16x16">/, `${file} missing 16px PNG favicon`);
  assert.match(html, /<link rel="icon" href="\/img\/icon-192\.png\?v=4" type="image\/png" sizes="192x192">/, `${file} missing search-friendly PNG favicon`);
  assert.doesNotMatch(html, /favicon\.(?:svg|ico)/, `${file} must not reference legacy favicons`);
  assert.match(html, /class="header-social"[^>]+href="https:\/\/www\.instagram\.com\/cicekoto\/"/, `${file} missing header Instagram link`);
  assert.match(html, new RegExp(`<link rel="canonical" href="${canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`));
  for (const property of ['og:title', 'og:description', 'og:url', 'og:image', 'og:image:width', 'og:image:height', 'og:image:alt']) {
    assert.ok(html.includes(`property="${property}"`), `${file} missing ${property}`);
  }
  for (const name of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) {
    assert.ok(html.includes(`name="${name}"`), `${file} missing ${name}`);
  }
  assert.ok(structured.length, `${file} missing JSON-LD`);
  const types = graphTypes(structured[0]);
  assert.ok(types.has('AutoRepair'), `${file} missing AutoRepair schema`);
  assert.ok(types.has('WebPage'), `${file} missing WebPage schema`);
  assert.ok(types.has('FAQPage'), `${file} missing FAQPage schema`);
}

for (const file of ['404.html', 'admin.html', 'kvkk.html', 'gizlilik.html', 'kullanim-kosullari.html']) {
  const html = fs.readFileSync(file, 'utf8');
  assert.match(html, /<title>[^<]*Çiçek Oto[^<]*<\/title>/, `${file} title must use Çiçek Oto`);
  assert.match(html, /favicon-32\.png\?v=4/, `${file} missing 32px PNG favicon`);
  assert.match(html, /favicon-16\.png\?v=4/, `${file} missing 16px PNG favicon`);
  assert.match(html, /icon-192\.png\?v=4/, `${file} missing search-friendly PNG favicon`);
  assert.doesNotMatch(html, /favicon\.(?:svg|ico)/, `${file} must not reference legacy favicons`);
}

const homeTypes = graphTypes(page('index.html').structured[0]);
assert.ok(homeTypes.has('WebSite'));
const serviceTypes = graphTypes(page('hizmetler.html').structured[0]);
assert.ok(serviceTypes.has('CollectionPage'));
assert.ok(serviceTypes.has('BreadcrumbList'));
assert.ok(serviceTypes.has('ItemList'));

const robots = fs.readFileSync('robots.txt', 'utf8');
assert.match(robots, /User-agent: OAI-SearchBot\s+Allow: \//);
assert.match(robots, /User-agent: ChatGPT-User\s+Allow: \//);
assert.match(robots, /Disallow: \/api\//);
assert.match(robots, /Sitemap: https:\/\/www\.cicekoto\.com\.tr\/sitemap\.xml/);

const sitemap = fs.readFileSync('sitemap.xml', 'utf8');
assert.match(sitemap, /xmlns:image=/);
assert.match(sitemap, /real-service-diagnostics\.jpg/);
assert.match(sitemap, /real-service-workshop\.jpg/);

const llms = fs.readFileSync('llms.txt', 'utf8');
assert.match(llms, /Çiçek Otomotiv/);
assert.match(llms, /\[Ana sayfa\]\(https:\/\/www\.cicekoto\.com\.tr\/\)/);
assert.match(llms, /\+90 212 549 17 63/);
assert.match(llms, /Randevu formu kesin servis kabulü değil/);
assert.doesNotMatch(llms, /API_KEY|PASSWORD|SECRET|service-role/i);

const indexNowKey = '6af8c0a62d9cddc9e6a4efc12e3c39cc';
assert.equal(fs.readFileSync(`${indexNowKey}.txt`, 'utf8').trim(), indexNowKey);

const config = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const apiHeaders = config.headers.find(item => item.source === '/api/(.*)')?.headers || [];
assert.ok(apiHeaders.some(item => item.key === 'X-Robots-Tag' && /noindex/.test(item.value)));

const main = fs.readFileSync('js/main.js', 'utf8');
assert.doesNotMatch(main, /cicekOtoApts/);

console.log('SEO and GEO tests passed');
