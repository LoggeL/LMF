# LMF Spielplatz — Konzept

> **Arbeitstitel:** Spielplatz. Jedes Projekt ein Spielzeug.
> **Leitsatz:** Nicht erklären. Anfassen.
> **Status:** Konzept-Spec für einen vollständigen Redesign-Durchgang von `lmf.logge.top`. Statisch, kein Build-Schritt, Vanilla-ES-Module, keine Runtime-Abhängigkeiten.

Spec prose is in English for implementation precision. **All user-facing copy is German**, in Logge's casual first-person voice, and is marked as `Copy`. Treat copy drafts as final unless the research data contradicts them. In that case the data wins and the line gets cut, never "adjusted" into a claim.

---

## 0. The non-negotiable rule (read first)

The repo rule "never invent content" shapes this concept. Four consequences:

1. **Toys are replicas, not screenshots.** Every bespoke interaction is a *Nachbau*: a hand-built miniature that demonstrates the *documented* core idea of a project. Each toy carries a visible chip `Nachbau` and a line in its package insert (see below):
   `Copy:` „Das hier ist ein vereinfachter Nachbau für diese Seite. Das Original ist einen Klick weiter.“
   A toy may only simulate mechanics that are backed by a source (README, repo description, live page, existing `projects.json` text). The source for each mechanic is listed in section 6.
2. **Every fact field is optional, and none is ever filled with a placeholder.** A missing `year`, stack, or stars count hides that row. No "—", no "coming soon", and no "2024?".
3. **Every non-trivial fact renders with its source** in the project dossier ("Quellen"). Repo stats render with a date (`Stand: 28.09.2026`), because they go stale.
4. **Numbers on the page are computed from the data**, never typed into HTML. That covers counts, year spans, and per-group totals. If the data changes, the copy changes with it.

---

## 1. Big idea and narrative

### The problem with the current site
The current editorial redesign is tidy and describes everything in the same voice at the same volume. A karaoke app, a Bomberman clone, and a ski aftermovie all get a 16:10 thumbnail, a category label, and two sentences. The site *tells* you Logge builds playful things. It never lets you *play*.

### The idea
**The portfolio becomes a Spielplatz, a playground of bespoke toys.** Each featured project gets a *Station*: a stage with a small, precise, hand-built interaction that shows what the project *is* in about five seconds of touching:

- you don't read "chain-reaction bombs", you **set off a chain reaction**
- you don't read "vocal separation and timed lyrics", you **pull the vocal fader down while the lyrics sweep**
- you don't read "Windows 98 design concept", you **drag a window across a Win98 desktop**

Next to every toy sits a **Beipackzettel** (package insert). It's the German toy-box metaphor, and it's where the site goes deep: story, stack, start year, repo stats, highlights, and sources. Toy for the hand, insert for the head.

Around the stations, the site is a bold, editorial, typographic object. It has a kinetic hero set in a visible type case (*Setzkasten*), a cursor-reactive dot grid ("Rasterfeld") running under the paper, a year-by-year *Chronik*, a film *Schneideraum*, and a dense, sortable **Index** of the entire archive with a full-screen **Projektakte** (dossier) for every project.

### Narrative arc (scroll order = story)
1. **Neugier** (Hero): who, and the one-line thesis. *Aus Neugier. Gemacht.*
2. **Spielplatz** (6 Stations): proof by touch.
3. **Chronik**: how it grew, year by year, from camera to code to both.
4. **Schneideraum**: the film side, as a filmstrip.
5. **Index**: everything, sortable, searchable, with deep dives.
6. **Hinter den Tabs** (About): the person, organised as browser tabs.
7. **Selten ganz allein** (Network): the people.
8. **Abseits der Tabs** (Gallery teaser): photos as a contact sheet.
9. **Der nächste offene Tab** (Contact): a new-tab page with your mail in the address bar.

### Continuity with the existing brand
- The "offene Tabs" motif gets promoted from a caption to a **structural device**. The header navigation *is* a tab strip, the About section *is* tabbed, and Contact *is* a new-tab page.
- The logo stays (`assets/svg/logo.svg`, the italic heavy LMF). Its red `#d90429` becomes the brand accent family (tuned for AA, see §4.2).
- The ✳ asterisk from the current hero becomes the hero's first toy.

---

## 2. Information architecture

Single page `index.html` with hash routes for dossiers, plus the separate static `gallery/`. Section IDs are stable anchors. Existing anchors `#projects`, `#about` and `#socials` stay as aliases so old deep links don't break.

| # | Section | ID | Purpose | Primary data |
|---|---|---|---|---|
| — | Header / tab strip | — | nav, scroll-spy, theme, motion toggle | — |
| 00 | Hero | `#home` | thesis, kinetic type, verb toy | counts from `projects.json` |
| 01 | Spielplatz | `#spielplatz` | 6 stations with toys + Beipackzettel | `projects.json` v2 + `toy` key |
| 02 | Chronik | `#chronik` | year stacks + persona milestones | `year`, `data/timeline.json` |
| 03 | Schneideraum | `#filme` | filmstrip of all `film` projects | `film` fields |
| 04 | Index | `#index` (alias `#projects`) | complete archive, sort/filter/search/views | all projects |
| — | Projektakte | `#/projekt/<id>` | full-screen dossier dialog | everything per project |
| 05 | Hinter den Tabs | `#about` | tabbed About | static copy + project refs |
| 06 | Selten ganz allein | `#netzwerk` (alias `#partners`) | partners as sticker wall | `partners.json` |
| 07 | Abseits der Tabs | `#galerie` | contact-sheet teaser → `gallery/` | 12 fixed gallery images |
| 08 | Der nächste offene Tab | `#kontakt` (alias `#socials`) | new-tab-page contact | `socials.json` |
| — | Footer | — | sign-off, shortcuts hint | — |

### 2.1 Header: the tab strip
- Left: logo (SVG, 40px high) as brand link to `#home`.
- Center: nav rendered as **browser tabs**: `Spielplatz`, `Index`, `Filme`, `Über mich`, `Kontakt`. Each tab has a tiny favicon-dot in its group colour. Scroll-spy (IntersectionObserver on sections, threshold 0.35) raises the active tab: surface colour, top border in accent, and `aria-current="true"`. Tabs are plain links, not ARIA tabs, because this is navigation.
- Right: counter chip, theme toggle, motion toggle.
  - Counter chip `Copy:` „**39** offene Tabs“. The number comes from `projects.length`. Clicking it goes to `#index`.
  - Motion toggle `Copy:` label „Bewegung“ with states „an“ / „ruhig“ (see §9).
- Mobile (< 760px): the tab strip becomes a horizontally scrollable strip under the logo row (`overflow-x: auto; scroll-snap-type: x`), with no hamburger. The active tab scrolls into view with `scrollIntoView({inline:'nearest'})`. This drops the menu toggle. The existing mobile-menu test gets replaced (§14).
- Fun detail: on `visibilitychange` → hidden, `document.title` becomes `„✳ Noch ein Tab offen …“`, and it restores on return. It's harmless and on-motif.

### 2.2 Hero (`#home`)
Layout: full viewport height minus header (`min-height: calc(100svh - var(--header-h))`), 12-column grid.

```
Copy:
Eyebrow (mono):   LMF / Spielplatz — Web · Games · KI · Film
H1:               Aus Neugier.
                  Gemacht. [✳]
Sub:              Ich baue Apps, Spiele und Filme. Die meisten davon kannst du
                  hier direkt anfassen, bevor du sie öffnest.
CTA primary:      Los, anfassen ↓          → #spielplatz
CTA secondary:    Alles im Index →         → #index
Hint (mono, small, next to ✳):  Tipp: Drück auf den Stern.
Live line (aria-live=polite):   39 Projekte. Alle aus Neugier.
Bottom rail (mono):  Unabhängig. Aus Deutschland.  |  seit {minYear}  |  Scrollen ↓
```

**The verb toy (✳):** the asterisk is a `<button>`. Each press cycles the second line and recomputes the live line from data:

| Verb | Filter | Live line template |
|---|---|---|
| Gemacht. | all | „{n} Projekte. Alle aus Neugier.“ |
| Gebaut. | `web` | „{n} Web-Apps und Tools. Die meisten laufen noch.“ ⚠ only if ≥50% have a non-GitHub, non-YouTube live link. Otherwise „{n} Web-Apps und Tools.“ |
| Verspielt. | `games` | „{n} Spiele. Für den nächsten Abend mit Freunden.“ |
| Gedreht. | `film` | „{n} Filme. Von Skipiste bis Segelboot.“ |
| Gepromptet. | `ai` | „{n} Projekte mit KI. Neugier mit Rechenzeit.“ |

After the verb changes, "Los, anfassen" becomes `Zeig mir {Verb-Gruppe} ↓`, and it links to `#index` with that filter pre-applied (`#index?gruppe=games`). `{minYear}` = min `year` across projects. Hide the segment if no years are present.

### 2.3 Spielplatz (`#spielplatz`)
```
Copy:
Eyebrow:  01 / Der Spielplatz
H2:       Nicht erklären.
          Zeigen.
Lead:     Sechs Projekte, sechs kleine Nachbauten. Keine Screenshots zum Angucken,
          sondern Spielzeug zum Ausprobieren. Das Original ist jeweils einen Klick weiter.
```
Then six **Stations** in this order. Rhythm alternates dark/light and fast/slow.

| Station | Project(s) | Toy | Stage world |
|---|---|---|---|
| 01 | Bomberman (`bomberman-web`) | Kettenreaktion (canvas) | always-dark arcade |
| 02 | MelodAI (`melodai`) | Karaoke-Sweep + Stem-Fader | theme paper |
| 03 | ShareX-Trilogie (`sharex-win98`, `sharex-capture-engine`, `sharex-afterimage`) | Win98-Desktop | teal desktop `#008080` |
| 04 | Kniffel (`kniffel`) | 3D-Würfel | felt green |
| 05 | Transcripator (`transcripator`) | Wellenform + Live-Transkript | theme surface |
| 06 | GeoGames (`geo-game`) | Flaggen-Tease + Mini-Globus | ocean blue |

**Station anatomy (desktop ≥ 1024px):**
```
┌────────────────────────────────────────────────────────────────────┐
│  01  (outline numeral, 22vw, behind, parallax 0.15)                 │
│ ┌──────────── 4 col ───────────┐ ┌────────────── 8 col ───────────┐ │
│ │ Station 01 · Games · Nachbau │ │                                │ │
│ │ BOMBERMAN  (display XL)      │ │          TOY STAGE             │ │
│ │ Hook line (1 sentence)       │ │   aspect 4:3, min-h 440px      │ │
│ │ How-to line (mono, small)    │ │                                │ │
│ │ ┌─ Beipackzettel ──────────┐ │ │                                │ │
│ │ │ Was es ist / Womit / Seit│ │ └────────────────────────────────┘ │
│ │ │ Stats / Highlights (3)   │ │  Toy toolbar: [Neu] [Alles zünden]│
│ │ │ Projektakte → | Original↗│ │                                    │
│ │ └──────────────────────────┘ │                                    │
│ └──────────────────────────────┘                                    │
└────────────────────────────────────────────────────────────────────┘
```
Even stations mirror (stage left). The left column is `position: sticky; top: calc(var(--header-h) + 24px)` while the stage scrolls, but only when the stage is taller than the column.

