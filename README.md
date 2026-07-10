# Studio TL — Website

Personal static website (HTML/CSS/JS).

- 🌐 **Production**: [www.studiotl.fr](https://www.studiotl.fr)
- 🏠 **Hosting**: Infomaniak
- 🚀 **Deployment**: automatic via GitHub Actions (FTPS) on every push to `main`

## Structure

```
.
├── index.html              # Single page (inline CSS + JS)
├── assets/
│   ├── logo.svg
│   └── fonts/              # Neue Montreal (4 woff2)
└── .github/workflows/
    └── deploy.yml          # Automatic FTPS deploy to Infomaniak
```

## Local development

Install dependencies:

```bash
npm install
```

Generate the local production build:

```bash
npm run deploy:prepare
```

Either open `index.html` directly in a browser to work on the source, or run a small server from `dist/` after building:

```bash
cd dist
python3 -m http.server 8000
# then http://localhost:8000
```

## Deployment

Every `git push` to the `main` branch triggers an automatic deploy to Infomaniak over FTPS (GitHub Actions).

To force a manual deploy: **Actions** tab on GitHub → **Deploy to Infomaniak** workflow → **Run workflow**.

### Required GitHub secrets

Configure once under **Settings → Secrets and variables → Actions**:

| Secret           | Example                       |
| ---------------- | ----------------------------- |
| `FTP_SERVER`     | `ftp.infomaniak.com`          |
| `FTP_USERNAME`   | Infomaniak FTP username       |
| `FTP_PASSWORD`   | FTP password                  |
| `FTP_REMOTE_DIR` | `/sites/yourdomain.com/` or `/` depending on your config |
