# Logge Media Forge

Mein Portfolio: Web-Apps, Spiele, KI-Experimente und Filme, als Werkstatt gebaut („Die Esse brennt noch.“). Statische Website für GitHub Pages und `lmf.logge.top`, ohne Build-Schritt und ohne produktive npm-Abhängigkeiten. Die verbindliche Spezifikation liegt in [`docs/redesign-spec.md`](docs/redesign-spec.md).

Grundregel: **Nichts ist erfunden.** Jede Zahl, jedes Datum und jede Rolle stammt aus einem README, Repo-Metadaten, einer geprüften Live-Seite, der GitHub- oder YouTube-API oder vorhandenen Daten. Fehlt etwas, wird das Element weggelassen, nie mit einem Platzhalter gefüllt.

Die Belege stehen in den Daten (`sources` in `data/details/*.json`, `milestones.json`, `partners.json`) und werden von `npm run check` geprüft, aber **nicht auf der Seite gezeigt**: keine Punze, keine Fußnoten-Ziffern, keine „Quelle:“-Zeilen, kein „Stand“ an jedem Block. Die Seite ist ein Portfolio, kein Report. Das einzige „Stand“-Datum steht unter der Esse, weil die Glut davon abhängt. Auch sonst zeigt die Seite Arbeit statt Forensik: Daten als Monat („Sept. 2026“), keine Uhrzeiten von Repo-Anlagen, keine Commits und keine Sprach-Prozente, Sterne erst ab 25, höchstens vier Eckdaten pro Werkstück (zuerst die eigenen Zahlen des Projekts, „Zuletzt dran“ nur bei abgekühlten Stücken; keine Leiste, wenn sie nur das Jahr wiederholen würde). Das Schichtbuch zeigt Jahre und Meilensteine, keine Repo-Tabellen; der Zeitraffer zeigt jedes Repo als Strich in einer unbeschrifteten Glut-Reihe, ohne Sprach-Spuren, ohne Zahlen pro Jahr und ohne Anlagedatum im Tooltip.

## Lokal starten

```sh
npm run dev
# http://127.0.0.1:4173
```

`npm run dev` startet `scripts/serve.mjs`, einen kleinen statischen Server ohne Abhängigkeiten (großer Listen-Backlog, damit parallele Playwright-Worker keine Verbindungsabbrüche bekommen; unbekannte Pfade liefern `404.html` wie GitHub Pages). Anderer Port: `PORT=4180 npm run dev`, Tests dagegen mit `LMF_PORT=4180 npm test`. Zur Not geht auch `python3 -m http.server 4173 --bind 127.0.0.1`, der bricht aber unter parallelen Tests ab. JSON und ES-Module brauchen HTTP; `file://` funktioniert nicht.

## Aufbau

```
index.html              Gerüst, alle Texte, Mount-Punkte, Prerender-Marker (<!-- prerender:NAME -->)
404.html  gallery/      Fehlerseite, Fotoarchiv (ohne JavaScript nutzbar)
css/tokens.css base.css Farben (Tageslicht, Esse, Screen), Typo, Abstände, Bewegung
css/sections/*.css      je Abschnitt; werkbank.css und probes.css werden nachgeladen
js/main.js              Boot, Abschnitts-Registry, data-bind-Aktualisierung
js/lib/data.js          lädt alle Datendateien (allSettled), Details auf Abruf
js/lib/derive.js        reine Ableitungen: Glut, Lagernummer, Suche, Zählungen, data-bind-Werte
js/render/*.js          reine String-Renderer (Browser und Prerender)
js/sections/*.js        Abschnittsmodule (mount/destroy)
data/                   alle Inhalte (siehe unten)
assets/fonts/           4 WOFF2-Dateien + OFL-Lizenzen
scripts/                Entwicklungswerkzeuge (nicht Teil der Auslieferung)
tests/                  Playwright
```

## Daten

Die Seite liest zur Laufzeit nur `data/`. `docs/research/*.json` ist Rohmaterial und wird nur über `scripts/import-research.mjs` übernommen.

| Datei | Inhalt |
| --- | --- |
| `data/projects.json` | alle Projekte in Lager-Reihenfolge (= `scripts/order.json`), ≤ 40 KB |
| `data/details/<id>.json` | Tiefe pro Projekt: Geschichte, Highlights, Stack, Sprachen, Commits, Fakten, Medien, Quellen |
| `data/films.json` | YouTube-ID, Originaltitel, Upload, Länge, Reihe, Ort, wörtliches Beschreibungszitat |
| `data/repos.json` | eigene öffentliche Repos ohne Forks (Zeitraffer, Glut der Esse); Namen nur laut `scripts/repo-allowlist.json` |
| `data/snapshot.json` | `asOf` (Stichtag für die Glut und das eine „Stand“ unter der Esse), GitHub-Konto, Repos pro Jahr |
| `data/milestones.json` | Schichtbuch-Meilensteine mit Quellen (auf der Seite verlinkt nur der Text selbst, wenn es ein Video oder Repo gibt); `{gallery.nights}`-Platzhalter füllt `fillBindings()` |
| `data/chapters.json`, `data/universe.json` | Meisterstück-Kapitel, Kolpingtheater-Universum |
| `data/partners.json`, `data/socials.json` | Zunft und Kontakt |
| `docs/decisions.json` | Entscheidungen des Besitzers (Serotonin, GPS, Ortsnamen …), von `validate` gelesen |