**Beipackzettel** (package insert) is a `<dl>` styled like a pharmacy leaflet: mono, hairline rules, and a folded-corner clip-path. Rows render only when data exists.
```
Copy (labels):
Was es ist        → project.summary
Womit gebaut      → stack chips (max 5)
Seit              → year  (+ „Repo seit {createdAt-year}“ only if different and sourced)
Im Repo           → „★ {stars} · {language} · letzter Commit {pushedAt, relativ}“  + „Stand: {fetchedAt}“
Was drin steckt   → 3 highlights (bullet)
Hinweis           → „Das hier ist ein vereinfachter Nachbau für diese Seite.“
Links             → „Projektakte öffnen →“ (#/projekt/<id>)   „Zum Original ↗“
```

**Station copy drafts.** Facts are from existing data and READMEs. Anything marked ⚠ must be verified against research before shipping.

**Station 01: Bomberman**
```
Kicker:  Station 01 · Games · Nachbau
Title:   Bomberman
Hook:    Eine Bombe kommt selten allein. Leg eine hin und schau, was die Nachbarn machen.
How-to:  Feld antippen oder mit Pfeiltasten wählen · Leertaste legt eine Bombe · R räumt auf
Insert highlights (README bomberman-web):
  – Lokal zu zweit an einer Tastatur oder online mit Raumcode
  – Sechs Arenen mit 15 × 13 Feldern, neun Power-ups, Bots
  – Eine deterministische Engine, die im Browser und auf dem Server gleich läuft
Toy readout:  Kette: {n}   Rekord: {best}
```
**Station 02: MelodAI**
```
Kicker:  Station 02 · KI & Musik · Nachbau
Title:   MelodAI
Hook:    Gesang raus, Text drauf, selber singen. MelodAI trennt Stimme und Instrumental
         mit KI und legt zeitlich passende Lyrics darüber.
How-to:  Play drücken · Regler für Gesang und Instrumental · Ton ist aus, bis du ihn anmachst
Note:    Statt eines echten Songs singt hier diese Website. Songtexte gehören anderen.
Insert highlights (README MelodAI):
  – Stimmtrennung per KI
  – Zeitlich abgestimmte Lyrics, synchrone Wiedergabe
  – Gesang und Instrumental getrennt regelbar
```
**Station 03: ShareX, dreimal**
```
Kicker:  Station 03 · Webdesign · Nachbau
Title:   ShareX, dreimal.
Hook:    Drei unabhängige Ideen, wie die ShareX-Website aussehen könnte. Gefragt hat mich
         keiner, gemacht hab ich's trotzdem. Kein offizieller Auftritt.
How-to:  Doppelklick oder Enter auf ein Symbol · Titelleiste ziehen oder mit Pfeiltasten schieben
Insert:  one row per concept: Capture Engine (Three.js), Windows 98, Afterimage (KI-Bildmaterial)
```
**Station 04: Kniffel**
```
Kicker:  Station 04 · Multiplayer · Nachbau
Title:   Kniffel
Hook:    Drei Würfe, fünf Würfel, keine Ausreden. Im Original mit bis zu sechs Leuten,
         Reaktionen und Live-Rangliste. Hier erstmal nur du.
How-to:  Würfeln · Würfel antippen zum Halten · nach drei Würfen neue Runde
```
**Station 05: Transcripator**
```
Kicker:  Station 05 · KI & Audio · Nachbau
Title:   Transcripator
Hook:    Audio rein, Text raus, Zusammenfassung obendrauf. Hier transkribiert sich die
         Seite einfach selbst.
How-to:  Abspielen oder am Regler ziehen · „Zusammenfassen“ drücken
```
**Station 06: GeoGames**
```
Kicker:  Station 06 · Geografie · Nachbau
Title:   GeoGames
Hook:    Jeden Tag ein paar Minuten Weltkarte. Länder erkennen, Flaggen zuordnen,
         Orte finden. Hier: Welche Flagge ist das?
How-to:  Antwort wählen · je schneller, desto weniger Kacheln aufgedeckt
```
Closing line under station 06:
`Copy:` „Das waren sechs. Es gibt noch {n − 8}. → Zum Index“. The eight stations projects are 6 + 2 extra ShareX, so this is computed as `projects.length − stationProjectIds.length`.

### 2.4 Chronik (`#chronik`)
```
Copy:
Eyebrow:  02 / Die Chronik
H2:       Wie aus einem Tab
          {n} wurden.
Lead:     Jeder Block ist ein Projekt, jede Zeile ein Jahr. Die Farbe verrät, was es ist.
Legend:   ■ Web & Apps  ■ Games  ■ KI  ■ Film
```
- Layout: one row per year, from `minYear` to `maxYear`, descending (newest on top). Each row has the year in display type (tabular, `wdth 75`) on the left. On the right is a flex-wrap **stack of bricks**, one per project with that `year`, sorted by group. Each brick is a `<a href="#/projekt/<id>">` with the title as text. The brick is a pill with a group-colour left bar; on desktop, the title is truncated and the full title shows on hover and focus.
- Right rail per year: **persona milestone(s)** from `data/timeline.json` (research), rendered as mono notes, e.g. `2019 — Erste Segelreise gefilmt`. ⚠ Only research-sourced lines are used. Never write milestones by hand.
- Projects without `year` are listed in a final row `Copy:` „Ohne Jahreszahl“. The row is hidden if empty.
- Motion: bricks "drop" into place as each row enters (`animation-timeline: view()`, `animation-range: entry 0% entry 60%`, translateY(-40px) → 0 with the spring easing; stagger via `--i` custom property × 30ms of `animation-delay`). Wrap it in `@supports (animation-timeline: view())`. Without support, everything is static and visible.

### 2.5 Schneideraum (`#filme`)
```
Copy:
Eyebrow:  03 / Der Schneideraum
H2:       Urlaub, geschnitten.
Lead:     Skipisten, Segelboote, 48-Stunden-Drehs und eine Fantasy-Trilogie.
          Die ältesten Filme hier sind von {minFilmYear}.
Readout (mono, sticky above strip, aria-live=off):  TC {year} · {location} · {title}
```
- A horizontal **filmstrip** of all `film`-group projects, sorted by year descending. It's a native horizontal scroller (`overflow-x: auto; scroll-snap-type: x mandatory; overscroll-behavior-x: contain`) with frames at `scroll-snap-align: center`.
- Frame = image (`<img>` from `image`, 16:9 crop via `object-fit: cover`), with sprocket holes top and bottom drawn by a CSS `mask` of repeating radial gradients on a `::before`/`::after` band. A frame number in mono (`{index}A`, film-edge style) and a title below.
- Scroll-driven: each frame uses `animation-timeline: view(inline)` to scale from 0.88 to 1 and desaturate→saturate towards the center (`filter: saturate(.3)` → `saturate(1)`).
- The readout updates through an IntersectionObserver on frames (root = strip, threshold 0.6). The location comes from `film.location` (research) or is omitted.
- Controls: `‹` / `›` buttons scroll by one frame (`scrollBy({left: frameWidth, behavior})`). Pointer drag-to-scroll on desktop (pointer: fine) with momentum (velocity × 0.95 decay; disabled in reduced motion). Keyboard: the strip is focusable (`tabindex=0`, `role="region"`, `aria-label="Filmstreifen"`), so native arrow scrolling works, and each frame is a link.
- Frame click → `#/projekt/<id>`. The dossier holds the YouTube facade (§7.4).

### 2.6 Index (`#index`)
See §7 for behaviour.
```
Copy:
Eyebrow:   04 / Der Index
H2:        Alles. Sortiert,
           wie du willst.
Lead:      {n} Projekte seit {minYear}. Nach Jahr, Art oder Stack sortieren, durchsuchen,
           reinklicken. Eine Sammlung, kein Schlussstrich.
Search placeholder:  Titel, Stack, Ort …   (label: „Projekte durchsuchen“, hint: „Taste /“)
Sort label:          Sortieren nach
Sort options:        Jahr · Titel · Art · Stack
View label:          Ansicht
View options:        Liste · Raster · Zeitstrahl
Group filters:       Alle {n} · Web & Apps {n} · Games {n} · KI {n} · Film {n}
Stack cloud label:   Stack
Status line:         {visible} von {total} Projekten{filterSummary}
Empty state H3:      Hier ist noch Platz für eine Idee.
Empty state text:    Für „{q}“ gibt es kein Projekt. Noch nicht.
Empty state button:  Alles zeigen
```

### 2.7 Hinter den Tabs (`#about`)
```
Copy:
Eyebrow:  05 / Hey, ich bin Logge.
H2:       Ich wollte wissen,
          ob das geht.
Lead:     So fangen ziemlich viele meiner Projekte an.
```
Below it is an **ARIA tablist** styled as browser tabs. It's the same component skin as the header, but semantically real tabs. Each panel has a paragraph plus a row of 3–5 project chips linking to dossiers (picked by group/tag):

| Tab | Panel copy (all traceable to existing data) | Chips |
|---|---|---|
| Code | „Ich baue Web-Apps, meistens mit Next.js, manchmal ganz ohne Framework. Oft für ein Problem, das mich selbst nervt: Konzerte merken, Trainingspläne, Promille schätzen.“ | Setlist, Marathon Trainer, Voll-O-Meter, Kolpingtheater |
| Kamera | „Aftermovies von Ski- und Segelreisen, Kurzfilme aus 48-Stunden-Drehs und VFX für eine Fantasy-Trilogie, in der ich auch mitspiele.“ | Portes du Soleil, Infected, Exception, Selantis |
| KI | „Karaoke mit Stimmtrennung, Transkripte mit Zusammenfassung, ein Benchmark-Explorer und KI-Konzepte zum Anfassen.“ | MelodAI, Transcripator, Frontier, Learn AI |
| Spiele | „Spiele für den nächsten Abend mit Freunden. Würfeln, raten, Bomben legen. Am liebsten gemeinsam.“ | Bomberman, Kniffel, Coop Sudoku, BeatGuessr, Spyfall |
| Leute | „Selten ganz allein: Theater, eine Filmgruppe, Poolpartys und eine Discord-Community.“ | → scrolls to `#netzwerk` |

After the tabs:
`Copy:` „Unter Logge Media Forge sammle ich diese Dinge. Ich lerne beim Machen und lande dabei regelmäßig bei der nächsten Idee.“
Links: „Mein GitHub ↗“ · „Zur Fotogalerie →“.

Left column: the big LMF logo on a paper card ("HINTER DEN TABS." label, as today). It gets a slight 3D tilt toward the pointer (max 6°, `perspective: 900px`), and nothing in reduced motion.

