const fs = require('fs');
const path = require('path');

const requiredFiles = [
  path.join('dist', 'index.html'),
  path.join('dist', 'en', 'index.html'),
  path.join('dist', '.htaccess'),
  path.join('dist', 'robots.txt'),
  path.join('dist', 'sitemap.xml'),
  path.join('dist', 'assets', 'logo.svg'),
  path.join('dist', 'assets', 'og-image.png'),
  path.join('dist', 'assets', 'fonts', 'NeueMontreal-Regular.woff2'),
  path.join('dist', 'assets', 'fonts', 'NeueMontreal-Medium.woff2'),
  path.join('dist', 'assets', 'fonts', 'NeueMontreal-Bold.woff2')
];

const contentChecks = [
  {
    file: path.join('dist', 'index.html'),
    checks: [
      '<html lang="fr">',
      '<div class="info">',
      '<h1>',
      '<link rel="canonical" href="https://www.studiotl.fr/"',
      'hreflang="fr"',
      'hreflang="en"',
      'application/ld+json'
    ]
  },
  {
    file: path.join('dist', 'en', 'index.html'),
    checks: [
      '<html lang="en">',
      '<div class="info">',
      '<h1>',
      '<link rel="canonical" href="https://www.studiotl.fr/en/"',
      'hreflang="fr"',
      'hreflang="en"',
      'Handcrafted digital'
    ]
  },
  {
    file: path.join('dist', '.htaccess'),
    checks: ['RewriteCond %{HTTPS} off']
  },
  {
    file: path.join('dist', 'robots.txt'),
    checks: ['Sitemap: https://www.studiotl.fr/sitemap.xml']
  },
  {
    file: path.join('dist', 'sitemap.xml'),
    checks: [
      '<loc>https://www.studiotl.fr/</loc>',
      '<loc>https://www.studiotl.fr/en/</loc>'
    ]
  }
];

const errors = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    errors.push('Missing file: ' + file);
  }
}

function hasDsStore(dir) {
  if (!fs.existsSync(dir)) return false;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.name === '.DS_Store') return true;
    if (entry.isDirectory() && hasDsStore(fullPath)) return true;
  }
  return false;
}

if (hasDsStore('dist')) {
  errors.push('dist contains .DS_Store files');
}

for (const item of contentChecks) {
  if (!fs.existsSync(item.file)) continue;
  const content = fs.readFileSync(item.file, 'utf8');
  for (const expected of item.checks) {
    if (!content.includes(expected)) {
      errors.push(item.file + ' is missing: ' + expected);
    }
  }
}

if (errors.length) {
  console.error('Build verification failed:');
  for (const error of errors) console.error('  - ' + error);
  process.exit(1);
}

console.log('Build verification OK');
