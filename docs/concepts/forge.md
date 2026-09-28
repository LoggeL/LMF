# THE FORGE — Konzept für Logge Media Forge

> Creative-direction spec for the full LMF redesign. The spec is written in English and the on-site copy in German.
> Status: concept, ready to build. Target: static GitHub Pages, no build step, vanilla ES modules.

---

## 0. TL;DR

**Logge Media Forge becomes an actual forge.** The site opens in a dark forge with a live WebGL coal bed. The LMF logo gets hammered out of a glowing billet in three anvil strikes, then cools and shows real temper colours as it does. The cursor puts heat back into the steel and throws sparks. Every project is a **Werkstück**: a forged plate stamped with its number, alloy (category), year and stack.

The metaphor also carries information. Two colour systems encode real data:

| Signal                    | Carries                                                  | Source                                                                |
| ------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| **Anlassfarbe** (temper colour) | the _Legierung_, i.e. the category (Web, Games, KI, Film) | `groups` in `data/projects.json`                                      |
| **Glut** (glow heat)      | the _Aktualität_ (how recently I worked on it)            | `pushedAt` (repo) / publish date (film) from `docs/research/*.json`   |

So when you look at the archive you see **what** each thing is (its tint) and **how alive it is** (its glow). That is the "go deeper into the content" part. It also comes with dedicated deep-dive views (`#werk/<id>`), a year-by-year **Schichtbuch** (shift log) built on real GitHub numbers, and four long-form **Meisterstücke** chapters.

Design mantra: **„Hitze kommt schnell, Kälte langsam.“** Heat arrives in about 90 ms and cooling takes about 1.6 s. Every hover, press and filter follows that asymmetry, and the asymmetry is what makes the site feel physical.

---

## 1. Big idea and narrative

### 1.1 Why the forge

The name has always been _Media Forge_. The current site says "offene Tabs": curiosity, many things started. The forge adds the missing half, **making**. Ideas go into the fire raw. Some get hammered into finished pieces (Kniffel, MelodAI, the ski films). Some cool off in the Lager (the Corona Board). Some are still glowing (the 62 public repos created in 2026 so far). The story of the page is the story of a workshop day:

1. **Anheizen (hero):** the Esse (forge hearth) lights and the logo is forged in front of you.
2. **Noch warm:** what's on the anvil right now.
3. **Meisterstücke:** four pieces, told properly.
4. **Das Lager:** everything, searchable, as stamped stock.
5. **Das Schichtbuch:** the years, with a real "heat curve" of output.
6. **Die Werkstatt:** who works here, which tools hang on the wall, which crew shows up.
7. **Abseits der Tabs:** the photo archive.
8. **Das Feuer ist noch an:** contact.

### 1.2 Tone

Keep Logge's voice: casual first person, short sentences, gently self-ironic, with the „offene Tabs“ motif woven in rather than replaced. The forge vocabulary is **seasoning, not jargon**. Every forge word shares the line with a plain word (e.g. filter label "KI", with the tint legend explaining "Anlassfarbe Blau" once, optionally).

### 1.3 Honesty rule baked into the design

- Every number on the site is **computed from data** (count of projects, tags, repos per year). It is never typed into HTML copy.
- Every stat in a deep dive shows a **„Stand: TT.MM.JJJJ“** and has a **„Quellen“** disclosure listing the README / API / live page it came from.
- Missing data means the element is **omitted**. It is never shown as a placeholder. No "—" stats and no fake screenshots. Projects without images get a **Rohling** (blank billet): a typographic plate that is clearly not a screenshot.
- Forge temperatures (220 °C etc.) are labelled as a **colour-system legend** (real metallurgy of carbon-steel temper colours). They are never presented as project facts.

---

## 2. Information architecture (section by section, with copy)

Global order in `index.html`:

```
header.site-header       (sticky, 56px)
main
  #esse          Hero (always dark scope)
  #warm          Noch warm (recent work rail)
  #meisterstuecke  4 chapters
  #lager         Archive (search/filter/sort/views)
  #schichtbuch   Timeline + repo heat curve
  #werkstatt     About + Werkzeugwand + Zunft (partners)
  #abseits       Gallery teaser
  #kontakt       Contact (always dark scope)
footer
dialog#werkbank  Deep-dive (route #werk/<id>)
dialog#kuerzel   Keyboard shortcut sheet (?)
```

The old anchors `#projects`, `#about`, `#socials`, `#selected` and `#home` are kept as **aliases** (an empty `<span id>` inside the new sections) so existing links and tests keep working.

### 2.1 Header