### 2.8 Selten ganz allein (`#netzwerk`)
```
Copy:
Eyebrow:  06 / Selten ganz allein
H2:       Gute Leute.
          Gemeinsame Sachen.
```
**Sticker wall:** each partner is a die-cut sticker. It's an `<a>` with a white 6px "vinyl" outline via `filter: drop-shadow` stacking, random but seeded rotation (−7°…7°, seeded from id so it's stable across loads), logo, name, and one-line description from `partners.json`. Hover/focus: the sticker "peels" (rotate to 0, lift with `translateY(-4px)`, shadow grows). Gummibärenbande keeps its looping video (`gummibaeren.webm/mp4`, muted, `playsinline`), paused in reduced motion with the first frame as poster.

### 2.9 Abseits der Tabs (`#galerie`)
```
Copy:
Eyebrow:  07 / Abseits der Tabs
H2:       Manchmal nur ein Foto.
Lead:     77 Aufnahmen, ganz ohne Code drumherum.   ({n} is hard-coded in gallery/ only; here computed if a manifest exists, else static „Zur Galerie“ link)
CTA:      Zum Kontaktabzug →   (→ gallery/)
```
- A **contact sheet** (Kontaktabzug): a black strip holding 12 fixed thumbnails from `gallery/assets/img/small/*.webp`, with mono frame numbers (`12 ▸ 12A`), in a 6×2 grid (3×4 on mobile).
- Hover/focus on a frame draws a **grease-pencil circle** around it: an SVG ellipse with `stroke-dasharray` animated 0 → full in 420ms, in accent red, with a hand-drawn path (4 prepared path variants, pick by index).
- Every frame links to `gallery/#f{nn}`.

### 2.10 Der nächste offene Tab (`#kontakt`)
```
Copy:
Eyebrow:     08 / Der nächste offene Tab
H2:          Was hast du
             im Kopf?
Address bar: hyper.xjo@gmail.com     [Kopieren]  [Mail schreiben ↗]
Under bar:   Eine Idee, eine Frage oder einfach ein Hallo.
Speed dial label (mono):  Schnellzugriff
Speed dial tiles:  Discord · Telegram · GitHub · Galerie
Copy feedback (aria-live=polite):  Kopiert. Bis gleich im Postfach.
```
- The section is a **new-tab page**. A single tab labelled `Neuer Tab` slides in from the header tab strip when the section enters (a View Transition-free CSS animation, 420ms). Below it sits a browser chrome frame with an address bar. The address "field" is a read-only `<output>` containing the mail address, plus two buttons.
- Speed dial: 4 square tiles (icons from `assets/svg/`), with links from `socials.json` + GitHub + gallery.
- Kopieren: `navigator.clipboard.writeText`. The fallback selects the text in a hidden `<input>` and runs `execCommand('copy')`. If that fails, it shows „Markier's einfach selbst.“

### 2.11 Footer
```
Copy:
Logge Media Forge — Aus Neugier. Gemacht.
© {year} LMF   ·   Tastenkürzel: ?   ·   Zurück nach oben ↑
```
`?` opens a small shortcuts `<dialog>`: `/` search, `g i` Index, `g s` Spielplatz, `t` theme, `m` motion, and `Esc` to close. Shortcuts are ignored while focus is in inputs or inside a toy (§10).

---

## 3. Data contract (design for research output)

The research team delivers `docs/research/*.json` with sourced facts. Implementation merges them **once, at authoring time** into the runtime data via a dev script, `scripts/merge-research.mjs`. It's dev-only, its output is committed, and there's no build step at runtime. Field names below are the **runtime contract**. The merge script maps whatever research delivers onto it and drops any fact that has no `sources` entry.

### 3.1 `data/projects.json` v2 (array; order = editorial order)
```jsonc
{
  "id": "bomberman-web",                 // required, unique, kebab
  "title": "Bomberman",                  // required
  "category": "Multiplayer",             // required, display label
  "groups": ["games", "web"],            // required, subset of web|games|ai|film
  "description": "…",                   // required, 1–3 sentences
  "summary": "…",                        // optional, card length (≤ 140 chars)
  "link": "https://…",                   // required
  "linkLabel": "…",                      // optional
  "tags": ["…"],                         // required (legacy, still searched)
  "image": "assets/img/Bomberman.webp",  // optional (image OR art)
  "imageAlt": "…",                       // optional
  "art": "music",                        // optional typographic tile
  "isNew": true, "archived": false,      // optional

  // ── v2, all optional ──
  "year": 2026,                          // year the project started (research yearStarted)
  "yearNote": "Repo 2026 neu angelegt",  // optional caveat shown in dossier
  "stack": ["JavaScript", "Canvas", "Node.js", "Vite"], // ordered, primary first
  "story": ["Absatz 1 …", "Absatz 2 …"], // German, first person, sourced
  "highlights": ["…", "…", "…"],         // 3–6 bullets, sourced
  "repo": {                              // live GitHub stats snapshot
    "url": "https://github.com/LoggeL/bomberman-web",
    "stars": 1, "language": "JavaScript", "license": "MIT",
    "createdAt": "2026-06-16", "pushedAt": "2026-09-…", "commits": 123,
    "fetchedAt": "2026-09-28"
  },
  "screenshots": [                       // real captures only
    { "src": "assets/img/projects/bomberman-web/01.webp", "alt": "…", "w": 1600, "h": 1000, "source": "…" }
  ],
  "film": {                              // film group only
    "youtubeId": "ZjB-0SG0icU", "location": "Portes du Soleil", "duration": "PT4M12S",
    "role": ["Kamera", "Schnitt"], "gear": ["Drohne"], "event": "48-Stunden-Filmprojekt"
  },
  "toy": "bomberman",                    // optional: key in js/toys/registry.js
  "station": 1,                          // optional: shown as Station N (1–6)
  "sources": [ { "label": "README", "url": "https://github.com/…" } ]
}
```
Rules:
- `year` is the only field used for Chronik and year sorting. The merge script sets it from research `yearStarted`. When research only has repo `createdAt` and the repo was recreated (many LoggeL repos show `createdAt` 2026), `year` stays **unset** and the dossier shows `repo.createdAt` as "Repo seit …" only. Never guess.
- New projects from research (~10–16) are appended with `isNew: true` where appropriate. Screenshots go in `assets/img/projects/<id>/NN.{webp,avif}` at 1600w and 800w (see §11).
- `scripts/validate.mjs` extends to check: `year` is an integer from 2000 to the current year, each `stack` item is a non-empty string, `screenshots[].src` exists on disk with `w`/`h`, `toy` is in the known registry list, `film.youtubeId` matches `/^[\w-]{11}$/`, and every project with `story` or `highlights` has ≥1 `sources` entry.

### 3.2 `data/timeline.json` (persona milestones)
```jsonc
[ { "year": 2019, "text": "Erste Segelreise übers IJsselmeer gefilmt", "projectIds": ["sailing-2019"], "sources": [ … ] } ]
```
It's rendered only in the Chronik rail and dossier footers. If the file is missing, the rail is hidden.

### 3.3 Derived values (compute, never store)
`countByGroup`, `minYear`, `maxYear`, `minFilmYear`, `stackIndex` (stack → project ids, count), `status(project)`:
- `archived` → „Archiv“
- `link` host `github.com` → „Code“
- `youtube.com|youtu.be` → „Film“
- else → „Live“

---

## 4. Visual system

### 4.1 Typography
Two self-hosted variable families, both **SIL Open Font License 1.1**. Montserrat retires, and the logo stays SVG.

| Role | Font | Axes used | Source |
|---|---|---|---|
| Display + text | **Bricolage Grotesque** (Mathieu Triay) | `opsz` 12–96, `wdth` 75–100, `wght` 200–800 | https://github.com/ateliertriay/bricolage (also fonts.google.com/specimen/Bricolage+Grotesque) |
| Mono (labels, Beipackzettel, readouts, index meta) | **Martian Mono** (Evil Martians) | `wdth` 75–112.5, `wght` 100–800 | https://github.com/evilmartians/mono |

Why: Bricolage's `wdth` + `wght` + `opsz` axes make the kinetic hero and the "type case" idea possible with **one file**. Its slightly quirky, ink-trapped shapes read as *hand-made*, not corporate, which fits "Spielzeug". Martian Mono gives the insert/readout voice a technical, receipt-like texture, and its width axis lets index columns tighten on mobile.

**Subsetting (one-off, dev-time, outputs committed):**
```sh
pip install fonttools brotli
pyftsubset BricolageGrotesque[opsz,wdth,wght].ttf \
  --unicodes="U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201E,U+2026,U+20AC,U+2192,U+2193" \
  --layout-features="kern,liga,calt,tnum,case,ss01" --flavor=woff2 \
  --output-file=assets/fonts/bricolage-var.woff2        # target ≤ 90 KB
pyftsubset MartianMono[wdth,wght].ttf --unicodes="U+0020-007E,U+00A0-00FF,U+2013-2014,U+2026,U+00B7,U+2605" \
  --flavor=woff2 --output-file=assets/fonts/martian-mono-var.woff2   # target ≤ 45 KB
```
Add both licence files as `assets/fonts/OFL-Bricolage.txt` and `assets/fonts/OFL-MartianMono.txt`. **Arrows (↗ ↘ ↓ →) and ✳ are inline SVG** from a single `<svg><symbol>` sprite in `index.html`, not glyphs, so there's no font fallback jank.

Fallback metrics to kill CLS:
```css
@font-face { font-family: "Bricolage Fallback"; src: local("Arial"); size-adjust: 104%; ascent-override: 92%; descent-override: 24%; }
```
Tune these values with a quick Playwright overlay check.

**Type scale** (fluid, `clamp`, 320 → 1440px):
| Token | Size | Settings |
|---|---|---|
| `--t-hero` | `clamp(3.4rem, 13.5vw, 13rem)` | opsz 96, wght 780, wdth 88 default (kinetic 75–100 / 300–800), `line-height .86`, `letter-spacing -.035em` |
| `--t-station` | `clamp(2.6rem, 9vw, 8.5rem)` | opsz 96, wght 750, scroll-driven wdth 75→100 |
| `--t-h2` | `clamp(2.2rem, 6vw, 5.5rem)` | opsz 72, wght 700, lh .95 |
| `--t-h3` | `clamp(1.35rem, 2.2vw, 2rem)` | opsz 32, wght 650 |
| `--t-lead` | `clamp(1.15rem, 1.6vw, 1.45rem)` | opsz 18, wght 450, lh 1.4 |
| `--t-body` | `1.0625rem` | opsz 14, wght 420, lh 1.6 |
| `--t-mono` | `.78rem` | Martian Mono wdth 87.5, wght 450, `text-transform: uppercase`, `letter-spacing .06em` |
| `--t-numeral` | `22vw` | outline via `-webkit-text-stroke: 1.5px var(--line-strong); color: transparent` |

