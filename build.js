/**
 * i18n build: generates dist/index.html (FR) and dist/en/index.html (EN) from
 * a single source file (index.html in French) + i18n.json.
 *
 * User workflow:
 *   1. Edit index.html (in French)
 *   2. If a translatable string is touched, update i18n.json (FR→EN)
 *   3. Push → GitHub Action runs this script then the FTP deploy
 *
 * Output in dist/:
 *   - index.html       FR version (relative assets/ paths, OK from /)
 *   - en/index.html    EN version (assets/ paths absolutized to /assets/)
 *   - .htaccess        redirects en* visitors to /en/ (except bots)
 *   - assets/          copy of assets/ to serve the fonts + svgs
 *
 * Both HTML files receive the <link rel="alternate" hreflang> + canonical
 * tags so Google indexes both URLs separately for their target audience.
 */

const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://www.studiotl.fr';
const SOURCE = 'index.html';
const I18N = 'i18n.json';
const DIST = 'dist';

const source = fs.readFileSync(SOURCE, 'utf8');
const i18n = JSON.parse(fs.readFileSync(I18N, 'utf8'));

// hreflang + canonical tags injected into the <head> of each version.
// {{CANONICAL}} → '' for FR (= /), 'en/' for EN (= /en/)
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

// === FR: near-identical copy, just hreflang + canonical ===
const frVersion = injectHead(source, '');

