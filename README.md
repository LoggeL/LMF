# Logge Media Forge

The current LMF portfolio, rebuilt with the **LMF Redline** design system while preserving the established project archive, partner network, contact channels, analytics, gallery, and asset structure.

## Features

- Responsive editorial layout based on the angular LMF logo
- Dynamic project archive with filters, progressive loading, and detail dialog
- Current six-partner network and three contact channels loaded from JSON
- Dark and light themes with persisted preference
- Keyboard-friendly navigation and reduced-motion support
- Build-free HTML, CSS, and JavaScript

## Local development

The site loads JSON content with `fetch`, so serve it over HTTP:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8000/`.

## Structure

```text
index.html          Main portfolio page
css/lmf.css         Redline design system and responsive layout
js/main.js          Navigation, themes, projects, modal, and motion
data/               Projects, partners, and contact channels
assets/             Fonts, project images, logos, and video
gallery/            Existing standalone gallery
```

## Validation

```powershell
node --check .\js\main.js
Get-Content -Raw .\data\projects.json | ConvertFrom-Json | Out-Null
Get-Content -Raw .\data\partners.json | ConvertFrom-Json | Out-Null
Get-Content -Raw .\data\socials.json | ConvertFrom-Json | Out-Null
```
