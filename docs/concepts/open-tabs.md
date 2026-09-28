# OFFENE TABS: Konzept-Spec für das LMF-Redesign

> Status: Konzept, bereit zur Umsetzung · Ziel: `index.html`, `css/`, `js/`, `data/`, `gallery/` · Stand: 28.09.2026
> Arbeitstitel: **„Zu viele Tabs offen.“** Die Markenzeile bleibt **„Aus Neugier. Gemacht.“**

---

## 0. TL;DR

Logges Kopf ist ein Browser mit viel zu vielen offenen Tabs. Die Website **ist** dieser Browser, und zwar
wortwörtlich: Die Seitennavigation ist eine echte Tab-Leiste. Jedes Projekt ist ein Fenster mit Titelleiste,
Adresszeile und Seiteninfo (die Quellen). Die Suche ist eine Omnibox (⌘K). Ein Zähler zählt mit, wie viele
Tabs du beim Scrollen schon „geöffnet“ hast. Der Einstieg ist ein chaotischer Desktop, und dein Scrollen
räumt ihn auf. Unter dem Spiel bleibt die Seite ein vollständiges, scrollbares, barrierefreies
Portfolio mit durchsuchbarem Archiv. Das Konzept verlangt außerdem mehr Tiefe als bisher: Jedes
Projekt bekommt ein eigenes Fenster mit Story, Stack, echten Zahlen, Medien und **Quellen**.

Die „Keine erfundenen Inhalte“-Regel wird zum Gestaltungselement. Das Schloss-Symbol in der Adresszeile
öffnet bei jedem Projekt die **Seiteninfo**, also die Liste der Quellen mit Prüfdatum. Jede Zahl auf der
Seite hat eine Herkunft.

---

## 1. Big Idea und Erzählung

### 1.1 Die Metapher

| Browser-Ding           | Auf der Website                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------- |
| Tab-Leiste             | Hauptnavigation, sticky, ein Tab pro Abschnitt, der aktive Tab folgt dem Scrollen  |
| Tab-Zähler             | „Tabs offen“: zählt gesehene Projekte, auch im Favicon und im Seitentitel sichtbar |
| Omnibox / ⌘K           | Command-Palette: Projekte, Abschnitte, Filter, Aktionen, versteckte Befehle        |
| Fenster                | Jede Projektkarte ist ein Mini-Fenster, die Detailansicht ist das maximierte Fenster |
| Tab-Gruppen (farbig)   | Die vier Projektgruppen Web & Apps, Games, KI, Film mit festen Farben              |
| Tab-Übersicht          | Das Archiv: Raster aller Tabs oder Listenansicht                                   |
| Verlauf (Strg+H)       | Zeitachse von 2015 (GitHub-Account) bis heute                                      |
| Seiteninfo (Schloss)   | Quellen und Prüfdatum pro Projekt                                                  |
| Neuer Tab              | Kontakt: eine leere Neuer-Tab-Seite, in der du Logge direkt schreibst              |
| Abgestürzter Tab       | `404.html`                                                                         |

### 1.2 Dramaturgie (Scroll = Geschichte)

1. **Chaos.** Du landest auf einem Desktop voller echter Projektfenster, schief, überlappend und verschiebbar. Darüber steht: „Aus Neugier. Gemacht.“
2. **Aufräumen.** Beim Scrollen gleiten die Fenster in ein ordentliches Raster. Headline-Wechsel: „Aufgeräumt. Für den Moment.“
3. **Angepinnt.** Vier große Fenster mit den Lieblingsprojekten. Eins davon kann man direkt im Fenster spielen.
4. **Alle Tabs.** Die komplette Sammlung als Tab-Übersicht, filterbar nach Gruppen und durchsuchbar.
5. **Kino-Tab.** Der Browser wird dunkel. Filme, Filmstreifen, Bildstörung beim Wechseln.
6. **Verlauf.** Wie aus einem Tab viele wurden: Jahre, Repos, Projekte.
7. **Hinter den Tabs.** Wer Logge ist, mit echten Zahlen.
8. **Geteilte Tab-Gruppen.** Leute und Gruppen, mit denen Sachen entstehen.
9. **Abseits der Tabs.** Der Übergang in die Fotogalerie.
10. **Neuer Tab.** Leere Seite, blinkender Cursor: „Was hast du im Kopf?“

Der Zähler läuft die ganze Zeit mit. Am Ende steht da z. B. „43 Tabs offen. Du darfst jetzt schließen.“

---

## 2. Datenbasis (wofür gestaltet wird)

### 2.1 Grundsatz

- **Die Laufzeit liest nur `data/`.** `docs/research/*.json` ist Rohmaterial. Ein Entwickler-Skript
  (`scripts/merge-research.mjs`) übernimmt daraus nur Felder, die eine Quelle haben, und schreibt sie nach `data/`.
- **Fehlt ein Feld, fehlt der Block.** Es gibt keine Platzhalter wie „bald mehr“, keine Schätzwerte und keine
  Beispielzahlen. Die UI muss jede Kombination aus vorhandenen und fehlenden Feldern sauber darstellen.
- **Zahlen haben ein Datum.** Repo-Statistiken werden mit `fetchedAt` gespeichert und als „Stand: Sep. 2026“ angezeigt.

### 2.2 Schema `data/projects.json` (Index, wird initial geladen, Ziel ≤ 30 KB gzip)

Bestehende Felder bleiben unverändert (`id,title,category,description,summary,image|art,imageAlt,link,linkLabel,tags,groups,source,isNew,archived`). Neu und optional:

```jsonc
{
  "id": "bomberman-web",
  "year": 2026,                 // yearStarted, nur mit Quelle (erstes Commit / Repo-Erstellung / Veröffentlichung)
  "yearEnd": null,
  "status": "live",             // "live" | "archiv" | "konzept" | "demo" | "film" | "drehbuch"
  "hook": "…",                  // 1 Satz, max. 110 Zeichen, deutsch, für Karten und Palette
  "stack": ["JavaScript", "Canvas", "WebSocket"],
  "host": "loggel.github.io/bomberman-web",   // abgeleitet aus link, für die Adresszeile
  "thumb": "assets/img/thumbs/Bomberman-480.webp",
  "embed": { "url": "https://loggel.github.io/bomberman-web/", "verifiedAt": "2026-09-28" }, // nur wenn geprüft
  "youtubeId": "ZjB-0SG0icU",   // nur Filme; aus link abgeleitet
  "hasStory": true              // es gibt data/stories/<id>.json
}
```

### 2.3 Schema `data/stories/<id>.json` (wird erst beim Öffnen eines Fensters geladen)

```jsonc
{
  "id": "bomberman-web",
  "story": ["Absatz 1 …", "Absatz 2 …"],          // 1–4 Absätze, Logges Ich-Stimme, nur belegte Aussagen
  "highlights": ["Lokal an einer Tastatur oder online per Raumcode", "Bots", "Sechs Arenen"],
  "repo": {
    "fullName": "LoggeL/bomberman-web", "url": "https://github.com/LoggeL/bomberman-web",
    "stars": 0, "forks": 0, "commits": 0, "createdAt": "…", "pushedAt": "…",
    "languages": { "JavaScript": 123456, "CSS": 2345 },   // Bytes aus der GitHub-API
    "fetchedAt": "2026-09-28"
  },
  "film": { "year": 2026, "location": "Portes du Soleil", "runtime": "PT4M12S", "roles": ["Schnitt"] },
  "media": [{ "src": "assets/img/shots/bomberman-01.webp", "alt": "…", "kind": "screenshot", "source": "URL" }],
  "sources": [{ "label": "README", "url": "https://github.com/LoggeL/bomberman-web", "checkedAt": "2026-09-28" }]
}
```

Hinweis: Die Nullen und Beispielwerte oben sind nur Platzhalter für das Schema. Veröffentlicht wird immer der gemessene Wert.

### 2.4 `data/stats.json` und `data/timeline.json`

