const fs = require('node:fs');
const path = require('node:path');

for (const file of ['index.html', 'hizmetler.html', 'admin.html', '404.html']) {
  const html = fs.readFileSync(file, 'utf8');
  for (const match of html.matchAll(/(?:href|src)="([^"#?]+)(?:[?#][^"]*)?"/g)) {
    const reference = match[1];
    if (/^(?:https?:|tel:|mailto:|data:)/.test(reference)) continue;
    const target = path.resolve(path.dirname(file), reference);
    if (!fs.existsSync(target) && !fs.existsSync(`${target}.html`)) throw new Error(`${file} missing ${reference}`);
  }
}

console.log('local asset and route links ok');
