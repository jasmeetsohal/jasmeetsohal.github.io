# Jasmeet Singh — International Portfolio (EN / ES)

Bilingual static portfolio for **GitHub Pages** — English default, Spanish for visitors from Spain and other Spanish-speaking regions.

## Features

- Professional layout for international clients and remote hiring
- **English** and **Español** — switch with EN / ES buttons
- Auto-detects Spanish browser language (`es`, `es-ES`, etc.) on first visit
- Remembers language choice in `localStorage`
- Share links: `?lang=en` or `?lang=es`

## Customize

1. **`config.json`** — email, LinkedIn, GitHub, Calendly (replace `YOUR-*` placeholders)
2. **`i18n/en.json`** and **`i18n/es.json`** — projects, services, copy (keep both in sync)
3. Add your photo later in `index.html` if desired

## Run locally

```bash
cd /Users/jasmeetsingh/projects/jasmeet-portfolio
python3 -m http.server 8080
```

Open http://localhost:8080 — try `?lang=es` for Spanish.

## Deploy to GitHub Pages (free)

### Option A — User site (`username.github.io`)

1. Create a GitHub repo named **`jasmeetsohal.github.io`**
2. Push this folder to the **`main`** branch
3. GitHub → **Settings → Pages → Source**: Deploy from branch **`main`**, folder **`/ (root)`**
4. Site live at **https://jasmeetsohal.github.io** (also try `?lang=es` for Spanish)

### Option B — Project site (`username.github.io/portfolio`)

1. Repo name: e.g. `portfolio`
2. Same Pages settings, root `/`
3. URL: `https://yourusername.github.io/portfolio/`

### Push commands (first time)

```bash
cd /Users/jasmeetsingh/projects/jasmeet-portfolio
git add .
git commit -m "Add bilingual portfolio for GitHub Pages"
git remote add origin https://github.com/jasmeetsohal/jasmeetsohal.github.io.git
git push -u origin main
```

Enable Pages in repo settings after the first push.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Structure |
| `styles.css` | Design |
| `main.js` | i18n loader + render |
| `config.json` | Your links (not translated) |
| `i18n/en.json` | English copy |
| `i18n/es.json` | Spanish copy |
| `.nojekyll` | Lets GitHub Pages serve all files |

## Adding Portuguese later

Copy `i18n/es.json` → `i18n/pt.json`, translate, add `pt` to `SUPPORTED` in `main.js` and a PT button in `index.html`.

## License

Personal use — customize freely.