### Projektfelder

Pflicht: `id` (`/^[a-z0-9-]+$/`, stabil, steckt in `#werk/<id>`), `title`, `category`, `description` (≤ 320 Zeichen), `link` (https), `tags`, `groups` (Teilmenge von `web`, `games`, `ai`, `film`; die erste ist die Legierung) und entweder `image` (exakte Schreibweise, GitHub Pages unterscheidet Groß/Klein) oder `art` (`music|capture|retro|organic|widget|film` → Rohling).

Optional: `summary`, `imageAlt`, `artTitle`, `linkLabel`, `source`, `isNew`, `archived`, `year` (kuratiertes Startjahr, nie aus `repo.createdAt` kopiert), `yearLabel`, `repo` (`fullName`, `private`, `stars`, `createdAt`, `pushedAt`; geschrieben vom Snapshot), `live` (`live|repo-only|offline` + `checkedAt`), `probe`, `contentNote`, `details`, `related`.

### Details-Felder

`story` (1–4 Absätze), `highlights` (3–6), `stack`, `languages` (Prozent, nur Daten), `commits`, `commitsBy` (nur Daten), `facts` (`{key, label, value, source}`; mit `kind: "ribbon"` und `text` wird der Fakt ein Satz unter dem Titel statt einer Zelle im Faktenstreifen; `kind: "probe"` belegt nur ein Probestück und wird nicht gezeigt), `funFact` (`{text, source}`; auf der Seite „Nebenbei“), `relatedRepos` (nur Daten, nicht gezeigt), `media` (`{src, alt, caption, kind, width, height, source}`), `note`, `refs` (`repo`, `live`, `video`: Index der Quelle hinter einem Fakt) und `sources` (`{label, url, checkedAt, private?}`). Jede `source`-Zahl ist ein Index in `sources`. Ein Fakt ohne auflösbare Quelle wird weggelassen; die Quellen selbst erscheinen nicht auf der Seite. Quellen mit `private: true` zeigen auf ein privates Repo.

### Abgeleitete Werte

`js/lib/derive.js` rechnet alles, was die Seite zählt: `glowOf` (glüht ≤ 30 Tage, warm ≤ 180 Tage, sonst abgekühlt; Filme „fertig“, Archiv „ausgemustert“, immer gegen `snapshot.asOf`), `stockNo`, `normalize`/`haystack` (Suche, ä → a, ß → ss, Apostrophe weg), `reposByYear`, `nights` (Fotos vor 12 Uhr zählen zur Nacht davor), `toolCounts` (Werkzeugwand) und `bindings()`. Jede Zahl im Text ist ein `<span data-bind="schlüssel">`; `npm run prerender` schreibt den Wert hinein, `main.js` aktualisiert ihn zur Laufzeit.

## Skripte

| Befehl | Was passiert |
| --- | --- |
| `npm run import` | Recherche → `data/` (Korrekturen, neue Projekte, Details, Filme, Meilensteine, Universum, Partner). Idempotent, verweigert Fakten ohne Quelle. Zuletzt formuliert `scripts/lib/portfolio-copy.mjs` die Recherche-Sätze für Besucher um („laut Commits …“ raus); jede Ersetzung muss greifen. |
| `npm run snapshot` | `gh`-CLI (angemeldet): `repos.json`, `snapshot.json`, Sterne/Daten in `projects.json`, Commits/Sprachen in den Details. `--as-of YYYY-MM-DD` optional. |
| `npm run prerender` | füllt Prerender-Blöcke und `data-bind` in `index.html`; fehlende Renderer werden übersprungen. |
| `npm run check` | `scripts/validate.mjs`, alle Regeln aus Spec §3.15 plus Budgets und Umlaut-Prüfung. |
| `npm test` | Playwright. |
| `node scripts/fetch-fonts.mjs` | lädt die vier Schriftdateien und OFL-Texte (gepinnte Versionen). |
| `node scripts/fetch-film-stills.mjs` | YouTube-Vorschaubild für Ski 2023 (`maxresdefault` → `sddefault` → `hqdefault`, Balken abgeschnitten, 640×360 WebP). `--maxres-only`: ohne `maxresdefault` bleibt der Rohling. |
| `node scripts/strip-gps.mjs` | zeigt, welche Galerie-Originale GPS-Daten tragen. `--write` entfernt sie, **nur nach Freigabe**; danach `"stripGps": "done"` in `docs/decisions.json`. |

Reihenfolge nach neuen Recherchen: `npm run import && npm run snapshot && npm run prerender && npm run check && npm test`.

## Prüfen

```sh
npm ci
npx playwright install chromium
npm run check
npm test
```

`npm` wird ausschließlich für Entwicklungswerkzeuge gebraucht. Ausgeliefert werden die statischen Dateien; `node_modules`, `work`, `docs/research` und Testberichte gehören nicht auf den Webserver. Cloudflare Web Analytics und die Custom Domain bleiben konfiguriert; YouTube lädt erst nach einem Klick.