The second hero line (`Gemacht.`) sets in **italic-simulated slant**: `font-style: oblique 10deg` if the axis exists, else `transform: skewX(-10deg)` on an inline-block. This echoes the italic logo. It's in accent red.

### 4.2 Color tokens
All text pairs are checked against WCAG 2.2 AA (ratios computed; ≥4.5 for text, ≥3 for UI/large). Group colours are used as **text/UI on paper** and as **tints** (chips).

```css
:root, :root[data-theme="light"] {
  --paper:        #f3efe4;  /* warm newsprint */
  --surface:      #fbf8f0;
  --surface-2:    #ebe5d6;
  --ink:          #1b1a17;  /* 15.2:1 on paper */
  --muted:        #5c584e;  /* 6.2:1 */
  --line:         #d9d3c3;  /* decorative only */
  --line-strong:  #a39c8a;  /* 3:1+ for UI borders/focus-adjacent */
  --accent:       #c8102e;  /* LMF red, 5.1:1 on paper; button text = --paper (5.1:1) */
  --on-accent:    #f3efe4;
  --web:   #1f4fd1;  /* 5.9:1 */
  --games: #0c6e37;  /* 5.5:1 */
  --ai:    #7b2fd6;  /* 5.7:1 */
  --film:  #9a4708;  /* 5.6:1 */
  --tint-web: #dbe4ff; --tint-games: #d3f0de; --tint-ai: #eadcff; --tint-film: #ffe2c7; /* ink on tint ≥ 13:1 */
  --focus: #1f4fd1;
  --grid-dot: rgb(27 26 23 / .16);
  color-scheme: light;
}
:root[data-theme="dark"] {
  --paper:        #141412;
  --surface:      #1e1d1a;
  --surface-2:    #282722;
  --ink:          #f3efe4;  /* 16.1:1 */
  --muted:        #aaa597;  /* 7.5:1 */
  --line:         #3a3832;
  --line-strong:  #6d685c;
  --accent:       #ff5a5f;  /* 6.0:1 on paper; button text = --paper (6.0:1) */
  --on-accent:    #141412;
  --web:   #7fa2ff; --games: #4fd68a; --ai: #c19bff; --film: #ffab5c;  /* all ≥ 7.4:1 */
  --tint-web: #1d2a55; --tint-games: #12351f; --tint-ai: #2e1c4f; --tint-film: #3d2410; /* ink on tint ≥ 11.7:1 */
  --focus: #7fa2ff;
  --grid-dot: rgb(243 239 228 / .14);
  color-scheme: dark;
}
```
The theme persists through the existing `lmf-theme` localStorage key. The default follows `prefers-color-scheme` when no value is stored (a change from the current "light unless stored"). Update the inline head script to match and keep `theme-color` in sync.

**Toy worlds** keep their own palettes in both themes, so each station is a physical object. Each is AA inside itself:
- Arcade (Bomberman): bg `#0d0b1a`, neon magenta `#ff3ea5` (6.0:1), cyan `#34f5ff` (14.5:1), text `#f3efe4`.
- Win98: desktop `#008080`, window `#c0c0c0` with black text (12.6:1), title bar `#000080` with white.
- Felt (Kniffel): `#0f4d2e` with `#f3efe4` text; dice ivory `#fbf8f0` with ink pips.
- Ocean (GeoGames): `#0b2e4f` with `#f3efe4`.
- MelodAI and Transcripator use theme tokens.

### 4.3 Grid and spacing
- Container: `--shell: min(100% - 2 * var(--gutter), 1440px)`, `--gutter: clamp(16px, 4vw, 48px)`. That's 16px at 320px (hard requirement).
- 12 columns, `column-gap: clamp(12px, 2vw, 24px)`, 4 columns under 760px.
- Spacing scale (8px base): `--s1 4, --s2 8, --s3 12, --s4 16, --s5 24, --s6 32, --s7 48, --s8 64, --s9 96, --s10 144`. Section padding is `clamp(var(--s8), 10vw, var(--s10))`.
- The visible **"Setzkasten" grid** shows as hairlines only in the hero (`--line`, 1px), 12 cells wide, which the kinetic letters sit in. Elsewhere the grid is implied by the Rasterfeld dots (§6.2), which align to a 24px lattice.
- Radii: `--r-s 4px` (UI), `--r-m 12px` (cards, stages), `--r-l 28px` (toy stages on desktop). Buttons are pill `999px`.
- Paper texture: a 2 KB inline SVG `feTurbulence` noise as `body::before` at `opacity .05` (light) / `.035` (dark). It's static and `pointer-events:none`.

### 4.4 Motion principles
1. **Spielzeug hat Gewicht.** Things that are *touched* move with springs (overshoot). Things that *navigate* move with expo-out (no overshoot).
2. **Nichts bewegt sich ohne Grund.** Ambient motion only in the hero and a toy's *attract mode*. Both stop offscreen (IntersectionObserver) and when `document.hidden`.
3. **Eine Bühne zur Zeit.** At most one toy runs a rAF loop at a time. The toy closest to the viewport centre owns the loop; others freeze on their last frame.
4. **Text first.** Text is never hidden waiting on an animation. Entrance animations start from ≥ 0.001 opacity and never delay LCP.

Tokens:
```css
--ease-out:    cubic-bezier(.16, 1, .3, 1);          /* expo-out: navigation, reveals */
--ease-in-out: cubic-bezier(.65, 0, .35, 1);         /* view transitions */
--ease-spring: linear(0, .009, .035 2.1%, .141 4.4%, .723 12.9%, .938 16.7%, 1.017 20.4%, 1.061 24.3%, 1.071 28.3%, 1.048 36.7%, 1.012 45.9%, .999 53.5%, 1.001 71.5%, 1);  /* touch, pop */
--ease-snap:   cubic-bezier(.3, 1.6, .5, 1);         /* stickers, chips (fallback for linear()) */
--d-xs: 120ms;  /* hover color, press */
--d-s:  240ms;  /* chips, toggles */
--d-m:  420ms;  /* panels, verb flip, card lift */
--d-l:  700ms;  /* hero entrance, dossier open */
--d-xl: 1100ms; /* only: dice throw, globe spin */
--stagger: 28ms;
```
Use `@supports not (transition-timing-function: linear(0, 1))` to map `--ease-spring` to `--ease-snap`. JS reads these tokens from computed style (`motion.js`), so JS and CSS share one source.

---

## 5. Page-level signature moments (overview)

| # | Name | Where | Technique |
|---|---|---|---|
| S1 | **Setzkasten-Hero** | Hero | split-letter variable-font kinetics, pointer field, verb flip |
| S2 | **Rasterfeld** | behind paper (hero, chronik, index) | raw WebGL1 fragment shader, on-demand render |
| S3 | **Kettenreaktion** | Station 01 | Canvas 2D engine, 15×13 grid |
| S4 | **Karaoke-Sweep** | Station 02 | WAAPI word sweeps with `background-clip:text` + optional WebAudio stems |
| S5 | **ShareX98** | Station 03 | DOM window manager (CSS bevels), pointer + keyboard drag |
| S6 | **Umsortieren + Projektakte** | Index → Dossier | View Transitions API (FLIP fallback), hash router, `<dialog>` |

Shelf toys (smaller but still bespoke): **Würfelbecher** (Kniffel, CSS 3D), **Wellenform** (Transcripator, canvas), **Flaggen-Tease** (GeoGames, SVG + hand-written orthographic globe), **Schneideraum** filmstrip (scroll-driven CSS), **Kontaktabzug** (SVG stroke).

---

## 6. Signature interactions: implementation spec

Every toy module exports the same interface (see §12):
```js
export default { id, css: 'css/toys/<id>.css', mount(stageEl, ctx) → { start(), stop(), reset(), destroy() } }
// ctx = { project, reducedMotion: () => bool, announce(text), tokens, onExit }
```

### S1 Setzkasten-Hero
**Markup.** The `<h1>` contains the real text for AT and search: `<span class="sr-only">Aus Neugier. Gemacht.</span>`. A sibling `<span class="kinetic" aria-hidden="true">` holds one `<span class="ch" style="--i:n">` per character, split by JS at boot. SSR the split in HTML so there's no flash. Line 2 has a slot `<span class="verb">` plus the ✳ `<button class="star" aria-label="Anderes Verb zeigen" aria-describedby="hero-live">` with an inline SVG asterisk.

**Entrance (once per session, `sessionStorage` flag).** The letters are *set* into the type case. Each `.ch` starts at `translateY(-0.6em) rotate(var(--r))` (random ±8°, seeded) at opacity 0.001. It animates to rest with `--ease-spring`, `--d-l`, `delay: calc(var(--i) * var(--stagger))`. Hairline cells fade in 0 → 1 over `--d-m`. The whole thing finishes < 1.2s. Text is present from first paint, so LCP isn't delayed.

**Pointer field (pointer: fine only).** A single `pointermove` listener on the hero updates `targetX/Y`. In one rAF loop (running only while the hero is intersecting and the pointer moved within the last 1.5s), cache the letter centre rects (recompute on `resize` / `document.fonts.ready`). For each letter compute `d = hypot(dx, dy)` and `f = exp(-(d²)/(2·σ²))` with `σ = 180px`, then set:
- `--w: 300 + 500·f` (wght). The base for `f = 0` is 780 when idle, so lerp from `780` toward `300..800`. Design choice: near the cursor letters get **wider and bolder**, `wdth 88 → 100`, `wght 780 → 800`. Far letters condense slightly to `wdth 82`. The word "breathes" around the pointer.
- `transform: translate(dx·-0.04·f px, dy·-0.04·f px)`, a subtle repel.

Write via `el.style.setProperty` only when the value changes by more than 0.5. Smooth with a lerp (`current += (target - current) * 0.18`). Letters are `display:inline-block` with `font-variation-settings: "wght" var(--w), "wdth" var(--wd), "opsz" 96`.

**Touch.** No hover field. Instead, dragging a finger across the H1 applies the same field under the touch point (`pointermove` with `pointerType === 'touch'`, `touch-action: pan-y` so vertical scroll still works). On release, it springs back.

**Verb flip.** On ✳ press:
1. The star rotates `+72°` (spring, `--d-m`).
2. The current verb letters flip out `rotateX(0 → 90deg)`, staggered 20ms, `--d-s`, `--ease-out`. They're swapped for the new verb's letters, which flip in `-90deg → 0`.
3. The live region text updates (computed counts).
4. The primary CTA text/href updates.
5. The Rasterfeld tint (S2) crossfades to the group colour over `--d-m`.

The keyboard gets the same behaviour. `aria-describedby` points at the live line.

**Reduced motion.** No entrance, no field, and the verb swaps instantly. The star doesn't rotate; it gets a colour change only.

### S2 Rasterfeld (cursor-reactive dot grid)
**Element.** `<canvas id="field" aria-hidden="true">` with `position: fixed; inset: 0; z-index: -1; pointer-events: none`. Sections that should show it have `background: transparent`. Stations and toy stages have solid backgrounds and cover it.