- `stats.json` wird von `scripts/fetch-stats.mjs` per `gh api` erzeugt: `githubSince` (Account-Erstellung,
  aktuell 15.04.2015), `publicRepos`, `reposByYear` (**öffentliche Repositories ohne Forks** nach
  Erstellungsjahr; die Beschriftung in der UI muss genau das sagen), `bio` (aktuell: „I'm just pressing buttons“),
  `galleryCount` (77, gezählt aus `gallery/index.html`), `fetchedAt`.
  - Plausibilitätsprüfung bei der Recherche am 28.09.2026: öffentliche Repos pro Jahr (inkl. Forks) 2019: 4 · 2020: 8 · 2021: 10 · 2022: 9 · 2023: 8 · 2024: 11 · 2025: 26 · 2026: 65. Das Skript rechnet ohne Forks neu, die UI zeigt nur Skriptwerte.
- `timeline.json`: Persona-Stationen aus der Recherche (`{year, label, text, sources[]}`). Ohne Quelle wird ein Eintrag verworfen.

### 2.5 Bestandszahlen (automatisch berechnet, nie hart kodiert)

Aktuell 39 Projekte (Web 23, Games 7, KI 10, Film 16, Mehrfachgruppen möglich) und ungefähr 10 bis 16 neue aus der Recherche. Jeder Zähler auf der Seite rechnet aus den Daten.

---

## 3. Informationsarchitektur mit Textentwürfen

Die Texte sind in Logges Ton geschrieben: locker, Ich-Form, kurze Sätze, ein Augenzwinkern, keine Werbesprache. `{…}` wird aus den Daten gefüllt.

### 3.0 Browser-Chrome (Header, sticky)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ [LMF] ◖Neuer Tab◗ ◖Angepinnt◗ ◖Alle Tabs 39◗ ◖Kino◗ ◖Verlauf◗ ◖Über mich◗ ◖Kontakt◗  [+] │
│ ◯ ◯  🔒 lmf.logge.top/alle-tabs            Suchen oder Projekt eingeben … ⌘K   [07▢] ◐ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

- **Tab-Leiste:** `<nav aria-label="Abschnitte">` mit `<a>`-Links, der aktive Link hat `aria-current="location"`. Kein `role="tablist"`, denn es sind Anker. Jeder Tab hat ein Glyph-Favicon (✳ ◎ ▦ ▶ ↺ ☺ ✉) und einen Titel. Der aktive Tab ist wie in Chrome „angewachsen“: gleiche Farbe wie die Seite, konkave Außenecken per `radial-gradient`-Mask.
- **„+“** öffnet die Omnibox, Tooltip „Neuer Tab (⌘K)“.
- **Adresszeile:** zeigt `lmf.logge.top/<abschnitt>` passend zum Scrollstand. Das ist nur Anzeige, die echte URL wird beim Scrollen nicht verändert. Ein Klick öffnet die Omnibox. Beschriftung für Screenreader: „Suche öffnen“.
- **Zähler `[07▢]`:** Chrome-Mobile-Tab-Quadrat mit Zahl. Ein Klick öffnet die Tab-Übersicht der Abschnitte (Navigation, siehe Mobile).
- **Container Queries:** Wird ein Tab schmaler als 96 px, verschwindet der Titel und nur das Favicon bleibt. So verhält sich Chrome auch.
- Hover oder Fokus auf einem Tab zeigt eine **Tab-Vorschaukarte** (`popover="manual"`, 300 ms Verzögerung): Abschnittstitel, ein Satz Beschreibung und die Anzahl der Einträge.

Alte Anker bleiben als Aliase erhalten: `#home #selected #projects #about #partners #socials` sitzen als leere `<span id>` im jeweiligen Abschnitt.

### 3.1 `#start`: Neuer Tab / Desktop-Chaos

- Eyebrow (Mono): `● Das digitale Zuhause von Logge · {openTabs} Tabs offen`
- H1: **Aus Neugier.** / **Gemacht.** ✳ (zweite Zeile in `wdth 75`, `wght 300`, Akzentfarbe)
- Lead: „In meinem Kopf sind immer zu viele Tabs offen. Ein paar davon sind Apps geworden, ein paar Spiele, ein paar Filme. Hier liegen sie alle. Einigermaßen aufgeräumt, versprochen.“
- Buttons: `Aufräumen` (sekundär, räumt die Fenster sofort auf) · `Alle Tabs zeigen ↘` (primär, springt zu `#archiv`)
- Scroll-Hinweis (Mono, klein): „Scrollen räumt auf ↓“
- Fenster auf der Bühne: 12 echte Projektmotive (Bomberman, MelodAI-Player, Portes du Soleil, GeoGames, Kniffel, Learn AI, Frontier, Spotify Report, Transcripator, Marathon Trainer, Coop Sudoku, Infected). Titelleiste = Projekttitel, Adresszeile = echter Host.
- Headline nach dem Aufräumen (ersetzt den Lead per Crossfade): „Aufgeräumt. Für den Moment.“
- Unten rechts in der Bühne, klein: „Fenster lassen sich verschieben. Gewohnheit.“

### 3.2 `#angepinnt`: Die Tabs, die ich nie schließe

- Eyebrow: `Angepinnt · 04`
- H2: **Die Tabs, die ich nie schließe.**
- Sub: „Eins zum Spielen, eins zum Mitsingen, eins zum Verstehen und eins zum Rausgehen.“
- Vier große Fenster, abwechselnd links und rechts (Desktop), jeweils 12-Spalten-Split 7/5:
  1. **Bomberman:** Live-Fenster. Button „Hier spielen ▶“ lädt das echte Spiel (`embed.url`) im Fenster. Daneben Hook, drei Highlights, Stack-Chips, `Mehr über das Projekt →` (öffnet die Detailansicht).
  2. **MelodAI:** Player-Screenshot. Daneben „Gesang und Instrumental getrennt regeln.“ aus der bestehenden Beschreibung.
  3. **Learn AI:** Live-Fenster, wenn `embed` verifiziert ist, sonst Screenshot.
  4. **Portes du Soleil:** Film-Fenster mit YouTube-Fassade, „Film abspielen ▶“.
- Jedes angepinnte Fenster trägt oben ein 📌-Glyph (CSS, nicht Emoji-Font) und „Angepinnt“ als Tab-Label.

### 3.3 `#archiv`: Alle Tabs (Tab-Übersicht)

- Eyebrow: `Alle Tabs · {total}`
- H2: **Was sonst noch offen ist.**
- Sub: „Tools, kleine Welten und lange Schnittnächte. Nach Gruppen sortiert, weil Chaos nur im Kopf schön ist.“
- Toolbar:
  - Gruppen-Chips (Toggle, `aria-pressed`), jeweils mit Farbpunkt und Zahl: `Alle {n}` · `Web & Apps {n}` · `Games {n}` · `KI {n}` · `Film {n}`
  - Suche: Placeholder „Tabs durchsuchen … ( / )“, `aria-label="Projekte durchsuchen"`
  - Sortierung (`<select>`): „Wie ich sie mag“ (JSON-Reihenfolge) · „Neueste zuerst“ · „A–Z“
  - Ansicht: `Kacheln` / `Liste` (Toggle-Buttons)
- Status (`role="status"`): „{visible} von {matching} Tabs“
- Rechts daneben (Mono): „Eine Sammlung, kein Schlussstrich.“
- Mehr laden: „Weitere {n} Tabs öffnen ↓“ (in Zwölferschritten, nur in der Kachelansicht; die Liste zeigt alles)
- Leer: H3 „Kein Treffer. Aber hier ist noch Platz für eine Idee.“ · „Für „{q}“ in {gruppe} gibt es noch kein Projekt.“ · Button „Alle Tabs zeigen ↺“
- Status-Labels auf Karten: `Neu dabei`, `Archiv`, `Konzept` (ShareX-Konzepte: „Unabhängiges Designkonzept“), `Demo` (LoggeRythm).

### 3.4 `#kino`: Kino-Tab

Der Abschnitt ist in beiden Themes dunkel, eine eigene Bühne.

- Eyebrow: `Kino-Tab · {films} Filme`
- H2: **Manche Ideen brauchen eine Kamera.**
- Sub: „Aftermovies von Reisen mit Freunden, Kurzfilme aus 48-Stunden-Projekten und eine Fantasy-Trilogie, bei der ich VFX gemacht und mitgespielt habe.“ (belegt durch die Beschreibungen von Infected, Exception und Selantis)
- Großer Player (Fenster mit Titel `{title} · {year}`), darunter oder daneben: Ort, Jahr, Rolle, Laufzeit, jeweils nur wenn vorhanden.
- Filmstreifen: horizontaler Rail, nach Jahr sortiert, mit Perforation per CSS. Label: „Filmrolle, von neu nach alt“.
- Hinweis unter dem Player (klein, ehrlich): „Beim Abspielen lädt YouTube (youtube-nocookie.com).“

### 3.5 `#verlauf`: Verlauf

- Eyebrow: `Verlauf · Strg+H`
- H2: **Wie aus einem Tab ziemlich viele wurden.**
- Sub: „Seit {githubSinceYear} auf GitHub. Die Balken zeigen öffentliche Repositories pro Jahr, gezählt nach Erstellungsdatum und ohne Forks. Darunter stehen die Projekte aus diesem Archiv.“
- Aufbau wie `chrome://history`: Jahresüberschriften (neueste zuerst). Jede Zeile hat Favicon-Glyph, Titel, Host und Gruppe als farbigen Punkt, Ziel ist `#/p/<id>`.
- Kopf: Balkendiagramm Repos/Jahr mit direkter Beschriftung, zusätzlich als `<table>` für Screenreader (visuell versteckt, die Balken sind `aria-hidden`).
- Projekte ohne belegtes Jahr stehen unter „Ohne Datum, aber offen“.
- Fußzeile: „Verlauf löschen? Lieber nicht.“ (Mono, klein, Deko-Witz ohne Funktion, aber kein Button)

### 3.6 `#ueber-mich`: Hinter den Tabs

- Links ein Fenster `ueber-mich.txt` (Mono, Editor-Look mit Zeilennummern) mit dem bisherigen Text:
  - H2: **Ich wollte wissen, ob das geht.**
  - „So fangen ziemlich viele meiner Projekte an.“
  - „Ein Spiel für den nächsten Abend mit Freunden. Eine App für ein Problem, das mich selbst nervt. Ein Film, der von einer Reise mehr festhält als ein paar Fotos.“
  - „Unter Logge Media Forge sammle ich diese Dinge. Ich arbeite mit Code, Kamera und KI, lerne beim Machen und lande dabei regelmäßig bei der nächsten Idee.“
- Rechts ein Zitat-Chip: „„I'm just pressing buttons.“ sagt mein GitHub-Profil. Stimmt auch irgendwie.“ (Quelle: `stats.bio`, nur wenn vorhanden)
- Zahlenreihe (Mono-Ziffern, jede mit Tooltip-Quelle): `seit {2015} auf GitHub` · `{publicRepos} öffentliche Repos` · `{projects} Projekte hier` · `{films} Filme` · `{galleryCount} Fotos`
- Persona-Zeitleiste aus `timeline.json`, kompakt und vertikal. Wird nur gerendert, wenn Einträge existieren.
- Links: „Mein GitHub ↗“ · „Zur Fotogalerie →“

### 3.7 `#netzwerk`: Geteilte Tab-Gruppen

- Eyebrow: `Geteilte Tab-Gruppen`
- H2: **Gute Leute. Gemeinsame Sachen.**
- Jeder Partner ist ein Tab-Gruppen-Chip mit Logo, Titel und Kategorie. Aufgeklappt (Details/Summary) erscheint die Beschreibung aus `partners.json` plus Link.
- Gummibärenbande: das vorhandene Video `gummibaeren.webm/mp4` in einem kleinen Fenster, stumm, mit Loop und Pause-Button. Autoplay nur ohne reduzierte Bewegung, sonst Poster plus Play.

### 3.8 `#galerie`: Abseits der Tabs

- H2: **Abseits der Tabs.**
- Sub: „{galleryCount} Fotos, kein Code. Jedes öffnet sich in einem neuen Tab. Natürlich.“
- Streifen aus 6 Galerie-Thumbnails (`gallery/assets/img/small/*.webp`, lazy), CTA „Zur Fotogalerie →“. Der Wechsel nutzt eine Cross-Document View Transition, die neue Seite gleitet als neuer Tab in die Leiste.

### 3.9 `#kontakt`: Der nächste offene Tab

Gestaltet wie eine Neuer-Tab-Seite: zentrierte Omnibox, darunter Schnellwahl-Kacheln.

- Eyebrow: `Der nächste offene Tab`
- H2: **Was hast du im Kopf?**
- Omnibox-Eingabe (echtes `<textarea>`, einzeilig startend, `aria-label="Nachricht an Logge"`), Placeholder: „Eine Idee, eine Frage oder einfach Hallo …“
- Hinweis: „Enter öffnet dein Mailprogramm. Nichts wird hier gespeichert oder verschickt.“
- Enter (ohne Shift) öffnet `mailto:hyper.xjo@gmail.com?subject=Neuer Tab: {erste 6 Wörter}&body={text}`. Button daneben: „Abschicken ↗“.
- Schnellwahl-Kacheln (aus `socials.json` + GitHub): `Mail` · `Discord` · `Telegram` · `GitHub`, jeweils mit Glyph und Host.
- Die Mailadresse steht zusätzlich immer als sichtbarer Text-Link da, als Fallback.

### 3.10 Footer

„Logge Media Forge · Aus Neugier. Gemacht.“ · „{openTabs} Tabs offen. Du darfst jetzt schließen.“ · „© {Jahr} LMF“ · „Zurück nach oben ↑“ · „Quelltext dieser Seite ↗“ (github.com/LoggeL/LMF)

### 3.11 `404.html`: Abgestürzter Tab

„Mist. Dieser Tab ist abgestürzt.“ / „Die Seite gibt es nicht (mehr). Vielleicht war sie auch nur eine Idee.“ / Button „Neu laden“ (→ `/`). Dazu ein kleines ASCII-Gesicht im Mono-Font. Rein statisch.

---

## 4. Visuelles System

### 4.1 Typografie

| Rolle            | Schrift                                             | Lizenz | Quelle                                                                 |
| ---------------- | --------------------------------------------------- | ------ | ---------------------------------------------------------------------- |
| Display + Text   | **Bricolage Grotesque** (Variable: `opsz 12–96`, `wdth 75–100`, `wght 200–800`) | SIL OFL 1.1 | https://github.com/ateliertriay/bricolage · https://github.com/google/fonts/tree/main/ofl/bricolagegrotesque |
| Mono / Chrome    | **JetBrains Mono** (Variable `wght 100–800`)        | SIL OFL 1.1 | https://github.com/JetBrains/JetBrainsMono (Releases → `fonts/variable/`) |

- Beide Schriften werden selbst gehostet und mit `pyftsubset` auf Latin + Latin-1 Supplement + `–—„“‚‘…→↗↘↓↑←✳●◐` reduziert: `assets/fonts/Bricolage.var.woff2` (Ziel ≤ 55 KB) und `assets/fonts/JetBrainsMono.var.woff2` (Ziel ≤ 30 KB). Die Lizenzdateien liegen als `assets/fonts/OFL-*.txt` daneben. `Montserrat.woff2` entfällt.
- Gewählt, weil Bricolage mit seinen optischen Größen und der Breitenachse ein typografisches Spiel erlaubt: „Aus Neugier.“ in `wdth 100 / wght 800`, „Gemacht.“ in `wdth 75 / wght 300`. JetBrains Mono gibt der Browser-Chrome (URLs, Zähler, Metadaten) den Werkzeug-Charakter.
- **Signature-Detail:** Die Hero-Headline reagiert auf den Pointer. Die x-Position steuert `font-variation-settings: "wdth"` zwischen 75 und 100 auf „Gemacht.“ (lerp 0.12/Frame, nur `pointer: fine`, nicht bei reduzierter Bewegung).
- Skala (fluid, `rem`):

```css
--fs-mono-s: 0.75rem;                                   /* Chrome, Eyebrows, Meta */
--fs-0:      clamp(1rem, 0.96rem + 0.2vw, 1.125rem);    /* Fließtext, opsz 14 */
--fs-1:      clamp(1.2rem, 1.1rem + 0.5vw, 1.5rem);     /* Lead */
--fs-2:      clamp(1.5rem, 1.2rem + 1.4vw, 2.25rem);    /* H3 / Fenstertitel groß */
--fs-3:      clamp(2.1rem, 1.4rem + 3vw, 4rem);         /* H2 */
--fs-hero:   clamp(2.5rem, 0.9rem + 8.4vw, 10rem);      /* H1; bei 320px darf nichts überlaufen */
```

Zeilenhöhen: Display 0.92, H2 1.0, Text 1.6. Tracking: Display −0.03em, Mono-Eyebrows +0.04em und uppercase.

### 4.2 Farbe (Tokens, beide Themes, Kontraste geprüft)

Die Werte wurden für dieses Konzept gegen WCAG 2.x nachgerechnet. Die Zahl nennt den Kontrast zu `--bg` bzw. `--surface`.

```css
:root, :root[data-theme="light"] {
  --bg: #f2efe6;        /* Papier */
  --surface: #fffcf5;   /* Fensterinhalt */
  --sunk: #e7e3d7;      /* Tab-Leiste, inaktive Tabs */
  --ink: #191a17;       /* 15.2 / 17.1 */
  --ink-2: #57594f;     /* 6.2 / 7.0: Sekundärtext */
  --line: #cdc8b9;      /* nur dekorativ */
  --ui-border: #7d7a6d; /* 3.75 / 4.2: Inputs, Chips (≥ 3:1 Non-Text) */
  --accent: #c21a1a;    /* 5.3 / 5.9: LMF-Rot, abgeleitet aus Logo #d90429 */
  --g-web: #1d56c9;     /* 5.7 */
  --g-games: #b3146a;   /* 5.7 */
  --g-ai: #6538c9;      /* 6.2 */
  --g-film: #8f5200;    /* 5.4 */
  --on-group: var(--surface); /* Text auf Gruppenfarbe ≥ 6.0 */
  --focus: #1d56c9;
  --shadow-window: 0 1px 0 rgb(0 0 0 / .04), 0 24px 48px -24px rgb(40 30 10 / .35);
  color-scheme: light;
}
:root[data-theme="dark"] {   /* dazu identisch in @media (prefers-color-scheme: dark) :root:not([data-theme="light"]) */
  --bg: #111210;        /* Nachtschicht */
  --surface: #1b1c19;
  --sunk: #0b0c0a;
  --ink: #f1eee4;       /* 16.2 / 14.8 */
  --ink-2: #a8a99e;     /* 7.9 / 7.2 */
  --line: #35372f;
  --ui-border: #75776b; /* 4.1 / 3.8 */
  --accent: #ff6b57;    /* 6.7 / 6.1 */
  --g-web: #7ea8ff;     /* 8.0 */
  --g-games: #ff7cbc;   /* 7.9 */
  --g-ai: #b89cff;      /* 8.3 */
  --g-film: #f0b24a;    /* 10.0 */
  --on-group: var(--sunk); /* ≥ 8.3 */
  --focus: #ffd166;     /* 13.0 */
  --shadow-window: 0 0 0 1px rgb(255 255 255 / .06), 0 30px 60px -30px rgb(0 0 0 / .8);
  color-scheme: dark;
}
.kino { /* immer dunkel: übernimmt die Dark-Tokens lokal */ }
```

- Theme-Logik: Ohne gespeicherte Wahl gilt `prefers-color-scheme`. Das Inline-Script im `<head>` setzt `data-theme` nur, wenn `localStorage` einen Wert hat. Das bisherige Verhalten (immer hell) wird damit ersetzt.
- Gruppenfarben tauchen auf als 3 px Streifen oben am Fenster, als Chip-Punkt, als Tab-Gruppen-Label (gefüllt, Text `--on-group`) und als Balken im Verlauf. Farbe ist nie der einzige Träger: Es steht immer auch der Gruppenname da.

### 4.3 Raster und Maße

- Container: `max-width: 1520px`. Seitenrand `clamp(16px, 4vw, 56px)`, Gutter `clamp(16px, 2vw, 28px)`.
- Spalten: 12 (≥ 1100 px), 8 (760–1099 px), 4 (< 760 px) als CSS-Grid mit `subgrid` für Karten-Innenraster und `@supports`-Fallback.
- Abstände (8er-Basis): `--s-1: 4px … --s-10: 160px`. Abschnittsabstand `clamp(96px, 12vw, 200px)`.
- Fenster-Anatomie: Titelleiste 36 px (Mono 12 px), drei Ampelpunkte à 10 px (Deko auf Karten, echte Buttons im Detailfenster), Adresszeile 32 px nur im Detail/Pinned, Radius 12 px außen und 8 px für Medien, Gruppenstreifen 3 px.
- Tab-Form: Höhe 36 px, Radius 10 px oben. Die konkaven Fußecken entstehen über zwei 10-px-Pseudo-Elemente mit `radial-gradient(circle at 0 0, transparent 10px, var(--bg) 10.5px)`.

### 4.4 Textur und Details

- Sehr feines Papierkorn auf `--bg` (SVG `feTurbulence`, 2 % Opazität, als Data-URI, 1 Request weniger). Im Dark-Theme 3 %.
- Das Logo-✳ ist das wiederkehrende Satzzeichen: Abschnittsenden, Loader-freie Zustände, Easter Eggs.
- Cursor: kein Custom-Cursor. Nur beim Ziehen von Fenstern `cursor: grabbing`.

### 4.5 Bewegung

**Prinzipien**

1. **Fenster haben Masse, Text nicht.** Chrome-Elemente (Fenster, Tabs, Zähler) federn. Fließtext wird nur ein- und ausgeblendet, nie skaliert oder gefedert.
2. **Scroll steuert, Zeit dekoriert.** Große Bewegungen hängen am Scrollfortschritt (umkehrbar, vom Nutzer kontrolliert). Zeitbasierte Animationen sind kurz (≤ 420 ms) und reagieren auf Eingaben.
3. **Eine Bewegung pro Blick.** Pro Viewport läuft höchstens eine große Animation.
4. **Inhalt ist nie versteckt.** Der Ausgangszustand im CSS ist sichtbar. Animationen starten von `@starting-style` oder JS-Klassen, nie von `opacity: 0` im Grund-CSS.

**Tokens**

```css
--ease-out:    cubic-bezier(.22, 1, .36, 1);   /* Standard, Einblenden (Quint) */
--ease-in:     cubic-bezier(.55, 0, 1, .45);   /* Schließen */
--ease-inout:  cubic-bezier(.65, 0, .35, 1);   /* Scroll-gekoppelte Lerps (in JS nachgebaut) */
--ease-spring: linear(0, .006, .025 2.8%, .101 6.1%, .539 18.9%, .721 25.3%, .849 31.5%, .937 38.1%, .968 41.8%,
               .991 45.7%, 1.006 50.1%, 1.015 55%, 1.017 63.9%, 1.001 85.2%, 1);  /* sanfter Overshoot für Fenster */
--t-micro: 120ms;  /* Hover, Press */
--t-ui: 220ms;     /* Chips, Tabs, Popover */
--t-window: 420ms; /* Fenster öffnen, View Transition */
--t-stage: 700ms;  /* Bildstörung Kino, Aufräumen-Button */
```

| Ereignis              | Bewegung                                                                  |
| --------------------- | ------------------------------------------------------------------------- |
| Hover Karte           | `translateY(-4px)`, Schatten tiefer, Titelleiste in Gruppenfarbe (120 ms) |
| Tab wird aktiv        | Tab-Hintergrund gleitet (View Transition `tab-indicator`, 220 ms)         |
| Zähler +1             | Ziffernrolle, jede Ziffer als vertikaler Streifen (240 ms, spring)        |
| Neue Karten (mehr laden) | Staffel 30 ms, `scale(.96)→1`, opacity (420 ms spring)                |
| Fenster öffnen        | View Transition Karte → Detail (420 ms spring), Fallback `@starting-style` |
| Fenster schließen     | 200 ms ease-in, Fenster schrumpft zum Zähler oben rechts                  |
| Press auf Buttons     | `scale(.97)` 120 ms                                                       |

---

## 5. Signature-Interaktionen

### S1: Desktop-Chaos → Ordnung (Hero-Bühne)

**Was passiert:** Zwölf echte Projektfenster liegen schief und überlappend auf der Bühne. Man kann sie ziehen, sie haben Trägheit, und ein angeklicktes Fenster kommt nach vorn. Beim Scrollen durch die Bühne (`height: 220vh`, innen `position: sticky; top: 0; height: 100svh`) wandern alle Fenster per Lerp in ein 4×3-Raster. Bei Fortschritt 1 ist alles ordentlich, dann scrollt die Seite normal weiter zu „Angepinnt“.

**Technik**

- DOM: `<ul class="desk" aria-label="Gerade offene Tabs">` mit 12 `<li><article class="win">`. Jede Titelleiste enthält einen `<a href="#/p/{id}">` mit dem Projekttitel. Das Fenster selbst ist kein Link.
- Positionen: Chaos-Positionen sind deterministisch per Seed (Mulberry32, Seed = Tag im Jahr, jeden Tag ein anderes Chaos). Sie werden in Prozent der Bühne abgelegt, dazu Rotation ±9°, Skalierung 0.85–1.05 und z-Index. Die Grid-Positionen misst ein unsichtbares Referenzraster (`.desk-grid` mit 12 leeren Zellen, `getBoundingClientRect` bei Resize via `ResizeObserver`).
- Pro Frame (rAF, nur solange `IntersectionObserver` die Bühne meldet): `p = clamp((scrollY - stageTop) / (stageHeight - vh))`, `e = easeInOutCubic(p)`, `transform = translate(lerp(cx,gx,e), lerp(cy,gy,e)) rotate(lerp(cr,0,e)) scale(lerp(cs,1,e))`. Es werden nur Transforms geschrieben, keine Layout-Reads im Frame.
- Ziehen: Pointer Events mit `setPointerCapture` auf der Titelleiste. Unter 4 px Bewegung zählt es als Klick (öffnet das Detail). Beim Loslassen Trägheit mit `v *= 0.92` pro Frame, begrenzt auf die Bühne. Ein gezogenes Fenster bekommt eine neue Chaos-Position und wird beim Aufräumen trotzdem eingeordnet.
- Button `Aufräumen`: animiert `p` für die Fenster lokal in 700 ms auf 1 (spring) und scrollt nicht. Das ist gleichzeitig die **Einzelzeiger-Alternative zum Ziehen** (WCAG 2.5.7).
- Headline-Wechsel bei `p > .85`: Lead-Crossfade zu „Aufgeräumt. Für den Moment.“ (`aria-live` aus, rein dekorativ; der ursprüngliche Lead bleibt im DOM für Screenreader).
- Bilder: `thumb` (480 w WebP, ca. 15–30 KB). Die ersten 4 laden eager mit `fetchpriority="low"`, der Rest lazy. **LCP ist die H1 (Text)**, nicht ein Bild.
- Tablet: 8 Fenster, Bühne 160vh. Mobile: siehe §8. Reduzierte Bewegung: Bühne ohne Sticky, direkt im Raster, kein Ziehen.

### S2: Tab-Leiste + Tab-Zähler

**Was passiert:** Der aktive Tab folgt dem Scrollen. Jedes Projekt, das mindestens 60 % sichtbar war (Karte, Pin, Verlaufszeile) oder geöffnet wurde, erhöht einmalig den Zähler „Tabs offen“. Der Zähler steht im Header-Quadrat, im **Favicon** (Badge) und im Seitentitel, sobald der Tab im Hintergrund ist.

**Technik**

- Aktiver Abschnitt: `IntersectionObserver` mit `rootMargin: "-45% 0px -50% 0px"`. Der Tab-Wechsel läuft über `document.startViewTransition` nur für den Indikator (`view-transition-name: tab-indicator` am aktiven Tab), Fallback ohne Animation.
- Gesehen-Set: `Set<id>` in `sessionStorage` (`lmf-seen`, try/catch). Start = 1 („Neuer Tab“). Maximum = Anzahl Projekte + 1.
- Ziffernrolle: Jede Ziffer ist ein `<span>` mit einem Streifen 0–9, `translateY(-n * 1em)`. Sichtbar ist nur die Zahl. Für Screenreader: `aria-label="{n} von {max} Tabs geöffnet"` am Button, kein Live-Region-Spam. Nur Meilensteine (10, 25, alle) gehen in eine höfliche Live-Region.
- Favicon: 64×64-Canvas zeichnet `logo.svg` (einmal als `Image` geladen) plus roten Kreis mit Zahl (Mono, bold) und setzt `link[rel=icon]` auf `canvas.toDataURL()`. Das passiert nur bei Änderungen, gedrosselt auf 1×/500 ms. `favicon.svg` bleibt als Default im HTML.
- `visibilitychange`: Ist der Tab versteckt, lautet der Titel „({n}) Hier sind noch Tabs offen · LMF“. Beim Zurückkommen wird der Originaltitel wiederhergestellt.
- Alle gesehen: Toast „Alle {max} Tabs gesehen. Du bist offiziell neugieriger als mein Browser.“ und ✳-Konfetti (Canvas, 1.2 s, 40 Partikel; bei reduzierter Bewegung nur der Toast).

### S3: Omnibox / Command-Palette (⌘K · Strg+K · „+“ · Klick in die Adresszeile)

**Was passiert:** Ein zentrales Omnibox-Fenster öffnet sich. Es durchsucht Projekte, Abschnitte, Filter und Aktionen, komplett per Tastatur bedienbar. Das Modul wird beim ersten Öffnen oder in `requestIdleCallback` nachgeladen.

**Technik und Verhalten**

- `<dialog id="omnibox">` (modal) mit `<input role="combobox" aria-expanded aria-controls="omni-list" aria-activedescendant>` und `<ul role="listbox">` in Gruppen (`role="group"` + `aria-labelledby`): **Projekte**, **Abschnitte**, **Filter**, **Aktionen**.
- Tasten: ↑/↓ bewegen, Enter führt aus, Alt+Enter bzw. ⌘Enter öffnet bei Projekten den externen Link, Esc schließt, Tab bleibt im Dialog. `/` fokussiert (außerhalb von Eingabefeldern) die Archivsuche statt der Palette.
- Suche (`js/lib/search.js`): Normalisierung mit `toLocaleLowerCase("de")`, NFD ohne Diakritika, `ß→ss`, zusätzlich `ae/oe/ue → a/o/u`, damit „Kolpingtheater“, „Oilberts“ und „geogame“ treffen. Tokens werden UND-verknüpft. Score: Titel-Präfix 100, Wortanfang im Titel 60, Titel enthält 40, Stack/Tags 25, Kategorie 20, Hook/Beschreibung 10, Fuzzy-Subsequenz im Titel 15. Gleichstand wird nach `year` absteigend entschieden. Treffer werden mit `<mark>` hervorgehoben (escaped).
- Leer-Zustand ohne Eingabe: „Zuletzt geöffnet“ (aus `sessionStorage`), danach die Abschnitte.
- Kein Treffer: „Keine Treffer für „{q}“. Enter sucht im Archiv weiter.“ Das setzt die Archivsuche und scrollt hin.
- Aktionen (deutsch):
  `Gehe zu: Angepinnt / Alle Tabs / Kino / Verlauf / Über mich / Kontakt` · `Fotogalerie öffnen` ·
  `Nur Web & Apps / Games / KI / Film zeigen` · `Dunkles Design` / `Helles Design` / `Wie mein System` ·
  `Auf gut Glück` (zufälliges Projekt) · `Alle Tabs schließen` · `Link zu dieser Ansicht kopieren` ·
  `Mail an Logge schreiben` · `Quelltext dieser Seite ansehen`.
- Versteckte Befehle (erscheinen nur bei exakter Eingabe): `98`, `sudo …` („Netter Versuch.“), `bomberman`, `tabs zurücksetzen`.
- Öffnen und Schließen: `scale(.98)→1` + opacity (220 ms), Backdrop `backdrop-filter: blur(6px)` (nicht bei `prefers-reduced-transparency`).

### S4: Karte → maximiertes Fenster (Detailansicht mit Hash-Route)

**Was passiert:** Ein Klick auf eine Karte lässt ihr Bild per **View Transition** in ein großes Fenster wachsen. Das Fenster hat Titelleiste, Adresszeile mit Schloss, lokale Tabs und Navigation zum vorherigen und nächsten Tab. Die URL wird `#/p/{id}`. Zurück-Taste und Esc schließen, Deep-Links funktionieren, ⌘-Klick öffnet die Detailansicht im echten neuen Browser-Tab.

**Technik**

- Karten sind `<a class="card" href="{link}">`. Ohne JS führt das zum externen Projekt. JS setzt beim Rendern `href="#/p/{id}"`, damit Modifier-Klicks natürlich funktionieren.
- `js/core/router.js`: lauscht auf `hashchange`. `#/p/{id}` öffnet das Detail, `#/p/{id}/{tab}` öffnet direkt den Tab (story|stack|zahlen|medien|quellen), alles andere schließt es. Anker ohne `#/` bleiben normale Sprungmarken.
- Öffnen: Beim Klick bekommt das Karten-Medium `style.viewTransitionName = "win-media"` und die Titelleiste `"win-title"`. Dann `document.startViewTransition(async () => { await renderDetail(id); dialog.showModal(); card.style.viewTransitionName = ""; })`. Detail-Medium und -Titel tragen dieselben Namen. `::view-transition-group(win-media)` läuft mit `--t-window` und `--ease-spring`. Fallback: `dialog[open]` mit `@starting-style { opacity:0; transform: scale(.96) translateY(12px) }`.
- Daten: `data/stories/{id}.json` wird bei Hover oder Fokus der Karte vorgeladen (`fetch` mit `priority: "low"`, im Map-Cache) und beim Öffnen awaited. Beim Laden erscheint zuerst der Index-Inhalt (Titel, Hook, Bild) sofort, die Story blendet nach.
- **Fensteraufbau**
  - Titelleiste: Ampel als echte Buttons: Rot „Fenster schließen“, Gelb „Minimieren“ (schließt mit Flug-Animation zum Zähler), Grün „Vollbild umschalten“ (Fenster ↔ Vollfläche). Mittig `{title}`, rechts „Öffnen ↗“ (externer Link, Label bei Filmen „Film ansehen ↗“, bei Repos „Code ansehen ↗“).
  - Adresszeile: Schloss-Button „Seiteninfo“ + `{host}` in Mono. Die Seiteninfo ist ein `popover` mit „Quellen für diese Seite“, einer Liste `{label} · geprüft am {checkedAt} ↗` und dem Satz „Alles hier ist belegt. Wenn was nicht stimmt, sag Bescheid.“ plus Mail-Link.
  - Lokale Tabs (echtes ARIA-`tablist`, Pfeiltasten, automatische Aktivierung; es werden nur Tabs mit Daten angezeigt):
    - **Story**: Hook als großer Satz (`--fs-2`), Absätze, Highlights als nummerierte Liste mit Mono-Nummern `01 02 03`.
    - **Stack**: Stack-Chips plus **Sprachbalken** aus `repo.languages` (horizontaler Stapelbalken, Prozent direkt beschriftet, Sprachen unter 2 % als „Rest“, Farben aus einer festen 6er-Skala). Als Tabelle für Screenreader.
    - **Zahlen**: Kacheln wie Sterne, Forks, Commits, „Erstes Commit {Jahr}“, „Zuletzt aktualisiert {Monat Jahr}“, bei Filmen Jahr, Ort, Laufzeit, Rolle. Jede Kachel hat eine hochgestellte Quellenmarke `[1]`, die auf die Seiteninfo verweist. Fußnote: „Stand: {fetchedAt}“.
    - **Medien**: Screenshots (Scroll-Snap-Karussell mit Buttons), **Live-Vorschau** (S4a) bzw. YouTube-Fassade.
    - **Quellen**: dieselbe Liste wie die Seiteninfo, als normaler Inhalt.
  - Fuß: „Verwandte Tabs“ (3 Projekte mit geteilten Gruppen oder Tags, Score = gemeinsame Tags×2 + gemeinsame Gruppe) und `← {vorheriger}` / `{nächster} →` in Archivreihenfolge mit aktuellem Filter. Tasten `[` und `]` (bzw. ← und →, wenn der Fokus nicht in der Tablist ist).
- Schließen: Esc, Rot, Klick auf den Backdrop, Zurück-Taste. Wurde die Route von uns gepusht, folgt `history.back()`, sonst `history.replaceState(null, "", "#archiv")`. Der Fokus geht zurück zum Auslöser (Karte). Bei einem Deep-Link ohne Auslöser geht er zur passenden Karte im Archiv (wird bei Bedarf nachgerendert).
- Seitentitel während des Details: `{title} · LMF`. OG-Tags bleiben statisch (keine SSR).

**S4a: Live-Fenster (Pinned und Detail „Medien“)**

- Nur für Projekte mit `embed.verifiedAt`. `scripts/check-embeds.mjs` prüft per HEAD/GET, dass kein `X-Frame-Options` und kein `frame-ancestors` gesetzt ist, und schreibt das Datum. Stand 28.09.2026 hatten Bomberman, Kniffel, GeoGames, Learn AI, MelodAI, Coop Sudoku, BeatGuessr, ShareX Win98 und Frontier keinen dieser Header. Das muss vor dem Merge erneut geprüft werden.
- Vor dem Klick liegt dort nur das Poster mit dem Button „Live laden ▶“ (Label „Hier spielen ▶“ bei Games). Danach: `<iframe src loading="lazy" title="{title}, Live-Version" sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups" allow="fullscreen; autoplay">` im Fenster, skaliert (`transform: scale(var(--k))` bei fester 1280×800-Innenbreite) mit einem Hinweis, dass die Seite von `{host}` geladen wird.
- Verlässt das Fenster den Viewport oder schließt sich das Detail, wird das Iframe entladen (`src = "about:blank"`, dann entfernt), damit keine Game-Loops weiterlaufen.
- Tastatur: Button „Fokus aus dem Spiel holen“ direkt nach dem Iframe, weil Games Tasten abfangen können. Esc funktioniert innerhalb eines Iframes nicht zuverlässig, deshalb der Hinweis: „Zum Verlassen: Klick außerhalb oder Tab-Taste.“

### S5: Kino-Tab: Bildstörung per WebGL

**Was passiert:** Im Kino-Tab steht ein großer Player. Wählt man im Filmstreifen einen anderen Film, wechselt das Poster mit einer kurzen analogen Bildstörung (Chroma-Versatz, Zeilenrauschen, Filmkorn, 700 ms). Im Ruhezustand liegt feines animiertes Korn über dem Poster, auf Hover verschiebt sich der Chroma-Versatz leicht zur Mausposition. Play ersetzt das Canvas durch die YouTube-Fassade und dann das Iframe.

**Technik**

- Handgeschriebenes WebGL1 (`js/gl/film.js`, Ziel ≤ 4 KB gzip), ein Canvas über dem Poster, ein Fullscreen-Triangle.
- Uniforms: `uA`, `uB` (Poster-Texturen, gleiche Origin), `uP` (Übergang 0→1), `uT` (Zeit), `uM` (Maus 0–1), `uHover`, `uRes`.
- Fragment-Shader (Kern):
  ```glsl
  float n = hash(vec2(floor(v.y*uRes.y/3.), floor(uT*24.)));       // Zeilenrauschen
  float k = sin(uP*3.14159);                                       // Störung max. in der Mitte
  vec2 off = vec2((n-.5)*.08*k + (uM.x-.5)*.004*uHover, 0.);
  vec3 a = vec3(texture2D(uA,v+off*1.3).r, texture2D(uA,v).g, texture2D(uA,v-off).b);
  vec3 b = vec3(texture2D(uB,v+off).r, texture2D(uB,v-off*.6).g, texture2D(uB,v-off*1.3).b);
  vec3 c = mix(a, b, smoothstep(.35,.65,uP + (n-.5)*.3));
  c += (hash(v*uRes + uT) - .5) * .06;                             // Korn
  ```
- Rendern nur, solange der Abschnitt sichtbar ist und `document.visibilityState === "visible"`. Nach 2 s ohne Hover und ohne Übergang wird auf 12 fps gedrosselt. DPR ist auf 1.5 begrenzt. `webglcontextlost` führt zum CSS-Fallback.
- Fallback und reduzierte Bewegung: CSS-Crossfade 200 ms, statisches Korn als PNG-Overlay mit 4 % Deckkraft.
- Filmstreifen: `<ul role="listbox" aria-label="Filme">` mit Roving Tabindex (← → Home End), Enter wählt aus, `aria-selected`. Scroll-Snap, Perforation per `repeating-linear-gradient` in `::before/::after`.
- YouTube-Fassade: Poster + Play-Button. Der Klick injiziert `https://www.youtube-nocookie.com/embed/{id}?autoplay=1&rel=0`. Vor dem Klick werden keine Drittanbieter-Requests ausgelöst.

### S6: Neuer-Tab-Kontakt + Easter Eggs

**Kontakt:** siehe §3.9. Technik: `<form>` mit `action="mailto:…"` als No-JS-Fallback. JS baut `mailto:` mit `encodeURIComponent`, Subject = „Neuer Tab: “ + die ersten 6 Wörter. Die Textarea wächst mit (`field-sizing: content`, Fallback JS). Schnellwahl-Kacheln sind echte Links.

**Easter Eggs** (`js/chrome/eggs.js`, wird per `requestIdleCallback` geladen, alle abschaltbar und nie im Weg):

| Auslöser                                       | Effekt                                                                                                                                                                                                             |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Konami-Code oder `98` in der Omnibox           | **Windows-98-Skin**: lädt `css/skins/win98.css` (`data-skin="98"`), Titelleisten `#000080` mit weißem Text (16:1), Bevel-Buttons, `#c0c0c0`-Flächen. Toast: „Windows-98-Modus. Wer das mag, mag auch mein ShareX-Konzept →“ (verlinkt `sharex-win98`). Nochmal = aus. |
| „Alle Tabs schließen“ (Omnibox)                | Alle Fenster und Karten fliegen per View Transition zum Zähler, der Zähler fällt auf 1. Die Seite zeigt eine einzige Karte: „Leerer Tab. Endlich Ruhe.“ und den Button „Tabs wiederherstellen“ (auch Strg+Z). Inhalte werden nur per Klasse versteckt, `inert` am Rest, der Button bekommt den Fokus. |
| ✳ in der H1 dreimal klicken, oder `bomberman`   | Das ✳ „explodiert“ wie eine Bomberman-Bombe: Kreuz-förmige Flammen aus CSS-Blöcken (4 Richtungen, 3 Felder), 600 ms. Danach erscheint das ✳ wieder. Toast mit Link: „Das richtige Spiel gibt's hier →“.         |
| Browser-Tab verlassen                          | Titel „({n}) Hier sind noch Tabs offen · LMF“                                                                                                                                                                      |
| DevTools-Konsole                               | ASCII-LMF-Logo + „Du schaust in den Quelltext? Gleiche Neugier. → github.com/LoggeL/LMF“                                                                                                                           |
| `sudo …` in der Omnibox                        | „Netter Versuch.“                                                                                                                                                                                                  |
| 60 s Leerlauf auf der Hero-Bühne (vor dem Aufräumen) | Die Fenster driften langsam wie ein Bildschirmschoner (±6 px, 8 s Sinus). Stoppt bei jeder Eingabe. Nicht bei reduzierter Bewegung.                                                                                |

### S7 (klein, aber wichtig): Verlauf-Balken per Scroll-Timeline

Die Balken im Verlauf wachsen mit `animation-timeline: view(); animation-range: entry 10% cover 40%` von `scaleY(0)` auf 1, gestaffelt über `animation-delay` nach Index (in Scroll-Timelines wird `animation-range` pro Balken verschoben). Ohne Support (`@supports not (animation-timeline: view())`) sind sie einfach statisch da.

---

## 6. Archiv und Detail im Detail

### 6.1 Karte (Mini-Fenster)

```
┌ ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔ (3px Gruppenfarbe) ┐
│ ● ● ●   Bomberman           ↗         │  Titelleiste 36px, Mono
│ ┌───────────────────────────────────┐ │
│ │            Medium 16:10           │ │  thumb / Art-Kachel
│ └───────────────────────────────────┘ │
│ 2026 · Multiplayer · JS, Canvas       │  Mono, --ink-2
│ Bomben, Bots und Kettenreaktionen …   │  hook || summary
│ [Games] [Web & Apps]      Neu dabei   │  Gruppen-Labels, Status
└───────────────────────────────────────┘
```

- `<li><article>` mit `<h3><a class="card-link" href>` und einem Stretched-Link (`::after`, inset 0). Nur ein Tab-Stopp pro Karte.
- Art-Kacheln (typografische Motive für Projekte ohne Bild) bleiben und werden als „Tab ohne Vorschau“ gestaltet: großer Titel in Bricolage `wdth 75`, Gruppenfarbe als Fläche, Mono-Kategorie. Sie werden nie als Screenshot ausgegeben.
- Archivierte Projekte: Titelleiste entsättigt, Label „Archiv“, im Detail der Hinweis „Dieses Projekt gehört zum Archiv. Der ursprüngliche Link wird zur Dokumentation angezeigt.“
- `content-visibility: auto; contain-intrinsic-size: auto 420px` auf Karten.

### 6.2 Listenansicht

`<table>` mit `<caption class="sr-only">Alle Projekte als Liste</caption>`. Spalten: Projekt (Link auf `#/p/id`) · Gruppe(n) · Jahr · Stack · Status · Link ↗. Sortierbare Spaltenköpfe als `<button>` in `<th aria-sort>`. Mobile (< 560 px): Zeilen werden zu Blöcken (`display:grid`), die Spaltenlabels kommen per `data-label` und bleiben lesbar.

### 6.3 Zustand in der URL

Filter, Suche, Sortierung und Ansicht werden per `history.replaceState` in den Query-String geschrieben (`?gruppe=games&q=sudoku&sort=neu&ansicht=liste`, dann `#archiv`). Beim Laden werden sie gelesen. Teilen funktioniert, und „Link zu dieser Ansicht kopieren“ in der Omnibox nutzt genau das.

### 6.4 Detail

Siehe S4. Zusätzlich gilt: Hat ein Projekt nur Index-Daten, zeigt das Fenster Titel, Medium, Beschreibung, Tags und Link, ohne leere Tabs. Das ist der heutige Dialog im neuen Chrome.

---

## 7. Galerie (`gallery/`)

- Bleibt statisch und **funktioniert ohne JS**. Sie bekommt dieselbe Tab-Leiste als reines HTML (Links zurück auf `../#…`), die gleichen Tokens und Schriften.
- Kopf: „Abseits der Tabs.“ / „{77} Aufnahmen. Jede öffnet sich in einem neuen Tab. Natürlich.“
- Raster: Masonry-artig über `grid-template-rows: masonry` hinter `@supports`, sonst `columns: 4 240px`.
- `@view-transition { navigation: auto; }` auf beiden Seiten plus `view-transition-name: page-tab` am aktiven Tab. Der Wechsel Index ↔ Galerie sieht dann aus wie ein neuer Tab, der in der Leiste aufgeht (Chrome/Edge 126+, sonst normaler Seitenwechsel).
- Optional (reine Verbesserung): ein JS-Lightbox-Modul mit `<dialog>`, Pfeiltasten und `srcset` aus `medium/large`. Ohne JS bleibt der bestehende Link zum großen Bild.

---

## 8. Mobile (≤ 759 px, getestet ab 320 px)

- **Chrome wandert nach unten:** Oben bleibt nur eine schlanke Leiste (Logo + Adresszeile als Suchbutton). Unten sitzt eine fixierte Toolbar (56 px + `env(safe-area-inset-bottom)`) mit `Suche` (Omnibox), dem **Tab-Quadrat mit Zahl** und `Theme`. Das Quadrat öffnet die **Tab-Übersicht**: ein Vollbild-`<dialog>` mit einem 2-Spalten-Raster aus Abschnitts-„Tabs“ (Titel, ein Satz, Anzahl), also die Navigation. Schließen mit „Fertig“, Esc oder Wisch nach unten.
- Beim Scrollen nach unten verschwindet die untere Toolbar (translateY), beim Hochscrollen kommt sie zurück, wie in mobilen Browsern. Das passiert nicht, wenn der Fokus in ihr liegt.
- **Hero:** Statt Bühne gibt es einen Fensterstapel aus 3 Karten (leicht rotiert). Der Button „Nächster Tab ↻“ und Wischen nach links/rechts blättern (Pointer Events, Schwelle 60 px). Die restlichen Projekte stehen darunter als horizontaler Tab-Streifen (Scroll-Snap). Kein Sticky-Scrollen.
- **Angepinnt:** gestapelt, Live-Laden nur per Button. Hinweis bei Games: „Am Handy am besten im eigenen Tab ↗“ mit direktem Link.
- **Archiv:** Standard = Liste (kompakte Karten mit 64 px Thumbnail links), Umschalten auf Kacheln (1 Spalte). Die Filterchips scrollen horizontal mit Fade-Kanten. Die Suche steht über den Chips in voller Breite.
- **Detail:** Vollbild-Sheet von unten. Ziehgriff oben; Ziehen nach unten über 120 px schließt (Pointer Events, nur am Griff und an der Titelleiste, damit der Inhalt normal scrollt). Die lokalen Tabs scrollen horizontal. `overscroll-behavior: contain`.
- **Kino:** Player in voller Breite, Filmstreifen darunter, WebGL nur bei `pointer: fine` **oder** wenn `navigator.hardwareConcurrency ≥ 6`. Sonst CSS-Crossfade.
- **Verlauf:** nur vertikale Liste, Balkendiagramm quer mit 8 Balken und Beschriftung unter den Balken.
- Touch-Ziele ≥ 44×44 px, keine Hover-only-Informationen (Tab-Vorschaukarten existieren mobil nicht).

---

## 9. Reduzierte Bewegung (`prefers-reduced-motion: reduce`)

Global über `js/core/motion.js` (`reduced` als Signal mit `matchMedia`-Listener) und CSS:

| Feature               | Normal                               | Reduziert                                                        |
| --------------------- | ------------------------------------ | ---------------------------------------------------------------- |
| Hero-Bühne            | Sticky 220vh, Chaos → Raster, Ziehen | Keine Sticky-Bühne, Fenster direkt im Raster, kein Ziehen, keine Drift |
| View Transitions      | Morph 420 ms spring                  | `::view-transition-group(*) { animation-duration: 0s }`, nur Opacity-Crossfade 120 ms |
| Zähler                | Ziffernrolle                         | Zahl springt                                                     |
| Kino                  | WebGL-Störung + Korn                 | Crossfade 150 ms, statisches Korn                                |
| Verlauf-Balken        | Scroll-getrieben                     | Statisch                                                         |
| Smooth Scroll         | `scroll-behavior: smooth`            | `auto`                                                           |
| Gummibären-Video      | Autoplay muted loop                  | Poster + Play-Button                                             |
| Konfetti, Explosion   | Animiert                             | Nur Toast / Symbolwechsel                                        |
| Headline-Achse        | Pointer-gesteuert                    | Fest                                                             |

Zusätzlich: `prefers-reduced-transparency` schaltet Backdrop-Blur ab, `prefers-contrast: more` setzt `--line` auf `--ui-border` und entfernt Korn und Schatten.

---

## 10. Barrierefreiheit (WCAG 2.2 AA, beide Themes, Win98-Skin inklusive)

- **Landmarks:** `header` (Tab-Leiste = `nav aria-label="Abschnitte"`), `main`, Abschnitte als `section aria-labelledby`, `footer`. Skip-Link „Zum Inhalt“ zuerst im DOM, dazu „Zur Suche“.
- **Überschriften:** genau eine H1. H2 pro Abschnitt, H3 pro Karte/Fenster. Das Detail-Fenster nutzt `aria-labelledby` auf seinen H2.
- **Tastatur:** alles erreichbar. Sichtbarer Fokus mit `outline: 3px solid var(--focus); outline-offset: 3px` (≥ 3:1 auf allen Flächen). Keine Tastaturfallen außer in modalen Dialogen, dort ist der Fokus eingeschlossen (natives `<dialog>` + `inert`). Shortcuts (⌘K, `/`, `[`, `]`) greifen nie, wenn der Fokus in einem Eingabefeld liegt. Sie sind in einer „Tastenkürzel“-Liste dokumentiert (Omnibox-Aktion „Tastenkürzel anzeigen“, `?`-Taste).
- **Ziehen:** immer mit Einzelzeiger- und Tastaturalternative („Aufräumen“, Klick öffnet, Sheet hat „Schließen“).
- **Zähler und Deko:** Ampelpunkte auf Karten, Perforation, Korn, Konfetti sind `aria-hidden`. Der Zähler-Button hat ein sprechendes Label. Live-Regionen nur für Suchstatus, Meilensteine und Toasts (`role="status"`).
- **Bewegung, Blinken, Auto-Play:** nichts blinkt mehr als 3×/s (die Zeilenstörung läuft mit 24 Hz, aber mit geringer Amplitude und nur 700 ms, deutlich unter der Flash-Schwelle, da nicht flächig hell/dunkel). Video mit Pause-Button (2.2.2).
- **Bilder:** `imageAlt` aus den Daten, Art-Kacheln `aria-hidden` mit Textalternative im Kartenkopf. Screenshots bekommen Alt-Texte aus der Recherche; ohne Alt-Text wird kein Screenshot veröffentlicht.
- **Iframes:** `title` Pflicht, nur nach Nutzeraktion geladen, „Fokus aus dem Spiel holen“-Button.
- **Sprache:** `lang="de"`, englische Begriffe mit `lang="en"` (z. B. das GitHub-Bio-Zitat).
- **Zoom und Reflow:** 400 % Zoom bzw. 320 CSS-px ohne horizontales Scrollen (1.4.10). Textabstände nach 1.4.12 dürfen nichts abschneiden: keine festen Höhen auf Textcontainern.
- **Tests:** axe-core für hell, dunkel, Win98-Skin, geöffnetes Detail und geöffnete Omnibox; zusätzlich manuell VoiceOver (Safari) und NVDA (Firefox) auf Palette, Tabs und Filmstreifen.

---

## 11. Performance-Budget

| Metrik (Moto-G-Klasse, Fast 4G, Lighthouse mobile) | Ziel     |
| -------------------------------------------------- | -------- |
| LCP                                                | < 1.8 s (hartes Limit 2.5 s) |
| CLS                                                | < 0.02   |
| INP                                                | < 150 ms |
| TBT                                                | < 100 ms |
| Transfer erster Viewport                           | ≤ 450 KB |

| Ressource                                   | Budget (gzip)                   | Laden                                           |
| ------------------------------------------- | ------------------------------- | ----------------------------------------------- |
| HTML (inkl. prerendertem Archiv)            | ≤ 28 KB                         | sofort                                          |
| CSS `lmf.css` (mit `@layer`)                | ≤ 24 KB                         | render-blocking, 1 Datei                        |
| CSS `skins/win98.css`                       | ≤ 4 KB                          | nur beim Egg                                    |
| Fonts                                       | ≤ 85 KB (2 Dateien)             | Bricolage per `preload`, Mono `font-display: swap` |
| JS initial (`main` + core + chrome + hero + archive) | ≤ 32 KB                 | `type=module`, `modulepreload` für core         |
| JS lazy: omnibox ≤ 7 · detail ≤ 9 · films+gl ≤ 7 · history ≤ 4 · eggs ≤ 4 | je KB | Interaktion / `IntersectionObserver` (rootMargin 50%) / idle |
| `data/projects.json`                        | ≤ 30 KB                         | `fetch` sofort, dazu `<link rel="preload" as="fetch" crossorigin>` |
| `data/stories/*.json`                       | je ≤ 6 KB                       | Hover/Fokus-Prefetch                            |
| Hero-Thumbnails                             | 12 × ≤ 30 KB, 4 eager           | `fetchpriority="low"`                           |

- **Kein Framework, keine Vendor-Libs.** WebGL ist handgeschrieben. `js/vendor/` bleibt leer.
- Main-Thread: ein einziger rAF-Loop (`js/core/loop.js`) für Bühne, Headline-Achse und Zähler. Registrierte Tasks laufen nur, solange sie aktiv sind. Scroll-Listener passiv, keine Layout-Reads im Frame (Maße per `ResizeObserver` gecacht).
- Bilder: `scripts/thumbs.mjs` (devDependency `sharp`) erzeugt `assets/img/thumbs/*-480.webp` und `-960.webp`, `srcset` + `sizes` auf Karten.
- **Aufräumen:** `assets/img/avifenc.exe` (10 MB) gehört nicht auf den Webserver und sollte gelöscht werden. Ebenso ungenutzte `.png`-Originale, sofern nichts auf sie verweist (Prüfung per Skript).
- Cloudflare Web Analytics bleibt (`defer`, nach dem Rest).

---

## 12. Datei- und Modularchitektur

```
index.html                 prerenderte Inhalte (Hero-Fenster, Pins, Archiv als Liste, Verlauf), JS verbessert
404.html                   „Dieser Tab ist abgestürzt.“
css/
  lmf.css                  @layer reset, tokens, base, chrome, window, sections, archive, detail, kino, utilities
  skins/win98.css          Easter-Egg-Skin (lazy)
js/
  main.js                  Boot: Theme, Daten, Router, Sektionen registrieren, Lazy-Imports planen
  projects.js              BLEIBT: escapeHtml, safeUrl, filterProjects (Signatur unverändert, nutzt lib/search normalize), projectVisual, projectCard → cardHTML
  core/
    dom.js                 $, $$, html``-Tagged-Template mit Auto-Escape, on()
    store.js               Mini-Store (get/set/subscribe) für filter, query, sort, view, seen, theme, skin
    router.js              Hash-Routen #/p/:id(/:tab), Push/Replace-Buchhaltung
    motion.js              reduced-Signal, Easings in JS, vt(fn): View-Transition-Wrapper mit Fallback
    loop.js                ein rAF-Loop, add/remove Tasks, pausiert bei hidden
    storage.js             try/catch-Wrapper für local/sessionStorage
  lib/
    search.js              normalize(), score(), highlight()
    seed.js                mulberry32, Tages-Seed
  chrome/
    tabstrip.js            aktiver Abschnitt, Tab-Vorschaukarten, Adresszeile
    counter.js             Gesehen-Set, Ziffernrolle, Favicon-Badge, Titel bei hidden, Meilensteine
    omnibox.js   (lazy)    Palette, Befehle, versteckte Befehle
    tab-overview.js (lazy) mobile Abschnittsübersicht
    toast.js               role=status-Toasts
    eggs.js      (idle)    Konami, Explosion, Tabs schließen, Konsole, Bildschirmschoner
  sections/
    hero-desk.js           S1 Bühne + mobiler Stapel
    pinned.js              angepinnte Fenster, Live-Laden
    archive.js             Filter, Suche, Sortierung, Ansicht, URL-Sync, Mehr laden
    kino.js      (lazy)    Player, Filmstreifen, YouTube-Fassade
    history.js   (lazy)    Verlauf + Balken
    about.js               Zahlenreihe, Persona-Zeitleiste
    network.js             Partner, Video-Steuerung
    contact.js             Neuer-Tab-Mail-Komposition
  windows/
    window.js              Fenster-Chrome-Markup (Titelleiste, Adresszeile) für alle Kontexte
    detail.js    (lazy)    S4 Detail-Dialog, lokale Tabs, verwandte Tabs, Seiteninfo
    live-frame.js(lazy)    S4a Iframe-Laden/Entladen/Skalieren
    languages.js (lazy)    Sprachbalken
  gl/
    film.js      (lazy)    S5 WebGL1, Shader inline als Template-Strings
  vendor/                  (leer, bewusst)
data/
  projects.json            Index (erweitert, §2.2)
  stories/<id>.json        Tiefe pro Projekt (§2.3)
  stats.json, timeline.json, partners.json, socials.json
assets/
  fonts/Bricolage.var.woff2, JetBrainsMono.var.woff2, OFL-*.txt
  img/thumbs/*-480.webp, *-960.webp ; img/shots/* (Recherche-Screenshots mit Quelle)
scripts/                   (nur Entwicklung, nie im Deploy nötig)
  validate.mjs             erweitert: Schema, Quellenpflicht (story/highlights/repo/film/media ⇒ sources ≥ 1), Alt-Texte, Prerender aktuell?
  merge-research.mjs       docs/research/*.json → data/projects.json + data/stories/*.json (nur belegte Felder)
  fetch-stats.mjs          gh api → data/stats.json, repo-Blöcke in stories aktualisieren (fetchedAt)
  check-embeds.mjs         X-Frame-Options / CSP frame-ancestors prüfen → embed.verifiedAt
  thumbs.mjs               sharp → Thumbnails
  prerender.mjs            füllt <!-- lmf:archive --> / <!-- lmf:desk --> / <!-- lmf:history --> in index.html aus data/
tests/
  portfolio.spec.js        erweitert (§13)
```

**Prerendering statt Build-Step:** `scripts/prerender.mjs` ist ein Autoren-Werkzeug wie `validate.mjs`. Es schreibt zwischen Kommentar-Marken statisches HTML in `index.html` (Archiv als Linkliste mit externen Links, Hero-Fenster, Verlauf). Das Ergebnis wird committet, das Deployment bleibt reine statische Auslieferung. Vorteile: Ohne JS ist das Archiv als Liste vollständig lesbar, der erste Paint zeigt echte Inhalte, und Suchmaschinen sehen alle Projekte. `validate.mjs` schlägt fehl, wenn das Prerender veraltet ist. JS ersetzt die Marken-Inhalte beim Boot durch die interaktiven Versionen, mit denselben Maßen, damit kein CLS entsteht.

**Rendering-Konvention:** Alle HTML-Strings entstehen über das `html```-Template aus `core/dom.js`, das Interpolationen escaped (bestehende `escapeHtml`-Logik). Rohes HTML ist nur über ein explizites `raw()` erlaubt. URLs laufen immer durch `safeUrl`.

---

## 13. Tests (Erweiterung `tests/portfolio.spec.js`)

1. Archiv: Gruppen × Suche × Sortierung, Umlaut-Normalisierung („kolping“, „oilbert“), leerer Zustand + Reset, „Weitere Tabs öffnen“ fokussiert die erste neue Karte, Listenansicht sortiert per `aria-sort`, URL-Sync und Reload stellen den Zustand wieder her.
2. Omnibox: ⌘K/Strg+K öffnet sie, Pfeiltasten + `aria-activedescendant`, Enter öffnet das Detail, Esc gibt den Fokus zurück, `/` fokussiert die Archivsuche, Shortcuts greifen nicht in Inputs.
3. Detail: Deep-Link `#/p/melodai` öffnet das Detail, Zurück-Taste schließt es, Fokus-Rückgabe, lokale Tabs per Pfeiltaste, fehlende Daten erzeugen keine leeren Tabs, Seiteninfo listet Quellen.
4. Live-Fenster: vor dem Klick **kein** Iframe und kein Request an den Embed-Host bzw. YouTube (per `page.on("request")` geprüft), danach Iframe mit `title`; Entladen beim Schließen.
5. Zähler: Scrollen durchs Archiv erhöht ihn, `sessionStorage`-Persistenz, Label korrekt.
6. Hero: „Aufräumen“ ohne Ziehen erreichbar. Bei `reducedMotion: "reduce"` gibt es keine Sticky-Bühne und keine laufende Animation (`document.getAnimations()` leer nach Load).
7. Layout: kein horizontaler Überlauf bei 320, 375, 768, 1024, 1440, 1920. Keine Texte, die aus Fenstern ragen.
8. axe: hell, dunkel, Win98, Detail offen, Omnibox offen, mobile Tab-Übersicht offen.
9. Ohne JS (`javaScriptEnabled: false`): Archivliste mit allen Projekten und Links sichtbar, Kontakt-Mail sichtbar, Galerie vollständig.
10. Datenfehler: `projects.json` 500 → prerendete Liste bleibt, Hinweis erscheint, Kontakt und GitHub bleiben erreichbar.
11. Performance-Smoke: Summe JS beim ersten Load ≤ 32 KB gzip (über `response.body()` + zlib), keine Requests an Drittanbieter außer Cloudflare-Beacon vor Interaktion.

---

## 14. Umsetzungsreihenfolge (für einen Durchgang)

1. Tokens, Schriften, Chrome-Grundgerüst, `window.js`, Karten und Archiv (inkl. URL-Sync, Liste) sowie Prerender. Damit ist die Seite **vollständig nutzbar**.
2. Router + Detailfenster + View Transitions + Seiteninfo + Datenmerge (`merge-research`, `fetch-stats`).
3. Tab-Leiste aktiv/Zähler/Favicon, mobile Toolbar + Tab-Übersicht.
4. Hero-Bühne S1 (Desktop, Tablet, mobiler Stapel, reduziert).
5. Omnibox S3.
6. Kino S5 + Verlauf S7 + Über mich + Netzwerk + Kontakt S6.
7. Easter Eggs, 404, Galerie-Chrome + Cross-Document-Transition.
8. Tests, Budgets, axe, manuelle Screenreader-Runde, Aufräumen (`avifenc.exe`, alte PNGs, `Montserrat.woff2`).

---

## 15. Risiken und Gegenmaßnahmen

- **Gimmick frisst Inhalt:** Jede Spielerei hat eine langweilige, vollständige Alternative (Liste, Buttons, Prerender). Die Tests 6 und 9 sichern das ab.
- **Leere Tiefe:** Wenn die Recherche für viele Projekte nichts Belegtes liefert, wirken Detailfenster dünn. Gegenmaßnahme: Tabs nur bei vorhandenen Daten zeigen, Karten mit `hook` bevorzugt kuratieren, angepinnte Projekte nach Datentiefe auswählen.
- **Iframe-Einbettung** kann sich jederzeit ändern (Header, Cookie-Banner, Performance). `check-embeds.mjs` läuft vor jedem Deploy, und Live-Laden ist immer opt-in.
- **Tastenkürzel-Konflikte** (Strg+K in Firefox): nur `preventDefault`, wenn der Fokus nicht in einem Feld liegt. Die Omnibox ist zusätzlich über „+“ und die Adresszeile erreichbar.
- **View Transitions / Scroll-Timelines** fehlen in manchen Browsern: jede Nutzung liegt hinter Feature-Detection, die Fallbacks sind in §5 und §9 definiert.
- **Mobile Performance** der Bühne: mobil gibt es keine Bühne, WebGL wird nur bedingt aktiviert.
- **Favicon-Badges** ignoriert Safari: rein additiv, nichts hängt davon ab.
