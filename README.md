# Studio TL — Website

Personal one-page website for Studio TL (UI/UX freelance, Lyon). Plain HTML/CSS/JS — no framework, no database.

**Live:** [www.studiotl.fr](https://www.studiotl.fr)

## How it works

The site is authored as a single French source file, [index.html](index.html), with inline CSS and JS. A small Node build ([build.js](build.js)) turns it into the bilingual site that ships to production:

- `dist/index.html` — French version, served at `/`
- `dist/en/index.html` — English version, served at `/en/` (strings translated via [i18n.json](i18n.json))
- `.htaccess`, `robots.txt`, `sitemap.xml` — language routing (`Accept-Language` → `/en/`), canonical redirects and SEO
- everything minified (comments stripped, so the commented source stays readable in the repo)

Assets — the SVG logo and the self-hosted Neue Montreal fonts (woff2) — live in `assets/`.

## Local development

```bash
npm install            # installs the only build dependency (html-minifier-terser)
npm run deploy:prepare # build + verify + minify into dist/
```

To iterate on the site, edit `index.html` and open it directly in a browser. To preview the exact production output, serve `dist/` after building:

```bash
cd dist && python3 -m http.server 8000   # then http://localhost:8000
```

When you change a translatable string, update `i18n.json` (FR → EN) so the English version stays in sync.

## Deployment

Every push to `main` triggers a GitHub Actions workflow ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)) that builds `dist/` and uploads it to Infomaniak over FTP — no manual step. To re-run it by hand: **Actions → Deploy to Infomaniak → Run workflow**.

### Configuration — GitHub secrets

The deploy workflow needs FTP credentials to reach the Infomaniak server. These are stored as GitHub **repository secrets** rather than committed to the repo — so the password never ends up in the (public) source, and the automated deploy can still authenticate. The workflow references them by name; without them the deploy fails at the login step.

Set them once under **Settings → Secrets and variables → Actions**:

| Secret           | What it is                                        |
| ---------------- | ------------------------------------------------- |
| `FTP_SERVER`     | FTP host, e.g. `ftp.infomaniak.com`               |
| `FTP_USERNAME`   | FTP account username                              |
| `FTP_PASSWORD`   | FTP account password                              |
| `FTP_REMOTE_DIR` | Target directory on the server, e.g. `/`          |