**Technique.** Raw WebGL1, one full-screen triangle, hand-written (~120 lines of JS + ~40 of GLSL, no library).

Uniforms: `u_res` (px), `u_dpr`, `u_mouse` (px, lerped in JS), `u_mouseAmt` (0..1, eased toward 1 on move and decays to 0 over 1.2s idle), `u_time`, `u_dot` (vec3 from `--grid-dot`), `u_tint` (vec3 group colour), `u_tintAmt`, `u_ripples[4]` (vec3: x, y, startTime), `u_scroll` (px, so the lattice scrolls with the page: `gl_FragCoord.y + u_scroll`).

Fragment logic:
```glsl
vec2 p = vec2(gl_FragCoord.x, gl_FragCoord.y + u_scroll) / u_dpr;
float cell = 24.0;
vec2 toM = p - u_mouse;  float dm = length(toM);
float f = u_mouseAmt * exp(-dm*dm / (2.0*160.0*160.0));
vec2 q = p + normalize(toM + 1e-4) * f * 10.0;      // repel lattice sample
vec2 g = fract(q / cell) - 0.5;  float r = length(g) * cell;
float rad = 1.1 + 2.6 * f;                          // dots grow near pointer
// ripples: ring at radius (t-start)*420px, width 18px, fade over 0.9s
float ring = 0.0; for (int i=0;i<4;i++){ vec3 R=u_ripples[i]; float t=u_time-R.z; if(t>0.0&&t<0.9){ float d=abs(length(p-R.xy)-t*420.0); ring+= (1.0-smoothstep(0.0,18.0,d))*(1.0-t/0.9);} }
rad += ring * 2.0;
float a = 1.0 - smoothstep(rad - 0.75, rad + 0.75, r);
vec3 col = mix(u_dot, u_tint, clamp(f*u_tintAmt + ring, 0.0, 1.0));
gl_FragColor = vec4(col, a * (0.55 + 0.45*max(f, ring)));   // premultiplied blend
```
**Rendering policy.** Render **on demand**: only while `u_mouseAmt > 0.01` or a ripple is active, plus once on scroll/resize/theme change. The canvas is sized at `min(devicePixelRatio, 1.5)` to stay cheap on 4K. Ripples spawn on any click (`pointerdown`) outside interactive toys. The tint follows the active group: the hero verb, the hovered index row's group, or the station's group via IntersectionObserver.

**Fallback.** If there's no WebGL, it's a touch-primary device, `prefers-reduced-motion`, or `saveData`: don't create the canvas. `body` gets `background-image: radial-gradient(var(--grid-dot) 1.1px, transparent 1.3px); background-size: 24px 24px;`, which gives the identical static look. Handle context loss with `webglcontextlost` → fallback class.

### S3 Kettenreaktion (Bomberman)
**Sources for mechanics:** README `LoggeL/bomberman-web`, which says "Six 15×13 arenas", "Destructible terrain — solid walls stay put; bricks blow apart", "a blast that touches another bomb detonates it instantly, resolved within the same tick". Visual palette from the existing `Bomberman.webp` (Neon Reactor splash).

**Model.** `Uint8Array(15*13)`: 0 floor, 1 solid (every odd/odd cell inside the border plus the border ring, classic layout), 2 brick (seeded PRNG `mulberry32(seed)` fills ~48% of the free floor, keeping a 3×3 clear area at the centre). Bombs are `Map<cell, {placedAt, range: 2}>`. Fuse is 1400ms.

**Tick (fixed 60Hz step, accumulator).** Collect bombs whose fuse has elapsed into a `queue`. Then, **in the same tick**: pop a bomb and cast rays in 4 directions up to `range`. A ray stops at solid. At a brick, it marks the brick destroyed and stops. At a bomb, it pushes that bomb onto the queue (chain). Mark flame cells with `flameUntil = now + 380ms`. Chain length is the count of bombs popped in this tick group. The readout shows `Kette: n`, and the best is kept in `localStorage['lmf-bomb-best']` (try/catch).

**Rendering (Canvas 2D).** The stage canvas keeps a 15:13 aspect ratio and fits the stage, with `cellPx = floor(min(w/15, h/13))` and DPR ≤ 2.
- Floor: `#0d0b1a` with 1px grid in `rgba(52,245,255,.08)`.
- Solid: rounded rects `#1d1838` with a top highlight.
- Brick: `#ff3ea5` at 70% with a mortar line.
- Bomb: a circle with a pulsing fuse spark (radius oscillates at 8Hz, lerping to fast pulses near detonation).
- Flames: `globalCompositeOperation = 'lighter'` gradients magenta→cyan, alpha decaying with `easeOutQuad`.
- Brick debris: max 120 particles (pool), gravity 1800px/s², lifetime 600ms.
- Screen shake: offset `±min(2 + chain, 6)px` decaying over 180ms, and none in reduced motion.
- Cursor cell: a 2px cyan outline plus a corner ticks animation.

**Input.**
- Pointer: `pointerdown` on the canvas maps to a cell. If it's a floor cell without a bomb, place a bomb (max 12 active).
- Keyboard: the stage wrapper is `tabindex="0"`, `role="application"` (justified: a custom 2D grid game) with `aria-roledescription="Spielfeld"`, `aria-label="Bomberman-Nachbau, 15 mal 13 Felder"`, and `aria-describedby` pointing at the how-to line. Arrow keys move the cursor. Space/Enter places a bomb. `R` resets (new seed). `Z` "Alles zünden" (sets all fuses to now). Esc blurs the stage back to the section. Keys are only captured while the stage has focus, and `preventDefault` on arrows and space only happens then.
- Toolbar buttons (real `<button>`s below the stage): `Neues Feld`, `Alles zünden`. These are also the no-keyboard-trap escape hatch.

**Announcements** (`ctx.announce`, polite, throttled to 1 per 800ms):
- „Bombe auf Feld C4.“ (column letter A–O, row 1–13)
- „Kettenreaktion: 4 Bomben, 7 Mauern weg.“

**Attract mode.** On first intersection (≥ 60% visible) and not reduced motion, run a scripted demo: 3 bombs are pre-placed in a line 2 cells apart, then detonate after 900ms. That's a chain of 3, with the readout showing „Kette: 3“, then it resets to a fresh board 1.2s later. It runs only once per page load, and user input cancels it immediately.

**Reduced motion.** No shake, no particles, and flames render as a static cross for 380ms with no alpha animation. The fuse is shown as a numeric countdown ring (a static arc updated at 4Hz).

**No-JS / pre-mount.** The stage shows `Bomberman.webp` as a poster with the play hint.

### S4 Karaoke-Sweep (MelodAI)
**Sources:** README/description `LoggeL/MelodAI`: vocal separation, timed lyrics, synchronized playback. Existing data says vocals and instrumental are adjustable separately. There's no real audio and no copyrighted lyrics.

**Lyrics** are Logge's own, from site copy. They're stored in the module as timed words (ms):
```js
const LINES = [
  ["Ich","wollte","wissen,","ob","das","geht."],
  ["Also","hab","ich's","einfach","gebaut."],
  ["Ein","Tab,","dann","noch","einer,"],
  ["und","plötzlich","war","es","ein","Spielplatz."],
];
// timing: 4/4 at 104 BPM, one word per eighth or quarter, table of [start,dur] per word
```
**Layout.** The stage has theme `--surface`, with three stacked lines visible (previous at 40% opacity, current at 100% in display size `clamp(1.6rem, 3.6vw, 3rem)`, next at 40%). Below is a **stem lane**: two thin horizontal waveforms, "Gesang" (accent) and "Instrumental" (ink/muted). To the right (desktop) or below (mobile) are two faders, `Gesang` and `Instrumental`.

**Sweep technique.** Each word is `<span class="w">` with:
```css
.w { background: linear-gradient(90deg, var(--accent) 0 50%, var(--muted) 50% 100%);
     background-size: 200% 100%; background-position: 100% 0;
     -webkit-background-clip: text; background-clip: text; color: transparent; }
```
When a word starts: `el.animate([{backgroundPosition:'100% 0'},{backgroundPosition:'0% 0'}], {duration: dur, easing:'linear', fill:'forwards'})`. The clock is `performance.now()`-based, or `AudioContext.currentTime` when sound is on, for sync. A line change translates the line stack `translateY(-1 line)` in `--d-m` with `--ease-out`. The playhead is a 2px accent bar over the stem lanes.

