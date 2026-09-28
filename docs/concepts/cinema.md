# ROHSCHNITT — Konzept „Kino / Filmrolle" für Logge Media Forge

> Status: Konzept-Spezifikation, bereit zur Umsetzung. Stand 28.09.2026.
> Sprache der Spezifikation: Englisch (für präzise Umsetzung). Alle sichtbaren Texte: Deutsch, in Logges Stimme.
> Harte Regel aus dem Repo gilt überall: **nichts erfinden.** Jede Zahl, jedes Datum, jede Rolle muss aus `data/*.json`, `docs/research/*.json`, einer Repo-README/-Metadaten oder einer Live-Seite stammen. Wo Daten fehlen, fällt das UI-Element weg; es wird nie mit Platzhaltern gefüllt.

---

## 0. TL;DR

The site becomes **one long film that is never locked** — a *Rohschnitt* (rough cut) of everything Logge has made. It keeps the existing brand line „Aus Neugier. Gemacht." and replaces the "offene Tabs" motif with its cinema twin: **„Rohschnitt, kein Final Cut."** (evolved from the current „Eine Sammlung, kein Schlussstrich.")

The page is structured like a screening, and the UI is borrowed from the editing suite where Logge actually cuts his aftermovies:

```
VORSPANN → HEUTE IM PROGRAMM → AKT I Web → AKT II Games → AKT III KI → AKT IV Film
        → ZEITRAFFER (making-of timeline, real repo data) → DAS MATERIAL (archive/bin)
        → KONTAKTABZUG (gallery) → AUDIOKOMMENTAR (about) → ABSPANN (credits) → NACH DEM ABSPANN (contact)
```

The scrollbar becomes a **playhead** with a live **timecode (25 fps, PAL — made in Germany)**; each act is a **35 mm strip running through a projector gate**; every project opens in a **Vorführraum** (screening room) deep-dive behind a real URL (`#/projekt/<id>`) with a **Filmklappe** (slate) holding only sourced facts; the site ends with **generated end credits** built from real data (partners, locations from film titles, languages from 140 public repos).

Six signature moments, all with first-class no-motion fallbacks:

1. **Projektor-Vorspann** — hand-written WebGL film gate (grain, gate weave, halation, flicker) over the Portes-du-Soleil still, optional 1-second Academy-leader countdown, iris-close into Act I.
2. **Letterbox-Kasch & Grading** — acts "change aspect ratio" (16:9 → 2.39:1 bars close in) and "change LUT" (a registered `--grade` colour per act) via CSS scroll-driven animations.
3. **Filmstreifen durch das Bildfenster** — per act, a sticky stage where scrolling pulls a perforated strip frame-by-frame through the gate; the gate shows the active project big with logline, year, stack.
4. **Playhead-HUD** — a bottom NLE track bar that is the actual chapter navigation, with timecode, chapter markers, motion pause, and J/K/L shortcuts.
5. **Zeitraffer** — an NLE-style timeline of every public repo since 2015 (140 clips at snapshot), language tracks, milestone markers; scroll pans through time and the 2025/2026 explosion (25 → 62 repos) becomes visible density.
6. **Vorführraum + Klappe** — hash-routed full-screen deep dive with View-Transitions morph from the card still, slate "clap", story, highlights, stack as credits, sourced numbers, YouTube click-to-load, prev/next "nächster Clip".

Bonus: **Abspann** (scroll-crawled end credits from data) and **Leuchttisch** (contact-sheet gallery with loupe).

---

## 1. Big idea & narrative

### 1.1 Why cinema, and why *Rohschnitt*

- Logge makes films (16 of the 39 archive entries are in the `film` group: aftermovies 2019–2026, two 48-hour short films, VFX/acting in *Die Chroniken von Selantis*, the *Infected Origins* screenplay). The cinema frame isn't decoration; it's his medium.
- His GitHub bio reads **„I'm just pressing buttons"** — and it already stood on the 2020 version of this site (`index.old.html`, © 2020). REC is a button. Play is a button. The whole site is a playful answer to that line.
- The current copy says the archive is „eine Sammlung, kein Schlussstrich". In film terms that's a **rough cut**: the material is all there, it's watchable, but it's not locked, because the next idea is always coming. That's honest (2026 alone saw 62 new public repos by 28.09.) and gives us a coherent vocabulary: *Material, Clip, Spur, Schnittliste, Klappe, Take, Abspann*.

### 1.2 Narrative arc

| Beat | Section | Emotional job |
|---|---|---|
| Lights down | Vorspann | "Oh, this is different." Establish film language, brand line, bio wink. |
| The trailer | Heute im Programm | Three instant entry points for impatient visitors (Bomberman, MelodAI, Portes du Soleil). |
| Four acts | Web → Games → KI → Film | Go *deep*: each act has its own grade, its own premise, and walks through its best projects one frame at a time with real stories and stacks. Film is the climax because it's the medium the whole site is dressed in. |
| Making-of | Zeitraffer | Zoom out: years of work as one timeline. The quiet years, then the explosion. |
| The vault | Das Material | Everything, searchable, filterable, sortable, as frames or as an edit decision list. |
| B-roll | Kontaktabzug | 77 real photos as a contact sheet. |
| Director's commentary | Audiokommentar | The personal "why", as a timecoded transcript. |
| End credits | Abspann | Everyone and everything involved, generated from data. |
| Post-credit scene | Nach dem Abspann | Contact. The next open tab. |

### 1.3 Vocabulary (use consistently in UI copy)

| Web concept | Film term used in UI |
|---|---|
| Project | Clip / Projekt (both fine; headings say „Projekt", UI chrome says „Clip") |
| Category group | Spur (track): Web = V1, Games = V2, KI = V3, Film = A1… (labels always also spelled out) |
| Archive | Das Material |
| List view | Schnittliste (EDL) |
| Grid view | Frames |
| Detail view | Vorführraum |
| Fact sheet | Klappe |
| Sources | Nachweise |
| Scroll progress | Playhead / Timecode |
| Theme light / dark | Tageslicht / Kinosaal (visible tooltip), aria-labels stay „Helles/Dunkles Design aktivieren" |

---

## 2. Information architecture (section by section, with copy)

All copy below is a draft in Logge's voice: casual, first person, du-Form, short sentences, a wink but no hype. Numbers in `{curly}` are **computed at runtime from data** — never hard-coded. Copy marked *(bestehend)* is taken verbatim from the current site.

### 2.0 Global chrome

**Header** (`<header class="site-header">`, sticky, 56px mobile / 64px desktop, transparent over the Vorspann, solid `--bg` with a hairline after 80px scroll via scroll-driven animation):

- Brand: existing `assets/svg/logo.svg` + mono label `LMF · ROHSCHNITT` (desktop only).
- Right: `#motion-toggle` (Bewegung pausieren/fortsetzen), `#theme-toggle` (keep aria-labels „Dunkles Design aktivieren"/„Helles Design aktivieren"; `title` = „Kinosaal"/„Tageslicht"), `#menu-toggle` „Menü" (mobile only; controls `#navigation`).

**HUD / navigation** (`<nav id="navigation" aria-label="Kapitel">`): on desktop ≥ 1024px rendered as the fixed bottom **Playhead-HUD** (§4.4); below 1024px it's the overlay menu behind „Menü" styled as a **Schnittliste** (chapter list with timecodes). One nav element, two presentations. Links:

```
00 Vorspann · I Web · II Games · III KI · IV Film · Zeitraffer · Material · Abspann · Kontakt
```

**Footer**: `Aus Neugier. Gemacht.` · `© {year} LMF` · `Zurück zum Vorspann ↑`.

### 2.1 Vorspann — `#home`

Structure (desktop):

```
┌──────────────────────────────────────────────────────────────────────┐
│ LMF · ROHSCHNITT · {39} CLIPS · 4 AKTE · 25 FPS          ● REC 00:00:00:00 │  ← mono meta strip
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ Logge Media Forge zeigt ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ │  ← letterbox bar (solid --screen)
│ │                                                                  │ │
│ │      [ Skiing2026 still + <canvas> WebGL film gate ]             │ │  ← "the screen", 2.39:1 on desktop
│ │                                                                  │ │
│ │▓▓▓ Portes du Soleil, 2026 · Aftermovie ▓▓▓▓▓▓▓▓▓▓▓ Szene ansehen ↗│ │
│ └──────────────────────────────────────────────────────────────────┘ │
│  Aus Neugier.                                         »I'm just      │
│  Gemacht.✳                                             pressing       │
│                                                        buttons.«      │
│  Ich baue Apps, entwickle Spiele …   [Film ab ↓] [Direkt ins Material →] │
└──────────────────────────────────────────────────────────────────────┘
```

Copy:

- Screen top bar (mono, `--on-screen`): **Logge Media Forge zeigt**
- H1 (`#hero-title`, Instrument Serif, huge): **Aus Neugier.** / ***Gemacht.*** + `✳` *(bestehend)*
- Lede *(bestehend)*: „Ich baue Apps, entwickle Spiele und mache Filme. Mal praktisch. Mal verspielt. Immer, weil ich wissen will, was daraus werden kann."
- Bio aside (small, rotated −2°, like a handwritten note taped next to the screen): „»I'm just pressing buttons.« Stand 2020 schon auf dieser Seite. Stimmt immer noch." — source: `index.old.html` + GitHub profile bio.
- Screen bottom bar: „Portes du Soleil, 2026 · Aftermovie" + link „Szene ansehen ↗" → `#/projekt/skiing-2026`.
- CTAs: `Film ab ↓` (→ `#web`) · `Direkt ins Material →` (→ `#projects`).
- Meta strip: `LMF · ROHSCHNITT · {projects.length} CLIPS · 4 AKTE · 25 FPS`.

### 2.2 Heute im Programm — `#selected` (keeps `#selected-projects`)

Three "Kinosäle" as posters in a marquee row. Keeps the quick path for people who won't scroll four acts.

- Eyebrow: **Heute im Programm**
- H2: **Drei zum Reinklicken.**
- Lede *(bestehend)*: „Ein Spiel für zwischendurch. Ein Tool für Musik. Und ein guter Grund, rauszugehen."
- Posters (portrait 4:5 crops of `Bomberman.webp`, `MelodAI-player.webp`, `Skiing2026.webp`) labelled `Saal 1 · Multiplayer`, `Saal 2 · KI & Musik`, `Saal 3 · Film · 2026`. Title in Instrument Serif, summary below. Each poster is a `button[data-project-id]` opening the Vorführraum (test hook `#selected-projects [data-project-id="melodai"]` preserved).

### 2.3 The four acts — `#web`, `#games`, `#ki`, `#film`

Each act is **HTML-first**: heading, lede and a `data-featured` list live in `index.html`; frames are rendered from `data/projects.json`. Act anatomy:

```
<section class="act" id="games" data-group="games" data-grade="games"
         data-featured="bomberman-web kniffel coop-sudoku geo-game beatguessr oilbert spyfall"
         aria-labelledby="act-games-title">
  <header class="act__title-card"> numeral · eyebrow · h2 · lede · stat line </header>
  <div class="act__stage">            ← sticky on desktop
    <div class="act__gate">            ← big projected frame (aria-hidden mirror of active frame)
    <ol class="reel">                  ← the strip; real, focusable frames (source of truth for AT)
  </div>
  <a class="act__more" href="?spur=games#projects">Alle {n} Games im Material →</a>
</section>
```

Pinned frames per act are capped at **7** (scroll length ≈ frames × 70svh). Everything else is reachable via „Alle {n} … im Material".

**Frame content** (in the gate, desktop): Instrument Serif title (clamp 3–7rem), logline (`logline` → `summary` → `description`), a 3-cell fact row (only cells with data): `JAHR {year}` · `TECHNIK {stack[0..2]}` · one real stat (e.g. `★ {repo.stars}` only if > 0, or `DREHORT {film.location}`), CTA `Szene ansehen ↗` (opens Vorführraum) and secondary `Projekt öffnen ↗` (external link, with `linkLabel`).

#### Akt I — Web — `#web`
- Numeral: **I**, grade: cyan
- Eyebrow: **Akt I · Werkzeuge**
- H2: **Probleme, die mich selbst nerven.**
- Lede: „Die meisten meiner Web-Apps fangen gleich an: Irgendwas nervt. Dann baue ich was dagegen. Manchmal wird's ein kleines Tool. Manchmal eine ganze Website für Leute, die ich mag."
  (Grounding: about-text „Eine App für ein Problem, das mich selbst nervt"; Kolpingtheater/JP/Palatina websites are partner sites.)
- Stat line: `{n} Web-Projekte im Material`
- Featured (default; swap in research picks): `setlist spotify-viz theater-website sharex-capture-engine loggerythm voll-o-meter poolparty-website`
- Special frame: the three ShareX concepts share one frame as a **triptych** (`related` ids) — three stills side by side in the gate: „Ein Programm, drei Designkonzepte." (All three are described as independent design concepts in the data; keep the „kein offizieller ShareX-Auftritt" note from the existing descriptions.)

#### Akt II — Games — `#games`
- Numeral: **II**, grade: magenta
- Eyebrow: **Akt II · Noch eine Runde**
- H2: **Spiele für den nächsten Abend.**
- Lede: „Kniffel mit bis zu sechs Leuten, Sudoku zu zweit, Bomberman an einer Tastatur. Ich baue Spiele meistens, weil wir sie gerade selbst spielen wollen."
  (Grounding: Kniffel „für ein bis sechs Personen", Coop Sudoku co-op, Bomberman local keyboard mode — all in current data/README. Check the Kniffel count against research before shipping.)
- Stat line: `{n} Spiele im Material`
- Featured: all 7 games in data order.

#### Akt III — KI — `#ki`
- Numeral: **III**, grade: phosphor green
- Eyebrow: **Akt III · Maschinen, die zuhören**
- H2: **KI, aber zum Anfassen.**
- Lede: „Stimmen aus Songs lösen, Gespräche abtippen, Modelle vergleichen. Mich interessiert, was KI im Alltag wirklich kann. Also probiere ich's aus."
  (Grounding: MelodAI vocal separation, Transcripator transcription, Frontier benchmark comparison.)
- Stat line: `{n} KI-Projekte im Material`
- Featured: `melodai transcripator frontier learn-ai marathon-trainer codex-quota-widget`
- ⚠ Data check before launch: `sailing-2019` and `sailing-2022` carry the `ai` group, which looks like an error (see §12). Fix the data, don't hide it in code.

#### Akt IV — Film — `#film`
- Numeral: **IV**, grade: tungsten amber
- Eyebrow: **Akt IV · Die Kamera läuft**
- H2: **Mehr als ein paar Fotos.**
- Lede: „Aftermovies von Skiurlauben, Segeltörns und Poolpartys. Kurzfilme, die in 48 Stunden entstanden sind. Und eine Fantasy-Trilogie, bei der ich die VFX gemacht und mitgespielt habe."
  (Grounding: film descriptions in `data/projects.json`: Infected „in 48 Stunden gedreht", Exception „48-Stunden-Film-Hackathon", Selantis „als VFX-Artist und Schauspieler".)
- Stat line: `{n} Filme im Material · Drehorte von Feldberg bis Portes du Soleil`. Locations come from `film.location` (fallback: parsed from the existing descriptions and titles: Feldberg, IJsselmeer, Bodensee, Bad Gastein, Zillertal, Flachau, Portes du Soleil).
- Featured: `skiing-2026 infected infected-origins exception selantis skiing-2024-epic sailing-2022`
- Film act specials:
  - The gate reuses the **WebGL projector** (§4.1) with the amber grade.
  - `infected` ↔ `infected-origins` are linked via `related`: the Infected frame has an extra chip „Das Drehbuch zum Prequel ↗".
  - Frames show a **YouTube facade**, never an iframe, until clicked (§5.4).

### 2.4 Zeitraffer — `#zeitraffer`

- Eyebrow: **Making-of**
- H2: **Zeitraffer.**
- Lede: „Jedes öffentliche Repo, das ich angelegt habe, auf einer Spur. Lange war's ruhig. Dann nicht mehr."
- Counters (mono, count up as the playhead passes; static in reduced motion): `{repos.length} öffentliche Repos · {languages.length} Sprachen · seit {accountCreated:yyyy}` + `Stand {snapshotAt:dd.MM.yyyy}`.
- Year captions that appear under the playhead (only from data): e.g. `2025 · {25} neue Repos`, `2026 · {62} bisher`.
- Milestone markers (from `timeline.json.milestones`, each with a source). Seed candidates, all verified in GitHub metadata/this repo:
  - `15.04.2015` GitHub-Account angelegt *(GitHub API `created_at`)*
  - `12.07.2017` Erstes öffentliches Repo: BetterDiscordThemes *(repo `createdAt`)*
  - `15.06.2018` Repo der Palatina-Films-Website, „meine erste professionelle Website" *(repo `createdAt` + existing project description)*
  - `28.03.2020` Corona Board *(repo `createdAt`)*
  - `28.08.2020` „first commit" dieser Seite *(git log of LMF)*
  - `21.10.2024` MelodAI *(repo `createdAt`)*
  - Persona milestones from `docs/research` (school/job/etc.) **only** if sourced.
- Toggle: `Zeitleiste | Liste` (segmented control). Liste = a real `<table>` per year.
- Outro line: „Und das sind nur die öffentlichen." *(true: the profile has private repos too; don't give a private count.)*

### 2.5 Das Material — `#projects` (archive)

- Eyebrow: **Das Material**
- H2: **Alles, was im Schneideraum liegt.**
- Lede *(bestehend, leicht gekürzt)*: „Tools, kleine Welten und lange Schnittnächte. Such dir aus, worauf du Lust hast."
- Meta right: **Rohschnitt, kein Final Cut.**
- Toolbar: Spur filters (`Alle {n}` · `Web & Apps` · `Games` · `KI` · `Film`, `aria-pressed`, exact names kept for tests), search (`Projekt suchen …`, `/` focuses it when shortcuts are on), sort (`Programm` · `Neueste zuerst` · `A–Z`), view (`Frames` · `Schnittliste`).
- Count (`#project-count`, `role="status"`): `{visible} von {matching} Projekten` *(bestehend)*.
- Empty state *(bestehend)*: „Hier ist noch Platz für eine Idee." / „Für diese Suche gibt es keinen Clip." / button „Alle Projekte anzeigen ↗".
- Load more *(bestehend)*: „Mehr entdecken ↓" in batches of 9, focus moves to the first new card.
- noscript *(bestehend)*: GitHub + gallery links.

### 2.6 Kontaktabzug — `#kontaktabzug`

- Eyebrow: **Kontaktabzug**
- H2: **Abseits der Tabs.** (matches the gallery page H1, kept for continuity)
- Lede: „77 Aufnahmen aus dem Fotoarchiv. Laut Dateinamen alle aus September und Oktober 2020."
  (Grounding: all 77 filenames carry `IMG_202009…` (29) / `IMG_202010…` (48) timestamps. These are camera filename timestamps, so the copy says „laut Dateinamen".)
- 12-frame contact sheet (`gallery/assets/img/small/*.webp`), each with an edge label `{nn}A` and the filename timestamp `24.09.20 · 23:30`.
- CTA: **Zum Leuchttisch ↗** (→ `gallery/`).

### 2.7 Audiokommentar — `#about`

The current about copy, presented as a timecoded **director's-commentary transcript** next to a big LMF mark on a "screen".

- Eyebrow: **Audiokommentar**
- H2 *(bestehend)*: **Ich wollte wissen, ob das geht.**
- Transcript (`<ol class="commentary">`, each `<li>` with a mono `<span class="tc">`):
  - `00:00:03` — „So fangen ziemlich viele meiner Projekte an." *(bestehend)*
  - `00:00:09` — „Ein Spiel für den nächsten Abend mit Freunden. Eine App für ein Problem, das mich selbst nervt. Ein Film, der von einer Reise mehr festhält als ein paar Fotos." *(bestehend)*
  - `00:00:21` — „Unter Logge Media Forge sammle ich diese Dinge. Ich arbeite mit Code, Kamera und KI, lerne beim Machen und lande dabei regelmäßig bei der nächsten Idee." *(bestehend)*
  - Optional 4th line from research persona story, if sourced.
- Links *(bestehend)*: „Mein GitHub ↗" · „Zur Fotogalerie ↗".

### 2.8 Abspann — `#abspann` (contains `#partners`)

Generated from data; visually hidden H2 „Abspann". Content blocks (all conditional on data):

```
                        LOGGE MEDIA FORGE
                      Ein Rohschnitt von Logge

                    CODE · KAMERA · KI
                          Logge                 ← wording from the about text

                  IN ZUSAMMENARBEIT MIT         ← data/partners.json (6)
        Gummibärenbande ........... Gaming-Community auf Discord
        Kolpingtheater Ramsen ..... Theater
        Palatina Films ............ Filmgruppe
        JP ........................ Events
        CFW ....................... Medien
        Xenon ..................... Discord-Bot

                     MITGEWIRKT BEI             ← projects with role ≠ own (e.g. Selantis: VFX & Darsteller)

                        DREHORTE                ← film.location, with year, deduped
        Feldberg 2019 · IJsselmeer 2019, 2022 · Bodensee 2020 · Bad Gastein 2020
        Zillertal 2022 · Flachau 2024 · Portes du Soleil 2026

                        TECHNIK                 ← languages from timeline.json snapshot
        JavaScript 46 · TypeScript 35 · HTML 26 · Python 10 · CSS 7 · Vue 4
        Dart 2 · C# · Kotlin · Rust · Svelte · Swift · …   (Stand 28.09.2026)

                        MATERIAL
        {39} Projekte · {77} Fotos · {140} öffentliche Repos

                   Aus Neugier. Gemacht.
                       © {year} LMF
```

Partner entries remain links (existing `data/partners.json`, Gummibärenbande keeps its wordmark/video logo treatment). Collaborator names (people) appear **only** if listed in research with a source (e.g. a film's public credits); otherwise the block is omitted.

### 2.9 Nach dem Abspann — `#socials`

- Eyebrow: **Nach dem Abspann**
- Mini-line (mono): „Du bist noch da. Gut." (a wink at post-credit scenes; it states nothing about the world.)
- H2 *(bestehend)*: **Was hast du im Kopf?**
- Copy *(bestehend)*: „Eine Idee, eine Frage oder einfach ein Hallo. Schreib mir."
- `.contact-mail` `hyper.xjo@gmail.com ↗`, then Discord / Telegram / GitHub from `data/socials.json`.

### 2.10 Vorführraum — `#/projekt/<id>` (dialog)

See §5. Copy labels: `Logline`, `Die Geschichte`, `Szenen`, `Technik`, `Zahlen`, `Drehort`, `Nachweise`, `Aus derselben Rolle` (related), `Vorheriger Clip` / `Nächster Clip`, `Projekt öffnen ↗` / `Film ansehen ↗` / `Quellcode ↗`, archived note *(bestehend)*.

---

## 3. Visual system

### 3.1 Principles

1. **The screen is always dark.** Stills, the gate, the Vorführraum and the credits sit on `--screen` (near-black) in *both* themes. Themes change the *room*: Tageslicht = the edit suite with script paper; Kinosaal = the dark auditorium.
2. **Two clocks.** UI motion runs on a smooth "camera" clock (eased); film-texture motion runs on a stepped "projector" clock (24 fps, `steps()`), which is what makes it feel analogue.
3. **Aspect ratio is a design element.** 16:9 (project stills), 2.39:1 (act gates, hero), 4:5 (posters), 3:2 (contact sheet). Changing ratio = changing chapter.
4. **Mono is metadata.** Anything that is data (timecode, year, stack, counts) is set in mono; anything that is story is serif or sans. That makes the sourced facts visually auditable.

### 3.2 Typography

Three self-hosted, open-license (SIL OFL 1.1) fonts. Replace Montserrat.

| Role | Font | Source | Files (latin + latin-ext subset, woff2) |
|---|---|---|---|
| Display / titles | **Instrument Serif** (Regular, Italic) | https://github.com/Instrument/instrument-serif (also fonts.google.com/specimen/Instrument+Serif) | `assets/fonts/InstrumentSerif-Regular.woff2`, `…-Italic.woff2` (~25 KB each) |
| UI / body / credits | **Archivo** variable (`wght` 100–900, `wdth` 62–125) | https://github.com/Omnibus-Type/Archivo (fonts.google.com/specimen/Archivo) | `assets/fonts/Archivo[wdth,wght].woff2` (target ≤ 90 KB after subsetting) |
| Timecode / data | **JetBrains Mono** (variable `wght`, only 400–600 needed) | https://github.com/JetBrains/JetBrainsMono | `assets/fonts/JetBrainsMono.woff2` (subset Basic Latin + `·▸◂●★↗↘↓←→` ≈ 20 KB) |

Subsetting: add `scripts/subset-fonts.sh` (dev only) using fontTools: `pip install fonttools brotli` then `pyftsubset <ttf> --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+2013-2014,U+2018-201E,U+2022,U+2026,U+20AC,U+2190-2193,U+2197-2198,U+25B8,U+25C2,U+25CF,U+2605,U+2733" --layout-features='*' --flavor=woff2`. (Alternative download of pre-subset woff2: https://gwfh.mranftl.com/fonts.) Commit the OFL license text as `assets/fonts/OFL-*.txt`. Update `docs/content-sources.md`.

Loading: `font-display: swap` for all; **preload only** `InstrumentSerif-Regular.woff2` (the H1). Provide metric-matched fallbacks with `size-adjust`/`ascent-override` (`Georgia` for Instrument Serif, `Arial` for Archivo) to keep CLS < 0.05.

Scale (fluid, `rem` so user zoom works):

| Token | Font | Size | Line-height | Tracking |
|---|---|---|---|---|
| `--t-display` | Instrument Serif | `clamp(3.25rem, 10.5vw + 0.5rem, 13rem)` | 0.86 | −0.025em |
| `--t-h2` | Instrument Serif | `clamp(2.5rem, 5.5vw + 1rem, 7rem)` | 0.92 | −0.02em |
| `--t-frame` | Instrument Serif | `clamp(2.25rem, 4vw + 1rem, 6rem)` | 0.95 | −0.015em |
| `--t-h3` | Archivo 620, wdth 100 | `clamp(1.25rem, 0.9vw + 1rem, 1.75rem)` | 1.15 | −0.01em |
| `--t-body` | Archivo 400, wdth 100 | `1.0625rem` | 1.6 | 0 |
| `--t-lede` | Archivo 380, wdth 100 | `clamp(1.125rem, 0.5vw + 1rem, 1.375rem)` | 1.45 | 0 |
| `--t-meta` | JetBrains Mono 500 | `0.8125rem` (min 13px) | 1.4 | 0.06em, uppercase, `tabular-nums` |
| `--t-credit-role` | Archivo 700, wdth 62 | `0.875rem` | 1.3 | 0.14em, uppercase |
| `--t-credit-name` | Instrument Serif | `clamp(1.5rem, 2vw + 1rem, 2.5rem)` | 1.1 | 0 |
| `--t-numeral` | Archivo 900, wdth 62→125 (animated) | `clamp(8rem, 38vw, 34rem)` | 0.8 | −0.04em, decorative, outlined |

Italic Instrument Serif marks the emotional word in a heading (`Gemacht.`, `Zeitraffer.`) — at most one per heading.

### 3.3 Color tokens

Contrast ratios below were computed (WCAG 2.x relative luminance) against `--bg` / `--surface` / `--raised` of the same theme. All text tokens ≥ 4.5:1 on all three surfaces.

```css
:root, :root[data-theme="light"] {           /* „Tageslicht" – Schneideraum, Drehbuchpapier */
  --bg:        #F2EDE3;   /* paper */
  --surface:   #FBF8F2;   /* card / sheet */
  --raised:    #E8E1D3;   /* chips, hover wells */
  --ink:       #14120E;   /* 16.0 / 17.7 / 14.4 */
  --muted:     #5B5447;   /*  6.4 /  7.1 /  5.8 */
  --line:      #D6CDBD;   /* non-text, 3:1 not required for hairlines; use --muted for UI borders */
  --accent:    #B42F17;   /* Tally-Rot  5.4 / 5.9 / 4.8 */
  --grade-web:   #006C7F; /* 5.2 / 5.7 / 4.7 */
  --grade-games: #B0206B; /* 5.5 / 6.1 / 4.9 */
  --grade-ai:    #3E6B12; /* 5.4 / 6.0 / 4.9 */
  --grade-film:  #8A5300; /* 5.4 / 6.0 / 4.9 */
  color-scheme: light;
}
:root[data-theme="dark"] {                   /* „Kinosaal" */
  --bg:        #0C0B09;
  --surface:   #16140F;
  --raised:    #201D17;
  --ink:       #F4EFE4;   /* 17.2 / 16.1 / 14.7 */
  --muted:     #ABA394;   /*  7.9 /  7.4 /  6.7 */
  --line:      #2E2A22;
  --accent:    #FF5B3D;   /*  6.4 /  6.0 /  5.5 */
  --grade-web:   #5FD3E6; /* 11.2 */
  --grade-games: #FF6FB5; /*  7.7 */
  --grade-ai:    #9BE564; /* 12.9 */
  --grade-film:  #FFB547; /* 11.2 */
  color-scheme: dark;
}
:root {                                      /* theme-independent "screen" tokens */
  --screen:     #0C0B09;
  --screen-2:   #16140F;
  --on-screen:  #F4EFE4;  /* 17.2 on --screen */
  --on-screen-muted: #ABA394;
  --on-screen-accent: #FF5B3D;
  /* on-screen grades = the dark-theme grade values */
}
```

- Theme default: stored `lmf-theme` wins; otherwise follow `prefers-color-scheme` (currently the site forces light; the pre-paint inline script changes accordingly). `meta[name=theme-color]` = `--bg`.
- Buttons with filled accent: light theme `#FBF8F2` on `#B42F17` = 5.9:1; dark theme `#0C0B09` on `#FF5B3D` = 6.4:1.
- **Grade**: register `@property --grade { syntax: '<color>'; inherits: true; initial-value: #B42F17; }`. Each act sets `--grade: var(--grade-<act>)` on `:root` via `data-act` (set by JS when an act crosses 50 % of the viewport; pure CSS in browsers with `:has()` + scroll-state queries is optional). `transition: --grade 800ms var(--ease-dolly)`. Grade tints: act numeral stroke, strip edge-codes, HUD active marker, focus ring inside the act, shader `uGrade`. Text in grade colour only uses the verified tokens above.
- Film-texture colours (decorative, no text): `--halation: #FF4A1C`, `--leak: #FFB547`, `--base-orange: #C8631D` (negative base, used for strip edges in light theme).

### 3.4 Grid & spacing

- 12 columns, `max-width: 1680px`, column gap `clamp(12px, 1.6vw, 28px)`, page gutter `clamp(16px, 4vw, 64px)` (16px at 320px).
- Spacing scale (8px base): `4 8 12 16 24 32 48 64 96 128 192`.
- Section rhythm: `padding-block: clamp(96px, 14vh, 192px)`.
- "Safe-area" marks: thin corner brackets at 5 % (action safe) and 10 % (title safe) inset on every `.screen` — decorative, `aria-hidden`, drawn with `border-image`/pseudo-elements.
- Radii: 0 everywhere except perforations (2px) and buttons (2px). Cinema is rectangular.
- Borders: 1px `--line` hairlines; UI component borders use `--muted` (≥ 3:1 for 1.4.11).

### 3.5 Textures & ornaments

- **Perforation**: KS-style holes on strips via mask (no images):
  ```css
  .perf { --h: 12px; --pitch: 19px;
    background: var(--screen);
    mask: linear-gradient(#000 0 0) , url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='19' height='20'%3E%3Crect x='5' y='4' width='9' height='12' rx='2'/%3E%3C/svg%3E") 0 0/var(--pitch) 100% repeat-x;
    mask-composite: exclude; }
  ```
- **Edge codes** (decorative mono text along strips, `aria-hidden`): `LMF ▸ {yy} ▸ REEL {numeral} ▸ {index:0000} ◂` — derived from data, no claims.
- **Grain**: shader in hero/film gate; elsewhere a 128×128 noise tile generated once at runtime (`canvas → toDataURL`) and applied as `background-image` on `.grain::after`, `opacity: .06` (light) / `.09` (dark), animated with `steps(6)` background-position jitter at 12 fps; static in reduced motion.
- **Viewfinder** (hover *and* `:focus-visible` on frames/cards): corner brackets scale in from 1.08 → 1, `● REC` label top-left, current timecode of the card top-right. CSS only.
- **Grease pencil**: SVG hand-drawn circles/arrows (`stroke-dashoffset` draw-on) used on the contact sheet and the „Heute im Programm" posters.

### 3.6 Motion system

Easings (CSS custom properties, mirrored in `js/motion.js`):

| Token | Value | Use |
|---|---|---|
| `--ease-shutter` | `cubic-bezier(.7, 0, .2, 1)` | Cuts, dialog open/close, slate clap |
| `--ease-dolly` | `cubic-bezier(.22, 1, .36, 1)` | Reveals, camera-like settle, grade changes |
| `--ease-crane` | `cubic-bezier(.45, 0, .15, 1)` | Long scroll-linked moves (strip, credits) |
| `--ease-projector` | `steps(6, jump-none)` over 250 ms (= 24 fps) | Film-texture UI micro-motion, frame pull-down |
| `linear` | — | Everything scroll-driven (the scroll *is* the easing) |

Durations: `--d-tap 120ms` · `--d-ui 240ms` · `--d-reveal 480ms` · `--d-cut 320ms` · `--d-chapter 800ms` · `--d-titles ≤ 1400ms` (whole Vorspann sequence).

Rules:
- Animate only `transform`, `opacity`, `clip-path`, `filter: blur()` (≤ 3 elements at once), registered custom properties, `font-variation-settings` on ≤ 2 elements per viewport.
- No flashes: nothing brightens > 10 % luminance more than twice per second (WCAG 2.3.1). Cuts are hard cuts or 2-frame pull-downs, never white flashes.
- Scroll-driven first: CSS `animation-timeline: scroll()` / `view()` inside `@supports (animation-timeline: view())`; JS fallback sets `--p` (0–1) on the same elements so the **same keyframes** can be expressed as `calc()` on `--p` (see §7.2).
- Anything auto-playing > 5 s (grain, light leaks, projector) has a global pause (§8, WCAG 2.2.2).

---

## 4. Signature interactions

### 4.1 Projektor-Vorspann (WebGL film gate + leader + iris)

**What the user sees**: the Portes-du-Soleil still, alive like a projected print: fine 24 fps grain, sub-pixel gate weave, soft flicker, red halation around bright snow, a warm light leak drifting from the left edge, rare dust specks. On first visit per session a 1.0 s **Academy leader** (circle, sweeping wedge, 3 → 2 → 1) plays inside the screen. Scrolling down closes an **iris** on the screen and the title tracks out; Act I's title card opens from the iris centre.

**Technique**:
- DOM: `<figure class="screen screen--hero"><picture>(avif, webp, jpg of Skiing2026, 1280×720, fetchpriority=high)</picture><canvas class="gate" aria-hidden="true"></canvas></figure>`. The `<img>` is the LCP element and paints without JS. The canvas is layered on top, `opacity: 0` until the first GL frame is drawn, then crossfades in 240 ms.
- `js/gl/projector.js` — raw WebGL1 (works everywhere), ≤ 6 KB gz, one full-screen triangle, texture from the already-decoded `<img>` (`img.decode()` then `texImage2D`).
- Fragment shader uniforms: `uTex`, `uRes`, `uTime`, `uFrame` (integer frame at 24 fps → grain hash seed; this is what gives the "projector clock"), `uWeave` (vec2, from low-freq noise, amplitude 0.6 px), `uFlicker` (0.97–1.03), `uGrade` (vec3 from `--grade`), `uIris` (0–1, from scroll), `uPointer` (vec2, optional parallax of the leak), `uIntensity` (0 in reduced motion → static frame).
  - Grain: `hash12(gl_FragCoord.xy + uFrame*17.0)` blended in overlay mode, stronger in shadows.
  - Halation: cheap 5-tap bright-pass (`smoothstep(.75,1.,luma)`) offset sampling, tinted `#FF4A1C`, added.
  - Vignette + gentle S-curve + `mix(color, color*uGrade, .12)`.
  - Light leak: `exp(-dist²)` warm gradient whose centre drifts with `sin(uTime*.07)`.
  - Dust: 1–2 random dots/frame with probability 0.04; vertical scratch with probability 0.01, 3 frames long.
- Loop: `requestAnimationFrame`, but draws only when `floor(t*24)` changes (24 fps cap). DPR capped at 1.5. `IntersectionObserver` pauses when < 10 % visible; `visibilitychange` pauses; on `webglcontextlost` fall back to CSS grain.
- Init: `requestIdleCallback` after `load` (timeout 1500 ms), and only if `!reducedMotion && !saveData && navigator.hardwareConcurrency >= 4`.
- **Leader**: separate `<canvas class="leader">` using 2D context, 24 frames (3 numerals × 8 frames) = 1.0 s, drawn in `--on-screen` on `--screen` with the wedge sweep. Plays only if `sessionStorage['lmf-leader']` unset, reduced motion off, `scrollY === 0`, tab visible. Any `keydown`/`pointerdown`/`wheel`/`touchstart` skips it. It never hides the H1 (the H1 is outside the screen).
- **Iris**: `.screen--hero { clip-path: circle(var(--iris) at 50% 50%); }` with
  ```css
  @supports (animation-timeline: scroll()) {
    .screen--hero { animation: iris linear both; animation-timeline: view(); animation-range: exit 0% exit 90%; }
    @keyframes iris { from { --iris: 75%; } to { --iris: 4%; } }   /* @property --iris <percentage> */
  }
  ```
  Title: `#hero-title { animation: track-out linear both; animation-timeline: view(); animation-range: exit 10% exit 80%; }` → `letter-spacing: -0.025em → 0.04em; opacity 1 → 0.2`.

### 4.2 Letterbox-Kasch & Grading (CSS scroll-driven)

**What the user sees**: as an act's title card enters, two black bars slide in top and bottom of its stage, turning 16:9 into 2.39:1 (the act "goes widescreen"); simultaneously the site's accent shifts to the act's grade; the giant outlined numeral (I, II, III, IV) squeezes from `wdth 62` to `wdth 125` like an anamorphic de-squeeze, and the act headline pulls focus (blur 10px → 0).

**Technique**:
```css
@supports (animation-timeline: view()) {
  .act__stage::before, .act__stage::after {            /* the bars */
    content:""; position:absolute; inset-inline:0; height:12.5%; background:var(--screen);
    transform: scaleY(0); animation: bar linear both;
    animation-timeline: --act; animation-range: entry 20% entry 80%; }
  .act__stage::before { top:0; transform-origin:top; } .act__stage::after { bottom:0; transform-origin:bottom; }
  @keyframes bar { to { transform: scaleY(1); } }
  .act { view-timeline: --act block; }
  .act__numeral { animation: desqueeze linear both; animation-timeline: --act; animation-range: entry 0% cover 40%; }
  @keyframes desqueeze { from { font-variation-settings:"wdth" 62; } to { font-variation-settings:"wdth" 125; } }
  .act__title-card h2 { animation: pull-focus linear both; animation-timeline: view(); animation-range: entry 10% entry 70%; }
  @keyframes pull-focus { from { filter: blur(10px); opacity:.3; } to { filter:none; opacity:1; } }
}
```
Fallback: `motion.js` `progress(el, 'entry')` sets `--p`; CSS in `@supports not (animation-timeline: view())` uses `transform: scaleY(var(--p))`, `font-variation-settings: "wdth" calc(62 + 63 * var(--p))`, `filter: blur(calc(10px * (1 - var(--p))))`.
Grade: `js/reels.js` observes acts with one `IntersectionObserver` (`rootMargin: "-50% 0px -50% 0px"`), sets `document.documentElement.dataset.act = id`; CSS maps `:root[data-act="games"] { --grade: var(--grade-games) }`.

### 4.3 Filmstreifen durch das Bildfenster (pinned reel per act)

**What the user sees (desktop ≥ 1024px, motion on)**: the stage sticks for `frames × 70svh`. On the left ~62 % sits the **gate** (2.39:1 screen) showing the active project's still with title, logline and fact row. On the right a **vertical 35 mm strip** with perforations carries all frames as small stills with edge codes; scrolling pulls it upward, and whenever a frame reaches the gate line the gate performs a **2-frame pull-down cut** (content slides 6 % up with `--ease-projector` while the new still appears — no flash) and the HUD timecode shows `SZENE {act}.{frame}`. A thin progress bar in the strip shows position in the act.

**Technique**:
- DOM truth is `<ol class="reel">` with one `<li class="frame">` per project, each containing a real `<button data-project-id>` (opens Vorführraum) and the external link. The gate is a visual mirror (`aria-hidden="true"`, `inert`) re-rendered from the active frame's data.
- Scroll → index: `reels.js` runs one rAF-throttled read per scroll event *only for the act currently intersecting*: `p = clamp((scrollY - stageTop) / (stageHeight - innerHeight))`, `i = min(n-1, floor(p * n))`. Set `stage.style.setProperty('--p', p)` and, if `i` changed, `stage.dataset.active = i` + swap gate content.
- Strip translation: `translate: 0 calc(var(--p) * -1 * (var(--strip-h) - 100%))` (CSS; works for both native and fallback since `--p` is always set by JS here — this one is intentionally JS-driven because we need the discrete index anyway).
- Gate cut: swap uses `element.animate()` with 250 ms `steps(6)`, or `document.startViewTransition` scoped to the gate (`view-transition-name: gate-still`) when supported — nice crossfade-less "pull-down" via custom `::view-transition-old/new(gate-still)` keyframes.
- **Keyboard**: when a frame button receives focus (`focusin`), compute its target scroll `stageTop + (i + 0.5)/n * (stageHeight - innerHeight)` and `scrollTo({ top, behavior: reduced ? 'instant' : 'smooth' })` so the gate always shows what is focused. Screen readers just read the `<ol>`.
- Also clickable: clicking a small strip frame scrolls to it (same function).
- Stage height: `height: calc(var(--frames) * 70svh + 100svh)`; `.act__stage` is `position: sticky; top: 0; height: 100svh`. No `overflow: hidden` on ancestors (use `overflow: clip` where needed so sticky keeps working).

### 4.4 Playhead-HUD (timecode navigation)

**What the user sees (desktop)**: a 56 px bar fixed to the bottom, dark `--screen` in both themes:

```
● REC  LMF_ROHSCHNITT_{yyyy}   00:01:12:07 │▮00 Vorspann│ I │ II │ III │  IV  │Zeitraffer│Material│Abspann│ ⏸  ?
                                           └──────────────────▲ playhead ─────────────────────────────┘
```

- Track = the whole document. Chapter markers are the `#navigation` links, positioned at each section's offset (`left: offsetTop / scrollHeight * 100%`) and widths proportional to section height (ResizeObserver on `<main>`, debounced).
- Playhead: a 2px `--on-screen-accent` line using `animation-timeline: scroll(root)` (`@keyframes { from { left:0 } to { left:100% } }` → implement as `transform: translateX(calc(var(--p)*100cqw))`, container query units) — pure CSS where supported, JS `--p` fallback.
- Timecode (`aria-hidden="true"`): `SECONDS_PER_VIEWPORT = 4`, `fps = 25`; `frames = round(scrollY / innerHeight * 4 * 25)` → `HH:MM:SS:FF`, `font-variant-numeric: tabular-nums`. Updated in rAF only when the frame number changes. It's a metaphor, not a claim — never label it "Laufzeit".
- Active chapter marker gets `aria-current="true"` (IntersectionObserver), grade-coloured.
- **Drag to scrub** (pointer: fine): `pointerdown` on the track → `setPointerCapture` → `scrollTo(p * (scrollHeight - innerHeight))` instantly. Enhancement only; links are the accessible path.
- `⏸` = `#motion-toggle` duplicate for convenience (desktop); `?` opens the shortcuts dialog.
- **Shortcuts** (NLE homage; ignored while focus is in an input/textarea/select or a dialog other than Vorführraum): `J` previous chapter · `L` next chapter · `K` pause/resume motion · `/` focus archive search · `?` shortcuts help. Help dialog includes a switch „Tastenkürzel aktiv" (persisted `lmf-shortcuts`), satisfying WCAG 2.1.4.
- Mobile (< 1024px): no bottom HUD. Header gets a 2px scroll-driven progress line and a mono label of the current chapter (`II · GAMES`). „Menü" opens `#navigation` as a full-screen Schnittliste: each link shows its chapter timecode (computed) in mono.

### 4.5 Zeitraffer (making-of timeline)

**What the user sees (desktop, motion on)**: a sticky full-height NLE timeline. A year ruler (2015 → 2026) runs along the top with month ticks. Below, **tracks**: `JS`, `TS`, `HTML/CSS`, `PY`, `ANDERE` (from `primaryLanguage`), plus `PORTFOLIO` (repos that map to an archive project, drawn as labelled clips with thumbnail) and `MARKER` (milestones as coloured flags, like NLE markers). Each public repo is a small clip block at its `createdAt`. Scrolling pans the timeline from 2015 to today; a fixed centre **playhead** reads the current month (`APR 2015`) and year counters tick up. Early years pass quickly and sparsely; from 2025 the tracks visibly fill up. Hover/focus a clip → tooltip card (name, date, language, GitHub description, "Im Material ansehen" if mapped).

**Technique**:
- Data: `data/timeline.json` (§6.3), fetched lazily when the section is within 1 viewport.
- Rendering: **DOM, not canvas** (140–200 absolutely positioned `<a>`/`<span>` elements is cheap and gives native accessibility). `left` computed from time: `x = (t - t0) / (t1 - t0) * width`. Stack overlapping clips into lanes within each track (greedy interval packing).
- Honest scale: x is **linear in time**. To avoid scrolling through empty years, the *scroll→pan* mapping is density-weighted: scroll budget per year = `max(0.4, count_year / max_count) * yearWeight`, then invert to get pan position. The ruler stays truthful; only the speed varies.
- Zoom (P2): `+`/`−` buttons and ctrl/⌘ + wheel switch between year and month resolution (width × 4), anchored at the playhead.
- Keyboard: the clip field is **one tab stop** (roving tabindex): `←/→` previous/next clip in time, `↑/↓` switch track, `Home/End` first/last, `Enter` opens the repo or the project deep dive. Focused clip scrolls into the playhead. Tooltip is `role="tooltip"` linked via `aria-describedby`.
- Parallel **Liste** view (segmented control, and forced in reduced motion / < 1024px): per year `<h3>2026 · 62 Repos</h3>` + `<table>` (Datum, Repo, Sprache, Beschreibung). English GitHub descriptions get `lang="en"` (heuristic: stored `descriptionLang` from the snapshot script).
- Mobile: vertical — each year is a row with a density bar (`count` → width) and a `<details>` to expand the list.

### 4.6 Vorführraum + Klappe (deep dive)

Full spec in §5. The signature moment: clicking a frame/card, the still **morphs** (View Transitions API) from its card position into the full-width screen of the dialog, while the **Filmklappe** (slate) above the text claps shut once (160 ms, `--ease-shutter`, 2px impact shake) and its chalk fields fill in with the project's real metadata.

### 4.7 Abspann (credits crawl) — bonus

- Desktop, motion on: `#abspann` is `height: calc(var(--credits-h) * 1.6)`; inner `.credits__viewport` sticky 100svh with `mask-image: linear-gradient(transparent, #000 15%, #000 85%, transparent)`; `.credits__roll` translates `-(credits-h - 100svh) * p` → the crawl runs at ~0.6× scroll speed, feeling cinematic but fully user-controlled. Via `animation-timeline: view()` or JS `--p` fallback.
- Reduced motion / mobile: normal flow, two columns ≥ 640px.
- Content generated by `js/credits.js` from projects/partners/timeline (see §2.8), rendered into a static fallback list if JS fails (partners list already server-side in HTML, rest progressive).

### 4.8 Leuchttisch (gallery) — bonus

- `gallery/index.html` restyled as a **contact sheet on a light table** (`--screen` sheet, edge numbers `01A…77A`, timestamps parsed from filenames at authoring time and written into the static HTML — no JS needed).
- Keeps the no-JS behaviour: every thumbnail is an `<a>` to the large JPG (77 `.photo-grid a`, heading „Abseits der Tabs.").
- JS enhancement (`gallery/js/lighttable.js`): pointer-fine **loupe** — a 220px circular lens following the pointer over a thumbnail, showing the `medium` image at 2.5×; keyboard/touch get a `<dialog>` lightbox with ←/→, Esc, counter `12 / 77`, and „Original öffnen ↗".
- Alt texts: the current „Galerieaufnahme NN" are weak. Improve only by actually looking at each image (describe what's visible, no guessing of places/people) — otherwise keep.

---

## 5. Archive & project detail

### 5.1 Das Material — behaviour

- Source: `data/projects.json` (order = curated „Programm").
- Filters: Spur (group) buttons with `aria-pressed`, combinable with search. Search matches title, description, summary, logline, category, tags, stack names, story text, film location (case-insensitive, `de` locale, diacritics-insensitive via `normalize('NFD').replace(/\p{M}/gu,'')` so „Ubersee" finds „Übersee").
- Sort: `Programm` (JSON order), `Neueste zuerst` (`year` desc, then JSON order; items without year last), `A–Z` (`localeCompare('de')`).
- View: `Frames` (default grid, `.project-card`) | `Schnittliste` (EDL table).
- Pagination: 9 per batch (keeps tests); `Mehr entdecken` moves focus to the first new item.
- URL state via `history.replaceState`: `?spur=games&q=kniffel&sort=neu&ansicht=liste#projects`. Read on load. (Hash is reserved for sections and `#/projekt/…` routes.)
- Act links („Alle 7 Games im Material →") set `?spur=…` and scroll to `#projects`.

**Frame card** (`.project-card`, `<article>` > `<button class="project-trigger" data-project-id aria-haspopup="dialog">`):

```
┌▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫┐  ← perforation top (decorative)
│  [ 16:9 still / art tile ]      │  ← viewfinder brackets + ● REC on hover/focus
│  NEU  ·  0012                   │  ← badge (isNew) + frame number (archive index)
└▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫▫┘
 V2 GAMES · 2026                 ↗   ← mono: track + year (if known)
 Bomberman                           ← h3
 Bomben, Bots und Kettenreaktionen…  ← summary
 JavaScript · Canvas · Multiplayer   ← stack/tags, max 3, mono
```

- Archived: mono stamp `ARCHIVMATERIAL` rotated −4° over the still + desaturated still (`filter: grayscale(.7)`) — keep existing archived note in the dialog.
- Film cards: `▶ YOUTUBE` mono chip.
- `art` tiles (no screenshot): keep the typographic CSS tiles, restyled as **title cards** (Instrument Serif on a grade-coloured "Titelkarte" with safe-area marks) — explicitly not screenshots, as today.

**Schnittliste (EDL)**: `<table>` with `<caption class="visually-hidden">`; columns `#` (0001), `Titel` (button → dialog), `Spur` (text + track code), `Jahr`, `Technik`, `Status` (`Online`, `Archiv`, `Film`). Monospace, zebra `--raised`, sticky header, horizontal scroll container at < 640px with `tabindex="0"` and `role="region" aria-label="Schnittliste"`.

### 5.2 Vorführraum — routing

- Route: `#/projekt/<id>`. `js/router.js` parses `location.hash` on load and `hashchange`.
- Open from UI: `history.pushState({ lmfDialog: true }, '', '#/projekt/' + id)` then open. Close: if `history.state?.lmfDialog`, `history.back()`, else `history.replaceState(null, '', location.pathname + location.search + '#projects')`. `popstate` → close/open accordingly. Deep links open after data loads; invalid id → toast-free fallback: open nothing, scroll to `#projects`, announce „Dieses Projekt gibt es hier nicht (mehr)." in the `#project-count` status region.
- Prev/next: within the **current archive result order** (filter + search + sort) if opened from the archive, else within the act's featured order, else JSON order. Buttons `Vorheriger Clip` / `Nächster Clip` + keys `←/→` and `J/L`. Each switch `replaceState`s the hash (no history spam).
- `<title>` updates to `{Projekt} · Logge Media Forge` while open; restored on close.

### 5.3 Vorführraum — layout

Native `<dialog id="project-modal">` (keeps test ids `#close-modal`, `#modal-link`, `#modal-title`), `showModal()`, full viewport (`width:100vw; height:100dvh; max-width:none; max-height:none; margin:0`), background `--screen`, text `--on-screen`. Internal scroll container `.screening__scroll`.

Desktop (≥ 1024px) — two columns:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← Vorheriger Clip        II · GAMES · CLIP 03/07             Nächster Clip → │ Schließen × │
├──────────────────────────────────────────────┬───────────────────────────────┤
│                                              │ ┌───────────────────────────┐ │
│   [ still, 16:9, view-transition target ]    │ │▞▚▞▚▞▚▞▚ KLAPPE ▞▚▞▚▞▚▞▚▞▚│ │ ← clapper stick
│   [ screenshots strip: "Muster" ▫ ▫ ▫ ]      │ │ PROD  LMF    SZENE II.03  │ │
│                                              │ │ TITEL Bomberman           │ │
│   ▶ Film ansehen (YouTube facade, films)     │ │ JAHR 2026  ROLLE Code     │ │
│                                              │ │ SPUR V2 Games · Web       │ │
│                                              │ └───────────────────────────┘ │
│                                              │ Logline (serif, large)        │
│                                              │ Die Geschichte  (paragraphs)  │
│                                              │ Szenen          (highlights)  │
│                                              │ Technik         (credits-like)│
│                                              │ Zahlen          (sourced)     │
│                                              │ [Projekt öffnen ↗] [Quellcode ↗]│
│                                              │ Aus derselben Rolle ▫ ▫       │
│                                              │ Nachweise ¹ ² ³               │
└──────────────────────────────────────────────┴───────────────────────────────┘
```

Mobile: single column, still on top (sticky shrinking to 30 % as you scroll the sheet — scroll-driven), slate as a 2×3 grid, sticky bottom action bar (`Projekt öffnen ↗`, `Nächster Clip →`), close button top-right 44×44.

Content rules (each block renders only if data exists):

| Block | Data | Notes |
|---|---|---|
| Klappe | `title`, `year`, `role`, `groups`, act numeral + frame index | Only sourced fields; `ROLLE` only if `role` given. `PROD LMF` and `SZENE` are UI numbering, not claims. |
| Logline | `logline` → `summary` → `description` | Instrument Serif, `--t-lede`×1.4 |
| Die Geschichte | `story[]` | 1–4 paragraphs, German, Logge's voice |
| Szenen | `highlights[]` | numbered `01 02 03` mono, like a shot list |
| Technik | `stack[]` (`{name, role?}`) | Two-column credits: role (condensed caps) → name (serif). Fallback: `tags` |
| Zahlen | `repo.stars`, `repo.createdAt`, `repo.pushedAt`, `repo.language`, `film.location`, research numbers | Each value has a footnote to `sources`; label `Stand {snapshotAt}` |
| Muster | `screenshots[]` | horizontal strip, click → enlarges in place; each has alt + source |
| Film | `film.youtubeId` | facade (§5.4) |
| Aus derselben Rolle | `related[]` | mini frames, open in place |
| Nachweise | `sources[]` + `link` + `source` | `<ol>` with labels and domains |
| Archiv | `archived` | existing note |

Slate clap: `.klappe__stick { transform-origin: 0 100%; rotate: -22deg; }` → on open `animate([{rotate:'-22deg'},{rotate:'0deg'}], {duration:160, easing:'cubic-bezier(.7,0,.2,1)'})` then `.klappe` `translate: 0 2px → 0` 60 ms. Chalk fields fade in with 40 ms stagger. Reduced motion: stick rendered closed, no animation.

View transition:
```js
const still = trigger.querySelector('.project-media');
still.style.viewTransitionName = 'screening-still';
const vt = document.startViewTransition?.(() => { renderScreening(project); dialog.showModal();
  still.style.viewTransitionName = ''; dialogStill.style.viewTransitionName = 'screening-still'; });
```
`::view-transition-group(screening-still) { animation-duration: 420ms; animation-timing-function: var(--ease-dolly); }`; root crossfade 200 ms. Close reverses (dialog still → card, if the card is in viewport, else plain fade). Fallback: `dialog[open]` with `@starting-style { opacity:0; scale:.98 }` + `transition: opacity 240ms, scale 240ms, overlay 240ms allow-discrete, display 240ms allow-discrete`. Reduced motion: no transition.

Focus: on open focus `#close-modal` (existing test); native modal makes the page inert; keep the explicit Tab wrap only between first/last focusables if tests require. On close, focus returns to the trigger (if it no longer exists because of re-render, to the first card).

### 5.4 YouTube facade (privacy)

- Poster: local still + play button (`button`, label „Film abspielen: {title}") + note under it: „Beim Abspielen lädt YouTube (Google) Inhalte und setzt ggf. Cookies." (German privacy expectation, DSGVO).
- On click: replace with `<iframe src="https://www.youtube-nocookie.com/embed/{id}?autoplay=1&rel=0" title="{title} auf YouTube" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" loading="lazy">` in a 16:9 box. Focus moves into the iframe.
- `youtubeId` is parsed from the existing `link` (both `youtu.be/` and `watch?v=`) if not given; playlists (Selantis) → link out only.
- Secondary: „Auf YouTube öffnen ↗".

---

## 6. Data contract (design for the research output)

The research team writes `docs/research/*.json`. The site reads only `data/`. Merge research into `data/projects.json` (manually or with `scripts/merge-research.mjs`, dev-only, output committed — no deploy-time build). **Rule: a research field without a source is not merged.**

### 6.1 `data/projects.json` — extended item (all new fields optional)

```jsonc
{
  "id": "melodai",                    // existing required fields unchanged
  "title": "MelodAI", "category": "KI & Musik", "description": "…", "summary": "…",
  "image": "assets/img/MelodAI-player.webp", "imageAlt": "…",
  "link": "https://melodai.logge.top/about", "linkLabel": "…",
  "tags": ["ml","audio","web-app"], "groups": ["ai","web"],
  "source": "https://github.com/LoggeL/MelodAI", "isNew": false, "archived": false,

  "year": 2024,                       // year shown in UI (release/first public); must be sourced
  "yearStarted": 2024,
  "logline": "Karaoke mit jedem Song: Stimme raus, Text im Takt.",   // ≤ 110 chars, German
  "story": ["…", "…"],                // 1–4 paragraphs, German, first person
  "highlights": ["…", "…", "…"],     // 3–5 short, factual
  "stack": [{ "name": "TypeScript", "role": "Frontend" }, { "name": "…" }],
  "role": "Idee & Code",              // Logge's role; e.g. Selantis: "VFX & Darsteller"
  "repo": { "name": "MelodAI", "language": "TypeScript", "stars": 7,
            "createdAt": "2024-10-21", "pushedAt": "…", "snapshotAt": "2026-09-28" },
  "film": { "youtubeId": "…", "location": "Portes du Soleil", "kind": "Aftermovie",
            "collaborators": [{ "name": "…", "role": "…", "source": "…" }] },
  "screenshots": [{ "src": "assets/img/melodai/01.webp", "alt": "…", "width": 1600, "height": 1000,
                    "source": "https://github.com/LoggeL/MelodAI/tree/main/docs/screenshots" }],
  "related": ["…"],
  "sources": [{ "label": "README", "url": "https://github.com/LoggeL/MelodAI", "checkedAt": "2026-09-28" }]
}
```

Validation additions (`scripts/validate.mjs`): `story|highlights|stack|role|film.collaborators` present ⇒ `sources.length ≥ 1`; `year` integer 2010–current; `screenshots[].src` exists locally, has `alt`, `width`, `height`, `source`; `youtubeId` matches `/^[\w-]{11}$/`; `related` ids exist and are not self; `logline.length ≤ 110`; no duplicate ids; group values in the allowed set.

New projects from research (10–16): same schema; screenshots only from the project's own repo/live page (captured with Playwright from the live URL is fine and must be recorded in `docs/content-sources.md` with URL + date). Put images in `assets/img/<id>/`, WebP + AVIF, max 1600 px wide, ≤ 120 KB each.

### 6.2 Featured lists

In HTML: `data-featured` on each `.act` (space-separated ids). Unknown ids are skipped silently (validated by `validate.mjs` parsing `index.html`).

### 6.3 `data/timeline.json`

Generated by `scripts/snapshot-github.mjs` (dev-only; uses `gh repo list LoggeL --visibility public --limit 400 --json name,createdAt,pushedAt,primaryLanguage,stargazerCount,homepageUrl,description,isFork`, excludes forks):

```jsonc
{
  "snapshotAt": "2026-09-28",
  "account": { "login": "LoggeL", "createdAt": "2015-04-15" },
  "repos": [
    { "name": "bomberman-web", "createdAt": "2026-06-16", "language": "JavaScript",
      "stars": 1, "homepage": "", "description": "2-4 player Bomberman for the web: …",
      "descriptionLang": "en", "projectId": "bomberman-web" }
  ],
  "milestones": [
    { "date": "2015-04-15", "label": "GitHub-Account angelegt", "source": "https://api.github.com/users/LoggeL" },
    { "date": "2020-08-28", "label": "Erster Commit dieser Seite", "source": "https://github.com/LoggeL/LMF/commits" }
  ]
}
```

Snapshot at concept time (for sanity checks, not for hard-coding): 140 public non-fork repos; per year 2017: 1 · 2018: 2 · 2019: 6 · 2020: 9 · 2021: 9 · 2022: 8 · 2023: 8 · 2024: 10 · 2025: 25 · 2026: 62; languages JavaScript 46, TypeScript 35, HTML 26, Python 10, CSS 7, Vue 4, Dart 2, and 1 each for C#, Jinja, Jupyter Notebook, Kotlin, Rust, Svelte, Swift (3 without language). `projectId` is set when `project.source` or `project.link` points to that repo/pages URL. Size target ≤ 30 KB (truncate descriptions to 140 chars).

---

## 7. File & module architecture

```
index.html                     HTML-first: all section copy, act shells, dialog shell, noscript
css/
  lmf.css                      single stylesheet, @layer reset, tokens, fonts, base, layout,
                               components, vorspann, acts, hud, timeline, archive, screening,
                               credits, gallery-shared, motion-fallback, reduced-motion, print
js/
  main.js                      boot: theme, nav, motion prefs, data load, archive, router; lazy-loads the rest
  projects.js                  (existing) pure helpers: escapeHtml, safeUrl, filterProjects (extended),
                               sortProjects, projectVisual, projectCard, edlRow, youtubeId
  data.js                      fetchJson with in-memory cache, getProjects(), getTimeline(), getPartners()
  motion.js                    reducedMotion signal, userPaused signal (lmf-motion), supportsScrollTimeline,
                               progress(el, range, cb) fallback driver, rafThrottle, easings
  theme.js                     theme toggle + system default + theme-color
  nav.js                       mobile menu (#menu-toggle/#navigation), shortcuts, shortcuts dialog
  hud.js                       playhead, chapter markers, timecode, scrub (desktop only; lazy)
  archive.js                   Material: filters, search, sort, view, pagination, URL state
  router.js                    #/projekt/:id routing, history handling
  screening.js                 Vorführraum render, slate, view transitions, prev/next, YouTube facade (lazy on first open/deep link)
  reels.js                     acts: render frames, gate mirror, pinned progress, grade switching (lazy per act via IO)
  timeline.js                  Zeitraffer render, lanes, density scroll map, roving focus, list view (lazy)
  credits.js                   Abspann generation + crawl (lazy)
  contactsheet.js              home Kontaktabzug teaser (lazy, tiny)
  gl/projector.js              WebGL film gate (lazy, conditional)
  gl/shaders.js                GLSL strings
  leader.js                    2D-canvas Academy leader (lazy, conditional)
  sound.js                     P2: optional WebAudio projector hum/clap, off by default (lmf-sound)
data/
  projects.json (extended) · partners.json · socials.json · timeline.json (new)
assets/fonts/                  InstrumentSerif-*.woff2, Archivo[wdth,wght].woff2, JetBrainsMono.woff2, OFL-*.txt
assets/img/<id>/               new screenshots per project
gallery/index.html             static contact sheet (timestamps baked in)
gallery/css/gallery.css
gallery/js/lighttable.js       loupe + lightbox enhancement
scripts/
  validate.mjs                 extended schema + featured-id + timeline checks
  snapshot-github.mjs          gh → data/timeline.json (+ repo stats into projects.json)
  merge-research.mjs           docs/research/*.json → data/projects.json (sourced fields only)
  subset-fonts.sh              fontTools subsetting
tests/
  portfolio.spec.js            extended (see §11)
```

Loading strategy: `main.js` is the only module in HTML (`type="module"`). It statically imports `projects.js`, `data.js`, `motion.js`, `theme.js`, `nav.js`, `archive.js`, `router.js` (small, needed early). Everything else via `import()` gated by `IntersectionObserver` (`rootMargin: '100% 0px'`) or by user intent (first dialog open, deep link). Add `<link rel="modulepreload">` only for `main.js` and its static deps.

### 7.1 JS APIs (key contracts)

```js
// motion.js
export const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'paused';
export function onMotionChange(cb) {}               // fires on media change and user toggle
export const supportsScrollTimeline = CSS.supports('animation-timeline: view()');
export function progress(el, { range = 'cover' } = {}, cb) {} // sets el.style --p (0..1) while intersecting; returns disposer
// router.js
export function onRoute(cb) {}  export function openProject(id, { from }) {}  export function closeProject() {}
// screening.js
export async function show(project, { trigger, list }) {}  export function hide() {}
// archive.js
export function initArchive(projects, { onOpen }) {}  export function currentOrder() {} // ids for prev/next
```

### 7.2 Scroll-driven + fallback pattern (use everywhere)

```css
@property --p { syntax: "<number>"; inherits: true; initial-value: 0; }
.thing { transform: translateY(calc((1 - var(--p)) * 40px)); opacity: calc(.2 + .8 * var(--p)); }
@supports (animation-timeline: view()) {
  .thing { animation: p-in linear both; animation-timeline: view(); animation-range: entry 0% cover 40%; }
  @keyframes p-in { from { --p: 0 } to { --p: 1 } }
}
```
JS fallback only registers `progress()` when `!supportsScrollTimeline`. Reduced/paused: `:root[data-motion="reduced"] .thing { --p: 1 !important; animation: none; }` (set `data-motion` from `motion.js`, plus a pure-CSS `@media (prefers-reduced-motion: reduce)` duplicate so it works before JS).

---

## 8. Reduced motion & motion pause

Triggered by `prefers-reduced-motion: reduce` **or** the user's `#motion-toggle` (label „Bewegung pausieren" / „Bewegung fortsetzen", `aria-pressed`, persisted `lmf-motion`). Also honoured: `prefers-reduced-data`/`Save-Data` → no WebGL, no leader.

| Feature | Motion on | Reduced / paused |
|---|---|---|
| Vorspann | GL gate, leader, iris, title track-out | static still with static grain tile, no leader, no iris |
| Acts | pinned stage, strip scrub, bars, de-squeeze, focus pull | not pinned; title card then a normal grid/list of frames (gate hidden), bars shown at final state, numeral at `wdth 100`, no blur |
| Grade | 800 ms transition | instant |
| HUD | playhead, timecode | playhead updates (position indicator is not motion-heavy), timecode updates in steps; no drag easing |
| Zeitraffer | pinned pan, counters | Liste view by default, counters show final numbers |
| Vorführraum | view transition, clap | instant open, slate drawn closed |
| Credits | crawl | static columns |
| Grain textures | 12 fps jitter | static |
| Smooth scrolling | `scroll-behavior: smooth` for in-page links | `auto` |
| Hover viewfinder | scale-in | appears without scale |

---

## 9. Mobile behaviour (320–1023px)

- Header 56px: logo, current chapter label (mono), Menü. Top 2px progress line.
- **No pinning anywhere** below 1024px (pinned scroll on touch feels like hijacking). Scroll-driven *reveals* stay (cheap, non-blocking).
- Vorspann: screen at 16:9 (not 2.39:1), full-bleed; H1 below at `clamp(3.25rem, 15vw, 6rem)`; bio note under the lede; CTAs full-width stacked. GL only if `hardwareConcurrency ≥ 6` and not Save-Data; else CSS grain.
- Heute im Programm: horizontal snap carousel of posters (`scroll-snap-type: x mandatory`, 82vw posters), visible scrollbar hidden but region focusable with arrow-key scrolling.
- Acts: title card, then the reel as a horizontal snap strip of frames (86vw each) with perforations top/bottom; each frame shows still, title, logline, facts, CTA. `animation-timeline: view(inline)` scales the off-centre frames to 0.94 (reduced: none).
- Zeitraffer: vertical year rows with density bars + `<details>` lists.
- Material: filters as a horizontally scrollable chip row; search full width; sort/view in a single row of two `<select>`s; Frames grid 1 col (≥ 560px: 2 cols); Schnittliste scrolls horizontally inside its region.
- Vorführraum: full-screen sheet as described in §5.3; swipe left/right on the still = prev/next (pointer events, threshold 60px, never on the text area).
- Credits: normal flow. Contact: large mail link wraps (`overflow-wrap: anywhere`).
- All touch targets ≥ 44×44 CSS px. Test at 320, 375, 768, 1024, 1440 (no horizontal page scroll).

---

## 10. Accessibility (WCAG 2.2 AA)

- **Structure**: one `h1` (Vorspann); each top-level section `h2`; frames/cards `h3`. Landmarks: header, nav#navigation, main, footer; each section `aria-labelledby`. Skip link „Zum Inhalt" retained. `lang="de"`; English repo descriptions `lang="en"`.
- **Contrast**: tokens in §3.3 verified ≥ 4.5:1 for text in both themes and on `--screen`. Text never sits directly on photos: titles sit in letterbox bars, below screens, or on solid panels. Decorative edge codes/numerals are `aria-hidden` (exempt) but still ≥ 3:1 where possible.
- **Keyboard**: every interaction has a keyboard path (frames, strip, HUD links, timeline roving focus, dialog prev/next, lightbox). Focus ring: `outline: 3px solid var(--grade, var(--accent)); outline-offset: 3px`; on `--screen` surfaces use `--on-screen-accent`. `:focus-visible` also triggers the viewfinder styling. Sticky header/HUD never obscure focus (`scroll-padding-top: 80px; scroll-padding-bottom: 72px` — WCAG 2.4.11).
- **Character shortcuts**: can be turned off (2.1.4); never active in form fields.
- **Motion**: pause control (2.2.2), reduced-motion parity (§8), no flashes (2.3.1).
- **Dialog**: native modal `<dialog>`, labelled by `#modal-title`, Esc closes, focus to close button on open, returns to trigger. Prev/next announce via the title change (dialog `aria-labelledby` updates; add a polite live region „Clip 4 von 7: Kniffel Multiplayer").
- **Live regions**: `#project-count` `role="status"`; timecode `aria-hidden`; timeline counters `aria-hidden` with the final numbers in visible text for AT.
- **Canvas/WebGL**: `aria-hidden="true"`; the `<img>` beneath carries the alt text.
- **Target size**: ≥ 24×24 everywhere (2.5.8), 44×44 on touch layouts.
- **Reflow**: 320px without horizontal scroll; text resizes to 200 % (rem-based clamps).
- **No-JS**: all section copy readable; hero image and CTAs work; gallery fully works; archive shows the existing noscript fallback; partners/contact lists static in HTML.
- **axe**: zero violations in both themes, also with the dialog open and with the EDL view active.

---

## 11. Performance budget & verification

| Metric | Budget |
|---|---|
| LCP (mobile, Slow 4G, 4× CPU) | < 2.0 s (hard limit 2.5 s); LCP = hero `<img>` (Skiing2026.avif 18 KB) or H1 |
| CLS | < 0.05 (fixed aspect boxes, font fallbacks with size-adjust) |
| INP | < 150 ms (no work > 50 ms on the main thread during scroll) |
| HTML | ≤ 40 KB raw |
| CSS | ≤ 30 KB gzip, one file, render-blocking |
| JS initial (main + static deps) | ≤ 22 KB gzip |
| JS lazy total | ≤ 40 KB gzip (projector ≤ 6, timeline ≤ 8, screening ≤ 8, reels ≤ 6, hud ≤ 4, credits ≤ 3, leader ≤ 2, sound ≤ 2) |
| Third-party | Cloudflare beacon only (existing), YouTube only after click |
| Fonts | ≤ 160 KB total, 1 preload |
| Images above the fold | ≤ 80 KB; everything else `loading="lazy"` + `decoding="async"` with explicit width/height |
| Data | `projects.json` ≤ 80 KB, `timeline.json` ≤ 30 KB (lazy) |
| GPU | 24 fps cap, DPR ≤ 1.5, paused off-screen/hidden tab, one GL context at a time (`WEBGL_lose_context` on unmount) |

Rules: passive scroll listeners; one rAF loop per module max; read layout once per frame, write after; `content-visibility: auto` + `contain-intrinsic-size` on below-the-fold sections (not on pinned acts); images in `<picture>` with AVIF/WebP/JPG. Exclude `assets/img/avifenc.exe` (10 MB) and `index.old.html` from deployment or delete after owner confirmation.

**Tests** (`tests/portfolio.spec.js`, extend; keep all current assertions green — hooks listed below):
- Keep: `#project-count` „9 von 39 Projekten" (count derives from data; update if research adds projects), `.project-card`, „Mehr entdecken", Spur buttons „Film"/„Games" exact names, searchbox, `#empty-state`, „Alle Projekte anzeigen", `#load-more`, `#modal-link`, `#close-modal`, `body.modal-open` (or update to `:has(dialog[open])` and adjust test), „Menü", `#navigation`, theme toggle labels, `.contact-mail`, `#selected-projects [data-project-id="melodai"]`, gallery `.photo-grid a` ×77 and heading „Abseits der Tabs.".
- Add: deep link `/#/projekt/melodai` opens dialog, Back closes it; prev/next order follows filters; URL query state round-trip; EDL view renders `table` with 39 rows after full load; reduced-motion emulation → no element with running `getAnimations()` except none, acts not sticky, Zeitraffer shows list; motion toggle persists; shortcuts off switch; timeline list has `repos.length` rows; credits contain all partners; YouTube iframe absent until click; overflow check at 320/375/768/1024/1440; axe with dialog open in both themes; LCP via `PerformanceObserver` < 2500 ms under CPU throttling (CDP `Emulation.setCPUThrottlingRate: 4`).
- `npm run check` validates the extended schema.

---

## 12. Risks & open questions

1. **Research gaps**: many projects (especially films) may lack year/story/role. The design must look complete with only the current fields — every block is conditional, frames fall back to summary, facts row collapses. Never pad.
2. **Suspicious data**: `sailing-2019` and `sailing-2022` are in the `ai` group (inflates „KI" count to 10). Verify with Logge/research and correct `data/projects.json` before launch.
3. **Low-res stills**: most film stills are 640×360. At gate size they will be soft; the grain/halation treatment helps, but better: fetch `https://i.ytimg.com/vi/<id>/maxresdefault.jpg` for Logge's own videos at dev time, convert to AVIF/WebP locally, and document in `docs/content-sources.md` (they are his own published thumbnails). No invented stills.
4. **No real footage locally**: `assets/video/gummibaeren.*` is a 138×138, 2-second logo loop, not aftermovie footage. "Aftermovie clips as texture" therefore means stills + shader + YouTube facade, unless Logge supplies short self-cut loops (then: `film.loop` field, muted `<video>` ≤ 600 KB, `preload="none"`, played only in view, never in reduced motion).
5. **Scroll-driven animation support**: Firefox and older Safari may lack `animation-timeline`; the JS `--p` fallback must be tested as a first-class path (Playwright WebKit/Firefox projects recommended).
6. **Pinned sections feel like scroll-jacking** if too long: cap frames per act at 7 and 70svh per frame; always offer „Alle … im Material" and HUD jumps.
7. **Sticky + overflow**: any ancestor `overflow: hidden` breaks sticky stages — use `overflow: clip`.
8. **View Transitions + top-layer dialog**: verify in Chromium/Safari; keep the `@starting-style` fallback; never block opening on a transition promise.
9. **Timeline "honesty"**: repo creation date ≠ project start (repos can be created later/earlier). Label clearly „Repo angelegt am …" and let `yearStarted` from research override only on the project's own clip.
10. **Test churn**: the new IA changes some DOM; keep ids/labels listed in §11 or update tests deliberately in the same change.
11. **Deployment weight**: remove/exclude `assets/img/avifenc.exe` (10 MB) and unused PNG originals from the Pages artifact.

---

## 13. Build order (one pass, strong engineer)

1. Fonts + tokens + base layout + HTML skeleton of all sections with final copy (site readable with zero JS).
2. `projects.js` / `data.js` / `archive.js` (Frames + Schnittliste, URL state) — tests green.
3. `router.js` + `screening.js` (dialog, slate, facade, prev/next, sources) — deep links.
4. `reels.js` acts (mobile snap strips first, then desktop pinned stage), grade switching, letterbox/de-squeeze CSS + fallback.
5. `hud.js` + `nav.js` (shortcuts, motion toggle).
6. `snapshot-github.mjs` → `timeline.json`; `timeline.js` (list first, then pinned NLE view with roving focus).
7. `credits.js`, Kontaktabzug teaser, gallery Leuchttisch.
8. `gl/projector.js`, `leader.js`, view transitions polish.
9. Reduced-motion audit, axe, performance pass, 320px sweep, tests.
10. P2: sound, timeline zoom.
