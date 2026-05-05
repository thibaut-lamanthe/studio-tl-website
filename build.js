/**
 * Build i18n : génère dist/index.html (FR) et dist/en/index.html (EN) à
 * partir d'un seul fichier source (index.html en français) + i18n.json.
 *
 * Workflow utilisateur :
 *   1. Modifier index.html (en français)
 *   2. Si on touche un texte traduisible, mettre à jour i18n.json (FR→EN)
 *   3. Push → GitHub Action lance ce script puis FTP deploy
 *
 * Output dans dist/ :
 *   - index.html       version FR (path assets/ relatifs, OK depuis /)
 *   - en/index.html    version EN (path assets/ absolutisés en /assets/)
 *   - .htaccess        redirige les visiteurs en* vers /en/ (sauf bots)
 *   - assets/          copie de assets/ pour servir les fonts + svgs
 *
 * Les deux HTML reçoivent les <link rel="alternate" hreflang> + canonical
 * pour que Google indexe les deux URLs séparément avec leur public cible.
 */

const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://studio-tl.fr';
const SOURCE = 'index.html';
const I18N = 'i18n.json';
const DIST = 'dist';

const source = fs.readFileSync(SOURCE, 'utf8');
const i18n = JSON.parse(fs.readFileSync(I18N, 'utf8'));

// Tags hreflang + canonical injectés dans le <head> de chaque version.
// {{CANONICAL}} → '' pour FR (= /), 'en/' pour EN (= /en/)
function buildHeadTags(canonicalPath) {
  return [
    '<link rel="canonical" href="' + SITE_URL + '/' + canonicalPath + '" />',
    '<link rel="alternate" hreflang="fr" href="' + SITE_URL + '/" />',
    '<link rel="alternate" hreflang="en" href="' + SITE_URL + '/en/" />',
    '<link rel="alternate" hreflang="x-default" href="' + SITE_URL + '/" />'
  ].join('\n  ');
}

function injectHead(html, canonicalPath) {
  return html.replace('</head>', '  ' + buildHeadTags(canonicalPath) + '\n</head>');
}

// === FR : copie quasi à l'identique, juste hreflang + canonical ===
const frVersion = injectHead(source, '');

// === EN : remplace les strings FR→EN, swap lang attr, absolutise les
//         path assets/ (sinon depuis /en/ ils résolvent en /en/assets/) ===
let enVersion = source.replace('<html lang="fr">', '<html lang="en">');
for (const [fr, en] of Object.entries(i18n)) {
  if (!enVersion.includes(fr)) {
    console.warn('⚠️  Translation key not found in source: "' + fr + '"');
  }
  enVersion = enVersion.split(fr).join(en);
}
// Asset paths : relative (assets/) → absolute (/assets/) pour /en/
enVersion = enVersion.replace(/href="assets\//g, 'href="/assets/');
enVersion = enVersion.replace(/src="assets\//g, 'src="/assets/');
enVersion = enVersion.replace(/url\("assets\//g, 'url("/assets/');
enVersion = injectHead(enVersion, 'en/');

// === .htaccess : auto-redirect basé sur Accept-Language ===
// Logique :
//   - Si User-Agent est un bot → pas de redirect (ils crawlent les URLs
//     explicitement, hreflang les guide)
//   - Si déjà sous /en/ → pas de redirect
//   - Si requête pour un asset → pas de redirect
//   - Si Accept-Language commence par "en" (en-US, en-GB, etc.) → 302 vers /en/
//   - Sinon → reste sur /
const htaccess = [
  'RewriteEngine On',
  '',
  '# Skip bots : ils crawlent les URLs explicitement, hreflang les guide',
  'RewriteCond %{HTTP_USER_AGENT} (googlebot|bingbot|yandex|baiduspider|duckduckbot|slurp|applebot|facebot) [NC]',
  'RewriteRule .* - [L]',
  '',
  '# Skip si déjà sous /en/',
  'RewriteCond %{REQUEST_URI} ^/en($|/)',
  'RewriteRule .* - [L]',
  '',
  '# Skip pour les assets (fonts, svgs, etc.)',
  'RewriteCond %{REQUEST_URI} ^/assets/',
  'RewriteRule .* - [L]',
  '',
  '# Ne traite que la racine (/ ou /index.html)',
  'RewriteCond %{REQUEST_URI} !^/$',
  'RewriteCond %{REQUEST_URI} !^/index\\.html$',
  'RewriteRule .* - [L]',
  '',
  '# Redirect EN speakers vers /en/',
  'RewriteCond %{HTTP:Accept-Language} ^en [NC]',
  'RewriteRule ^ /en/ [R=302,L]',
  ''
].join('\n');

// === Output ===
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(path.join(DIST, 'en'), { recursive: true });
fs.writeFileSync(path.join(DIST, 'index.html'), frVersion);
fs.writeFileSync(path.join(DIST, 'en', 'index.html'), enVersion);
fs.writeFileSync(path.join(DIST, '.htaccess'), htaccess);

// Copie récursive de assets/ → dist/assets/
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}
copyDir('assets', path.join(DIST, 'assets'));

console.log('Build OK :');
console.log('  - ' + path.join(DIST, 'index.html') + ' (FR)');
console.log('  - ' + path.join(DIST, 'en', 'index.html') + ' (EN)');
console.log('  - ' + path.join(DIST, '.htaccess'));
console.log('  - ' + path.join(DIST, 'assets/') + ' (copié)');
