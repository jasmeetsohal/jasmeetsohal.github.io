# Jasmeet Singh — International Portfolio

Multilingual static portfolio for **GitHub Pages** — English default, plus European languages and Japanese for international clients.

## Languages

| Code | Language | Regions |
|------|----------|---------|
| `en` | English | Default, international |
| `es` | Español | Spain, Latin America |
| `de` | Deutsch | Germany, Austria, Switzerland |
| `fr` | Français | France, Belgium, Luxembourg |
| `nl` | Nederlands | Netherlands |
| `pl` | Polski | Poland |
| `it` | Italiano | Italy |
| `pt` | Português | Portugal |
| `ja` | 日本語 | Japan |

## Features

- Professional layout for international clients and remote hiring
- Language dropdown in the header (replaces EN/ES buttons)
- Auto-detects browser language on first visit
- Remembers choice in `localStorage`
- Share links: `?lang=de`, `?lang=ja`, etc.

## Customize

1. **`config.json`** — email, LinkedIn, GitHub, Calendly (replace `YOUR-*` placeholders)
2. **`i18n/*.json`** — keep all locale files in sync when you change copy
3. Add a locale: copy `i18n/en.json`, translate, add code to `SUPPORTED` in `main.js`

## Run locally

```bash
cd /Users/jasmeetsingh/projects/jasmeet-portfolio
python3 -m http.server 8080
```

Open http://localhost:8080 — try `?lang=de` or `?lang=ja`.

## Deploy to GitHub Pages (free)

### Option A — User site (`username.github.io`)

1. Create a GitHub repo named **`jasmeetsohal.github.io`**
2. Push this folder to the **`main`** or **`gh-pages`** branch
3. GitHub → **Settings → Pages → Source**: Deploy from branch, folder **`/ (root)`**
4. Site live at **https://jasmeetsohal.github.io**

### Push commands (first time)

```bash
cd /Users/jasmeetsingh/projects/jasmeet-portfolio
git add .
git commit -m "Add multilingual portfolio for GitHub Pages"
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
| `i18n/*.json` | Translated copy per language |

## License

Personal use — customize freely.