**Faders.** These are native `<input type="range" min="0" max="100">` with `aria-label="Gesang"` / `"Instrumental"` and `aria-valuetext="{n} Prozent"`. On desktop they're vertical via `writing-mode: vertical-lr; direction: rtl`, horizontal on mobile.
- The Gesang value maps to lyrics: at 0 the current line turns to an outline (`-webkit-text-stroke:1px var(--muted); background: none`) and a caption appears, `Copy:` „Jetzt du.“ (that's karaoke). It also maps to the vocal waveform amplitude and vocal gain.
- The Instrumental value maps to the instrumental waveform amplitude and gain.

**Optional sound (opt-in, never autoplay).** A `Ton an/aus` toggle (`aria-pressed`) creates an `AudioContext` on first press. A tiny **original** synth arrangement plays two stems: an *Instrumental* (triangle bass on root notes + a soft square-wave chord pad through a lowpass at 1.2kHz) and a *Gesang* (sine lead with slight vibrato, one note per word, pitches from a C-major pentatonic melody table). Each stem goes through its own `GainNode` driven by the faders, which demonstrates "getrennt regelbar" audibly. The loop length is 4 bars × 4 lines. The waveforms are drawn from an `AnalyserNode` per stem when sound is on, or from precomputed envelopes when off.

**Controls.** `Play/Pause` button (`aria-pressed`), `Von vorn`. Space toggles play while the stage is focused.

**Attract mode.** When visible, the first line sweeps silently once, then pauses on „Play drücken“.

**Reduced motion.** No sweeping gradient. Each word switches colour instantly at its start time, lines swap without translate, and the waveforms render static.

### S5 ShareX98 (Win98 desktop hub for three concepts)
**Sources:** repo descriptions and `projects.json` entries for `sharex-win98`, `sharex-capture-engine`, `sharex-afterimage` (all "unabhängiges Designkonzept", not official).

**Structure.** The stage is a teal desktop with 3 desktop icons in a column (`<button class="w98-icon">` with a 32px pixel-art SVG + label): `Capture Engine.exe`, `Windows 98.exe`, `Afterimage.exe`. The taskbar sits at the bottom with a `Start` button, one taskbar button per open window, and a clock showing the real local time (updated every 30s, `aria-hidden`, since it's decoration).

**Windows.** Each window is `<section role="dialog" aria-modal="false" aria-labelledby>` (non-modal, several can be open) with:
- a title bar (`#000080` gradient to `#1084d0`, white bold text, 3 caption buttons `_ □ ×` with proper `aria-label`s: „Minimieren“, „Maximieren“, „Schließen“)
- a menu row (`Datei  Bearbeiten  Ansicht  ?`, decorative, `aria-hidden`)
- a content area showing the concept's first screenshot if research provides one, else the existing typographic art tile, then the summary text and a Win98 push button `Öffnen ↗` linking out
- a status bar with `Nachbau · kein offizieller ShareX-Auftritt`

Bevels are pure CSS: `box-shadow: inset -1px -1px #0a0a0a, inset 1px 1px #fff, inset -2px -2px #808080, inset 2px 2px #dfdfdf`. The font stack is `"Pixelated MS Sans Serif", Tahoma, Geneva, sans-serif` at 12px, bumped to 14px if the viewport is < 400px for readability.

**Window manager** (`js/toys/win98.js`, ~250 lines):
- Open: icon double-click, or Enter/Space on a focused icon. Single tap on touch.
- Opening animation: an outline rectangle zooms from the icon rect to the window rect in 180ms, steps(6) (period-correct), then the window appears.
- Drag: `pointerdown` on the title bar → `setPointerCapture`, then move with `transform: translate()`, clamped to the desktop bounds.
- Keyboard: focusing the title bar (it's `tabindex=0`, `aria-roledescription="Titelleiste, verschiebbar"`) lets arrow keys move 8px (Shift = 32px). Announce position only at the end ("Fenster verschoben").
- Z-order: `focusin` on any window brings it to front (`z-index` counter).
- Minimize → hides, and the taskbar button stays (`aria-pressed=false`). Maximize fills the desktop. Close → `hidden`, and focus returns to its icon.
- `Start` opens `role="menu"` with `menuitem`s: the 3 concepts, a separator, `Projektakte…` (→ `#/projekt/sharex-win98`), and `Beenden…`. Beenden closes all windows and shows a joke dialog `Copy:` „Sie können den Computer jetzt ausschalten.“, then „OK“ restores the desktop. Arrow keys, Home/End, and Esc all work in the menu.
- Mobile (< 760px): windows open maximized and don't drag. The taskbar reduces to Start + clock.

**Attract mode.** None. Instead, on first view, the `Windows 98.exe` window is already open at a slight offset, so the metaphor reads instantly.

**Reduced motion.** No zoom-rect animation.

### S6 Umsortieren + Projektakte (Index → Dossier)
See §7 for the full archive spec. The signature part is the motion.

**Sorting as a physical re-shuffle.** Changing sort, view, or filter runs:
```js
const run = () => renderIndex(nextState);                 // pure DOM patch, keyed by id
if (document.startViewTransition && !reduced()) document.startViewTransition(run);
else run();
```
Each row/card gets `style="view-transition-name: p-<id>"`. There are ≤ 60 names, which is fine. Names are only set while a transition runs, to avoid layer costs: add a class `.vt` on `<html>` inside a `requestAnimationFrame` before calling. CSS:
```css
::view-transition-group(*) { animation-duration: var(--d-m); animation-timing-function: var(--ease-out); }
::view-transition-old(*), ::view-transition-new(*) { animation-duration: var(--d-s); }
.vt [data-pid] { view-transition-name: var(--vtn); }
```
Stagger is simulated by assigning `--vtn` only to the first 40 visible rows. Offscreen rows swap without animation.

**FLIP fallback** (no View Transitions, e.g. Firefox before its implementation shipped): measure `getBoundingClientRect` before render, then after render apply inverse `transform` and animate to `none` with WAAPI, `--d-m`, `--ease-out`. It's max 40 elements.

**Dossier open morph.** On opening `#/projekt/<id>`, the clicked row's thumbnail (or the station stage poster) gets `view-transition-name: dossier-media`, and so does the dossier hero media. Then `startViewTransition(() => dialog.showModal())`. The image flies from the list into the full-screen dossier. Close reverses it: set the name on the dossier media, start the transition, and inside it call `dialog.close()` and set the name on the target row. The fallback is a dialog fade-and-rise (`opacity 0→1`, `translateY(24px)→0`, `--d-m`) via `@starting-style` on `dialog[open]` and `transition-behavior: allow-discrete` on `display, overlay`.

---

## 7. Archive (Index) and project detail

### 7.1 State and URL
State: `{ q, group, stack, sort, dir, view }`. It's serialised in the hash query after `#index`:
`#index?gruppe=games&stack=Canvas&sort=jahr&dir=desc&ansicht=liste&q=bomb`
Defaults are omitted. It's written with `history.replaceState` (typing doesn't spam history), debounced 250ms for `q`. On load, and on `hashchange` to `#index?…`, state is restored. This keeps old `#projects` anchors working: they map to `#index` with default state.

### 7.2 Controls (toolbar)
- **Search**: `<input type="search" id="index-search">`, labelled. It matches title, description, summary, category, tags, stack, story, film.location, and year (as a string), normalised with `toLocaleLowerCase('de')` and diacritics folded (`normalize('NFD').replace(/\p{M}/gu,'')`, so `ae`≈`ä` is **not** attempted, only accent folding). Matches are highlighted in titles with `<mark>`. The `/` shortcut focuses it.
- **Group filter**: 5 toggle buttons (`aria-pressed`), counts reflecting the current search.
- **Stack cloud**: a disclosure (`<details><summary>Stack</summary>`) containing toggle chips for each stack item with a count, sorted by count desc. One active stack at a time (clicking the active one clears it). Chip font size scales slightly with count (`calc(.8rem + min(count, 10) * .02rem)`), a subtle "cloud".
- **Sort**: a segmented control (radio group: `role="radiogroup"` with `<input type=radio>`s visually as pills): Jahr / Titel / Art / Stack. Clicking the active one toggles direction (the arrow icon flips, and `aria-label` includes „absteigend/aufsteigend“). In list view, the table column headers are also sort buttons with `aria-sort` on `<th>`, synced.
  - Jahr: `year` desc. Projects without `year` go last. Ties break on editorial order.
  - Titel: `localeCompare(…, 'de', {sensitivity:'base'})`.
  - Art: group order web → games → ai → film (first group), then title.
  - Stack: primary stack item A–Z, then title. Projects without stack go last.
- **View**: a radio group: Liste / Raster / Zeitstrahl.
- **Status line**: `role="status"`, for example `12 von 54 Projekten · Games · sortiert nach Jahr`.
- **Reset**: a `Alles zurücksetzen` text button, shown only when state ≠ default.

### 7.3 Views
**Liste (default).** A real `<table>`, with a `<caption class="sr-only">` giving the „Projektindex, …“ summary.

| Col | Content | Mobile |
|---|---|---|
| Nr. | editorial index, zero-padded `001` (mono) | hidden |
| Projekt | title (display, 1.25–1.6rem) + summary (1 line, muted, clamp) | shown |
| Art | group dot + category | hidden → shown as meta under title |
| Jahr | year or „—“ in *visual* only with `aria-label="ohne Jahr"` (this "—" is layout, not a fact) | meta |
| Stack | up to 3 chips | hidden |
| Status | Live / Code / Film / Archiv badge | meta |

- The whole row is clickable: the title is a `<a href="#/projekt/<id>">`, and a `::after` stretches it over the row. Other links are not nested.
- **Hover preview (pointer: fine):** a single floating `<figure class="peek" aria-hidden="true">` (260×162) follows the cursor with lerp 0.2 and rotates by horizontal velocity (clamped ±6°). It shows the project image (`decode()` before swapping `src`), or the art tile, or the first screenshot. It hides on `pointerleave` of the table. In reduced motion there's no follow: the peek is fixed to the right edge of the hovered row.
- Rows use `content-visibility: auto; contain-intrinsic-size: auto 72px`.

**Raster.** Cards in a 3/2/1 column grid (`repeat(auto-fill, minmax(min(100%, 300px), 1fr))`). Image + meta + title. Card hover lifts `translateY(-4px)` with spring and the image zooms 1.04. No pagination: all results render, images are `loading="lazy"` with explicit dimensions, and cards past index 12 use `content-visibility: auto`.

**Zeitstrahl.** Years become columns (desktop: horizontal scroll with sticky year headers) with group swimlanes as rows. Each project is a small tile. On mobile it's a vertical list grouped by year with `<h3>` years. It's the same data as the Chronik, but filterable.

All three views are keyed renders (`data-pid`). Switching views uses a View Transition with the root crossfade only, since no shared names are useful across layouts, except that titles keep `view-transition-name` so they glide.

**Empty state:** the copy from §2.6 plus a „Alles zeigen“ button that resets and focuses the search.

**No-JS:** a `<noscript>` block containing a plain `<ul>` of **all** project titles with their external links. The implementation generates it into `index.html` between `<!-- noscript-index:start -->` markers via `scripts/merge-research.mjs` (dev time), so the archive is readable without JS, and there's still no runtime build step.

### 7.4 Projektakte (dossier)
**Routing.** `js/core/router.js` handles hashes starting `#/`:
- `#/projekt/<id>` → open the dossier. Unknown id → toast „Das Projekt gibt's hier nicht (mehr).“ and replace the hash with `#index`.
- Opening from inside the page uses `pushState`, so Back closes the dialog. Opening from a fresh deep link (cold load) opens it directly. Closing then does `replaceState` to `#index` and scrolls the row into view, never `history.back()` out of the site.
- The `document.title` becomes `„{title} · Logge Media Forge“`, restored on close.
- Plain anchors (`#index`, `#about`, …) are not routes and use normal scrolling.

**Element.** One `<dialog id="dossier" class="dossier" aria-labelledby="dossier-title">`, full-viewport (`width: 100%; max-width: none; height: 100dvh; margin: 0`), with an internal scroller. Opened with `showModal()`, so the browser handles focus containment, inertness, and Esc. Remove the current manual Tab-trap code. `body` scroll lock is done via `html:has(dialog[open]) { overflow: hidden; scrollbar-gutter: stable; }`.

**Layout (desktop):**
```
[ ← Zurück zum Index ]                          [ ‹ Vorheriges ] [ Nächstes › ] [ Schließen × ]
┌───────────────────────────────────────────────────────────────────────────────────────┐
│ NR 014 · GAMES · 2026 · LIVE                                                          │
│ BOMBERMAN  (t-station)                                                                 │
│ „summary“ as lead                                                                     │
├───────────────────────────── hero media (view-transition-name) ───────────────────────┤
│ toy (if project.toy) · else screenshots carousel · else image · else art tile           │
│ film: YouTube facade                                                                   │
├──────────── 7 col ─────────────────────────┬──────────── 5 col ────────────────────────┤
│ Die Geschichte  (story paragraphs)         │ Beipackzettel (full dl)                    │
│ Was drin steckt (highlights)               │   Womit gebaut · Seit · Im Repo · Stand    │
│ Screenshots (scroll-snap strip, if >1)     │   Drehort · Rolle · Länge (film)          │
│                                            │ [ Zum Original ↗ ]  [ Code ansehen ↗ ]    │
│                                            │ Chronik: „Im selben Jahr: …“ chips        │
├────────────────────────────────────────────┴───────────────────────────────────────────┤
│ Quellen: README ↗ · Repository ↗ · Live-Seite ↗                                        │
│ Archiv note (if archived): „Dieses Projekt gehört zum Archiv. …“ (existing copy)       │
└───────────────────────────────────────────────────────────────────────────────────────┘
```
- **Toys inside dossiers:** if `project.toy` is set, the same toy module mounts in the dossier stage. Its station instance is `stop()`ped first, since only one stage runs.
- **Screenshots**: a horizontal scroll-snap strip. Each `<img>` has real `alt`, `width`/`height`, and `srcset` (800w/1600w), and is lazy. Clicking one toggles an in-dialog zoom (`object-fit: contain` full-bleed overlay) with Esc/click to exit.
- **YouTube facade (film):** a poster (`image`) + play button `Film abspielen (YouTube)` with privacy note `Copy:` „Lädt ein Video von YouTube (youtube-nocookie.com).“. On click it swaps in `<iframe src="https://www.youtube-nocookie.com/embed/{id}?autoplay=1" title="{title}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="lazy">`. The existing external link is kept as a secondary button.
- **Prev/next** follow the **current Index order and filter** (so browsing Games-only stays in Games), with the labels showing neighbour titles. Keyboard: `[` and `]` only, because arrows are reserved for scrolling and toys.
- **"Im selben Jahr"**: up to 4 chips of other projects with the same `year`, plus any `timeline.json` milestone for that year.
- **Stats freshness:** `Stand: {fetchedAt}` next to repo stats. If `pushedAt` is within 60 days, show a green dot with „kürzlich aktiv“, a derived fact.

---

## 8. Mobile behaviour (320–759px)

- **Header**: logo row (logo + counter chip + theme + motion) and a second row with the scrollable tab strip. The height is 104px, and `scroll-padding-top` matches.
- **Hero**: H1 at `13.5vw` ≈ 43px at 320px with `wdth 80` so "Neugier." fits. That gets verified by an overflow test at 320px. The CTA stacks full-width. There's no pointer field; touch-drag works instead.
- **Stations**: stacked as kicker → title → hook → stage (full-bleed, `margin-inline: calc(-1 * var(--gutter))`, aspect 1:1 for Bomberman at 15:13, 4:5 for the others) → toolbar → Beipackzettel in `<details>` (`Copy:` summary „Beipackzettel lesen“). The outline numeral sits at 38vw behind the title.
- **Toy adaptations**:
  - Bomberman: tap cells. Cells are ≥ 20px at 320px ((320 − 0)/15 ≈ 21px full-bleed). The toolbar buttons are 44px tall.
  - Karaoke: faders horizontal under the lyrics. Lyrics use `clamp(1.4rem, 7vw, 2rem)`.
  - Win98: windows maximized, no drag, 14px UI font.
  - Dice: a row of 5 at 52px each.
  - Waveform: full width, and the slider is the primary control.
  - GeoGames: answers as full-width buttons.
- **Index**: the list view renders each row as a two-line block (title / meta: Art · Jahr · Status) with no table columns: `display: grid` on `tr`, the table keeps its semantics, and hidden cells get `display: none`, which is safe because the same info is in the meta line with the proper `headers` relationship dropped (the meta line is plain text). The sort/view controls become one horizontally scrollable pill row. The stack cloud stays collapsed. There's no hover peek; thumbnails show inline as a 56px square at row start.
- **Dossier**: single column. The top bar is fixed with `Schließen` and `‹ ›`, and the hero media is full-bleed.
- **Schneideraum**: frames at 82vw with native swipe.
- Touch targets are ≥ 44×44px. `touch-action: manipulation` is set on buttons.

---

## 9. Reduced motion

There are two inputs: the OS `prefers-reduced-motion: reduce` and the site toggle `Bewegung: ruhig`, stored in `localStorage['lmf-motion']` = `reduce|full`. The site toggle wins. Both set `html[data-motion="reduce"]`. CSS keys off the attribute (`:root[data-motion="reduce"] …`) and JS off `motion.reduced()`, which also listens for media-query changes.

| Feature | Full | Reduced |
|---|---|---|
| Hero entrance / pointer field | yes | static, final state |
| Verb flip | 3D flip + star spin | instant swap, colour change |
| Rasterfeld | WebGL | static CSS dots |
| View Transitions / FLIP | yes | none (instant) |
| Scroll-driven (stations wdth, chronik drop, filmstrip scale) | yes | none; final state |
| Toy attract modes | once per load | never |
| Bomberman | shake, particles, flames | numeric fuse, static flame cross |
| Karaoke | gradient sweep, line scroll | per-word colour switch, instant line swap |
| Win98 | zoom rectangle | none |
| Dice | 3D tumble 1.1s | instant face change + "Wurf n" text flash (opacity only) |
| Globe | rotates to target | jumps to target |
| Sticker peel / card lift | transform | colour/outline change only |
| Hover peek (index) | follows cursor | fixed beside row |
| Smooth scrolling | `scroll-behavior: smooth` | `auto` |
| Gummibären video | loops | paused, poster |

No information is ever conveyed only by motion. Chain count, dice results, and quiz answers are always also text.

---

## 10. Accessibility

- **Landmarks and headings**: one `h1` (hero). Each section has an `h2` with `aria-labelledby`, stations are `h3` within Spielplatz, and the dossier has its own `h2` (the dialog is a separate context). The skip link „Zum Inhalt“ stays, and a second skip link „Zum Index“ is added.
- **Toys**:
  - Each station stage is a `<figure>` with `<figcaption>` = how-to line. The poster `<img>` has alt text before mount.
  - Every toy is fully keyboard-operable (see each spec), with no keyboard traps: Esc returns focus to the stage wrapper, and Tab always leaves.
  - Canvas elements are `aria-hidden="true"`. State is exposed via a per-toy `aria-live="polite"` region (throttled) plus visible text readouts.
  - Global shortcuts are disabled while focus is inside `[data-toy]`, inputs, or dialogs.
  - Every toy has a text alternative in the Beipackzettel („Was es ist“), so skipping the toy loses nothing.
- **Index**: a real `<table>` with `aria-sort` on the active column's `<th>`, a `role="status"` count, and `aria-pressed` filter buttons. Focus is kept on the control that changed. After a View Transition, focus is not moved.
- **Dialog**: native `showModal()`. Initial focus goes to the dossier `h2` (`tabindex="-1"`) so screen readers start at the title. Close restores focus to the trigger (or the index row on deep link).
- **About tabs**: WAI-ARIA tabs pattern (roving tabindex, arrows, Home/End, automatic activation).
- **Focus style**: `outline: 3px solid var(--focus); outline-offset: 3px` everywhere, plus `box-shadow: 0 0 0 6px var(--paper)` halo so it's visible on images and toy worlds. Inside the Win98 toy, a period-correct dotted focus rectangle (`outline: 1px dotted #000; outline-offset: -4px`) is paired with the global ring on the outer element.
- **Contrast**: all tokens in §4.2 verified. axe runs on both themes, for the page plus an open dossier plus each toy mounted (§14).
- **Language**: `lang="de"`. English stack names get `lang="en"` on chips where needed (not strictly required).
- **Images**: project images keep their `imageAlt` or „{title}, Projektmotiv“. Gallery images keep their current neutral alts; no invented descriptions.
- **Zoom/reflow**: works at 400% zoom (320 CSS px) because the mobile layout is the reflow.
- **Forced colors**: `@media (forced-colors: active)` removes background-clip text (karaoke uses `color: CanvasText`/`Highlight` per word state), shows borders on stages, and keeps focus visible.

---

## 11. Performance budget

Targets on a mid-range phone (Moto G Power class, 4G): **LCP < 2.0s** (budget 2.5), **CLS < 0.05**, **INP < 150ms**, **TBT < 150ms**.

| Asset | Budget (transfer, gzip/br from GitHub Pages) | Notes |
|---|---|---|
| `index.html` | ≤ 28 KB | includes SVG sprite, SSR'd hero letters, noscript index |
| CSS critical (`css/lmf.css`) | ≤ 22 KB | tokens, base, layout, hero, header |
| CSS sections (`css/sections.css`) | ≤ 14 KB | loaded normally (non-blocking would complicate; it's small) |
| CSS per toy | ≤ 4 KB each | injected on mount |
| Fonts | ≤ 140 KB total | Bricolage var subset (preloaded), Martian Mono (not preloaded) |
| JS initial (`main.js` + core + hero + header) | ≤ 22 KB | ES modules, `modulepreload` for the 4 core files |
| JS on idle | `field.js` (WebGL) ≤ 6 KB, `index-view.js` ≤ 12 KB, `dossier.js` ≤ 10 KB | `requestIdleCallback` / on section approach |
| JS per toy | ≤ 14 KB each | dynamic `import()` when station is within 150% viewport |
| `projects.json` | ≤ 60 KB raw | story text included; fetched once, shared |
| Images above fold | 0 (hero is typographic) | LCP element = H1 text |
| Station posters | ≤ 60 KB each (AVIF/WebP `<picture>`) | lazy |
| Screenshots | 800w ≤ 70 KB, 1600w ≤ 180 KB (AVIF, WebP fallback) | lazy, dossier only |
| Total first view | ≤ 250 KB | |
| Full scroll (no dossier) | ≤ 1.6 MB | |

Tactics:
- No hero image (LCP is text). `fetchpriority="high"` on the Bricolage preload, and `font-display: swap` with metric-matched fallback.
- `<link rel="modulepreload">` for `main.js`, `core/dom.js`, `core/motion.js`, `sections/hero.js`.
- Toys are dynamic-imported. Their posters are real `<img>`s in HTML so nothing is empty before JS.
- One shared rAF scheduler (`core/loop.js`) that only ticks when a subscriber is active. Pause everything on `visibilitychange`.
- IntersectionObserver for every loop start/stop. `content-visibility: auto` on offscreen sections (with `contain-intrinsic-size`).
- The WebGL field is created only after first user pointer movement (not on load), so zero cost for the initial paint.
- Images: `width`/`height` always set. `decoding="async"`. `<picture>` with AVIF → WebP (existing assets already have both).
- No third-party scripts besides the existing Cloudflare beacon (deferred). YouTube loads only on click.
- A budget check script, `scripts/budget.mjs` (dev), sums gzipped sizes of the files above and fails `npm run check` on overrun. A Playwright test reads `PerformanceObserver` LCP on a throttled run as a smoke check (not a gate).

---

## 12. File and module architecture

```
index.html                      # all static content, SVG sprite, SSR hero, poster imgs, noscript index
css/
  lmf.css                       # @layer reset, tokens, base, layout, header, hero, utilities
  sections.css                  # spielplatz, chronik, filme, index, about, netzwerk, galerie, kontakt, dossier
  toys/bomberman.css karaoke.css win98.css dice.css waveform.css geo.css
js/
  main.js                       # boot: theme, motion, header, hero; schedules the rest
  core/
    dom.js                      # $, $$, h() tiny element builder, escapeHtml, safeUrl (moved from projects.js)
    motion.js                   # reduced() + subscribe, token reader (durations/easings from CSS)
    loop.js                     # shared rAF scheduler, visibility pause, "one stage at a time" arbiter
    observe.js                  # IO helpers: onNear(el, cb, margin), onVisible(el, in, out)
    data.js                     # fetch + cache projects/timeline/partners/socials; derived values (§3.3)
    router.js                   # hash routes (#/projekt/id) + #index?query state
    announce.js                 # shared polite/assertive live regions, throttle
    shortcuts.js                # global keys (/, g i, g s, t, m, ?), guarded
    transition.js               # withViewTransition(fn, {names}), FLIP fallback
  projects.js                   # PURE: filterProjects, sortProjects, groupByYear, stackIndex, status (unit-testable)
  sections/
    header.js                   # tab strip, scroll-spy, counter, theme + motion toggles, title easter egg
    hero.js                     # S1
    field.js                    # S2 WebGL + fallback
    stations.js                 # station shells, Beipackzettel render, toy lazy-mount + arbitration
    chronik.js                  # year stacks + milestones
    filmstrip.js                # Schneideraum
    index-view.js               # S6 toolbar, list/raster/zeitstrahl, peek
    dossier.js                  # dialog render, morph, prev/next, screenshots, YouTube facade
    about-tabs.js               # ARIA tabs
    network.js                  # sticker wall
    contact.js                  # new-tab page, clipboard
  toys/
    registry.js                 # { bomberman: () => import('./bomberman.js'), … }
    bomberman.js karaoke.js win98.js dice.js waveform.js geo.js
    lib/prng.js                 # mulberry32, seeded helpers
    lib/ortho.js                # orthographic projection for the globe (lat/lon → x/y, graticule paths)
data/
  projects.json                 # v2 (§3.1)
  timeline.json                 # persona milestones (§3.2)
  partners.json socials.json    # unchanged
assets/
  fonts/bricolage-var.woff2 martian-mono-var.woff2 OFL-*.txt
  img/projects/<id>/NN-{800,1600}.{avif,webp}
gallery/                        # static, restyled as Kontaktabzug; :target lightbox (no JS)
scripts/
  validate.mjs                  # extended (§3.1)
  merge-research.mjs            # docs/research/*.json → data/*.json + noscript index in index.html
  budget.mjs                    # size budget (§11)
tests/
  portfolio.spec.js             # updated + new (§14)
```
There's no `js/vendor/`, since everything is hand-written. The total hand-written JS estimate is ~3,000 lines.

**Boot sequence (`main.js`):**
1. Sync: theme, motion attribute, header, hero (letters already in HTML).
2. `data.load()` starts immediately (fetch in parallel).
3. After data: hero counts, the header counter, and station Beipackzettel (fill SSR shells).
4. `observe.onNear` for each station → `import(toy)` → mount poster→toy crossfade.
5. `requestIdleCallback`: chronik, filmstrip, index-view, network, contact, about-tabs.
6. `router.start()`: if the hash is `#/projekt/…`, import `dossier.js` immediately.
7. On first `pointermove`: `import('./sections/field.js')`.

**Toy interface** (from §6): `mount(stage, ctx)` returns `{start, stop, reset, destroy}`. `stations.js` owns arbitration: the toy with the largest intersection ratio ≥ 0.5 is `start()`ed, and the others are `stop()`ped. Dossier mounts call `stop()` on all station toys first.

**Shelf toys: specs in brief.**
- **dice.js (Kniffel):** 5 `<button class="die" aria-pressed>` each containing a `.cube` (`transform-style: preserve-3d`, 6 faces with CSS-grid pips). A throw rolls un-held dice with `crypto.getRandomValues`. The target rotation per face comes from a lookup, plus `360° × (2..3)` random spins per axis, animated with WAAPI (`--d-xl`, `--ease-out`, landing overshoot via an extra keyframe at 88%). The combination detector is pure: Kniffel, Große Straße, Kleine Straße, Full House, Viererpasch, Dreierpasch, or Chance with the sum. The result is a sticker slap („Full House!“, `scale 1.4→1` spring, rotated −6°) + announcement. There are 3 throws per round, and the „Wurf 2/3“ readout shows progress. Labels: „Würfel 3: fünf, gehalten“.
- **waveform.js (Transcripator):** the spoken text is the About paragraph (the existing copy). Words get synthetic timings (≈ 330ms + 45ms/char). The waveform is a canvas of 240 bars with amplitude from a seeded per-word envelope (attack/decay), and silence between sentences. The playhead is controlled by a visible `<input type="range">` (`aria-label="Position"`, `aria-valuetext="0:04 von 0:21"`) plus a canvas drag. The transcript renders words as the playhead passes them, with mono timestamps every sentence (`[0:04]`). `Zusammenfassen` collapses the transcript (height animation) into one line: `Copy:` „Kurz gesagt: Neugier, dann Code, dann die nächste Idee.“ This is labelled as handwritten, `Copy:` „(Von Hand zusammengefasst. Ehrenwort.)“, to avoid implying a live AI call.
- **geo.js (GeoGames):** a local table of ~14 flags that are simple enough to draw as SVG rects/stripes with correct official colours (e.g. Deutschland, Frankreich, Italien, Irland, Belgien, Österreich, Niederlande, Ungarn, Estland, Litauen, Polen, Ukraine, Nigeria, Peru) with capital lat/lon. The flag is covered by an 8×5 SVG mask grid, and cells reveal every 700ms in random order. There are 3 answer buttons (1 correct + 2 random). Afterwards, the mini globe (SVG circle, 15° graticule via `lib/ortho.js`, no land data) rotates in `--d-xl` to centre the capital, and a pin pops in. Streak counter. The toy note says: `Copy:` „Im Original gibt's täglich neue Runden, Karten und Länderumrisse.“ ⚠ Keep only what research confirms about daily modes; existing data says „Tägliche Geografie-Minispiele“, so that's sourced.

---

## 13. Gallery (`gallery/`), still without JS

- It becomes the **Kontaktabzug**: black page background in both themes (a photo darkroom), mono frame numbers, and 4/3/2 columns of thumbnails with film-edge borders.
- **CSS-only lightbox**: each thumb links to `#f01` … `#f77`. Each `<figure id="fNN" class="lb">` (at the page end) is `display:none` except `:target`. It holds a `<img loading="lazy" src="assets/img/large/…">`, prev/next links (`#f{nn±1}`), and close (`#top`). Hidden lazy images don't load until targeted. The existing "open original in new tab" link stays inside the lightbox for full res.
- The grease-pencil hover circle is shared with the home teaser (CSS + inline SVG, no JS).
- It uses the shared header (tab strip in minimal form: brand + `Zurück zum Spielplatz`).

---

## 14. Tests and checks (update, don't delete coverage)

Update `tests/portfolio.spec.js`:
1. **Index**: the default status shows all projects (`{n} von {n} Projekten`). The search „Infected“ + Film filter → 2 rows. Games + that search → empty state → reset. Sorting by Jahr puts the highest `year` first. The URL hash reflects state, and a reload restores it. The `/` shortcut focuses search.
2. **Dossier**: a click on the Bomberman row opens a dialog with the correct external link. Esc closes and focus returns. A cold load of `/#/projekt/melodai` opens directly, and close lands on `#index`. Back button closes. Prev/next respect the filter. An unknown id shows the toast.
3. **Toys**:
   - Bomberman gets focus → Arrow/Space places a bomb → the live region mentions „Bombe auf Feld“. `Alles zünden` → the „Kette“ readout is ≥ 1.
   - Karaoke fader keyboard changes `aria-valuetext`.
   - Win98: Enter on an icon opens a window, Esc/close returns focus to the icon, and Start menu arrow navigation works.
   - Dice: Würfeln → 5 faces have labels, and holding keeps a value across a throw.
   - For each toy: Tab can leave the toy (no trap).
4. **Reduced motion**: with `reducedMotion: 'reduce'`, `#field` canvas doesn't exist, no element has a running animation longer than 0.01s after 1s (`document.getAnimations()` filter), and View Transitions are skipped.
5. **Theme and motion persistence** across reloads. The site toggle overrides the OS preference.
6. **Layout**: no horizontal overflow at 320/375/390/768/1024/1440, both themes, with dossier open and closed. The hero H1 fits at 320.
7. **axe**: both themes: the page, an open dossier, each station after mount, and the gallery page with a `:target` lightbox open.
8. **No-JS**: the gallery works (`javaScriptEnabled: false`), and the noscript index lists all projects.
9. **Data failure**: a routed 500 on `projects.json` → station Beipackzettel shows a fallback line, the Index shows the GitHub link, and the hero counts hide (no "undefined").

`npm run check` = `validate.mjs` + `budget.mjs`.

---

## 15. Build order (one pass, P0 → P2)

**P0, ship-critical:**
1. tokens, fonts, lmf.css base
2. header tab strip
3. hero S1 (without field)
4. data v2 + merge script + validator
5. index-view (list, filters, sort, search, URL state)
6. dossier + router
7. stations shell with posters + Beipackzettel
8. Bomberman S3
9. Win98 S5
10. Karaoke S4 (silent)
11. about tabs
12. contact new-tab
13. network stickers
14. gallery Kontaktabzug
15. reduced-motion matrix
16. tests

**P1:** Rasterfeld S2, View Transitions S6 (+FLIP), Chronik, Schneideraum, dice, waveform, geo, hover peek, YouTube facade, shortcuts dialog.

**P2:** karaoke WebAudio stems, Zeitstrahl view, gallery `:target` lightbox, budget script, title easter egg, attract modes.

---

## 16. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Toys read as fake features / break the "never invent" rule | `Nachbau` chip + insert note on every toy. Mechanics limited to sourced features (§6 cites them). Lyrics/speech are Logge's own site copy. |
| Research data arrives incomplete (no years, few screenshots) | Every v2 field is optional and hides cleanly. Chronik falls back to an „Ohne Jahreszahl“ row. Index "Jahr" sort pushes unknowns last. |
| Repo `createdAt` ≠ project start (many repos were created or recreated in 2026) | Never map `createdAt` → `year` automatically. It's shown only as „Repo seit“. |
| Perf regressions from 6 toys | Dynamic import, one active loop, posters first, budget script. |
| Keyboard traps in toys | Keys captured only when the stage is focused, Esc exits, Tab always leaves, and tests assert it. |
| View Transitions / scroll-driven animations unsupported | Feature-detected. FLIP fallback for sort, static final states for scroll-driven effects. |
| Hero kinetic cost | Only the ~20 letter spans, rAF only while the pointer is active and the hero is in view, cached rects. |
| Font licence/format | Both OFL. Licence files committed, subset outputs committed. |
| Old deep links (`#projects`, `#socials`) | Aliased to new sections. |