// === EN: swap FR→EN strings, swap lang attr, absolutize the
//         assets/ paths (otherwise from /en/ they resolve to /en/assets/) ===
let enVersion = source.replace('<html lang="fr">', '<html lang="en">');
for (const [fr, en] of Object.entries(i18n)) {
  if (!enVersion.includes(fr)) {
    console.warn('⚠️  Translation key not found in source: "' + fr + '"');
  }
  enVersion = enVersion.split(fr).join(en);
}
// Asset paths: relative (assets/) → absolute (/assets/) for /en/
enVersion = enVersion.replace(/href="assets\//g, 'href="/assets/');
enVersion = enVersion.replace(/src="assets\//g, 'src="/assets/');
enVersion = enVersion.replace(/url\("assets\//g, 'url("/assets/');
// OG meta: url + locale specific to the EN version
enVersion = enVersion.replace(
  '<meta property="og:url" content="' + SITE_URL + '/" />',
  '<meta property="og:url" content="' + SITE_URL + '/en/" />'
);
enVersion = enVersion.replace(
  '<meta property="og:locale" content="fr_FR" />',
  '<meta property="og:locale" content="en_US" />'
);
enVersion = enVersion.replace(
  '<meta property="og:locale:alternate" content="en_US" />',
  '<meta property="og:locale:alternate" content="fr_FR" />'
);
enVersion = injectHead(enVersion, 'en/');

// === .htaccess: auto-redirect based on Accept-Language ===
// Logic:
//   - Non-canonical host or plain HTTP → 301 to https://www.studiotl.fr
//   - If User-Agent is a bot → no redirect (they crawl URLs
//     explicitly, hreflang guides them)
//   - If already under /en/ → no redirect
//   - If the request is for an asset → no redirect
//   - If Accept-Language starts with "en" (en-US, en-GB, etc.) → 302 to /en/
//   - Otherwise → stays on /
const htaccess = [
  'RewriteEngine On',
  '',
  '# Canonicalization: any host != www.studiotl.fr → 301 to the canonical host.',
  '# Covers studiotl.fr (apex), studio-tl.fr, thibautlamanthe.com, thibautlamanthe.fr',
  '# and their www variants. The path is preserved via $1.',
  'RewriteCond %{HTTP_HOST} !^www\\.studiotl\\.fr$ [NC]',
  'RewriteRule ^(.*)$ https://www.studiotl.fr/$1 [R=301,L]',
  '',
  '# Force HTTPS on the canonical host. The X-Forwarded-Proto check avoids a',
  '# redirect loop if TLS is terminated by a proxy in front of Apache.',
  'RewriteCond %{HTTPS} off',
  'RewriteCond %{HTTP:X-Forwarded-Proto} !https',
  'RewriteRule ^(.*)$ https://www.studiotl.fr/$1 [R=301,L]',
  '',
  '# Skip bots: they crawl URLs explicitly, hreflang guides them',
  'RewriteCond %{HTTP_USER_AGENT} (googlebot|bingbot|yandex|baiduspider|duckduckbot|slurp|applebot|facebot) [NC]',
  'RewriteRule .* - [L]',
  '',
  '# Skip if already under /en/',
  'RewriteCond %{REQUEST_URI} ^/en($|/)',
  'RewriteRule .* - [L]',
  '',
  '# Skip for assets (fonts, svgs, etc.)',
  'RewriteCond %{REQUEST_URI} ^/assets/',
  'RewriteRule .* - [L]',
  '',
  '# Only handle the root (/ or /index.html)',
  'RewriteCond %{REQUEST_URI} !^/$',
  'RewriteCond %{REQUEST_URI} !^/index\\.html$',
  'RewriteRule .* - [L]',
  '',
  '# Redirect EN speakers to /en/',
  'RewriteCond %{HTTP:Accept-Language} ^en [NC]',
  'RewriteRule ^ /en/ [R=302,L]',
  ''
].join('\n');

// === robots.txt ===
// Allows everything, points to the sitemap.
const robots = [
  'User-agent: *',
  'Allow: /',
  '',
  'Sitemap: ' + SITE_URL + '/sitemap.xml',
  ''
].join('\n');

// === sitemap.xml ===
// One entry per language version with cross-linked xhtml:link hreflang.
const today = new Date().toISOString().slice(0, 10);
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
  '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  '  <url>',
  '    <loc>' + SITE_URL + '/</loc>',
  '    <lastmod>' + today + '</lastmod>',
  '    <xhtml:link rel="alternate" hreflang="fr" href="' + SITE_URL + '/" />',
  '    <xhtml:link rel="alternate" hreflang="en" href="' + SITE_URL + '/en/" />',
  '    <xhtml:link rel="alternate" hreflang="x-default" href="' + SITE_URL + '/" />',
  '  </url>',
  '  <url>',
  '    <loc>' + SITE_URL + '/en/</loc>',
  '    <lastmod>' + today + '</lastmod>',
  '    <xhtml:link rel="alternate" hreflang="fr" href="' + SITE_URL + '/" />',
  '    <xhtml:link rel="alternate" hreflang="en" href="' + SITE_URL + '/en/" />',
  '    <xhtml:link rel="alternate" hreflang="x-default" href="' + SITE_URL + '/" />',
  '  </url>',
  '</urlset>',
  ''
].join('\n');

// === Output ===
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(path.join(DIST, 'en'), { recursive: true });
fs.writeFileSync(path.join(DIST, 'index.html'), frVersion);
fs.writeFileSync(path.join(DIST, 'en', 'index.html'), enVersion);
fs.writeFileSync(path.join(DIST, '.htaccess'), htaccess);
fs.writeFileSync(path.join(DIST, 'robots.txt'), robots);
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap);

// Recursive copy of assets/ → dist/assets/
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === '.DS_Store' || entry.name.startsWith('._')) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}
copyDir('assets', path.join(DIST, 'assets'));

console.log('Build OK:');
console.log('  - ' + path.join(DIST, 'index.html') + ' (FR)');
console.log('  - ' + path.join(DIST, 'en', 'index.html') + ' (EN)');
console.log('  - ' + path.join(DIST, '.htaccess'));
console.log('  - ' + path.join(DIST, 'robots.txt'));
console.log('  - ' + path.join(DIST, 'sitemap.xml'));
console.log('  - ' + path.join(DIST, 'assets/') + ' (copied)');
