# Studio TL — Site

Site personnel statique (HTML/CSS/JS).

- 🌐 **Production** : [www.studiotl.fr](https://www.studiotl.fr)
- 🏠 **Hébergement** : Infomaniak
- 🚀 **Déploiement** : automatique via GitHub Actions (FTPS) à chaque push sur `main`

## Structure

```
.
├── index.html              # Page unique (CSS + JS inline)
├── assets/
│   ├── logo.svg
│   └── fonts/              # Neue Montreal (4 woff2)
└── .github/workflows/
    └── deploy.yml          # Déploiement auto FTPS vers Infomaniak
```

## Développement local

Soit ouvrir `index.html` directement dans un navigateur, soit lancer un petit serveur :

```bash
python3 -m http.server 8000
# puis http://localhost:8000
```

## Déploiement

Tout `git push` sur la branche `main` déclenche un déploiement automatique vers Infomaniak via FTPS (GitHub Actions).

Pour forcer un déploiement manuel : onglet **Actions** sur GitHub → workflow **Deploy to Infomaniak** → **Run workflow**.

### Secrets GitHub requis

À configurer une seule fois dans **Settings → Secrets and variables → Actions** :

| Secret           | Exemple                       |
| ---------------- | ----------------------------- |
| `FTP_SERVER`     | `ftp.infomaniak.com`          |
| `FTP_USERNAME`   | identifiant FTP Infomaniak    |
| `FTP_PASSWORD`   | mot de passe FTP              |
| `FTP_REMOTE_DIR` | `/sites/tondomaine.com/` ou `/` selon ta config |