- Left: logo SVG (inline, `currentColor` + brand red), wordmark in stencil: `LOGGE / MEDIA FORGE`.
- Nav: **Werkstücke** (#lager) · **Schichtbuch** · **Werkstatt** · **Galerie** (gallery/) · **Kontakt**.
- Right controls:
  - Theme toggle, labelled by state: `aria-label="Tageslicht-Design aktivieren"` / `"Esse-Design aktivieren"`. The visible icon is a tiny flame/sun glyph.
  - Sound toggle: `aria-pressed`, label "Ton". Off by default and persisted in `localStorage("lmf-sound")`.
  - Mobile: "Menü +" button, same pattern as today.
- Section indicator (desktop ≥ 1024px): a small mono readout next to the nav, `§ 03 Lager`, updated by IntersectionObserver. It is `aria-hidden`; the landmarks carry the semantics.
- A 2px **Glühlinie** under the header (see S5) whose colour follows the page's `--heat` value: hot at the top, cooling as you scroll.

### 2.2 `#esse` — Hero „Anheizen“

Layout (desktop): full-viewport section, min-height `100svh`, WebGL canvas as background layer, and a 12-column grid on top.

```
[eyebrow, mono]            Logge Media Forge · Die Werkstatt von Logge
[H1, display 2 lines]      Aus Neugier.
                           Gemacht.                 ← "Gemacht." is stamped in on strike 3
[lead]                     Ich baue Apps, entwickle Spiele, mache Filme und
                           probiere viel mit KI aus. Das hier ist meine Esse:
                           alles, was aus einer Idee geworden ist. Fertig,
                           halbfertig oder abgekühlt im Lager.
[CTA primary]              Ins Lager ↘                      (→ #lager)
[CTA ghost]                Einmal zuschlagen                (→ strike, see S1)
[readout strip, mono]      {n} Werkstücke · 4 Legierungen · seit {gh.createdYear} auf GitHub
[hint, mono, pointer only] Maus bewegen: Funken. Klicken: Schlag.
[scroll cue]               Weiter ↓
```

- `{n}` = `projects.length` at runtime (39 today, more after the research import). `{gh.createdYear}` = 2015 (GitHub API `users/LoggeL.created_at` = 2015-04-15; stored in `data/stats.json` with its source).
- The static HTML ships the readout **without numbers** ("Werkstücke · Legierungen · GitHub"), and JS fills them in. That way no stale numbers are hard-coded.
- The hint line only renders when `matchMedia("(hover: hover) and (pointer: fine)")` is true. Touch variant: "Tippen: Schlag."

### 2.3 `#warm` — „Noch warm.“

```
eyebrow   01 / Auf dem Amboss
H2        Noch warm.
lead      Woran ich zuletzt gehämmert habe. Manches glüht noch,
          manches ist gerade erst abgekühlt.
```

- A horizontal **rail** of 6–8 plates, sorted by `research.repo.pushedAt` (fallback: `isNew` flag, then JSON order). Each plate shows the heat state label, e.g. `glüht · zuletzt bearbeitet 19.09.2026`. The date comes from data.
- Rail = CSS `overflow-x: auto; scroll-snap-type: x mandatory`, with visible prev/next buttons (keyboard + mouse) that call `scrollBy`. At the end there's a "Alles im Lager →" tile.
- Heat state (derived, see §4.5): `glüht` (≤ 30 days), `warm` (≤ 180 days), `abgekühlt` (older), `fertig` (films/finished media), `ausgemustert` (archived).

### 2.4 `#meisterstuecke` — four chapters

```
eyebrow   02 / Meisterstücke
H2        Vier Stücke, genauer angeschaut.
lead      Eins aus jeder Legierung. Mit Geschichte, Werkzeug und
          allem, was dranhängt.
```

One chapter per alloy. The default picks are below. They are configurable via `data/stories.json → featured[]`, and each one only works if research provides a `story`; otherwise the project falls back to the next candidate with a story.

| #   | Alloy  | Project                             | Existing sourced hooks                                                    |
| --- | ------ | ----------------------------------- | ------------------------------------------------------------------------- |
| I   | Games  | **Bomberman**                       | lokal an einer Tastatur oder online per Raumcode, Bots, 6 Arenen, Kettenreaktionen |
| II  | KI     | **MelodAI**                         | KI-Stimmtrennung, zeitlich abgestimmte Lyrics, synchrone Wiedergabe       |
| III | Film   | **Infected** (+ Infected Origins)   | in 48 Stunden gedreht, praktische Effekte, Prequel-Drehbuch online lesbar |
| IV  | Web    | **Kolpingtheater Ramsen** or **Kniffel** | Website + Ticketsystem / 1–6 Personen, Live-Rangliste                |

Chapter template (copy draft for Infected, using only facts already in `projects.json` plus fields that research will fill):

```
kicker    Kapitel III · Film · Rotglut
H3        Infected
dek       48 Stunden. Ein Action-Kurzfilm.
story     {research.story[0..2]}            ← 2–3 short paragraphs, German
facts     Gedreht in: 48 Stunden            ← from projects.json description
          Veröffentlicht: {research.film.published}
          Länge: {research.film.duration}
          Rolle: {research.film.role}
          Mit: Palatina Films               ← only if research links it
spinoff   Die Vorgeschichte gibt's als Drehbuch: Infected Origins →  (#werk/infected-origins)
CTA       Film ansehen ↗   ·   Werkstück öffnen →  (#werk/infected)
```

Layout: a sticky **media column** (left, 7 cols) and **steps** (right, 5 cols). Each step (story → highlights → stack/alloy → numbers) swaps the media panel (image → second screenshot → alloy bar → spec sheet). On mobile the chapter is simply stacked. The "swap" is progressive: without JS or with reduced motion, all media is shown inline in order.

### 2.5 `#lager` — Das Lager (archive)

```
eyebrow   03 / Das Lager
H2        Alles, was hier entstanden ist.
lead      {n} Werkstücke. Durchsuchbar nach Titel, Stack, Jahr und allem,
          was drinsteht. Nimm dir, was dich interessiert.
toolbar   [Alle {n}] [Web & Apps] [Games] [KI] [Film]   [⌕ Suchen: Titel, Stack, Jahr …  /]
          Sortieren: [Neueste zuerst ▾]   Ansicht: [Regal | Liste]   [☐ Ausgemustertes zeigen]
status    12 von 55 Werkstücken                     (role=status, aria-live polite)
grid      plates …
more      Mehr aus dem Lager ↓
empty     H3 Da liegt nichts. Noch nicht.
          p  Für diese Suche gibt's kein Werkstück. Hier ist noch Platz für eine Idee.
          [Alles zeigen ↗]
```

Details in §5.

### 2.6 `#schichtbuch` — „Das Schichtbuch.“

```
eyebrow   04 / Das Schichtbuch
H2        Jahr für Jahr am Amboss.
lead      Was wann auf der Werkbank lag. Die Glühbalken zeigen, wie viele
          öffentliche Repos ich pro Jahr angelegt habe.
callout   {stats.reposByYear[currentYear]} neue Repos in {currentYear}, bisher.
          Die Esse ist gerade ziemlich heiß.
footnote  Eigene öffentliche Repositories nach Anlagedatum, ohne Forks.
          Stand: {stats.asOf}. Quelle: GitHub API.
```

Verified snapshot (28.09.2026, `gh repo list LoggeL --visibility public`, non-forks, by `createdAt` year):
`2017: 1 · 2018: 2 · 2019: 6 · 2020: 9 · 2021: 9 · 2022: 8 · 2023: 8 · 2024: 10 · 2025: 25 · 2026: 62`. The research import owns the canonical numbers; this snapshot only proves the story holds up.

Per-year entries, rendered from `data/timeline.json` (persona milestones, sourced) plus projects grouped by `yearStarted`:

```
2015   GitHub-Konto angelegt.                              (API: users/LoggeL created_at 2015-04-15)
2017   Erstes öffentliches Repo: BetterDiscordThemes.      (API: repo createdAt 2017-07-12)
2020   Das LMF-Repo entsteht.                              (API: LoggeL/LMF createdAt 2020-08-27)
…      [Werkstück-Chips für alle Projekte mit yearStarted = Jahr]
```

Films use the publish year from research. Projects without `yearStarted` are not placed; the section's footer says „Nicht jedes Werkstück hat ein belegtes Jahr. Die fehlen hier lieber, als geraten zu werden.“

### 2.7 `#werkstatt` — about, tools, crew

```
eyebrow   05 / Die Werkstatt
H2        Ich wollte wissen, ob das geht.
lead      So fangen ziemlich viele meiner Projekte an.
p         Ein Spiel für den nächsten Abend mit Freunden. Eine App für ein Problem,
          das mich selbst nervt. Ein Film, der von einer Reise mehr festhält
          als ein paar Fotos.
p         Unter Logge Media Forge sammle ich diese Dinge. Ich arbeite mit Code,
          Kamera und KI, lerne beim Machen und lande dabei regelmäßig bei der
          nächsten Idee.
links     Mein GitHub ↗ · Zur Fotogalerie ↗
```

**Werkzeugwand** („Was an der Wand hängt“): a pegboard of the most-used tools. Each tool is a hanging tag with a count, computed from `tags` + `research.stack` across all projects (normalised: `nextjs`→`Next.js`, `typescript`→`TypeScript`). Clicking a tag sets the archive search to it and scrolls to #lager (`Next.js ×{k} → im Lager zeigen`). Header copy: „Was an der Wand hängt. Gezählt, nicht geschätzt.“

**Zunft** („Selten ganz allein.“ / „Gute Leute. Gemeinsame Sachen.“): partner plates from `partners.json`, each as a riveted brass badge. Gummibärenbande keeps its video, which only plays on hover/focus, is paused with reduced motion, and shows a poster otherwise.

### 2.8 `#abseits` — gallery teaser

```
eyebrow   06 / Abseits der Tabs
H2        Mit der Kamera statt mit der Tastatur.
lead      {gallery.count} Aufnahmen aus dem Herbst 2020.   ← derived from camera
          filenames IMG_20200924 … IMG_20201026
CTA       Zum Fotoarchiv ↗
```

The visual is a **contact sheet** (Kontaktbogen) strip of 8 thumbnails with stamped frame numbers and dates derived from filenames (`24.09.2020 · 23:30`). No captions are invented; alt text stays generic ("Galerieaufnahme 03") unless better descriptions are written by hand later.

### 2.9 `#kontakt` — contact (always dark scope, glowing coals at the bottom)

```
eyebrow   07 / Der nächste offene Tab
H2        Was hast du im Kopf?
p         Eine Idee, eine Frage oder einfach ein Hallo. Schreib mir.
mail      hyper.xjo@gmail.com ↗          (huge, display type, heats up on hover)
links     Discord ↗ · Telegram ↗ · GitHub ↗
aside     Das Feuer ist noch an.
```

### 2.10 Footer

`Logge Media Forge — Aus Neugier. Gemacht.` · `© {year} LMF` · `Esse aus. Bis zum nächsten Tab.` · `Nach oben ↑` · `Tastenkürzel (?)`

---

## 3. Visual system

### 3.1 Typography

All faces are open-license and self-hosted as woff2 in `assets/fonts/`. They are subset with `pyftsubset` to Basic Latin, Latin-1, and `– — ‘ ’ ‚ “ ” „ … € № ° ← ↑ → ↓ ↗ ↘ ★`.

| Role                                    | Font                                                | License | Source                                                                                                        | Use                                                        |
| --------------------------------------- | --------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **Display**                             | **Big Shoulders Display** (variable, wght 100–900)  | SIL OFL 1.1 | Google Fonts (fonts.google.com/specimen/Big+Shoulders+Display) · github.com/xotypeco/big_shoulders       | H1/H2, titles, huge numbers. Condensed, Chicago-industrial, and fits "Aus Neugier." at 320px. |
| **Stamp**                               | **Big Shoulders Stencil Display** (variable)        | SIL OFL 1.1 | same family / repo                                                                                        | Werkstück numbers, stamps, alloy chips, year numerals in the Schichtbuch. |
| **Meta**                                | **JetBrains Mono** (variable, wght 100–800)         | SIL OFL 1.1 | github.com/JetBrains/JetBrainsMono/releases                                                                    | eyebrows, spec sheets, stack, dates, counters.             |
| **Body**                                | **Montserrat** (existing `assets/fonts/Montserrat.woff2`) | SIL OFL 1.1 | already in repo                                                                                     | paragraphs, UI labels. Keeps brand continuity and costs no new bytes. |

Note: Google Fonts currently ships Big Shoulders as a family with Display/Text and Stencil variants (the exact naming may appear as "Big Shoulders" with an optical-size axis). Take whatever variable cut is current from the repo or google-webfonts-helper and subset it. Only the display cut is preloaded.

Fallbacks with metric overrides, to avoid CLS on swap:

```css
@font-face { font-family: "BS Fallback"; src: local("Arial Narrow"), local("Roboto Condensed"), local("Arial");
  size-adjust: 92%; ascent-override: 98%; descent-override: 24%; }
--font-display: "Big Shoulders Display", "BS Fallback", sans-serif;
--font-stamp:   "Big Shoulders Stencil Display", var(--font-display);
--font-mono:    "JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace;
--font-body:    Montserrat, system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
```

Fluid scale (`clamp`, rem-based, 1rem = 16px):

| Token      | Value                                  | Use                           |
| ---------- | -------------------------------------- | ----------------------------- |
| `--t-hero` | `clamp(3.6rem, 1.2rem + 12vw, 14rem)`  | H1, weight 800, line-height .82, uppercase, tracking −0.01em |
| `--t-h2`   | `clamp(2.6rem, 1.4rem + 5.5vw, 7rem)`  | section titles, weight 700, lh .9 |
| `--t-h3`   | `clamp(1.6rem, 1.1rem + 2vw, 3rem)`    | plate titles, chapter titles  |
| `--t-lead` | `clamp(1.125rem, 1rem + .5vw, 1.375rem)` | leads, lh 1.5               |
| `--t-body` | `1rem` (min 16px)                      | lh 1.65                       |
| `--t-meta` | `.75rem` (12px), mono, uppercase, tracking .08em | stamps/eyebrows. **Never below 12px.** |

Typographic details:

- The H1 uses `font-variation-settings` to animate weight 300 → 800 on the strike (the metal gets "compressed"), plus `letter-spacing` 0.08em → −0.01em. That's 2 properties with no layout thrash, because the H1 has a fixed height via `line-height` and `height: 2lh`.
- Numerals are `font-variant-numeric: tabular-nums` everywhere in stamps and counters.
- "Engraved" effect for titles on Rohling plates: `color: var(--steel-3); text-shadow: 0 1px 0 var(--steel-hi), 0 -1px 0 var(--steel-lo);`. The plate title is duplicated as a real `<h3>` for accessibility, and contrast is checked (≥ 4.5 on the plate).

### 3.2 Colour tokens

Two themes. **Esse** is dark and **Tageslicht** is light, and both are defined on `:root`. The hero (`#esse`), `#kontakt` and the Werkbank header are **always Esse** (`.scope-esse` re-declares the dark tokens), so the fire always sits on black.

Contrast numbers were computed (WCAG 2.x relative luminance) for this spec.

#### Esse (dark) — used when stored as `lmf-theme=dark`, or when nothing is stored and `prefers-color-scheme: dark`

| Token             | Hex       | Role                               | Contrast on `--bg` / `--surface` |
| ----------------- | --------- | ---------------------------------- | -------------------------------- |
| `--bg`            | `#0E0C0B` | Kohle (charcoal)                   | –                                |
| `--surface`       | `#1A1614` | plate steel                        | –                                |
| `--surface-2`     | `#241E1B` | raised steel, inputs               | –                                |
| `--ink`           | `#F3EEE7` | Asche hell (text)                  | 16.9 / 15.6                      |
| `--muted`         | `#AFA59A` | secondary text                     | 8.1 / 7.4                        |
| `--line`          | `#4A403A` | decorative rules only              | 1.9 (decorative)                 |
| `--control`       | `#7D7067` | input/button borders (≥3:1 UI)     | 4.1 / 3.75                       |
| `--accent`        | `#FF7A3D` | Glut, links, focus fill            | 7.5 / 6.9                        |
| `--brand`         | `#FF3B4E` | logo red, lifted for dark          | 5.6 / 5.1                        |
| `--focus`         | `#FFD166` | focus ring (3px, 2px offset)       | 13.5                             |
| `--alloy-web`     | `#E9C46A` | Strohgelb                          | 11.7 / 10.8                      |
| `--alloy-games`   | `#D59BF0` | Purpur                             | 9.1 / 8.4                        |
| `--alloy-ai`      | `#86AEFF` | Kornblumenblau                     | 8.8 / 8.1                        |
| `--alloy-film`    | `#FF7D5C` | Kirschrotglut                      | 7.8 / 7.1                        |

#### Tageslicht (light) — "kaltes Eisen auf Kalkstein"

| Token             | Hex       | Role                        | Contrast on `--bg` / `--surface` / `--surface-2` |
| ----------------- | --------- | --------------------------- | ------------------------------------------------ |
| `--bg`            | `#EDE9E2` | Kalk / Asche                | –                                                |
| `--surface`       | `#F8F6F2` | plate                       | –                                                |
| `--surface-2`     | `#E2DCD2` | inputs, raised              | –                                                |
| `--ink`           | `#171311` | Graphit                     | 15.3 / 17.1 / 13.5                               |
| `--muted`         | `#5B524A` |                             | 6.3 / 7.1 / 5.6                                  |
| `--line`          | `#8C8076` | rules                       | 3.2                                              |
| `--control`       | `#857970` | UI borders                  | 3.5 / – / 3.1                                    |
| `--accent`        | `#A3320E` | Glut, darkened              | 5.8 / – / 5.1                                    |
| `--brand`         | `#B80D29` | logo red                    | – / – / 4.9                                      |
| `--focus`         | `#1D4FB3` | focus ring                  | 6.2                                              |
| `--alloy-web`     | `#6E5200` | Stroh, darkened             | 6.1 / 6.8 / 5.4                                  |
| `--alloy-games`   | `#7A3796` | Purpur                      | 6.2 / 6.9 / 5.5                                  |
| `--alloy-ai`      | `#1D4FB3` | Blau                        | 6.2 / 6.9 / 5.5                                  |
| `--alloy-film`    | `#A8261A` | Rotglut                     | 5.9 / 6.6 / 5.2                                  |

Chips use a filled style in light mode (white text on alloy: 7.1–7.5) and an outline/tinted style in dark mode (alloy text on `--surface-2` ≥ 6.5).

#### Heat ramp (Glut)

This ramp is purely decorative (glows, shader, bars). It is **never used for text**. It is shared by CSS and GLSL.

```
--heat-0: #2A2522  (kaltes Eisen)
--heat-1: #5A0E05  (dunkle Rotglut ~600 °C)
--heat-2: #B3200A  (Kirschrot ~800 °C)
--heat-3: #F2600C  (Orange ~1000 °C)
--heat-4: #FFB347  (Gelb ~1100 °C)
--heat-5: #FFF4D6  (Weißglut ~1300 °C)
```

Alloy legend (optional `<details>` below the archive filters, „Warum diese Farben?“):
„Wenn Stahl angelassen wird, läuft er in Farben an: erst strohgelb, dann purpur, dann blau. Glühender Stahl leuchtet kirschrot. Die Farben hier folgen dem: Web ist Strohgelb, Games Purpur, KI Blau, Film Rotglut. Und wie stark ein Werkstück glüht, zeigt, wie kürzlich ich daran gearbeitet habe.“

#### Material textures (all procedural, no image downloads)

- **Steel grain**: a single inline SVG `feTurbulence` (baseFrequency .9, numOctaves 2) as a `data:` URI at 3–6% opacity, via `background-blend-mode: overlay` on plates. About 400 bytes.
- **Rivets**: 4× `radial-gradient` in plate corners (`::before`), 6px, lit from top-left.
- **Hammer marks** (Meisterstücke headers only): a tiled SVG of soft Voronoi dents at 4% opacity.
- **Scale/Zunder** (hero edges): produced by the shader, not by CSS.

### 3.3 Grid and spacing

- Container: `max-inline-size: 1440px; padding-inline: max(16px, 4vw)`.
- Columns: **12** at ≥ 1024px (gutter 24px), **6** at 640–1023px (gutter 20px), **4** at < 640px (gutter 16px).
- Spacing scale (8px base): `4 8 12 16 24 32 48 64 96 144 208`. Section padding is `clamp(96px, 12vw, 208px)` vertically.
- **Blueprint layer**: in section headers only, 1px `--line` column guides with small "+" marks at intersections (CSS `repeating-linear-gradient`) to evoke a workshop drawing. They are `aria-hidden` and disabled under `prefers-contrast: more`.
- Plates in the Regal (grid) view use `grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr))`. The media aspect ratio is 16:10 (matches the existing 960×600 assets).

### 3.4 Motion principles

1. **Heat is fast, cooling is slow.** Heat-in is 60–120 ms and cool-out is 1200–2400 ms.
2. **Mass, not bounce.** Only strikes are allowed to overshoot. Everything else decelerates heavily.
3. **One strike, one place.** At most one decorative burst at a time per component. No ambient loops outside the hero and contact coals.
4. **Motion explains state.** Stamps appear when content enters, quench on filter, and morph into the deep dive. There is no decoration that is disconnected from state changes.

Tokens:

```css
--ease-hammer:  cubic-bezier(.7, 0, .84, 0);     /* accelerate into impact */
--ease-rebound: cubic-bezier(.34, 1.56, .64, 1); /* after impact, slight overshoot */
--ease-cool:    cubic-bezier(.16, 1, .3, 1);     /* expo-out, long tails */
--ease-quench:  cubic-bezier(.4, 0, 1, 1);       /* fast exit */
--ease-std:     cubic-bezier(.2, 0, 0, 1);       /* UI default */

--d-strike:   90ms;   --d-rebound: 260ms;  --d-ui: 180ms;
--d-heat-in: 100ms;   --d-cool:   1600ms;  --d-route: 520ms;
--d-stamp:   420ms;   --d-quench:  240ms;
```

Registered custom properties (`@property`) so they can be transitioned: `--heat` (`<number>`, 0–1), `--mx`/`--my` (`<percentage>`), `--flap` (`<integer>`).

---

## 4. Signature interactions (6)

### S1 — Die Esse: forged logo hero (WebGL2, hand-written)

**What you see.** A black forge. At the bottom, a bed of coals slowly breathes (domain-warped fbm). In the centre-right (desktop) / behind the headline (mobile) there's a glowing rectangular billet. It takes three strikes: the screen flashes softly, the billet compresses and spreads, sparks burst out, and after strike 3 it _is_ the LMF logo. Then it cools over about 2 s through yellow → orange → cherry → dark steel, with a thin iridescent temper sheen (straw → purple → blue) passing across the surface as it cools. The cursor is a heat source: moving over the steel reheats it locally and throws sparks proportional to speed. Clicking or tapping is a strike at that point: a local flash, a burst, and the H1 "Gemacht." gets restamped.

**Technique.**

- **Context**: WebGL2, one fullscreen triangle, `preserveDrawingBuffer: false`, `antialias: false`, `powerPreference: "low-power"` (upgrade to "high-performance" is not needed).
- **Logo mask**: `logo-mask.js` loads `assets/svg/logo.svg` as an `Image` and draws it to a 1024×612 2D canvas. It then builds a **signed distance field** with a jump-flood pass on the GPU (two small shaders, ~log2(1024)=10 iterations at half res). The result is an R16F texture, `u_logoSdf`, computed once and cached in memory. (Cheaper fallback, if JFA is too much: 3 box-blur passes of the mask give a pseudo-SDF. That's good enough for bevel normals.)
- **Billet → logo morph**: `sdf = mix(sdRoundBox(p, billetSize), logoSdf(p), forge)`, where `forge` steps 0 → .45 → .8 → 1 at each strike, easing over 220 ms with `--ease-rebound` semantics implemented in JS. After each strike, the billet's `y` scale is squashed by `1 − 0.06·impulse`.
- **Heat field**: a ping-pong RG16F FBO at ¼ resolution. Each frame:
  `h' = blur5(h) * pow(0.35, dt)` (so ~65% decays per second, which is slow cooling), `+ splat(pointer, radius 0.06, amount ∝ pointer speed)`, `+ strikeImpulse`. The G channel stores "has been hot" memory for the temper sheen.
- **Shading of the metal** (inside `sdf < 0`):
  - Normal from SDF gradient (bevel width 0.012), plus hammer-dent normal perturbation from cellular noise, whose amplitude grows with the number of strikes.
  - `T = clamp(introHeat(t) + h.r, 0, 1)`; `emissive = blackbody(T)` (analytic ramp over the six `--heat-*` stops, sent as a `vec3[6]` uniform so CSS and GLSL stay in sync).
  - Cold steel = `#2A2522` with Blinn-Phong spec from a fixed key light upper-left.
  - Temper sheen: when `0.05 < T < 0.25`, mix in a hue band `temper(T)` (straw `#C9A227` → purple `#6B3FA0` → blue `#2E5DA8`) at 25% max, following the real sequence as it cools.
- **Background**: coal bed = `fbm(domainWarp(p*3 + t*.03))` masked to the lower 35%, tinted with heat-1..3; vignette; subtle heat-haze displacement (screen-space `sin` distortion of the fbm) above the coals only.
- **Sparks**: `sparks.js` is a CPU pool of 512 particles in a `Float32Array` (x, y, vx, vy, life, seed). Update: `v += g·dt; v *= 0.985; life -= dt`. Emit 60–120 on a strike (cone upwards ±70°, speed 0.6–1.8 vp/s) and up to 24/frame on pointer move. Rendered as `gl.POINTS` in the same context, with additive blending (`ONE, ONE`), size 1.5–3 px × DPR, colour = `blackbody(life)`, and a stretched streak computed in the fragment shader from velocity. The buffer is uploaded with `bufferSubData` each frame (512×6 floats = 12 KB, trivial).
- **Intro timeline** (`forge.js`): `t=0` billet appears at T=1 (white) → strikes at 450 / 1050 / 1650 ms → cooling until 3.6 s. On each strike: `strikeImpulse`, a spark burst, a 1-frame additive flash, a camera shake of ±3 px for 120 ms (skipped in low-motion situations), `navigator.vibrate?.(8)` only if sound is on and on touch devices, `anvil.clink()` only if sound is on, and `document.dispatchEvent(new CustomEvent("forge:strike", {detail:{n}}))`. The H1 listens: on strike 3 it runs the **stamp** animation on "Gemacht." (weight 300 → 800, `--d-strike` + `--d-rebound`).
- **Returning visitors**: `sessionStorage("lmf-forged")` means the intro is skipped and the hero starts cooled. Cursor/strike interaction stays.
- **Keyboard**: the „Einmal zuschlagen“ button triggers a centred strike. It's a real `<button>`, and its purpose is described: `aria-describedby="strike-hint"` → „Löst eine Animation im Hintergrund aus. Rein dekorativ.“ The canvas is `aria-hidden="true"` and `role="presentation"`.
- **Resource management**: render at `min(devicePixelRatio, 1.5)` (mobile: 1). There's an adaptive quality governor: if the average frame time over 30 frames is > 22 ms, drop the heat FBO to ⅛ and particles to 256, and if it's still slow, freeze the coal animation. IntersectionObserver pauses rAF when the hero is < 5% visible, and so does `visibilitychange`. `webglcontextlost` swaps to the poster.
- **Loading**: `main.js` does **not** import the forge. After `load` + `requestIdleCallback` (timeout 1500 ms), and only if `WebGL2 && !reducedMotion && !navigator.connection?.saveData && (navigator.deviceMemory ?? 8) >= 2`, it does `import("./forge/forge.js")`. Until then (and forever as fallback), the hero shows **`assets/img/forge-poster.avif/webp`**: a single frame of the cooled logo rendered from our own shader by `scripts/render-poster.mjs` (Playwright screenshot of `?poster` mode). It's our own artwork, not a project screenshot. The canvas fades in over the poster (opacity 0 → 1, 600 ms) once the first frame is drawn.
- **Light theme**: the hero stays in Esse scope (the fire needs the dark). Only the rest of the page follows the theme.

Shader sketch (fragment, composite pass, abbreviated):

```glsl
#version 300 es
precision highp float;
uniform sampler2D u_sdf, u_heat; uniform vec3 u_ramp[6];
uniform float u_forge, u_intro, u_strikes, u_time; uniform vec2 u_res, u_logoPos, u_logoScale;
in vec2 v_uv; out vec4 o;
vec3 blackbody(float t){ t=clamp(t,0.,1.)*5.; int i=int(floor(t)); return mix(u_ramp[i], u_ramp[min(i+1,5)], fract(t)); }
float sdLogo(vec2 p){ vec2 q=(p-u_logoPos)/u_logoScale+.5; return (texture(u_sdf,q).r-.5)*u_logoScale.x; }
void main(){
  vec2 p = v_uv; float d = mix(sdRoundBox(p-u_logoPos, vec2(.18,.05)*u_logoScale/.3, .01), sdLogo(p), u_forge);
  vec2 h = texture(u_heat, p).rg;
  vec3 col = coalBed(p, u_time);
  if (d < 0.) {
    vec3 n = bevelNormal(p, d) + dentNormal(p*40., u_strikes)*.15;
    float T = clamp(u_intro + h.r, 0., 1.);
    vec3 steel = vec3(.165,.145,.133) * (.35 + .65*max(dot(n, normalize(vec3(-.4,.6,.7))),0.)) + spec(n);
    col = steel + blackbody(T)*smoothstep(.02,.2,T) + temper(T, h.g)*.25;
  }
  col += glow(d, u_intro + h.r);           // halo around hot metal
  o = vec4(col, 1.);
}
```

**Reduced motion**: no module load; poster only; the H1 is fully rendered with no stamp animation. The „Einmal zuschlagen“ button is **hidden** (`hidden` attribute), because it would have nothing to trigger.

### S2 — Amboss-Schlag: strike micro-interaction on every press (CSS + tiny WAAPI + optional WebAudio)

Applies to: primary buttons, filter chips, load-more, "Weiter" controls, the prev/next buttons in the Werkbank.

- `:active` (and `.is-struck` for keyboard Enter/Space via `keydown`/`keyup`): `transform: translateY(2px) scaleY(.965)` over `--d-strike` `--ease-hammer`. On release: back to identity over `--d-rebound` `--ease-rebound`.
- At the same time, the background flashes to `--heat-4` for 1 frame and then cools to its resting colour (`transition: background-color var(--d-cool) var(--ease-cool)`). The chip "glows then goes dark".
- **Sparks**: `anvil.js` `strike(el, x, y)` creates 7 `<i class="spark">` nodes (absolutely positioned inside a shared, `pointer-events:none` overlay `<div aria-hidden="true">` at the body root, so there's no layout impact on the button). Each is animated with WAAPI: random angle in the upper 140° cone, distance 18–46px, `transform` + `opacity`, 380–620 ms, `--ease-cool`. The node is removed on `finish`. There's a hard cap of 40 live sparks page-wide.
- **Sound (opt-in)**: `anvil.clink()` synthesises a short anvil ping with WebAudio: 3 sine partials at inharmonic ratios (1, 2.76, 5.40) × 1850 Hz base with a random ±4% detune, gain envelope attack 2 ms and exp decay 380 ms, plus 20 ms of band-passed noise for the hammer "tick". Master gain is 0.12. The AudioContext is created lazily on the first user gesture after the toggle is on. No audio files.
- **Reduced motion**: no translate/scale and no sparks; only the colour flash (instant, not animated). Sound still follows the user's explicit toggle.

### S3 — Werkstück plates: stamped metadata + heat under your hand (CSS `@property`, scroll-driven animation, pointer vars)

Every project card is a plate:

```
┌─ ● ────────────────────────────── ● ─┐
│ Nº 017                 [KI · Blau]   │  ← stencil number, alloy chip
│ ┌──────────────────────────────────┐ │
│ │  media 16:10 (image or Rohling)  │ │
│ └──────────────────────────────────┘ │
│ MelodAI                           ↗  │  ← display title (h3 inside the link)
│ Karaoke mit KI-Stimmtrennung …       │  ← summary
│ 2024 · TYPESCRIPT · ★ 7 · glüht      │  ← mono stamp row, only present fields
└─ ● ────────────────────────────── ● ─┘
```

- **Number `Nº`**: position in a chronological sort (yearStarted, then JSON order), zero-padded to 3. It's derived and purely an index, and it carries no claim. It is shown in the Werkbank as well, so the "stock number" is consistent.
- **Stamp-in**: `@supports (animation-timeline: view())`, `.werk { animation: stamp both linear; animation-timeline: view(); animation-range: entry 5% entry 45%; }`. Keyframes: plate `opacity .0 → 1`, `translateY(28px) → 0`; the stamp row has `clip-path: inset(0 100% 0 0) → inset(0)` with a slight `letter-spacing` squeeze, so it looks like the ink is being pressed in. Browsers without support: static.
- **Heat under the hand**: `pointermove` (rAF-throttled, one listener delegated on the grid) writes `--mx/--my` on the hovered plate and sets `--heat: 1`. Leaving sets `--heat: 0`. `@property --heat` transitions **asymmetrically**: `.werk { transition: --heat var(--d-cool) var(--ease-cool) } .werk:is(:hover,:focus-within) { transition-duration: var(--d-heat-in) }`.
  The glow is painted by `::after`: `radial-gradient(circle at var(--mx) var(--my), color-mix(in oklch, var(--heat-4) calc(var(--heat)*45%), transparent), transparent 45%)` over a 1px border that mixes from `--line` to the alloy colour by `--heat`. Keyboard focus sets `--mx/--my` to 50%/40%, so focus looks like heat too. The focus ring is separate and always visible (see a11y).
- **Recency glow (data-driven, static)**: each plate has `data-glow="glueht|warm|abgekuehlt|fertig|ausgemustert"`, which maps to an inner box-shadow of heat-3 / heat-2 / none / none / desaturated plate. `ausgemustert` plates additionally get the grain at 10% and a stamped `AUSGEMUSTERT` diagonal (decorative; the text is also in the stamp row for screen readers).
- **Media treatment**: images stay honest, without filters at rest. On heat, a 6% `mix-blend-mode: screen` warm gradient is overlaid (not a recolour of the screenshot).
- **Rohling** (no image): steel plate texture, engraved title (`artTitle` or title) in the stencil face, and the category in mono. The existing `art` styles (`music`, `capture`, `retro`, `organic`, `widget`, `film`) become 6 billet variants: different engraving patterns (sound-wave grooves, viewfinder marks, 98-pixel bevel, organic etch, gauge ticks, film perforations), all CSS/SVG and all `aria-hidden`.

### S4 — Abschrecken: quench transition when filtering (View Transitions API, same-document)

- Each plate gets a stable `view-transition-name: werk-<id>` (CSS via inline `style` in the renderer) and `view-transition-class: werk`.
- `archive.update(next)` wraps the DOM update: `motion.transition(() => render(next))`. `motion.transition` calls `document.startViewTransition` if it's available and motion is allowed. Otherwise it calls the function directly.
- CSS:

```css
::view-transition-group(*.werk)   { animation-duration: 420ms; animation-timing-function: var(--ease-cool); }
::view-transition-old(*.werk):only-child {   /* leaving = quenched */
  animation: quench var(--d-quench) var(--ease-quench) both; }
::view-transition-new(*.werk):only-child {   /* entering = fresh from the fire */
  animation: reheat 520ms var(--ease-cool) both; }
@keyframes quench { 0% { filter: brightness(1.5) saturate(.6) } 100% { opacity: 0; filter: saturate(0) blur(6px); translate: 0 -14px } }
@keyframes reheat { 0% { opacity: 0; filter: brightness(2.2) sepia(1) saturate(3) hue-rotate(-20deg) } 100% { opacity: 1; filter: none } }
```

- A small **steam** puff (3 blurred ellipses, CSS only) rises from the toolbar when anything quenches: `.toolbar[data-steam]`, animated once for 700 ms.
- **Split-flap counter**: the visual counter `12 von 55` uses stencil digits in `overflow: hidden` cells, and each digit column translates by `calc(var(--flap) * -1em)` with `--ease-rebound` (320 ms). It is `aria-hidden`. The real text lives in the `role="status"` element (visually merged; SR reads „12 von 55 Werkstücken“).
- **Reduced motion** or no VT support: instant swap, counter updates as text only.

### S5 — Glühlinie and scroll-cooling (CSS scroll-driven animations)

- `html` gets a scroll timeline: `@supports (animation-timeline: scroll())`, `:root { animation: cool linear both; animation-timeline: scroll(root); } @keyframes cool { from { --page-heat: 1 } 30% { --page-heat: .15 } to { --page-heat: .05 } }`. (`@property --page-heat` is `<number>`.)
- The header's 2px Glühlinie: `background: color-mix(in oklch, var(--heat-3) calc(var(--page-heat)*100%), var(--line))`, with a `box-shadow` glow scaled by `--page-heat`. It's white-hot on arrival and a dim ember at the bottom.
- The section header rule ("Glühfaden") below each H2: `scale: 0 1 → 1 1` via `animation-timeline: view(); animation-range: entry 20% cover 35%`, with transform-origin left, coloured by the section's alloy (the Meisterstücke chapters use their alloy colour, the rest use accent).
- The WebGL hero reads `scrollY / heroHeight` and reduces the coal intensity and particle emission as you scroll. The fire "banks down" when you leave.
- **Reduced motion**: these are static lines at their end state; `--page-heat` is fixed at .3.

### S6 — Werkbank: card → deep-dive morph with hash routing (`<dialog>` + View Transitions + History)

The deep-dive view for a single project. Details in §5.3. The signature moment is the morph:

1. The user activates a plate link `<a href="#werk/melodai">`.
2. `router.js` intercepts `hashchange` (it doesn't need to preventDefault, since the hash is the state). It sets `view-transition-name: werk-hero` on the clicked plate's media element (and clears the per-card name for that one element during the transition to avoid duplicates).
3. `motion.transition(async () => { await werkbank.render(id); dialog.showModal(); })`. The dialog's hero media carries `view-transition-name: werk-hero`, so the browser morphs the small image into the full-bleed header (520 ms, `--ease-cool`). Title text morphs too (`werk-title`).
4. Closing reverses it: `history.back()` if we pushed the entry, otherwise `location.hash = "#lager"`. The morph runs back into the plate (the plate is scrolled into view first, instantly, if it's off-screen).
5. Without VT: the dialog uses `@starting-style` + `transition` on `opacity`/`translate` (240 ms) plus a `::backdrop` fade. With reduced motion: no transform, only a 120 ms opacity fade (or none).

Also inside the Werkbank: prev/next ("Voriges / Nächstes Werkstück") via buttons + `←`/`→` (when focus isn't in a text field). They navigate with `location.replace("#werk/<next>")` so Back still closes the dialog rather than stepping through 20 projects. The transition between two Werkstücke is a horizontal **slide-and-cool** VT (`::view-transition-old(werk-hero)` slides out left and cools; the new one slides in hot).

### (Bonus, if time allows) S7 — Werkzeug-Schnellzugriff: command palette

`Ctrl/⌘ + K` or `/` opens a small `<dialog>` with a combobox (`role="combobox"` + `listbox`, ARIA 1.2 pattern) that fuzzy-matches all Werkstücke, sections and tools. Enter goes to `#werk/<id>` or the anchor. It reuses `filterProjects`. It's not critical; the archive search stays the canonical path.

---

## 5. Archive and project detail

### 5.1 Data model (runtime)

`js/data.js` loads in parallel: `data/projects.json` (required), `data/stories.json`, `data/timeline.json`, `data/stats.json` (all optional; a failure of any of them only removes the related UI). It merges by `id` into `Werk` objects:

```js
/** @typedef {{
 *  id, title, category, description, summary?, image?, imageAlt?, art?, artTitle?, link, linkLabel?,
 *  tags: string[], groups: ("web"|"games"|"ai"|"film")[], source?, isNew?, archived?,
 *  // from research (all optional, each with sources):
 *  story?: string[],                 // 1–4 German paragraphs
 *  highlights?: string[],            // 3–6 bullet facts
 *  stack?: string[],                 // canonical tool names
 *  languages?: {name:string, pct:number}[],  // GitHub languages API, pct sums to ~100
 *  yearStarted?: number, yearLabel?: string,
 *  repo?: { fullName, url, stars?, forks?, createdAt?, pushedAt?, license?, commits? },
 *  film?: { published?, duration?, location?, role?: string[], with?: string[], youtubeId? },
 *  media?: { src, alt, kind: "screenshot"|"poster"|"still", width, height, source }[],
 *  sources: { label, url, checked }[],
 *  // derived:
 *  no: number, alloy: "web"|"games"|"ai"|"film", glow: "glueht"|"warm"|"abgekuehlt"|"fertig"|"ausgemustert",
 *  haystack: string   // lowercased search text
 * }} Werk */
```

- `alloy` = the first group in `groups`. Colour and chapter assignment use it, and all groups are still filterable.
- `glow`: `archived` gives `ausgemustert`; else `film` in groups gives `fertig`; else by `repo.pushedAt` relative to `stats.asOf` (**not** `Date.now()`, so the label matches the stated snapshot): ≤30 d `glueht`, ≤180 d `warm`, else `abgekuehlt`. No `pushedAt` gives `abgekuehlt` without a date label.
- `haystack` = title + description + summary + category + tags + stack + yearStarted + story, lowercased with the `de` locale. This extends today's `filterProjects` (and keeps its signature so `scripts/validate.mjs` still works).

**Research import (dev-time only)**: `scripts/import-research.mjs` reads `docs/research/*.json` (whatever shape the research team delivers), maps it to the three data files, and **fails** if any fact lacks a source URL. It also copies/converts new screenshots to `assets/img/<id>-*.webp` (via `sharp` as a devDependency, or plain copy if they're already webp) and records their origin in `docs/content-sources.md`. New projects from research are appended to `projects.json` with the required fields. `scripts/validate.mjs` is extended to validate the new files (ids exist, every `media.src` exists, `sources[].url` is https, `languages` pct sum within 95–105).

### 5.2 Archive behaviour

- **State**: `{ group: "all", q: "", sort: "neu", view: "regal", archived: true, limit: 12 }`.
- **URL sync**: `?g=games&q=kniffel&s=az&v=liste` via `history.replaceState`. It's shareable, and a hash route for the Werkbank can coexist (`?g=film#werk/infected`). On load the state is parsed from `location.search`.
- **Search**: input `type="search"`, debounced 120 ms, `/` focuses it (unless you're typing), `Esc` clears. Matches are highlighted in titles/summaries with `<mark>`, built safely from escaped text segments. Placeholder: „Suchen: Titel, Stack, Jahr …“.
- **Filters**: `role="group"` of toggle buttons with `aria-pressed` (the existing, tested pattern). Each chip shows its count (`Games 11`), computed live against the current query, so you see where results are before clicking. Chips with 0 get `aria-disabled="true"` plus a muted style (they stay focusable, because it's better not to remove them).
- **Sort**: a native `<select>`: „Neueste zuerst“ (pushedAt/published desc, then yearStarted desc, then JSON order), „Älteste zuerst“, „A–Z“, „Wie im Lager“ (JSON order; the curated default when no research dates exist).
- **Views**:
  - **Regal** (grid of plates, S3): paginated in 12s with „Mehr aus dem Lager ↓“. Focus moves to the first new plate's link (existing behaviour).
  - **Liste**: a real `<table>` with a `<caption>` (visually hidden) and columns `Nº · Werkstück · Legierung · Jahr · Stack · Status`. It shows all rows, with no pagination. Sortable column headers are `<button>`s inside `<th aria-sort>`. Rows are links (title cell contains the `<a href="#werk/id">`). At < 640px, the Stack and Status columns collapse into a second line in the title cell.
  - The view choice is persisted in `localStorage("lmf-view")` (try/catch).
- **Empty state**: as in §2.5, and „Alles zeigen“ resets everything and focuses „Alle“.
- **No JS**: `index.html` contains a **baked static list** of all Werkstücke (`<ol class="lager-static">` with title, category, one-liner and external link) between `<!-- lager:start -->` and `<!-- lager:end -->` markers. It's regenerated by `npm run bake` (`scripts/bake-static.mjs`, a dev tool with committed output, so the deploy still has no build step). JS replaces it with the interactive archive on boot. That gives SEO, no-JS users and data-failure resilience in one mechanism. The failure message from today stays as the fallback if the fetch fails (the static list stays visible).

### 5.3 Werkbank (deep dive) — `#werk/<id>`

A full-screen modal `<dialog id="werkbank" aria-labelledby="wb-title">`. On desktop it takes up to 1280px with a 5vh inset. On mobile it's a full sheet. Its content scrolls inside (`overflow: auto`), and `body` scrolling is locked via `:has(dialog[open])`.

Structure (each block renders only if its data exists):

```
[sticky top bar, esse scope]  ← Lager   ·   Nº 017 · KI · glüht   ·   [Voriges] [Nächstes]   [Schließen ×]
[hero]            full-bleed media (VT morph target) or Rohling; film: YouTube facade
[title block]     H2 (display, huge)  MelodAI
                  dek (summary)       Karaoke mit KI-Stimmtrennung und zeitlich abgestimmten Lyrics.
                  CTA                 [Ausprobieren ↗] [Repo ansehen ↗]
[2 cols ≥1024]
  left 7:  „Die Geschichte“   story paragraphs
           „Was drinsteckt“   highlights as riveted list (rivet = CSS bullet)
           Medien             scroll-snap strip of research screenshots (buttons + keyboard), each with caption + source
  right 5 (sticky): „Werkstattdaten“  <dl> spec sheet:
           Legierung      KI · Web
           Begonnen       2024              (yearStarted)
           Zuletzt dran   19.09.2026        (repo.pushedAt)
           Sterne         7                 (repo.stars)
           Lizenz         …                 (repo.license)
           Repo           LoggeL/MelodAI ↗
           Live           melodai.logge.top ↗
           Stand          28.09.2026
         „Legierung“  stacked bar of languages (TypeScript 71 % …) + text list (the bar is aria-hidden, the list is real)
         „Werkzeug“   stack chips → clicking closes the dialog and sets archive search
[film variant]    Werkstattdaten → Veröffentlicht, Länge, Ort, Rolle, Mit (Palatina Films ↗) ; hero = facade
[footer]          „Belegt durch“ <details>: list of sources (README, GitHub API, Live-Seite) with dates
                  Next preview: „Nächstes Werkstück: Kniffel →“ (plate mini)
```

- **YouTube facade**: a poster image (the existing project image) plus a play button: „Film abspielen (lädt YouTube)“. Clicking replaces it with an `iframe` from `https://www.youtube-nocookie.com/embed/<id>?autoplay=1`. Nothing loads before the click (privacy + performance). `youtubeId` is parsed from `link` if research doesn't provide it.
- **Title & meta**: while open, `document.title = "MelodAI · Werkstück · Logge Media Forge"`. On close it's restored.
- **Focus**: on open, focus goes to the `h2` (`tabindex="-1"`) so screen readers start at the title. The close button is first in tab order in the top bar. The native `<dialog>` modal traps focus, so the manual trap in today's code can be dropped (keep the Tab test). Escape closes via the `cancel` event → router closes → focus returns to the originating plate link (or to `#lager` heading if it came from a direct URL).
- **Direct load**: `/#werk/infected` opens the dialog after data loads, on top of the page scrolled to `#lager`. An unknown id shows a toast „Dieses Werkstück gibt's nicht (mehr).“ and leaves the dialog closed.
- **Lazy CSS**: dialog styles live in `css/werkbank.css`. `main.js` injects the `<link>` on first idle, and `router.js` awaits its `load` before the first open. There are no inline `onload` handlers, to stay CSP-friendly. The file is small (~8 KB), so it can also simply be merged into `forge.css`: merge if the total CSS stays < 14 KB gz.

---

## 6. Mobile behaviour (320–767px)

- **Header**: logo + „Menü +“ + theme. Nav opens as a full-width panel (existing tested pattern), and items are big stencil words (Werkstücke / Schichtbuch / Werkstatt / Galerie / Kontakt) at 2.5rem. The sound toggle moves into the panel.
- **Hero**: canvas behind the text. The logo sits in the upper 45%, the H1 below it. The lead is shortened: the hero shows only the first sentence at < 480px and the rest moves to `#warm`'s intro. Particle cap 200, heat FBO ⅛, DPR 1. Tap = strike at the finger position; there's no hover heat. Intro strikes are identical but the shake is disabled. The readout strip wraps onto 2 lines.
- **H1 at 320px**: `--t-hero` min 3.6rem = 57.6px. "AUS NEUGIER." in Big Shoulders Display 800 is about 0.45em per glyph, so about 311px. That's too tight for a 288px content width, so under 360px use `3.1rem` via container query on the hero. Test: no horizontal overflow at 320 (existing test).
- **Noch warm**: the rail is kept (snap, 85% width plates).
- **Meisterstücke**: no sticky; linear stack: media → story → highlights → spec sheet (collapsible `<details>` „Werkstattdaten“).
- **Lager**: filters in a horizontally scrolling chip row (`scroll-snap-type: x proximity`, fade mask on the edges), with sort/view/archived in a „Mehr Optionen“ `<details>`. The search is full width and sticky under the header while the archive is in view (`position: sticky; top: 56px`). Regal is a 1-column plate layout; Liste is a 2-line row per item.
- **Werkbank**: a full sheet. The bottom bar is sticky: `[← Voriges] [Schließen] [Nächstes →]`, with 48px hit targets. The spec sheet goes under the story. Media strip is swipeable (native scroll).
- **Schichtbuch**: the years are a vertical list; the Glühbalken become horizontal bars next to the year numeral; the sticky year numeral is disabled.
- All touch targets are ≥ 44×44 px, and no hover-only information exists anywhere (heat under the hand is decoration; everything it hints at is in text).

---

## 7. Reduced motion (`prefers-reduced-motion: reduce`)

A single source of truth, `js/motion.js`, exports `reduced` (a live `matchMedia` signal) and `transition(fn)`. The CSS wraps all non-essential motion in `@media (prefers-reduced-motion: no-preference) { … }`, so **motion is opt-in by default**.

| Feature         | Full motion                         | Reduced                                              |
| --------------- | ----------------------------------- | ---------------------------------------------------- |
| Hero            | WebGL forge, intro strikes, sparks  | Static poster (cooled logo), no forge module loaded, strike button hidden |
| H1 stamp        | weight/tracking snap on strike 3    | Final state immediately                              |
| Amboss-Schlag   | squash + sparks + flash             | Colour flash only (no transition), no sparks         |
| Plates          | stamp-in on scroll, heat glow fade  | Visible immediately; heat glow instant on/off (`transition: none`) |
| Filter          | VT quench/reheat, flap counter      | Instant swap, text counter                           |
| Werkbank        | VT morph                            | 120 ms opacity or none                               |
| Glühlinie       | scroll-driven                        | Static, mid heat                                     |
| Rails/chapters  | smooth scroll on buttons            | `behavior: "auto"`                                   |
| Partner video   | play on hover/focus                 | Poster only                                          |
| Coal bed (contact) | CSS gradient "breathing" loop    | Static gradient                                      |

`html { scroll-behavior: smooth }` only applies under `no-preference`.

---

## 8. Accessibility

- **Target: WCAG 2.2 AA** in both themes, including Werkbank open states (axe runs in all 4 combinations: light/dark × dialog closed/open).
- **Landmarks & headings**: one `h1` (hero), each section `h2` with `aria-labelledby`, plate titles `h3`, Werkbank `h2` (the dialog is its own context).
- **Links vs buttons**: plates are **links** (`#werk/id`) because they navigate to a URL state; filters, view toggle and strike are **buttons**. External links have a visible ↗ and screen-reader text „(öffnet neue Seite)“ via a visually hidden span.
- **Focus**: a 3px `--focus` outline with 2px offset on everything, never removed. On plates the ring is drawn on the plate container via `:focus-within` so it's not clipped by `overflow: hidden` media.
- **Live regions**: the archive count `role="status"`; the Werkbank's open state is announced by the dialog itself; the toast for an unknown id uses `role="status"`.
- **Colour is never the only carrier**: alloy is always named in text (chip label), and heat state is always named (`glüht`, `warm`, …) in the stamp row.
- **Canvas & decoration**: `aria-hidden`; sparks overlay `aria-hidden`; blueprint lines are pseudo-elements.
- **Data viz** (Glühbalken, languages bar): each has a text equivalent. The Schichtbuch renders the counts as text next to each bar ("62"), plus a visually hidden `<table>` („Öffentliche Repos pro Jahr“). The languages bar has an adjacent `<ul>` with percentages.
- **Keyboard**: everything reachable in order; shortcuts (`/`, `←/→` in Werkbank, `?` for the list, optional `Ctrl+K`) are ignored while typing in inputs and documented in the `?` dialog; `Esc` closes dialogs/menu.
- **Motion**: see §7. Also: no flashing more than 3 times per second (each strike flash is a single frame, and the intro strikes are 600 ms apart).
- **Sound**: off by default, never auto-plays, and has its own toggle with `aria-pressed`.
- **`prefers-contrast: more`**: blueprint and grain off, `--line` = `--muted`, glows off, borders 2px.
- **`forced-colors: active`**: plates get `border: 1px solid CanvasText`, chips use `ButtonText`/`ButtonFace`, the canvas is hidden (the poster is shown with `forced-color-adjust: none`), and focus uses `Highlight`.
- **Language**: `lang="de"`. English tool names are plain (no `lang` switching needed for single words); English project titles like „Capture Engine“ are fine.
- **Zoom/reflow**: works at 400% (320 CSS px), which is covered by the 320px test.

---

## 9. Performance budget

| Metric / asset                            | Budget                                                          |
| ----------------------------------------- | --------------------------------------------------------------- |
| **LCP** (mid-range mobile, 4G)            | **< 2.0 s** (hard < 2.5 s). LCP element = H1 text, not the canvas |
| CLS                                       | < 0.03 (fixed media aspect ratios, metric-matched font fallbacks) |
| INP                                       | < 150 ms (filtering 55 items with VT; render is a single `innerHTML` + one layout) |
| HTML (`index.html` incl. baked list)      | ≤ 45 KB raw / 12 KB gz                                          |
| CSS (`forge.css` [+ `werkbank.css`])      | ≤ 60 KB raw / 14 KB gz                                          |
| Critical JS (`main.js` + imports, excluding forge) | ≤ 40 KB raw / 13 KB gz, `type="module"` (deferred)     |
| Forge (lazy: `forge/*.js` incl. GLSL)     | ≤ 28 KB raw / 10 KB gz — **no three.js** (it would be ~160 KB gz for a job that needs about 400 lines of raw WebGL2) |
| Fonts                                     | ≤ 4 files, ≤ 120 KB total; only the display font is preloaded (~30 KB subset) |
| Hero poster                               | AVIF ≤ 35 KB, WebP fallback ≤ 60 KB, `fetchpriority="low"` (the H1 is LCP) |
| Data JSON (all 4 files)                   | ≤ 60 KB raw (stories are text; gzip helps a lot)               |
| Images                                    | Existing `<picture>` avif/webp/jpg sets; `loading="lazy"` below the fold, `decoding="async"`, explicit `width`/`height`; `sizes` attrs for the grid |
| GPU                                       | Hero ≤ 4 ms/frame on an M1 at 1440p ×1.5 DPR; governor degrades before 22 ms |
| Third-party                               | Cloudflare beacon only (existing). YouTube only after click.  |

Techniques: `content-visibility: auto; contain-intrinsic-size: auto 480px` on `#schichtbuch`, `#werkstatt` and `#abseits`; `<link rel="modulepreload">` for `js/data.js` and `js/archive.js`; data fetched in parallel with `Promise.allSettled`; the hero rAF is paused when offscreen; no scroll listeners (only IntersectionObserver and CSS scroll timelines); pointer handlers are rAF-throttled.

---

## 10. File and module architecture

```
index.html                     sections as in §2, baked static lager list, poster <picture>, no inline JS except the 4-line theme boot
404.html                       (optional) "Verschmiedet." — Esse scope, link home
css/
  forge.css                    @layer reset, tokens, base, layout, components, sections, utilities, motion
                               (tokens: colors both themes + .scope-esse, type, space, motion, @property regs, @font-face)
  werkbank.css                 dialog styles (optional split, see §5.3)
js/
  main.js                      boot: theme, nav, data load, mount modules, idle-load forge, shortcuts
  motion.js                    reduced-motion signal; transition(fn) → VT or direct; prefersSaveData
  theme.js                     theme toggle (Esse/Tageslicht) + meta theme-color; sound toggle state
  nav.js                       mobile menu (existing logic), section indicator (IO)
  data.js                      fetch + merge projects/stories/timeline/stats → Werk[]; derive no/alloy/glow/haystack
  projects.js                  escapeHtml, safeUrl, filterProjects (kept API), sortWerke, highlight(),
                               renderPlate(w, opts), renderRow(w), renderRohling(w), renderStampRow(w)
  archive.js                   state, URL sync, chips w/ counts, search, sort, views, pagination, empty state, flap counter
  warm.js                      "Noch warm" rail + controls
  chapters.js                  Meisterstücke: sticky steps via IO, media swap
  timeline.js                  Schichtbuch: bars, year groups, milestones, hidden table
  werkstatt.js                 Werkzeugwand (tag counts → archive search), partners, gallery contact strip
  router.js                    #werk/<id> routing, history bookkeeping, VT naming, direct load, unknown id toast
  werkbank.js                  dialog render (all blocks optional), media strip, YouTube facade, prev/next, focus mgmt
  heat.js                      delegated pointer heat for plates/buttons (--mx/--my/--heat), focus heat
  anvil.js                     strike(el,x,y) sparks via WAAPI; clink() WebAudio; vibrate
  palette.js                   (bonus) Ctrl+K quick-open
  forge/
    forge.js                   hero controller: lifecycle, intro timeline, events, governor, IO/visibility
    gl.js                      ~80 lines: compile/link, FBO ping-pong, fullscreen triangle, uniform helpers
    shaders.js                 GLSL strings: jfa_init, jfa_step, sdf_resolve, heat_step, composite, sparks_vs/fs
    sparks.js                  particle pool + emitters
    logo-mask.js               SVG → canvas mask → JFA SDF texture
data/
  projects.json                (existing, + new research projects appended)
  stories.json                 { featured: [ids], werke: { <id>: {story, highlights, stack, languages, yearStarted, repo, film, media, sources} } }
  timeline.json                [{ year, date?, text, link?, sources: [...] }]
  stats.json                   { asOf, github: { createdAt, publicRepos, reposByYear: {2017:1,…} }, sources: [...] }
  partners.json, socials.json  (existing)
assets/
  fonts/ BigShouldersDisplay.woff2, BigShouldersStencil.woff2, JetBrainsMono.woff2, Montserrat.woff2
  img/   forge-poster.avif/.webp (generated from our shader), new research screenshots <id>-*.webp
gallery/
  index.html                   contact-sheet design, frame numbers + filename-derived dates, stays JS-free;
                               optional enhancement: js/lightbox.js (<dialog>, ←/→) loaded as module, and links still work without it
  css/gallery.css
scripts/
  validate.mjs                 extended (new files, sources required, media exists)
  import-research.mjs          docs/research/*.json → data/*.json (+ asset copy, + content-sources.md entries)
  bake-static.mjs              regenerates the static lager list inside index.html markers
  render-poster.mjs            playwright: open index.html?poster → wait "forge:cooled" → screenshot → avif/webp
tests/
  portfolio.spec.js            extended (see below)
docs/
  concepts/forge.md            this file
  content-sources.md           extended per imported fact group
```

Module rules: pure functions (`filterProjects`, `sortWerke`, `deriveGlow`, `highlight`, `countTags`) live in files **without DOM access at import time**, so `scripts/validate.mjs` can import them in Node (as it does today with `projects.js`). All `innerHTML` rendering goes through `escapeHtml`/`safeUrl`. No `eval`, no inline event handlers (CSP-friendly).

### 10.1 Tests to add or adjust (Playwright + axe)

- Archive: search on stack/year terms, chip counts update, sort options, Liste view (table semantics, `aria-sort`), URL state round-trip (`?g=film&q=48`), `/` focuses search, reset restores everything.
- Router/Werkbank: open via click, via direct `#werk/infected` load, Back closes, Escape closes and restores focus to the plate, `←/→` navigates and Back still closes, unknown id shows the toast, the film facade doesn't load an iframe until clicked.
- Reduced motion (`page.emulateMedia({ reducedMotion: "reduce" })`): no `forge/forge.js` request, the strike button is hidden, the poster is visible.
- No WebGL2 (`page.addInitScript` stubbing `getContext("webgl2") → null`): poster stays and there are no console errors.
- No JS: the baked static list is present with all project titles (compare against `projects.json`), and the gallery works (existing).
- Data failure: the static list survives, and the error note plus GitHub link are shown (existing, adapted).
- Layout: no horizontal overflow at 320/375/768/1024/1440, in both themes, with the dialog open and closed.
- axe: both themes × dialog open/closed. Contrast of all alloy chips in both themes.
- Perf smoke: `performance.getEntriesByType("resource")` total JS before `load` ≤ 40 KB transfer, and the LCP entry is the H1.

---

## 11. Build order (one strong engineer, one pass)

1. **Tokens, fonts and base layout** (`forge.css`): both themes, the Esse scope, type scale, grid. Replace `lmf.css` and keep the `gallery.css` import path working.
2. **Data layer**: `data.js` + `stories/timeline/stats` stubs (empty objects are valid) + `validate.mjs` extensions. Once research lands, `import-research.mjs`.
3. **Plates + archive** (S3, S4, list view, URL sync), `bake-static.mjs`.
4. **Router + Werkbank** (S6), including the film facade.
5. **Sections**: Noch warm, Meisterstücke, Schichtbuch, Werkstatt, Abseits, Kontakt, with copy from §2.
6. **Micro-interactions**: anvil (S2), heat, Glühlinie (S5).
7. **Hero forge** (S1): poster first, then GL, then `render-poster.mjs` to produce the real poster.
8. **Gallery reskin** (contact sheet).
9. **Hardening**: tests, axe, 320px, reduced motion, forced colors, and a perf pass against §9.

---

## 12. Copy bank (German, Logge's voice)

Drop-in strings. Anything in `{}` is data-bound.

- Hero eyebrow: „Logge Media Forge · Die Werkstatt von Logge“
- H1: „Aus Neugier. / Gemacht.“
- Hero lead: „Ich baue Apps, entwickle Spiele, mache Filme und probiere viel mit KI aus. Das hier ist meine Esse: alles, was aus einer Idee geworden ist. Fertig, halbfertig oder abgekühlt im Lager.“
- Strike button: „Einmal zuschlagen“ · hint: „Löst eine Animation im Hintergrund aus. Rein dekorativ.“
- Pointer hint: „Maus bewegen: Funken. Klicken: Schlag.“ · Touch: „Tippen: Schlag.“
- Warm: „Noch warm.“ · „Woran ich zuletzt gehämmert habe. Manches glüht noch, manches ist gerade erst abgekühlt.“
- Heat labels: „glüht“, „warm“, „abgekühlt“, „fertig“, „ausgemustert“ · date: „zuletzt dran {TT.MM.JJJJ}“
- Meisterstücke: „Vier Stücke, genauer angeschaut.“ · „Eins aus jeder Legierung. Mit Geschichte, Werkzeug und allem, was dranhängt.“
- Chapter kicker: „Kapitel {I–IV} · {Legierung}“
- Lager: „Alles, was hier entstanden ist.“ · „{n} Werkstücke. Durchsuchbar nach Titel, Stack, Jahr und allem, was drinsteht. Nimm dir, was dich interessiert.“
- Search placeholder: „Suchen: Titel, Stack, Jahr …“ · aria-label: „Werkstücke durchsuchen“
- Filters group label: „Nach Legierung filtern“ · chips: „Alle“, „Web & Apps“, „Games“, „KI“, „Film“
- Toggle: „Ausgemustertes zeigen“ · Views: „Regal“, „Liste“ · Sort: „Neueste zuerst“, „Älteste zuerst“, „A–Z“, „Wie im Lager“
- Status: „{visible} von {total} Werkstücken“
- More: „Mehr aus dem Lager ↓“
- Empty: „Da liegt nichts. Noch nicht.“ / „Für diese Suche gibt's kein Werkstück. Hier ist noch Platz für eine Idee.“ / „Alles zeigen ↗“
- Colour legend summary: „Warum diese Farben?“
- Werkbank: „← Zurück ins Lager“, „Voriges Werkstück“, „Nächstes Werkstück“, „Schließen ×“, „Die Geschichte“, „Was drinsteckt“, „Werkstattdaten“, „Legierung“, „Werkzeug“, „Belegt durch“, „Stand: {date}“
- CTAs: web „Ausprobieren ↗“, repo „Repo ansehen ↗“, film „Film ansehen ↗“, script „Drehbuch lesen ↗“ (uses `linkLabel` if set)
- Film facade: „Film abspielen (lädt YouTube)“
- Archived note: „Das hier ist ausgemustert. Der Link bleibt zur Dokumentation, aktuell ist er nicht mehr.“
- Unknown route: „Dieses Werkstück gibt's nicht (mehr).“
- Schichtbuch: „Jahr für Jahr am Amboss.“ · „Was wann auf der Werkbank lag. Die Glühbalken zeigen, wie viele öffentliche Repos ich pro Jahr angelegt habe.“ · callout „{k} neue Repos in {year}, bisher. Die Esse ist gerade ziemlich heiß.“ (only if `k` is the maximum of all years, otherwise „{k} neue Repos in {year}, bisher.“) · missing years: „Nicht jedes Werkstück hat ein belegtes Jahr. Die fehlen hier lieber, als geraten zu werden.“
- Werkstatt: existing about copy (§2.7) · Werkzeugwand: „Was an der Wand hängt.“ / „Gezählt, nicht geschätzt.“ / tag action „im Lager zeigen“
- Zunft: „Selten ganz allein.“ / „Gute Leute. Gemeinsame Sachen.“
- Abseits: „Abseits der Tabs.“ / „Mit der Kamera statt mit der Tastatur.“ / „{count} Aufnahmen aus dem Herbst 2020.“ / „Zum Fotoarchiv ↗“
- Kontakt: „Der nächste offene Tab“ / „Was hast du im Kopf?“ / „Eine Idee, eine Frage oder einfach ein Hallo. Schreib mir.“ / aside „Das Feuer ist noch an.“
- Footer: „Esse aus. Bis zum nächsten Tab.“ · „Nach oben ↑“ · „Tastenkürzel“
- Shortcut dialog: „Tastenkürzel“ — „/ Suchen“, „← → Werkstück wechseln“, „Esc Schließen“, „? Diese Liste“
- 404: „Verschmiedet.“ / „Diese Seite ist beim Schmieden verloren gegangen. Zurück in die Werkstatt ↗“
- Meta description: „Ich bin Logge. In meiner Werkstatt entstehen Web-Apps, Spiele, KI-Experimente und Filme. Hier liegt alles, was dabei rausgekommen ist.“
- OG title: „Logge Media Forge · Aus Neugier. Gemacht.“ (unchanged) · OG image: the new forge poster (1200×630 crop from `render-poster.mjs`)

---

## 13. Risks and mitigations

| Risk                                                                  | Mitigation                                                                            |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Research data is late or incomplete, so chapters and stats are empty. | Every block is optional. Chapters fall back to the next project with a story, and the site is fully coherent on today's `projects.json` alone. |
| WebGL perf on weak phones                                             | Idle lazy-load, device gates, an adaptive governor, and a poster fallback. LCP never depends on GL. |
| View Transitions + top-layer dialog quirks (Safari/Firefox partial support) | `motion.transition` feature-detects; `@starting-style` fallback; the morph is an enhancement only. |
| Scroll-driven animations unsupported (Firefox stable)                 | `@supports` gates; content is always visible by default.                             |
| Forge vocabulary becomes cryptic                                      | Plain-word labels are always present (filter chips say „KI“, not „Blau“); the legend is optional. |
| Heat/recency labels drift from reality                                | Computed against `stats.asOf`, not "now", and the date is printed.                    |
| The 320px hero headline overflows                                     | A container-query size step plus the existing overflow test.                          |
| Tests assume old DOM (`#projects-container`, 9-item pages, `data-project-id` buttons) | Keep ids as aliases where cheap; update the tests deliberately in the same pass (the listed test plan). |
