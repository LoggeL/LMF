# LMF Redesign: Build Spec „Die Esse brennt noch.“

> **Status:** final build spec, binding for implementation. Stand der Fakten: **28.09.2026**.
> **Language:** spec in English; every visible string is German, in Logge's casual first-person voice.
> **Sources of truth, in order:** `docs/research/*.json` → existing `data/*.json` → this document. The concept files in `docs/concepts/` are background only; where they disagree with this spec, **this spec wins**.
> **Hard rule (from the repo, applies everywhere):** nothing is invented. Every claim, number, date, role and image is traceable to a repo README/metadata, a live page, the GitHub/YouTube API, or existing data. If data is missing, the UI element is **omitted**, never filled with a placeholder.

> **OWNER UPDATE (Portfolio statt Report), 28.09.2026 — overrides every rule below about visible sourcing:** „das gepunzt und die fußnoten für einzelne dinge find ich nicht so. das ist ein portfolio und kein report über dich.“ The page shows the work, not the evidence:
> - **No Punze** anywhere (no „Gepunzt · n Quellen“ button, popover, slot, `#i-punze` icon, footer line „Alles hier ist gepunzt …“; `js/werkbank/punze.js` is gone).
> - **No per-fact source marks** (¹²³ / `<sup>`), no „Quelle:“ lines under Schichtbuch milestones, no source-naming figcaptions, no „laut …“ labels, no counting-method footnote in the Schichtbuch, no „Repo angelegt“ disclaimers.
> - **One „Stand“ on the whole page:** the Esse caption (the ember brightness depends on it). Every other block drops its as-of date.
> - Chapter „Werkstattdaten“ tables become a **fact strip** (Seit · one key number · Stack), always open. Probestück chips keep the small „Nachbau“/„Echt“ tag plus at most one short line.
> - Useful links stay as ordinary links („Film ansehen“, „Live ansehen“, a milestone text linking its video or repo), never as citations.
> - **Fix round 1 (same day):** no commit accounting on the page (no „249 der 314 Commits sind von mir“, no „davon von mir“; a Werkstück shows Commits only from 100 up); no repo-creation forensics (no clock times, „+N s“, „angelegt“; the Zwischenstück keeps its 81-second ruler, cards say „Welt 1–3“); dates read as month and year („Nov. 2014“, „zuletzt dran Sept. 2026“), the day stays in `<time datetime>`; the Werkbank strip is one row of at most four cells (2×2 on phones), a `kind: "ribbon"` fact (the nomination) is one sentence under the title; one archive signal per archived piece; ShareX/Xenon disclaimers folded into the copy; the Creepshow role („Bote / Diener“) is no longer repeated in the Kapitel I dek, the Werkstatt card meta or the Zunft card; no Kontakt „Auf GitHub“ panel; Schichtbuch years without milestones and repos are left out, „0 Repos“ is never shown. Research phrasing is rewritten for visitors in `scripts/lib/portfolio-copy.mjs`, applied by `npm run import`.
> - **Fix round 2 (same day):** the Schichtbuch list has no per-year repo tables and no „Repos zeigen“ bars (year, milestones, a thin heat bar and a quiet „n Repos“ from 2 up); no commit counts anywhere (not even from 100), stars only from 5 and never on Lager/Warm plates; the Werkbank strip puts the project's own numbers first (Bomberman: Arenen · Power-ups · Ticks/s, MelodAI: Pipeline 6 Schritte, Theater: Plätze) and shows „Zuletzt dran“ only for a cooled piece whose last push is not its own year; no language percentages (no Sprachen block in the Werkbank, the Abspann names the top five without counts and without a caption), no repo lineage list, „Randnotiz“ is „Nebenbei“; the Zwischenstück is „Ein Abend, drei Welten.“ without the 81-second ruler; the Werkstatt „Auf der Bühne und dahinter“ block, the Kapitel IV Harras line, the Ramsen footnote under the Zunft and the jupeters.de half of the Kapitel IV dek are gone (the role is said once in Kapitel I, Harras once in the Schichtbuch); Noch-warm plates show only the glow badge; the Zeitraffer caption, legend (glüht · warm · abgekühlt), readout (the year) and tooltips („Titel · 2025“) drop the „angelegt“ apparatus; the repo count appears in the hero line and the Schichtbuch counter only, and the Esse caption reads „Stand September 2026“; a film Werkbank with the inline player has no extra „Film ansehen“ button; Kontakt is one centred column.
> - **Fix round 3 (29.09.2026):** the Zeitraffer has no language lanes and no counts: Meilensteine · Im Portfolio · one unlabelled „Glut“ row of ticks for every repo; the ruler shows only the year (the heat bar carries the volume), no „Jahr · Repos“ label, no lane counts, the keyboard map is visually hidden, glüht · warm · abgekühlt is the only visible legend. No clock times in copy (the Weihnachtsnacht milestone is „BeatGuessr und Coop Sudoku: zwei Spiele in einer Weihnachtsnacht.“, no Vorgänger-Repo sentence). The Creepshow role lives in Kapitel I only (no Creepshow milestone; the Abspann credit is „Website · Ticketsystem“). Probestücke show the chip line and at most one playful hint; the keyboard maps are `.vh`. Kapitel III's strip is Seit · Stack (the 01–06 rail says the pipeline). The Werkbank strip is skipped when it would hold only the year (the year then joins the kicker unless title or dek says it); a film's length is left to the player badge; stars only from 25. The Palatina-Films website counts as Web, so the Film chip and the Abspann both say 15. The header readout uses the eyebrow square, not „§“. Phones keep the first year and the newest three of the Schichtbuch open („2015–2023 zeigen“).
> - **The data keeps its sources.** `data/details/*.json` `sources`, `refs` and fact `source` indices, `milestones.json` and `partners.json` sources, `scripts/validate.mjs` rules 11–12 and the „omit when unsourced“ rule still apply; only the UI changed. Wherever the sections below ask for a Punze, a source mark, a „Quelle“ line or a „Stand“ date on a block, read: *not shown*.

> **OWNER UPDATE 28.09.2026 (overrides everything below):** these projects are OUT and must not appear anywhere (Lager, chapters, universe, „Mehr aus dieser Legierung“, related links, Zeitraffer names, copy, alt texts, tests): heatline-solara, theatermon, nachtschicht, frontier, static-pages, rectify, guess-the-model, song-domino, creepshow-rpg, pulse-field-monitor, kindenheimer-kerweborsch, infected-origins. The list lives in `docs/decisions.json → excludedProjects` and `scripts/import-research.mjs` honours it. The portfolio now has **43** projects. Kapitel I (Kolpingtheater) gets a new Probestück **„Saalplan“** (`theater-saalplan`, Nachbau): a small seat map of one show with the documented 68 seats that visitors can click to „buchen“, showing a QR-style ticket stub, no real booking and no network (source: docs/research/projects-deep.json theater-website + assets/img/KolpingtheaterSaalplan.webp). The Theatermon-Typenrad (§5.7c) is dropped. Kapitel III „Mehr“ = learn-ai, transcripator, codex-quota-widget. Logge's stage role „Bote / Diener“ in the play „Creepshow“ (a biographical fact, not the RPG) may stay.

---

## 0. Decisions at a glance

| Question | Decision |
|---|---|
| Spine | **THE FORGE.** „Logge Media Forge“ becomes a working Esse (hearth). It is the brand name taken literally, and it is the only concept where the metaphor itself carries data. |
| Grafts | From **Spielplatz**: hands-on *Probestücke* (toys), preferring toys that run the **real** mechanism. From **Rohschnitt**: the Zeitraffer repo timeline, „Erst Kamera, dann Code“, the projector gate for film, the generated credits, and the rule *mono = sourced fact*. From **Offene Tabs**: the sources popover (here called **Punze**, the hallmark), prerendered no-JS archive, archive state in the URL, omnibox (P2), opt-in live embeds (P2). |
| Cut | Tab counter and favicon badge, title rewriting, Win98 skin, desktop-chaos hero, Setzkasten hero, cursor dot grid, Academy leader, iris, letterbox, pinned reels, J/K/L shortcuts, custom cursors, confetti. None of these reveal anything about the work. |
| Hero | Not a full-bleed black WebGL blob. The H1 sits on the page (the LCP); next to it is a framed **Esse panel**. Its coal bed is made of **140 real embers, one per public repo**. |
| Scroll-jacking | None. No pinned stages anywhere. Every timeline scrolls natively and horizontally, with jump controls. |
| Fonts | Montserrat (existing family, now variable) + **Instrument Serif** + **JetBrains Mono**. Four files, ≤ 125 KB. |
| Routes | Deep dive at `#werk/<id>`. Archive state in `?g=&q=&s=&v=`. |
| Counting | **Own public repositories without forks** (140 at snapshot). One script computes them. Every number shows its „Stand“ date. |
| Motion | A global **„Bewegung pausieren“** toggle ships before any ambient animation (WCAG 2.2.2). Reduced motion gets a complete static site. |

---

## 1. Concept and narrative

### 1.1 The idea

The site is Logge's workshop on a working day. Ideas go into the fire raw. Some get hammered into finished pieces (MelodAI, Kniffel, the ski films). Some cool off in the Lager (Corona Board). Some are glowing right now: 62 own public repos created in 2026 alone, by 28.09.

Two colour systems carry **real data** on every project:

| Signal | Carries | Derived from |
|---|---|---|
| **Anlassfarbe** (temper colour) | the *Legierung*, i.e. the main category. Web = Strohgelb, Games = Purpur, KI = Blau, Film = Rotglut. This is the real sequence of steel temper colours, plus glowing red for film. | first entry of `groups` |
| **Glut** (glow) | how recently Logge worked on it: `glüht` / `warm` / `abgekühlt` / `fertig` / `ausgemustert` | `repo.pushedAt` measured against `snapshot.asOf`, **never `Date.now()`** |

Motion grammar for the whole site: **„Hitze kommt schnell, Kälte langsam.“** Heat arrives in about 90 ms and cooling takes about 1.6 s. Every hover, press and filter follows that asymmetry.

The forge is also a portrait. The personality material from the research is built into the structure, not bolted on:

- **Film came before code.** First YouTube upload „AE Test“ on 22.11.2014, GitHub account on 15.04.2015. That is the headline of the Schichtbuch: „Erst Kamera. Dann Code.“
- **„I'm just pressing buttons.“** It stood on the 2020 site and is still Logge's GitHub bio. It is the wink in the Werkstatt, and every Probestück is literally a button to press.
- **On stage and behind it.** The Kolpingtheater team page 2026 lists Logge as „Bote / Diener“ in *Creepshow* and as crew „Website“. In Theatermon, the game he built, he casts himself as the fallen final boss.
- **Night walks.** 77 phone photos, all shot between 20 and 2 o'clock, while the gallery code grew in the same weeks („im getting tired of this“).

### 1.2 The one thing people will remember

> **„Die Seite glüht dort, wo ich gerade arbeite.“**

The hero's coal bed is not decoration. Every ember is one of Logge's public repos, placed from old (left) to new (right). The brighter it glows, the more recently he pushed to it. The same heat then shows on every Werkstück in the archive. Visitors *see* 2026 burning, and a small mono caption tells them exactly what they are looking at, including the date it was measured.

The second memorable thing is the **Punze** (hallmark). In metalwork a hallmark certifies what a piece is made of. Here every Werkstück carries one: a stamped button that opens the list of sources and the date each was checked. „Alles hier ist gepunzt.“ The repo's no-invention rule becomes a visible, charming feature.

### 1.3 Narrative: one workshop day

| # | Section (`id`) | Job |
|---|---|---|
| – | **Anheizen** (`#esse`) | Hook. H1 + live Esse panel with the repo embers. The logo is forged in three strikes. |
| 01 | **Noch warm** (`#warm`) | What is on the anvil right now (sorted by last push). |
| 02 | **Meisterstücke** (`#meisterstuecke`) | Four long chapters, one per alloy, each with a hands-on Probestück. Between II and III sits a Zwischenstück: „Ein Brief, drei Welten“ (ShareX). |
| 03 | **Das Lager** (`#lager`) | Everything: search, filters, sort, shelf/list view. The deep dive `#werk/<id>` opens from here. |
| 04 | **Das Schichtbuch** (`#schichtbuch`) | „Erst Kamera. Dann Code.“ Milestones plus the Zeitraffer of 140 repos. |
| 05 | **Die Werkstatt** (`#werkstatt`) | Who works here: about, stage and backstage, „I'm just pressing buttons“, Werkzeugwand, Zunft (partners), generated Abspann. |
| 06 | **Abseits der Tabs** (`#abseits`) | The night photos as a night clock. |
| 07 | **Kontakt** (`#kontakt`) | „Der nächste offene Tab.“ Always dark, coals at the bottom. |

The existing „offene Tabs“ motif stays in the **copy** („Ein paar offene Tabs später …“, „Abseits der Tabs“, „Der nächste offene Tab“), not in the chrome.

### 1.4 Honesty system (designed in, enforced by `validate.mjs`)

1. **Mono = sourced fact.** Anything set in JetBrains Mono is data: dates, counts, stack, durations, stamps. Story text is serif or sans. Facts are therefore visually auditable.
2. **Every number is computed** from `data/*.json` at runtime or by the prerender script. None is typed into HTML copy (see `data-bind`, §3.13).
3. **Every number has a date.** „Stand: 28.09.2026“ comes from `snapshot.asOf`.
4. **Punze on every Werkstück**: sources with `checkedAt`, plus the line „Alles hier ist belegt. Wenn was nicht stimmt, sag Bescheid.“
5. **Probestück chips.** `Nachbau` means a simplified replica that only simulates a documented mechanic. `Echt` means it runs the real rule, algorithm or data. Each chip has visible explanation text.
6. **Omission, not placeholders.** A missing field means the block does not render. No „—“, no „bald mehr“, no fake screenshots. Projects without an image get a **Rohling** (typographic blank billet) that is clearly not a screenshot.
7. **Repo created ≠ project started.** `repo.createdAt` is only ever labelled „Repo angelegt …“. The project year comes from the curated `year` field.
8. **Forge vocabulary is seasoning.** Filters say „KI“, never „Blau“. The temperature legend is explicitly a colour legend, never a project fact.

### 1.5 Vocabulary (plain word always present)

| Plain (always shown) | Forge flavour (headings, stamps) |
|---|---|
| Projekt | Werkstück |
| Kategorie | Legierung (chip text stays „Web & Apps“, „Games“, „KI“, „Film“) |
| Archiv | Lager |
| Detailansicht | Werkbank |
| Quellen | Punze / „Gepunzt“ |
| Zuletzt bearbeitet | Glut (`glüht`, `warm`, `abgekühlt`, `fertig`, `ausgemustert`) |
| Zeitleiste | Schichtbuch |
| Ausprobieren | Probestück |

---

## 2. Page structure and final copy

Notation: `{…}` is data-bound (computed, see §3.13). *Italic word* in an H1/H2 = the one emotional word set in Instrument Serif Italic. `↗` marks external links (rendered as SVG icons, see §4.7).

### 2.0 Global

**`<head>`**

```
<title>          Logge Media Forge · Aus Neugier. Gemacht.
meta description Ich bin Logge. In meiner Werkstatt entstehen Web-Apps, Spiele, KI-Experimente und Filme. Hier liegt alles, was dabei rausgekommen ist.
og:title         Logge Media Forge · Aus Neugier. Gemacht.
og:description   Web-Apps, Spiele, KI und Filme. Eine Sammlung von Dingen, die ich ausprobieren wollte. Und dann gebaut habe.   (unchanged)
og:image         https://lmf.logge.top/assets/img/esse-og.jpg   (1200×630, rendered from our own shader, §5.1)
theme-color      synced to --bg of the resolved theme
```

Boot script (the only inline JS, CSP-friendly, before CSS paint):

```js
try {
  const d = document.documentElement, s = localStorage;
  const t = s.getItem("lmf-theme");
  d.dataset.theme = t === "dark" || t === "light" ? t
    : matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  if (s.getItem("lmf-motion") === "paused") d.dataset.motion = "paused";
} catch {}
```

(Change from today: without a stored value the site follows the system theme.)

**Header** (`.site-header`, sticky, 56 px, `--bg` with a hairline, plus a 2 px **Glühlinie** below, §5.2):

```
[logo SVG] LOGGE / MEDIA FORGE      Projekte · Chronik · Über mich · Galerie · Kontakt      [⏸] [◐] [Menü +]
```

- Nav links: `Projekte` → `#lager`, `Chronik` → `#schichtbuch`, `Über mich` → `#werkstatt`, `Galerie` → `gallery/`, `Kontakt` → `#kontakt`.
- `#motion-toggle`: constant name „Bewegung pausieren“, state in `aria-pressed` (the tooltip switches to „Bewegung fortsetzen“; the name never flips together with `aria-pressed`), persisted in `lmf-motion`. Always visible (under `prefers-reduced-motion: reduce` it is redundant but harmless, and keeps the header stable).
- `#theme-toggle`: aria-label „Dunkles Design aktivieren“ / „Helles Design aktivieren“ (unchanged, tested). Tooltip (`title`): „Esse“ / „Tageslicht“.
- `#menu-toggle`: „Menü +“ (unchanged pattern, `aria-expanded`, `aria-controls="navigation"`).
- Desktop ≥ 1024 px: a mono section readout `§ 03 Lager` next to the nav, `aria-hidden` (landmarks carry semantics).
- Skip link: „Zum Inhalt“ (unchanged).

**Legacy anchors** stay as empty alias spans so old links keep working: `#home` (in `#esse`), `#selected` (in `#meisterstuecke`), `#projects` (in `#lager`), `#about` (in `#werkstatt`), `#partners` (in the Zunft block), `#socials` (in `#kontakt`).

### 2.1 Anheizen: `#esse` (hero)

Layout: desktop 12 columns. Copy spans columns 1–6 on the page background (theme-dependent). The **Esse panel** spans columns 7–12: always dark, aspect 4:5, max-height 78svh, 1 px hairline frame. Mobile: copy first, then the panel at 4:3.

```
eyebrow (mono)   Logge Media Forge · Die Werkstatt von Logge
H1               Aus Neugier.
                 *Gemacht.*
lead             Ich baue Apps, entwickle Spiele, mache Filme und probiere viel mit KI aus.
                 Das hier ist meine Esse: alles, was aus einer Idee geworden ist. Manches
                 glüht noch, manches liegt abgekühlt im Lager.
CTA primary      Ins Lager ↘                               → #lager
CTA ghost        Einmal zuschlagen                         (button; hidden when motion is off; §5.1)
readout (mono)   {projects.total} Projekte · {repos.total} öffentliche Repos · auf GitHub seit {github.sinceYear}
```

Inside the Esse panel, at the bottom edge, is the **Glut caption** (mono, `--on-screen-muted`, real text, not `aria-hidden`):

```
Die Glut: {repos.total} öffentliche Repos von mir, links alt, rechts neu.
Je heller, desto kürzer war ich dran. Stand {snapshot.asOf}.
```

Pointer-only hint (rendered only when `(hover: hover) and (pointer: fine)` and motion is on): „Maus drüber: Funken. Klicken: Schlag.“ Touch variant: „Tippen: Schlag.“ Hint `id="strike-hint"` is also the `aria-describedby` of the strike button, with the added sentence „Rein dekorativ.“

If `repos.json` fails to load, the embers and the caption are omitted. The coal bed stays as pure decoration.

### 2.2 Noch warm: `#warm`

```
eyebrow   01 / Auf dem Amboss
H2        Noch *warm.*
lead      Woran ich zuletzt gehämmert habe. Manches glüht noch,
          manches ist gerade erst abgekühlt.
rail      8 plates, sorted by repo.pushedAt desc (only projects with a public or private repo date)
end tile  Alles im Lager →          (→ #lager)
```

Each plate's stamp row reads `glüht · zuletzt dran {dd.mm.yyyy}`. The rail uses native horizontal scroll with snap, plus visible `‹ ›` buttons (`aria-label` „Zurück“ / „Weiter“).

At the snapshot the top of the rail is (computed, for reference only): Learn AI (26.09.), Kolpingtheater Ramsen (21.09.), MelodAI (19.09.), Codex Quota Widget (13.09.), GeoGames (12.09.), Bomberman (04.09.), then whatever the snapshot script returns for the new projects.

### 2.3 Meisterstücke: `#meisterstuecke`

```
eyebrow   02 / Meisterstücke
H2        Vier Stücke, genauer *angeschaut.*
lead      Eins aus jeder Legierung. Mit Geschichte, Werkzeug, allem, was dranhängt,
          und jeweils einem Stück zum Selbst-Ausprobieren.
```

**Chapter template** (no pinning; on mobile everything stacks):

```
┌ kicker (mono, alloy colour)  Kapitel I · Web · Strohgelb
│ H3 (Instrument Serif, huge)  {chapter title}
│ dek                          {one sentence}
├─ left 7 cols ─────────────────────────┬─ right 5 cols (sticky only if taller) ─┐
│ Probestück stage (or media)           │ Werkstattdaten (mono dl, sourced, ¹²³)  │
│ [chip: Nachbau | Echt] + chip text    │ [Gepunzt · n Quellen]  (Punze button)   │
│ story paragraphs                      │ CTAs: Werkstück öffnen → · Ausprobieren ↗│
│ highlights (riveted list)             │                                          │
└───────────────────────────────────────┴──────────────────────────────────────────┘
```

Chapter order: I Web → II Games → Zwischenstück → III KI → IV Film. Film comes last because its projector screen is the darkest, most cinematic moment before the archive.

#### Kapitel I · Web · Strohgelb: Kolpingtheater Ramsen

Anchor project `theater-website`. Universe data in `data/universe.json` (§3.10).

```
kicker   Kapitel I · Web · Strohgelb
H3       Ein Theater, ganz viele *Tabs.*
dek      Für das Kolpingtheater Ramsen baue ich seit 2020 Websites, Werkzeuge
         und inzwischen auch Spiele. 2026 stand ich sogar mit auf der Bühne.
story    Die aktuelle Website kann mehr als Programm und Fotos: Man bucht dort Plätze
         direkt im Saalplan, bekommt ein QR-Ticket, einen Kalendereintrag und
         inzwischen auch ein Ticket für Google Wallet. Von {theater.commitsLogge} der
         {theater.commitsTotal} Commits im Repo sind von mir.

         Drumherum ist ein ganzes Universum entstanden: ein Drehbuch-System für die
         Proben, eine Videozuspielung für das Stück „Nexus“, ein Rollenspiel zu
         „Creepshow“ mit acht Enden. Und Theatermon, in dem das Ensemble gegen den
         Endgegner kämpft. Der Endgegner bin ich.
quote    „Logge, einst Teil des Teams, ist der Dunkelheit verfallen. Er hat die Plakate
         zerrissen, die Bühnenpläne gestohlen …“  — Intro von Theatermon
stage    „Auf der Bühne: Bote / Diener. Hinter der Bühne: Website.“
         (mono footnote: Teamseite kolpingtheater-ramsen.de, Creepshow 2026)
side note (small, muted)
         Stand {asOf}: Das Theater ist für den Deutschen Engagementpreis 2026 nominiert.
         Die Website, auf der das steht, ist von mir.
Werkstattdaten   Begonnen 2025 · Repo Kolpingtheater-Ramsen/next-theater · Commits {n} ({m} von mir)
                 · Zuletzt dran {pushedAt} · Live kolpingtheater-ramsen.de ↗ · Stand {asOf}
Stand-dated fact Stand {asOf}: Gebucht wird gerade „Romeo und Julia“, {68} Plätze pro Vorstellung.
Probestück       Theatermon-Typenrad (Echt, §5.7c) + Universe constellation (§5.7c)
CTAs             Werkstück öffnen →  (#werk/theater-website) · Zur Website ↗
```

Rules: no ensemble names or faces anywhere. The awards belong to the theatre and are phrased that way.

#### Kapitel II · Games · Purpur: Bomberman

```
kicker   Kapitel II · Games · Purpur
H3       Eine Bombe kommt selten *allein.*
dek      Bomberman für die Couch und fürs Netz, mit derselben Engine an beiden Orten.
story    (details.bomberman-web.story, the research text; first person)
highlights  (3 of details.highlights: shared deterministic engine; six 15×13 arenas
            with their names; chain reactions resolved in the same tick)
Probestück  Kettenreaktion (Nachbau, §5.7a)
chip text   Nachbau: ein vereinfachtes Feld für diese Seite. Die Regel stimmt: Trifft
            eine Explosion eine Bombe, geht die im selben Tick hoch.
CTAs        Werkstück öffnen → · Lokal spielen ↗
```

#### Zwischenstück: „Ein Brief, drei Welten.“ (ShareX) — REMOVED 29.09.2026 (owner: „kann raus“); the three ShareX projects stay in the Lager

Static section (`#dreiwelten`) between II and III. Three screenshots side by side (ShareXCaptureEngine, ShareXWin98, ShareXAfterimage), each a link into `#werk/<id>`.

```
eyebrow  Zwischenstück · Webdesign
H3       Ein Brief, drei *Welten.*
lead     Drei Ideen, wie die ShareX-Website aussehen könnte: ein Reaktor in Three.js,
         ein Windows-98-Desktop, der wirklich funktioniert, und ein bio-digitales Labor.
         Gefragt hat mich keiner. Alle drei Repos habe ich am {sharex.date} innerhalb
         von {sharex.seconds} Sekunden angelegt.
note     Unabhängige Designkonzepte. Kein offizieller ShareX-Auftritt.
```

`{sharex.seconds}` = max − min of the three `repo.createdAt` values = **81** at snapshot, computed.

#### Kapitel III · KI · Blau: MelodAI

```
kicker   Kapitel III · KI · Blau
H3       Gesang raus. *Du* rein.
dek      MelodAI macht aus fast jedem Song Karaoke: Stimme trennen, Wörter timen, mitsingen.
story    (details.melodai.story)
pipeline (six mono steps, horizontal, numbered):
         01 Suche · 02 Download · 03 Stimmtrennung (Demucs) · 04 Transkription (WhisperX)
         · 05 Zeilen bauen (LLM) · 06 Wiedergabe
fact     ★ {stars} · das Repo aus diesem Portfolio mit den meisten Sternen · Stand {asOf}
         (rendered only if computeMaxStars() === melodai; computed, never typed)
Probestück  Zwei Regler (Nachbau, §5.7b)
chip text   Nachbau: Statt eines echten Songs singt hier diese Website, mit selbst
            erzeugten Tönen. Wie im Original laufen Gesang und Instrumental über
            zwei getrennte Regler.
CTAs        Werkstück öffnen → · So funktioniert's ↗ (melodai.logge.top/about)
more     Mehr aus dieser Legierung: Learn AI · Frontier · Guess the Model → (#werk/…)
```

#### Kapitel IV · Film · Rotglut: the ski chronicle

Data: `data/films.json`, filtered `series === "ski"`, sorted by upload. Layout: the **projector gate** (§5.8), always dark.

```
kicker   Kapitel IV · Film · Rotglut
H3       Ski, Schnitt, *Wiederholung.*
dek      {films.ski} Ski-Aftermovies seit {films.skiFirstYear}. {films.skiOnJp} davon laufen auch auf
         jupeters.de, bei den Filmen der Gruppe.   (count = films with alsoOn jupeters.de; computed)
reel (buttons, one per film, mono):
         2019  Feldberg            4:09
         2020  Bad Gastein         4:02
         2022  Zillertal           7:54
         2023  Ski 2023            4:52
         2024  Flachau · Epic      3:25
         2024  Flachau · Fun Cut   3:22
         2026  Portes du Soleil    6:28   (9:16 badge: „Hochformat“)
caption  (for the active film, mono label „Beschreibung auf YouTube“ + the verbatim quote):
         Feldberg 2019 → (no description: caption row omitted)
         Bad Gastein 2020 → „FPS-Upscaler Flowframes“ note: „Von 25 auf 50 Bilder pro Sekunde
                            hochgerechnet, mit Flowframes.“ (paraphrase of the description, mono tag „laut Videobeschreibung“)
         Zillertal 2022 → „Hallo Welt“
         Ski 2023 → „Grüße gehen raus an den FI-Toaster und die unsichtbaren Backbleche.“
         Flachau Epic → „Mal was anders... Community Version kommt noch“
         Flachau Fun → „Ist in nem Fiebertraum entstanden. Bitte keine Erwatungen an die Qualität.“ (verbatim, typo kept)
         Portes du Soleil → „Die Welt steht schief diesmal in vertikal.“
facade   Film abspielen (lädt YouTube) ▶
         Beim Abspielen lädt YouTube (Google) Inhalte und setzt ggf. Cookies.
more     Außerdem auf der Rolle: Die Chroniken von Selantis · Infected · Exception ·
         Poolparty · Segeln · Bodensee → Alle Filme im Lager (?g=film#lager)
Selantis line  Bei „Die Chroniken von Selantis“ habe ich die VFX gemacht und im dritten Teil
               meine erste Hauptrolle gespielt: Harras.
```

### 2.4 Das Lager: `#lager`

```
eyebrow   03 / Das Lager
H2        Alles, was hier *entstanden* ist.
lead      {projects.total} Projekte. Durchsuchbar nach Titel, Stack, Jahr und allem,
          was drinsteht. Nimm dir, was dich interessiert.
toolbar   [Alle {n}] [Web & Apps {n}] [Games {n}] [KI {n}] [Film {n}]
          [⌕ Projekt suchen …]      (placeholder; aria-label „Projekte durchsuchen“; `/` focuses)
          Sortieren: [Wie im Lager ▾]  Ansicht: [Regal | Liste]
status    {visible} von {matching} Projekten                        (#project-count, role=status)
meta      Eine Sammlung, kein Schlussstrich.
legend    <details> Warum diese Farben?
more      Mehr entdecken ↓                                          (#load-more, batches of 12)
```

Sort options (native `<select id="sort">`): „Wie im Lager“ (JSON order, default), „Zuletzt bearbeitet“ (pushedAt desc, then film upload desc; items without dates last), „Älteste zuerst“ (`year` asc), „A–Z“ (`localeCompare("de")`).

Colour legend (`<details>` text):

> **Warum diese Farben?** Wenn Stahl angelassen wird, läuft er in Farben an: erst strohgelb, dann purpur, dann blau. Glühender Stahl leuchtet kirschrot. Die Farben hier folgen dem: Web ist Strohgelb, Games Purpur, KI Blau, Film Rotglut. Wie stark ein Werkstück glüht, zeigt, wie kürzlich ich daran gearbeitet habe: **glüht** heißt in den letzten 30 Tagen, **warm** in den letzten 180 Tagen, **abgekühlt** länger her. **Fertig** sind abgeschlossene Filme, **ausgemustert** ist Archiv. Gemessen am letzten Push ins Repo, Stand {asOf}.

**Plate (Regal view)**:

```
┌─ ● ─────────────────────────── ● ─┐
│ Nº 017                 [KI]        │  ← mono stock number (derived index), alloy chip
│ ┌────────────────────────────────┐ │
│ │ 16:10 image or Rohling         │ │
│ └────────────────────────────────┘ │
│ MelodAI                         →  │  ← h3 inside a.project-link
│ Karaoke mit KI-Stimmtrennung …     │  ← summary || description
│ 2024 · TYPESCRIPT · ★ 7 · glüht    │  ← mono stamp row, only present fields
└─ ● ─────────────────────────── ● ─┘
```

Badges: `isNew` → „Neu dabei“. `archived` → stamped „AUSGEMUSTERT“ (decorative, the text is also in the stamp row). A `contentNote` gives a small „Hinweis“ stamp.

**Liste view**: a real `<table>` with a visually hidden `<caption>` „Alle Projekte als Liste“. Columns: `Nº · Projekt · Legierung · Jahr · Stack · Glut`. Sortable headers are `<button>` inside `<th aria-sort>`. Every row's title cell holds the `a.project-link`. No pagination in list view. Below 640 px, Stack and Glut fold into a second line of the title cell.

### 2.5 Werkbank (deep dive): `#werk/<id>`

Native `<dialog id="werkbank" class="project-dialog" aria-labelledby="modal-title">`. Every block renders **only if its data exists**.

```
[top bar, always dark, sticky]
  ← Zurück ins Lager   ·   Nº 017 · KI · glüht   ·   [Voriges] [Nächstes]   [Gepunzt · 5 Quellen]   [Schließen ×]
[hero]           image (View-Transition target) · Rohling · film facade · Codex strip on its own dark stage
[title]          kicker {category}   H2#modal-title {title}   dek {summary}
                 CTAs: #modal-link „{linkLabel | Ausprobieren | Film ansehen | Drehbuch lesen} ↗“ · „Repo ansehen ↗“
[Hinweis]        contentNote · archived note · caveat for LoggeRythm (private demo) · Nachbau notes
[2 cols ≥1024]
  left:  Die Geschichte     story[] (1–4 paragraphs)
         Was drinsteckt     highlights[] (riveted list)
         Probestück         mount point (if project.probe)
         Medien             media strip (screenshots with caption + source)
         Randnotiz          funFact (only if it has its own source)
         Stammbaum          related public repos: role · name · „Repo angelegt {date}“ · commits
  right (sticky): Werkstattdaten <dl> (mono)
         Legierung      KI · Web
         Begonnen       2024
         Zuletzt dran   19.09.2026         ¹
         Repo angelegt  21.10.2024         ¹
         Commits        172                ¹
         Sterne         7                  ¹
         Live           geprüft 28.09.2026 ²
         Repo           LoggeL/MelodAI ↗
         Stand          28.09.2026
         Legierung (Sprachen)  stacked bar (aria-hidden) + real <ul> with percentages
         Werkzeug       stack chips → click: closes dialog, sets Lager search to the chip
[footer]         Gepunzt: ordered list of sources „{label} · geprüft am {dd.mm.yyyy} ↗“
                 „Alles hier ist belegt. Wenn was nicht stimmt, sag Bescheid.“ (mailto)
                 Nächstes Werkstück: {title} →
```

**Film variant** replaces the spec sheet rows with: `Titel auf YouTube` (realTitle), `Hochgeladen`, `Länge`, `Beschreibung` (verbatim quote or omitted), `Auch auf` (jupeters.de, if listed), `Rolle` (only if sourced, e.g. Selantis: „VFX, Homepage, Schauspieler“, „Hauptrolle Harras in Teil 3“). The hero is the YouTube facade.

**Copy labels**: „← Zurück ins Lager“, „Voriges Werkstück“, „Nächstes Werkstück“, „Schließen ×“, „Die Geschichte“, „Was drinsteckt“, „Probestück“, „Medien“, „Randnotiz“, „Stammbaum“, „Werkstattdaten“, „Legierung“, „Werkzeug“, „Gepunzt“, „Stand: {date}“. Archived note (existing wording, kept): „Dieses Projekt gehört zum Archiv. Der ursprüngliche Link wird hier zur Dokumentation angezeigt.“

While the dialog is open, `document.title` = „{title} · Werkstück · Logge Media Forge“. It is restored on close.

### 2.6 Das Schichtbuch: `#schichtbuch`

```
eyebrow   04 / Das Schichtbuch
H2        Erst Kamera. *Dann* Code.
lead      Mein erstes Video auf YouTube ist sieben Sekunden lang und heißt „AE Test“.
          Das war am 22.11.2014, knapp fünf Monate bevor ich mir einen GitHub-Account
          gemacht habe. Seitdem ist einiges dazugekommen. Zuletzt ziemlich schnell.
counters  {repos.total} eigene öffentliche Repos · {repos.currentYear} davon aus {currentYear}
          · mehr als {repos.firstYear} bis {currentYear−2} zusammen ({repos.before})
          (the „mehr als“ clause renders only if count(currentYear) > sum(firstYear … currentYear−2); computed.
           At snapshot: 62 > 53 for 2017–2024.)
view      [Zeitraffer | Liste]        (segmented control; Liste is the default < 1024 px and under reduced motion)
Zeitraffer caption
          Jeder Strich ist ein öffentliches Repo, das ich angelegt habe, auf der Spur
          seiner Hauptsprache. Ein Jahr ist hier so breit, wie viel in ihm passiert ist.
button    Zeitraffer abspielen ▶     (P2; motion only)
footnote  Gezählt: eigene öffentliche Repositories ohne Forks, nach Anlagedatum. Private
          Repos zählen nicht mit. Ein Repo anzulegen ist nicht dasselbe wie ein Projekt
          anzufangen. Namen zeige ich nur bei Repos, die hier im Portfolio vorkommen.
          Stand {asOf}. Quelle: GitHub API.
outro     Und das sind nur die öffentlichen.
```

**Milestones** (rendered on the MARKER track and in the list view, from `data/milestones.json`, each with a source link):

| Date (display) | Text (final copy) | Source |
|---|---|---|
| 22.11.2014 | Mein erstes Video: „AE Test“, sieben Sekunden After Effects. | youtube.com/watch?v=wHEcSFBkM0s |
| 2015 | Selantis Teil 1 wird gedreht. Palatina Films entsteht dafür. | PalatinaFilms/selantis.html |
| 15.04.2015 | GitHub-Account angelegt. | api.github.com/users/LoggeL |
| 29.03.2017 | Selantis Teil 1 geht auf YouTube, Teil 2 am Tag danach. | Selantis-Playlist |
| 12.07.2017 | Erstes öffentliches Repo: BetterDiscordThemes. | github.com/LoggeL/BetterDiscordThemes |
| 15.06.2018 | Die Palatina-Films-Website, meine erste richtige Website. | github.com/LoggeL/PalatinaFilms |
| 19.02.2019 | Feldberg 2019, der erste Ski-Aftermovie. | youtube.com/watch?v=-VTPliFOTA0 |
| 22.03.2020 | Selantis Teil 3. Meine erste Hauptrolle: Harras. | youtube.com/watch?v=c9oV3Lh2Lyw + team.html |
| 27.08.2020 | Der Kanaltrailer fürs Kolpingtheater, „Produziert von LMF“. Am selben Tag lege ich das Repo dieser Seite an. | youtube.com/watch?v=hlvHRI5d3qc + repo LoggeL/LMF |
| 24.09.2020 | Die erste von {gallery.nights} Nächten mit der Handykamera. Die Galerie baue ich parallel. | gallery filenames + git log |
| 27.09.2020 | Commit in der Galerie: „im getting tired of this“. | git log -- gallery |
| 05.12.2020 | Bad Gastein 2020, mit Flowframes von 25 auf 50 Bilder pro Sekunde gerechnet. | youtube.com/watch?v=KYahVktrq_I |
| 25.01.2021 | Den Aftermovie zu „Der Kristall der Träume“ entruckelt und auf 60 fps gebracht. | youtube.com/watch?v=YOi_lhZ7eJI |
| 05.07.2021 | kolpingCore, mein erstes Backend fürs Theater. | github.com/LoggeL/kolpingCore |
| 27.12.2022 | Kurzfilm „Exception“. | youtube.com/watch?v=uhlAo1chnlM |
| 29.12.2023 | Kurzfilm „Infected“, 12:22. | youtube.com/watch?v=6iNdfsbZWHs |
| 21.10.2024 | MelodAI. | github.com/LoggeL/MelodAI |
| 24.12.2025 | Weihnachtsnacht: Kurz vor Mitternacht (UTC) lege ich BeatGuessr an, um 02:38 Uhr deutscher Zeit kommt das erste Commit von Coop Sudoku. | BeatGuessr + coop-sudoku repos |
| 15.07.2026 | Drei ShareX-Konzepte in {sharex.seconds} Sekunden angelegt. | three repos |
| 2026 | „Creepshow“: auf der Bühne als Bote / Diener, dahinter die Website. | kolpingtheater-ramsen.de/team |

### 2.7 Die Werkstatt: `#werkstatt`

```
eyebrow   05 / Die Werkstatt · Hey, ich bin Logge.
H2        Ich wollte wissen, ob das *geht.*
lead      So fangen ziemlich viele meiner Projekte an.
p         Ein Spiel für den nächsten Abend mit Freunden. Eine App für ein Problem, das
          mich selbst nervt. Ein Film, der von einer Reise mehr festhält als ein paar Fotos.
p         Unter Logge Media Forge sammle ich diese Dinge. Ich arbeite mit Code, Kamera
          und KI, lerne beim Machen und lande dabei regelmäßig bei der nächsten Idee.
links     Mein GitHub ↗ · Zur Fotogalerie ↗
```

**Knöpfe** (the wink; a pressable stamp button that only animates, `aria-pressed` toggles its label):

```
H3        I'm just pressing buttons.
p         Das stand 2020 auf der allerersten Version dieser Seite. In meinem
          GitHub-Profil steht es bis heute. REC ist ein Knopf. Play auch.
button    [ Knopf ]   → pressed label: „Siehste.“
```

**Auf der Bühne und dahinter** (two cards):

```
H3        Auf der Bühne und *dahinter.*
card 1    Palatina Films
          Seit der Gründung war ich für alles zuständig, was mit IT und VFX zu tun hat,
          und stand als Statist mit vor der Kamera. Im dritten Teil von „Die Chroniken von
          Selantis“ durfte ich zum ersten Mal eine Hauptrolle spielen: Harras.
          (mono) Team-Seite der Palatina-Films-Website · Rolle: VFX, Homepage, Schauspieler
card 2    Kolpingtheater Ramsen
          2026 stand ich in „Creepshow“ als Bote / Diener auf der Bühne. Und in der Crew-Liste
          steht bei mir: Website.
          (mono) Teamseite kolpingtheater-ramsen.de · Stand {asOf}
```

**Werkzeugwand** (§5.10):

```
H3        Was an der Wand *hängt.*
lead      Gezählt, nicht geschätzt. Klick auf ein Werkzeug zeigt alles, wofür ich es benutzt habe.
tags      {Tool} ×{count}   → action label (visually hidden suffix): „im Lager zeigen“
```

**Zunft** (partners, `#partners` alias):

```
eyebrow   Selten ganz allein
H3        Gute Leute. Gemeinsame Sachen.
cards     from data/partners.json (updated §3.12). Gummibärenbande keeps its tiny clip
          (40 px, plays only on hover/focus, poster under reduced motion).
Ramsen line (under the cards, computed from partners with `place: "Ramsen"` + universe):
          Vieles davon passiert in Ramsen: das Kolpingtheater, die JP Poolparty. Und auf
          jupeters.de steht Logge Media Forge selbst in der Partnerleiste.
```

**Abspann** (generated credits, §5.11):

```
eyebrow        Abspann
H3             Wer und was hier *drinsteckt.*
blocks (all generated, each omitted if its data is missing):
  LOGGE MEDIA FORGE — Ein Rohschnitt von Logge
  CODE · KAMERA · KI — Logge
  AUCH ALS — VFX · Homepage · Schauspieler (Palatina Films) · Bote / Diener · Website (Kolpingtheater)
  IN ZUSAMMENARBEIT MIT — {partners: title … category}
  DREHORTE — {films with location: „Feldberg 2019 · Bad Gastein 2020 · Bodensee 2020 · …“}
  SPRACHEN — {repos.json primary languages with counts, desc} (Stand {asOf})
  MATERIAL — {projects.total} Projekte · {films.total} Filme · {gallery.total} Fotos · {repos.total} öffentliche Repos
  closing — Aus Neugier. Gemacht.   Rohschnitt, kein Final Cut.
```

### 2.8 Abseits der Tabs: `#abseits`

```
eyebrow   06 / Abseits der Tabs
H2        Nachts, mit dem *Handy.*
lead      {gallery.total} Fotos aus {gallery.nights} Nächten zwischen dem {gallery.first} und dem
          {gallery.last}. Laut Dateinamen alle zwischen {gallery.hourFrom} und {gallery.hourTo} Uhr
          aufgenommen. In denselben Wochen habe ich die Galerie dafür gebaut. Ein Commit von
          damals heißt „im getting tired of this“.
visual    Nachtuhr (§5.9): 20:00–02:00 arc with 77 ticks; 12 contact-sheet frames
CTA       Zum Fotoarchiv ↗       (gallery/)
```

Computed values at snapshot: 77 photos, **17 nights** (a photo taken before 12:00 belongs to the previous evening), 24.09.2020–26.10.2020, 20 to 2 Uhr. Note: research says „19 Nächte“; that counts calendar dates. The spec counts nights, and the code computes it. Places are **never** named: GPS reverse-geocoding is not used without Logge's consent.

### 2.9 Kontakt: `#kontakt` (always dark, CSS coal gradient at the bottom)

```
eyebrow   07 / Der nächste offene Tab
H2        Was hast du im *Kopf?*
p         Eine Idee, eine Frage oder einfach ein Hallo. Schreib mir.
mail      hyper.xjo@gmail.com ↗          (.contact-mail, display size, heats on hover/focus)
links     Discord ↗ · Telegram ↗ · GitHub ↗      (from data/socials.json + GitHub)
aside     Das Feuer ist noch an.
```

### 2.10 Footer

```
Logge Media Forge · Aus Neugier. Gemacht.      © {year} LMF      Alles hier ist gepunzt. Wenn was nicht stimmt, sag Bescheid.      Nach oben ↑
```

`{year}` is the runtime year; it is the only `Date.now()` use on the site.

### 2.11 States (final copy)

| State | Copy |
|---|---|
| Lager: no results (`#empty-state`) | H3 „Da liegt nichts. Noch nicht.“ · p „Für diese Suche gibt's kein Projekt. Hier ist noch Platz für eine Idee.“ · button `#reset-filters` „Alle Projekte anzeigen ↗“ |
| Lager: `projects.json` fails | `#project-count`: „Das Lager konnte gerade nicht geladen werden.“ The prerendered list stays visible. `#projects-container`: „Bitte lade die Seite erneut. Alternativ findest du die Projekte <a href="https://github.com/LoggeL">auf GitHub ↗</a>.“ Meisterstücke/warm show: „Gerade nicht erreichbar. <a>Zu GitHub ↗</a>“ |
| Loading (before JS data) | the prerendered static list is the loading state; no spinners, no skeletons |
| Werkbank: unknown id | announced via `#project-count` and a `role=status` toast: „Dieses Projekt gibt's hier nicht (mehr).“ Dialog stays closed, page scrolls to `#lager`. |
| Schichtbuch: `repos.json` fails | the prerendered per-year table stays; the Zeitraffer toggle is hidden |
| Probestück: fails to load | stage shows the project image + „Das Probestück klemmt gerade. Das Original geht aber: {Ausprobieren ↗}“ |
| Film facade | „Film abspielen (lädt YouTube)“ · note „Beim Abspielen lädt YouTube (Google) Inhalte und setzt ggf. Cookies.“ · „Auf YouTube öffnen ↗“ |
| No JS (`<noscript>` in Lager) | „Filter und Suche brauchen JavaScript. Die Liste unten ist trotzdem vollständig. Die <a href="gallery/">Galerie</a> geht auch ohne.“ |
| 404 (`404.html`) | eyebrow „404“ · H1 „*Verschmiedet.*“ · p „Diese Seite ist beim Schmieden verloren gegangen.“ · link „Zurück in die Werkstatt ↗“ |
| Omnibox, no hits (P2) | „Nichts gefunden für „{q}“. Enter sucht im Lager weiter.“ |

### 2.12 Gallery page (`gallery/index.html`, stays JS-free)

Restyled as a **contact sheet**, generated statically by `scripts/build-gallery.mjs`:

```
eyebrow  LMF / Das Fotoarchiv
H1       Abseits der Tabs.                 (unchanged, tested)
lead     Nachts mit dem Handy, Herbst 2020. {77} Aufnahmen aus {17} Nächten.
         Klick öffnet die große Version.
groups   one <section> per night: H2 „Nacht {nn} · {Wochentag}, {dd.mm.yyyy}“
         each with <div class="photo-grid"> of frames: edge number „{nn}A“ + time „{hh:mm}“
link     ← Zurück zur Werkstatt
```

It keeps `.photo-grid a` × 77, the first href `assets/img/large/IMG_20200924_233029.jpg`, and alt „Galerieaufnahme NN“ (better alt text only after someone actually looks at each photo).

### 2.13 Microcopy bank

- Strike button: „Einmal zuschlagen“ · hint: „Löst eine Animation im Bild rechts aus. Rein dekorativ.“
- Glow labels: „glüht“, „warm“, „abgekühlt“, „fertig“, „ausgemustert“ · „zuletzt dran {dd.mm.yyyy}“
- Plate aria-label: „{title}, {Legierung}, {glow}. Werkstück öffnen“
- External link SR suffix (visually hidden): „(öffnet neue Seite)“
- Punze button: „Gepunzt · {n} Quellen“ · popover title „Woher ich das weiß“
- Probestück chips: „Nachbau“ / „Echt“ · stage focus hint: „Esc oder Tab: raus aus dem Spielfeld.“
- Language bar: „Legierung laut GitHub“ · remainder: „Rest“
- Werkzeugwand action: „{Tool} im Lager zeigen“
- Motion toggle: „Bewegung pausieren“ (name) + `aria-pressed`; tooltip „Bewegung fortsetzen“ while paused
- Chapter CTAs: „Werkstück öffnen →“ · per link type: „Ausprobieren ↗“, „Lokal spielen ↗“, „Repo ansehen ↗“, „Film ansehen ↗“, „Drehbuch lesen ↗“ (`linkLabel` wins)

---

## 3. Data model

### 3.1 Principles

- The runtime reads **only `data/`**. `docs/research/*.json` is raw material. `scripts/import-research.mjs` (dev-only, output committed) copies only fields that carry a source.
- All new fields are **optional**. The UI must render every combination of present and missing fields.
- `snapshot.asOf` is the single date for every „Stand“ label and for glow derivation.
- Index data stays small (`projects.json` ≤ 40 KB raw). Depth lives in `data/details/<id>.json` and is fetched on hover, focus or open.

### 3.2 Fixes to existing data (must land before any UI work is merged)

| id / file | Problem (source) | Fix |
|---|---|---|
| `skiing-2019` | link `watch?v=VTPliFOTA0` is unavailable | `https://www.youtube.com/watch?v=-VTPliFOTA0` |
| `setlist` | setlist.logge.top returns 404 | title „Bands“, category „Musik & Web“, link `https://bands.logge.top`, `source` `https://github.com/LoggeL/setlist`, description: „Mein Musiktagebuch: Bands, die ich noch live sehen will, Bands, die ich schon gesehen habe, dazu Vorschauen und ein Song-Tagebuch. Hieß mal Sonic Noir, dann Setlist, jetzt Bands.“, `imageAlt` „Setlist, frühere Version von Bands“. Keep the `id` for URL stability. |
| `palatina-films-website` | palatina-films.de has no DNS | link `https://loggel.github.io/PalatinaFilms/`, linkLabel „Archiv ansehen“, groups `["web","film"]` (it is a website), keep `archived: true` |
| `voll-o-meter` | no service worker; „Offline-Modus“ unsupported | description: „Ein augenzwinkernder Promillerechner mit anpassbaren Getränken. Installierbar, die Daten bleiben im Browser. Nur eine Schätzung: keine Messung und keine Grundlage für Entscheidungen zur Fahrtüchtigkeit.“ tags `["javascript","localstorage","web-app"]` |
| `marathon-trainer` | „Strava-Anbindung“ is only a URL field; the KI runs in an external agent; private data | description: „Mein Trainings-Cockpit mit Countdown, 14-Wochen-Plan und Workout-Log. Workouts speichere ich mit Strava-Link, ausgewertet werden sie von einem externen KI-Agenten.“ tags `["nextjs","typescript","sqlite","recharts"]`, groups `["web"]`. **No goal time, PB or calendar details anywhere.** |
| `transcripator` | Flask, not Next.js; Groq Whisper + Gemini via OpenRouter | description: „Audio rein, Text raus, Zusammenfassung obendrauf. Angefangen als Telegram-Bot, heute auch als Web-App zum Hochladen oder direkt Aufnehmen.“ tags `["python","flask","whisper","gemini"]`, `source` `https://github.com/LoggeL/TranscripatorWeb` |
| `poolparty-website` | Express.js is outdated (jpCore uses Fastify 5); co-built | description: „Anmeldung, Mitbringliste, Helfer und Musikwünsche für die JP Poolparty. Gemeinsam mit realjupeters gebaut. Dahinter läuft mein Backend jpCore.“ tags `["javascript","fastify","sqlite"]`, `source` `https://github.com/realjupeters/realjupeters.github.io` |
| `geo-game` | tagged vanilla-js, is Next.js 16 / React 19 | tags `["nextjs","react","typescript","leaflet"]` |
| `oilbert` | README says HTML/CSS rendering, data says Canvas API | WP1 **checks the source** (`grep -r "getContext" LoggeL/OilbertsAdventure`). Canvas absent: description „Ein Endless-Runner mit einem rot-weißen VW-Bus in der Hauptrolle, gebaut mit JavaScript, HTML und CSS.“ tags `["game","javascript","css"]`. Canvas present: keep „Canvas“ and record the file in sources. |
| `theater-website` | `ai` group unexplained; repo is an org repo | groups `["web"]`, `source` `https://github.com/Kolpingtheater-Ramsen/next-theater` |
| `sailing-2019`, `sailing-2022` | wrong `ai` group | groups `["film"]` |
| `spyfall` | image path `Spyfall.webp`, but git tracks `spyfall.webp` (GitHub Pages is case-sensitive, so it is broken in production) | `image: "assets/img/spyfall.webp"` |
| all `isNew` | 7 old „new“ badges | `isNew: true` only on the 15 projects added now + `skiing-2023` |
| `partners.json` cfw | „Züge und Boote“ does not match the channel | see §3.12 |
| `partners.json` palatina-films | dead domain | link `https://loggel.github.io/PalatinaFilms/` |
| `infected`, `exception` | „48 Stunden“ only in existing data | keep the existing wording in `description`; never promote it to a headline, fact row or chapter |

### 3.3 `data/projects.json` v2 schema

Array; order = curated „Wie im Lager“ order (§3.4). Existing fields are unchanged in meaning.

```jsonc
{
  // existing, required
  "id": "melodai",                       // /^[a-z0-9-]+$/, unique, stable (used in #werk/<id>)
  "title": "MelodAI",
  "category": "KI & Musik",
  "description": "…",                    // German, ≤ 320 chars, only sourced claims
  "link": "https://melodai.logge.top/about",
  "tags": ["ml", "audio", "web-app"],
  "groups": ["ai", "web"],               // first = alloy
  // existing, one of
  "image": "assets/img/MelodAI-player.webp",   // exact-case path
  "art": "music",                        // music|capture|retro|organic|widget|film → Rohling variant
  // existing, optional
  "summary": "…", "imageAlt": "…", "artTitle": "…", "linkLabel": "…",
  "source": "https://github.com/LoggeL/MelodAI", "isNew": true, "archived": true,

  // NEW, optional
  "year": 2024,                          // curated project start year (research yearStarted / film year). Never auto-copied from repo.createdAt.
  "yearLabel": "2015–2020",              // optional display override (Selantis)
  "repo": {                              // written by scripts/snapshot-github.mjs
    "fullName": "LoggeL/MelodAI",
    "private": false,
    "stars": 7,
    "createdAt": "2024-10-21",           // date only
    "pushedAt": "2026-09-19"             // date only; drives glow + „Zuletzt bearbeitet“
  },
  "live": { "status": "live", "checkedAt": "2026-09-28" },   // live | repo-only | offline
  "probe": "melodai-mixer",              // Probestück id (§5.7), must exist in js/probes/index.js
  "contentNote": "…",                    // shown as „Hinweis“ (HEATLINE)
  "details": true,                       // data/details/<id>.json exists
  "related": ["infected-origins"]        // other project ids
}
```

Private repos (`geo-game`, `marathon-trainer`): `repo.private: true`, `fullName` omitted from UI (no link), `source` omitted. Dates and commit counts may show (they come from the research metadata).

### 3.4 Projects to add, and final order

Add from `docs/research/new-work.json → proposedProjects`, using their `id, title, category, description, summary, link, linkLabel, tags, groups, source, image` as delivered, plus `isNew: true`, `year` (= `yearStarted`), and `details: true`. Their `story/highlights/stack/evidence/imageNote` go into `data/details/<id>.json`.

| id | Changes vs research | groups |
|---|---|---|
| `heatline-solara` | `contentNote`: „Erwachsene Crime-Themen, harte Dialoge, stilisierte Action-Gewalt. Ein eigenständiges Projekt ohne Verbindung zu kommerziellen Spielen.“ (WP1 aligns wording with the README disclaimer, which names Rockstar/GTA; keep the non-affiliation sentence) | games, web |
| `nachtschicht` | – | games, web |
| `arcanum` | details.media note: „Titel-Overlay für den Screenshot ausgeblendet (Start braucht Pointer-Lock).“ | games, web |
| `voxel-blitz` | – (link = repo, needs own server) | games |
| `bulli-drive` | details.story adds: „Der große Bruder von Oilbert.“ (both are VW buses; README + sprite) and `related: ["oilbert"]` | games |
| `guess-the-model` | **never** any model name (validate denylist, §3.15) | ai, games |
| `theatermon` | `probe: "theatermon-types"`, `related: ["theater-website","creepshow-rpg"]` | games |
| `creepshow-rpg` | `related: ["theater-website","theatermon"]` | games |
| `jet-loop-reactor` | – | web |
| `rectify` | – | web |
| `static-pages` | description without the SEROTONIN mention: „Eine wachsende Sammlung statischer Web-Experimente und Interface-Studien: Simulationen, ein tägliches Musikquiz, Redesign-Konzepte, ein klickbarer Probenplan und eine Gesichtszensur, die kein Bild hochlädt.“ details.story also drops SEROTONIN; the count „11“ lives in details as a Stand-dated fact | web |
| `pulse-field-monitor` | – | web |
| `song-domino` | `related: ["spotify-viz"]` | games |
| `powerpoint-karaoke` | – | games, ai |
| `kindenheimer-kerweborsch` | – | web |
| ~~`serotonin`~~ | **not added** until the owner decides (§3.16). The screenshot stays in `assets/img` unreferenced. | – |

Also add **`skiing-2023`**:

```json
{ "id": "skiing-2023", "title": "Ski 2023", "category": "Aftermovie",
  "description": "Der Ski-Aftermovie 2023. Auf YouTube mit Grüßen an den FI-Toaster und die unsichtbaren Backbleche.",
  "link": "https://www.youtube.com/watch?v=CLalueWRmLI", "tags": ["aftermovie","skiing","editing"],
  "groups": ["film"], "year": 2023, "isNew": true, "image": "assets/img/Skiing2023.webp",
  "imageAlt": "Vorschaubild des Videos „Aftermovie Ski 2023“" }
```

`Skiing2023.webp` comes from `scripts/fetch-film-stills.mjs`: it downloads `https://i.ytimg.com/vi/CLalueWRmLI/maxresdefault.jpg` (Logge's own video thumbnail) and converts it to 960×600 WebP, center crop. It is recorded in `content-sources.md`. If the download fails, use `"art": "film"` instead.

**Final order (55 entries):** bomberman-web, melodai, theater-website, heatline-solara, learn-ai, skiing-2026, kniffel, theatermon, nachtschicht, frontier, sharex-capture-engine, sharex-win98, sharex-afterimage, geo-game, guess-the-model, jet-loop-reactor, rectify, spotify-viz, song-domino, beatguessr, coop-sudoku, arcanum, creepshow-rpg, voxel-blitz, bulli-drive, oilbert, transcripator, codex-quota-widget, loggerythm, setlist, marathon-trainer, powerpoint-karaoke, static-pages, pulse-field-monitor, kindenheimer-kerweborsch, poolparty-website, infected-origins, infected, exception, selantis, skiing-2024-epic, skiing-2024-fun, skiing-2023, skiing-2022, sailing-2022, poolparty-2021, skiing-2020, bodensee-2020, poolparty-2020, skiing-2019, sailing-2019, voll-o-meter, spyfall, palatina-films-website, corona-board.

`probe` assignments: bomberman-web → `bomberman-chain`, melodai → `melodai-mixer`, theatermon + theater-website → `theatermon-types`, transcripator → `transcripator-pow`, beatguessr → `beatguessr-years` (P2).

### 3.5 Screenshots that replace art tiles

| id | New `image` | `imageAlt` | Note |
|---|---|---|---|
| sharex-capture-engine | `assets/img/ShareXCaptureEngine.webp` | „Startseite des ShareX-Konzepts Capture Engine mit 3D-Reaktor“ | live capture |
| sharex-win98 | `assets/img/ShareXWin98.webp` | „ShareX-98-Konzept: Windows-98-Desktop mit geöffnetem Capture Center“ | live capture |
| sharex-afterimage | `assets/img/ShareXAfterimage.webp` | „ShareX-Konzept Afterimage Lab, Startseite“ | live capture |
| infected-origins | `assets/img/InfectedOrigins.webp` | „Startseite des Drehbuchs Infected Origins mit KI-generierter Figurenillustration“ | the images are AI-generated; say so |
| loggerythm | `assets/img/LoggeRythm.webp` | „LoggeRythm: Warteschlange im Webplayer (offizieller Screenshot aus dem Repo)“ | official repo screenshot |
| codex-quota-widget | **keep `art: "widget"`** for plates | – | the 945×147 strip goes into `details.media` with the caption „Widget-Vorschau mit Testdaten (aus dem Repo)“ and is shown on its own dark stage in the Werkbank, never forced to 16:10 |

### 3.6 `data/details/<id>.json` (new, one file per project with research)

```jsonc
{
  "id": "melodai",
  "story": ["Absatz …"],                       // 1–4 German paragraphs, first person, sourced
  "highlights": ["…"],                          // 3–6
  "stack": ["Python 3.12", "Flask", "React"],   // canonical names (see normalize map §5.10)
  "languages": { "TypeScript": 54.7, "Python": 28.5, "CSS": 16, "JavaScript": 0.6 },
  "commits": 172,
  "commitsBy": { "LoggeL": 249, "total": 314 }, // only where research provides it (theater, poolparty)
  "facts": [                                    // extra Stand-dated numbers; each points to a source
    { "label": "Themen", "value": "68", "source": 1 }
  ],
  "funFact": { "text": "…", "source": 0 },      // „Randnotiz“; omitted unless sourced
  "relatedRepos": [                             // public only; private ones are dropped by the importer
    { "role": "früherer Anlauf", "fullName": "LoggeL/BeatGuessr2", "createdAt": "2020-12-21", "commits": 51 }
  ],
  "media": [
    { "src": "assets/img/CodexQuotaWidget.webp", "alt": "…", "caption": "…", "kind": "screenshot",
      "width": 945, "height": 147, "source": 0 }
  ],
  "note": "…",                                   // public caveat (LoggeRythm: privates Demo-Projekt)
  "sources": [                                   // index = source number shown as ¹²³
    { "label": "README", "url": "https://github.com/LoggeL/MelodAI", "checkedAt": "2026-09-28" },
    { "label": "Live-Seite", "url": "https://melodai.logge.top/about", "checkedAt": "2026-09-28" }
  ]
}
```

Import mapping from `projects-deep.json`: `story` (split on sentence groups into ≤ 3 paragraphs, **wording unchanged**), `highlights`, `stack`, `repo.languages → languages`, `repo.commits → commits`, `relatedRepos` (public only), `liveCheck → project.live`, `funFact → funFact` (source = the entry's first source), `sources` (strings parsed into `{label,url}`, `checkedAt` = `liveCheck.checkedAt`). **Not imported:** `interactionIdeas`, `caveats` (they inform this spec only), any private-repo README facts marked „nicht verwenden“, Marathon personal data, Spotify reports of other people.

Specific story edits the importer must apply (and `validate.mjs` must enforce, §3.15): marathon-trainer drops the date, goal time and „für den Frankfurt Marathon am 25. Oktober 2026“ clause, and its story becomes „Mein Trainings-Cockpit: Countdown zur Startlinie, 14-Wochen-Plan, Tagesansicht und Rennbereitschaft. Das Projekt ist mit meinen Zielen gewachsen und hatte schon mehrere Leben. Workouts lassen sich mit Strava-Link speichern, die KI-Analyse läuft über meinen Agenten.“ Transcripator: the live footer still names Cerebras, so do not mention a provider in the story beyond the research text.

### 3.7 `data/films.json` (new)

One entry per film project (from `film-network-persona.json → films`) plus the film-only metadata the chapter needs.

```jsonc
{
  "id": "skiing-2026",
  "youtubeId": "ZjB-0SG0icU",              // must equal the id parsed from project.link
  "realTitle": "Ski 2026 - Portes du Soleil",
  "uploaded": "2026-02-03",
  "duration": "6:28",                       // m:ss or h:mm:ss
  "series": "ski",                          // ski | segeln | poolparty | kurzfilm | palatina | drehbuch | bodensee
  "location": "Portes du Soleil",           // only from titles or existing data
  "aspect": "9:16",                         // default 16:9
  "quote": "Die Welt steht schief diesmal in vertikal.",   // verbatim YouTube description or omitted
  "alsoOn": [{ "label": "jupeters.de", "url": "https://jupeters.de" }],
  "roles": [],                               // only sourced (Selantis)
  "sources": [{ "label": "YouTube", "url": "https://www.youtube.com/watch?v=ZjB-0SG0icU", "checkedAt": "2026-09-28" }]
}
```

Special entries: `selantis` has `parts[]` (3 × title/duration/upload/url), `roles: ["VFX","Homepage","Schauspieler","Hauptrolle Harras (Teil 3)"]` and `year: 2015`. `infected-origins` has `series: "drehbuch"`, no duration, and the note „Drehbuch, kein gedrehter Film. Die Bilder sind KI-generierte Visualisierungen.“ `bodensee-2020` has `quote` omitted (the description is just a URL). Selantis part 1 title: use „Dunkle Mächte“ (YouTube + selantis.html).

### 3.8 `data/repos.json` and `data/snapshot.json` (new, generated)

`scripts/snapshot-github.mjs` (uses `gh api`, dev-only) writes both files **in one run**:

```jsonc
// data/snapshot.json
{
  "asOf": "2026-09-28",
  "github": { "createdAt": "2015-04-15", "bio": "I'm just pressing buttons", "ownPublicRepos": 140 },
  "youtube": { "firstUpload": "2014-11-22", "firstTitle": "AE Test" },
  "sources": [
    { "label": "GitHub API users/LoggeL", "url": "https://api.github.com/users/LoggeL", "checkedAt": "2026-09-28" },
    { "label": "YouTube „AE Test“", "url": "https://www.youtube.com/watch?v=wHEcSFBkM0s", "checkedAt": "2026-09-28" }
  ]
}
// data/repos.json   (own public non-fork repos, sorted by createdAt)
{ "asOf": "2026-09-28",
  "repos": [
    { "c": "2017-07-12", "p": "2019-01-02", "l": "CSS", "n": "BetterDiscordThemes" },   // n only if allowlisted
    { "c": "2026-06-16", "p": "2026-09-04", "l": "JavaScript", "n": "bomberman-web", "id": "bomberman-web" },
    { "c": "2021-03-02", "p": "2021-04-01", "l": "JavaScript" }                           // unnamed
  ] }
```

- Query: `gh repo list LoggeL --visibility public --source --limit 400 --json name,createdAt,pushedAt,primaryLanguage`. Verified 28.09.2026: 140 repos. Per year: 2017: 1 · 2018: 2 · 2019: 6 · 2020: 9 · 2021: 9 · 2022: 8 · 2023: 8 · 2024: 10 · 2025: 25 · 2026: 62.
- **Name allowlist** (`scripts/repo-allowlist.json`): repos that map to a portfolio project (`id` set) plus milestone repos (BetterDiscordThemes, PalatinaFilms, kolpingCore, LMF, BeatGuessr2, TicketTheater). All others are unnamed and unlinked. That way the timeline never surfaces third-party or client repos (hartraet-redesign, foam-detector, etc.).
- The same script refreshes `projects.json → repo.{stars,createdAt,pushedAt}` and `details.<id>.{commits,languages}` for every project with a GitHub source (commit count via the `Link` header of `commits?per_page=1`; languages → percentages with one decimal).
- Numbers from mixed sources (148 including forks, 65 in 2026 including forks) are **not used anywhere**.

### 3.9 `data/milestones.json` (new)

```jsonc
[{ "date": "2014-11-22", "precision": "day", "kind": "film", "text": "Mein erstes Video: „AE Test“, sieben Sekunden After Effects.",
   "sources": [{ "label": "YouTube", "url": "https://www.youtube.com/watch?v=wHEcSFBkM0s" }] }]
```

`kind`: `film | code | web | life | galerie`. `precision`: `day | month | year`. Content = the table in §2.6. Sorted ascending.

### 3.10 `data/chapters.json` and `data/universe.json` (new)

```jsonc
// chapters.json
[{ "n": "I", "alloy": "web", "anchor": "theater-website", "probe": "theatermon-types", "universe": true },
 { "n": "II", "alloy": "games", "anchor": "bomberman-web", "probe": "bomberman-chain" },
 { "n": "III", "alloy": "ai", "anchor": "melodai", "probe": "melodai-mixer", "more": ["learn-ai","frontier","guess-the-model"] },
 { "n": "IV", "alloy": "film", "series": "ski", "more": ["selantis","infected","exception","poolparty-2021","sailing-2022","bodensee-2020"] }]
```

Copy for chapters lives in `index.html` (static, by the lead from §2.3). `chapters.json` only binds data.

`universe.json`: Kolpingtheater nodes, each `{ "label", "kind": "web|werkzeug|spiel|film", "text", "url", "projectId?", "year?" }`, all with a source URL. Nodes: Website (next-theater), Vorgänger-Website (q-theater), kolpingCore (2021), TicketTheater (2024), Skript (Drehbuch-PWA für Proben), CyberScreen (Videozuspielung für „Nexus“), TheaterApp (Flutter, 2026), Theatermon (projectId), Creepshow RPG (projectId), Creepshow-Slideshow (repo link only, no screenshot), Rampenlicht (Kartenspiel, repo link), Kanaltrailer 2020 (YouTube), Kristall-der-Träume-Aftermovie restauriert 2021 (YouTube). Nodes without a sourced description (escape, DrehbuchStats) are left out.

### 3.11 Probe data

- `js/probes/theatermon-rules.js`: `TYPE_NAME` and `typeEff()` copied **verbatim** from `LoggeL/theatermon/js/data.js`, with a header comment giving the source URL and commit SHA.
- `data/probes/beatguessr.json` (P2): generated by `scripts/snapshot-beatguessr.mjs` from `https://loggel.github.io/BeatGuessr/data/songs.json` → `[{ "year": 1960, "context": "Geburt der Sixties", "songs": [["Marina","Rocco Granata"], …] }]` (66 years × 10). No `preview_url`, `cover_url` or Spotify links. Decade colours are copied from the BeatGuessr CSS (with the file cited).

### 3.12 `data/partners.json` changes

```jsonc
{ "id": "cfw", "title": "CFW", "category": "Media",
  "description": "Ein YouTube-Kanal über Ausflüge, Reisen und Wanderungen. Für CFW habe ich ein Karteikartensystem gebaut.",
  "link": "https://www.youtube.com/channel/UClU8mK17SZwqCLDES0olV1w", "image": "assets/svg/CFW.svg" }
{ "id": "palatina-films", …, "link": "https://loggel.github.io/PalatinaFilms/", "description": "Die Filmgruppe, für die ich VFX gemacht, die Website gebaut und mitgespielt habe." }
{ "id": "jp", …, "place": "Ramsen" }            // jpCore README: „the annual event in Ramsen, Germany“
{ "id": "kolpingtheater", …, "place": "Ramsen", "description": "Theatergruppe in Ramsen. Website, Werkzeuge, Spiele und 2026 eine Rolle auf der Bühne." }
```

Optional new field on all partners: `sources: [{label,url,checkedAt}]`, shown via a Punze on the partner card.

### 3.13 Derived values (pure functions in `js/lib/derive.js`, Node-importable)

```js
alloyOf(p)          = p.groups[0]
glowOf(p, asOf)     = p.archived ? "ausgemustert"
                    : p.repo?.pushedAt ? (d = days(asOf - pushedAt), d <= 30 ? "glueht" : d <= 180 ? "warm" : "abgekuehlt")
                    : p.groups.includes("film") ? "fertig" : null        // null → no label
stockNo(projects)   = chronological index by (year ?? 9999, JSON order), zero-padded 3 → "Nº 017"
haystack(p, d?)     = normalize([title, summary, description, category, ...tags, ...(d?.stack||[]), year, film.location].join(" "))
normalize(s)        = s.toLocaleLowerCase("de").normalize("NFD").replace(/\p{M}/gu,"").replace(/ß/g,"ss")
                       .replace(/ae/g,"a").replace(/oe/g,"o").replace(/ue/g,"u")        // both sides
reposByYear(repos)  = { 2017: 1, …, 2026: 62 }
nights(names)       = unique(date(IMG_YYYYMMDD_HHMM) − (hour < 12 ? 1 day : 0))
bindings(data)      = { "projects.total": 55, "projects.web": …, "repos.total": 140, "repos.currentYear": 62,
                        "repos.before": 53, "github.sinceYear": 2015, "gallery.total": 77, "gallery.nights": 17,
                        "gallery.first": "24.09.", "gallery.last": "26.10.2020", "gallery.hourFrom": 20, "gallery.hourTo": 2,
                        "films.total": 16, "films.ski": 7, "films.skiFirstYear": 2019, "films.skiOnJp": 7, "sharex.seconds": 81,
                        "repos.firstYear": 2017,
                        "sharex.date": "15.07.2026", "snapshot.asOf": "28.09.2026", … }
```

`repos.before` = sum of every year before the previous year (2017–2024 = 53). `currentYear` = the year of `asOf`.

**`data-bind` mechanism:** every computed number in `index.html` copy is a `<span data-bind="repos.total">140</span>`. `scripts/prerender.mjs` writes the value (so no-JS readers get real numbers), and `main.js` rewrites it at runtime from the same `bindings()`. Copy never contains a typed number that describes data.

### 3.14 Scripts (dev-only, outputs committed; the deploy stays a static upload)

| Script | npm script | Does |
|---|---|---|
| `scripts/import-research.mjs` | `npm run import` | research → `projects.json` (new entries + fixes §3.2 as a patch table in the script), `details/*.json`, `films.json`, `milestones.json`, `universe.json`. Refuses facts without a source. Idempotent. |
| `scripts/snapshot-github.mjs` | `npm run snapshot` | §3.8. Requires `gh auth`. Sets `asOf` to today. |
| `scripts/fetch-film-stills.mjs` | – | Ski 2023 still (§3.4) |
| `scripts/prerender.mjs` | `npm run prerender` | fills `<!-- prerender:NAME -->…<!-- /prerender:NAME -->` blocks and `data-bind` spans in `index.html` using the pure renderers in `js/render/*.js` |
| `scripts/build-gallery.mjs` | `npm run gallery` | regenerates `gallery/index.html` body from `gallery/assets/data/images.json` + filename timestamps |
| `scripts/strip-gps.mjs` | – | removes EXIF GPS from `gallery/assets/img/original/*.jpg` (devDependency `sharp`, or `piexifjs`); **run only after owner approval**, §3.16 |
| `scripts/render-poster.mjs` | `npm run poster` | Playwright: opens `/?poster`, waits for `esse:cooled`, screenshots the Esse panel → `assets/img/esse-poster.{avif,webp}` and `esse-og.jpg` (1200×630) |
| `scripts/bake-logo-sdf.mjs` | – | renders `assets/svg/logo.svg` to a mask and computes an 8-bit SDF → `assets/img/logo-sdf.png` (512×306) |
| `scripts/check-embeds.mjs` (P2) | – | HEAD/GET each live URL; writes `project.embed.verifiedAt` only if no `X-Frame-Options` / `frame-ancestors` |
| `scripts/snapshot-beatguessr.mjs` (P2) | – | §3.11 |
| `scripts/fetch-fonts.mjs` | – | downloads the four font files + OFL texts (§4.1), verifies size |
| `scripts/validate.mjs` | `npm run check` | §3.15 |

`package.json` adds devDependencies `sharp` (images) and nothing else runtime.

### 3.15 `scripts/validate.mjs` rules (all must pass; CI runs `npm run check && npm test`)

**projects.json**
1. Required string fields `id,title,category,description,link`; `tags` array; `groups` non-empty ⊆ `{web,games,ai,film}`; ids unique and match `/^[a-z0-9-]+$/`.
2. `link` protocol `https:`; `image` exists **with exact case** (compare with `readdirSync` of the folder, not `access`); else `art` ∈ the six styles.
3. `year` integer in `[2014, year(asOf)]`; `repo.pushedAt`/`createdAt` ISO dates ≤ `asOf`; `live.status` ∈ `live|repo-only|offline`.
4. `probe` exists in `js/probes/index.js` (import the registry's `PROBE_IDS` export).
5. `related[]` ids exist; `details: true` ⇔ `data/details/<id>.json` exists.
6. Count is exactly the length of the final order list in the script (55 at launch); the order matches `scripts/order.json`.
7. **Regression denylist** (research-contradicted claims): no `Offline-Modus` in voll-o-meter; no `Strava-Anbindung` / `KI-gestützt` in marathon-trainer; no `Express` in poolparty-website; no `vanilla-js` in geo-game tags; no `nextjs` in transcripator tags; no `ai` group on sailing-* or theater-website; no link containing `setlist.logge.top`, `palatina-films.de` or `watch?v=VTPliFOTA0` (exact, without the dash).
8. **Spoiler denylist**: `guess-the-model` (project + details) must not match `/gpt|claude|gemini|llama|grok|deepseek|qwen|mistral|kimi|glm|opus|sonnet|o[134]-/i`.
9. **Privacy denylist**: marathon-trainer project + details must not match `/2:59|3:05|Pace|JGA|Urlaub|Festival|25\.10\./`; no file names the city of the night walks (the pattern lives in `scripts/validate.mjs`, stored obfuscated; unless the owner decision in §3.16 flips `ALLOW_PLACE_NAMES`).
10. `serotonin` must not be present unless `docs/decisions.json` has `"serotonin": "show"`.

**details/*.json**
11. `id` = filename = an existing project; `sources.length ≥ 1`; each source `url` is https (or a repo-relative path from the allowlist `index.old.html`, `gallery/…`); `checkedAt` ISO.
12. `facts[].source` and `media[].source` and `funFact.source` are valid indices into `sources`.
13. `languages` values sum to 95–105; `media[].src` exists (exact case); `story` 1–4 non-empty strings.

**films.json / milestones.json / universe.json / chapters.json**
14. Every film id is a project in `film`; `youtubeId` matches `/^[\w-]{11}$/` and equals the id parsed from `project.link` (this catches the Feldberg bug); `duration` matches `/^\d+:\d\d(:\d\d)?$/`; `uploaded` ISO.
15. Milestones sorted ascending, each with ≥ 1 https source; universe nodes each have a `url`; chapter anchors exist and have details.

**repos.json / snapshot.json**
16. `repos.asOf === snapshot.asOf`; every `n` is in the allowlist; no fork or private flags; `reposByYear` sums to `repos.length === snapshot.github.ownPublicRepos`.

**index.html**
17. Prerender freshness: re-render every `prerender:*` block and `data-bind` span in memory and compare with the file. Mismatch → fail with „Run npm run prerender“.
18. No typed data numbers: outside `<head>`, `prerender` blocks and `data-bind` spans, the text must not match `/\b\d+\s+(Projekte|Repos|Fotos|Filme|Nächte)\b/`.
19. Required hooks present: `#project-search`, `[data-filter]` ×5, `#project-count[role=status]`, `#projects-container`, `#load-more`, `#empty-state`, `#reset-filters`, `#werkbank`, `#close-modal`, `#modal-title`, `#modal-link`, `#menu-toggle`, `#navigation`, `#theme-toggle`, `#motion-toggle`, `.contact-mail`, `#lager-static`.

**assets / gallery**
20. `gallery/index.html` has exactly 77 `.photo-grid a` whose hrefs match `images.json`.
21. After owner approval: no JPEG in `gallery/assets/img/original/` contains a GPS IFD (tag `0x8825`, checked by a 40-line APP1 parser in the script).
22. Fonts: ≤ 4 woff2 in `assets/fonts`, total ≤ 125 KB, and each family has its `OFL-*.txt`.
23. `assets/img/avifenc.exe` must not exist. Unreferenced `*.png` originals in `assets/img` produce a warning list.

**Pure-function checks (kept + extended)**
24. `filterProjects(projects,"film","Infected").length === 2`; `filterProjects(projects,"games","MelodAI").length === 0`; `filterProjects(projects,"all","  BOMBERMAN  ")[0].id === "bomberman-web"`; `filterProjects(projects,"all","kolping")` includes `theater-website`; `filterProjects(projects,"all","oilberts")` includes `oilbert`.
25. `glowOf` against fixtures; `reposByYear(repos)[2026] === 62` at the launch snapshot (the test reads the value from the snapshot, it is not hard-coded after the next refresh).

### 3.16 Owner decisions (defaults ship unless Logge says otherwise)

| # | Question | Default |
|---|---|---|
| 1 | Show SEROTONIN (drug theme, strobe warning)? | **Not shown.** If yes: add with its contentNote and the „Kunstprojekt · keine Konsumempfehlung“ label, never in Noch warm or chapters. |
| 2 | Strip GPS from the 60 gallery originals? | **Yes, strip** (run `strip-gps.mjs`, commit after approval). Alternative: stop deploying `original/` entirely. |
| 3 | Name the city of the night walks? | **No.** |
| 4 | Setlist → Bands | **Switch** (commit „Rebrand Setlist to Bands“ + identical app live). |
| 5 | Marathon goal/PB/race date | **Not shown.** |
| 6 | Gummibären clip (Disney footage) | Keep **tiny** (≤ 40 px), hover/focus only. |
| 7 | Voxel Blitz / Bulli Drive without a live demo | Listed, linking to the repos. |

---

## 4. Visual system

### 4.1 Fonts (4 files, ≤ 125 KB, all SIL OFL 1.1, self-hosted)

| Role | Family | File | Download (pinned) | Size |
|---|---|---|---|---|
| Display: H1, H2, chapter titles, big numerals, quotes | **Instrument Serif** Regular | `assets/fonts/InstrumentSerif-Regular.woff2` | `https://cdn.jsdelivr.net/npm/@fontsource/instrument-serif@5.3.0/files/instrument-serif-latin-400-normal.woff2` | 21 KB |
| Display italic: the one emotional word | **Instrument Serif** Italic | `assets/fonts/InstrumentSerif-Italic.woff2` | `…/instrument-serif-latin-400-italic.woff2` | 22 KB |
| Body + UI | **Montserrat** variable (wght 100–900); replaces the static 400-only file with the same family | `assets/fonts/Montserrat-var.woff2` | `https://cdn.jsdelivr.net/npm/@fontsource-variable/montserrat@5.3.0/files/montserrat-latin-wght-normal.woff2` | 38 KB |
| Data / stamps / „mono = fact“ | **JetBrains Mono** variable (wght 100–800) | `assets/fonts/JetBrainsMono-var.woff2` | `https://cdn.jsdelivr.net/npm/@fontsource-variable/jetbrains-mono@5.3.0/files/jetbrains-mono-latin-wght-normal.woff2` | 40 KB |

Licences: `https://raw.githubusercontent.com/google/fonts/main/ofl/instrumentserif/OFL.txt`, `https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/OFL.txt`, `https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/OFL.txt` → `assets/fonts/OFL-*.txt`. Upstream: github.com/Instrument/instrument-serif, github.com/JetBrains/JetBrainsMono, github.com/JulietaUla/Montserrat. All URLs were verified (HTTP 200) on 28.09.2026. Delete the old `Montserrat.woff2` once gallery and index both use the new file.

The latin subset covers German (äöüß, „“ ‚‘ … –). Arrows are **not** font glyphs (§4.7).

```css
@font-face { font-family: "Instrument Serif"; src: url("../assets/fonts/InstrumentSerif-Regular.woff2") format("woff2"); font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: "Instrument Serif"; src: url("../assets/fonts/InstrumentSerif-Italic.woff2") format("woff2"); font-weight: 400; font-style: italic; font-display: swap; }
@font-face { font-family: "Montserrat"; src: url("../assets/fonts/Montserrat-var.woff2") format("woff2"); font-weight: 100 900; font-display: swap; }
@font-face { font-family: "JetBrains Mono"; src: url("../assets/fonts/JetBrainsMono-var.woff2") format("woff2"); font-weight: 100 800; font-display: swap; }
@font-face { font-family: "Serif Fallback"; src: local("Georgia"); size-adjust: 94%; ascent-override: 92%; descent-override: 24%; }   /* tune with an overlay check */
--font-display: "Instrument Serif", "Serif Fallback", Georgia, serif;
--font-body:    Montserrat, system-ui, -apple-system, "Segoe UI", Arial, sans-serif;
--font-mono:    "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
```

Preload only `InstrumentSerif-Regular.woff2` (the LCP H1) and `Montserrat-var.woff2`.

### 4.2 Colour tokens

Three scopes: **Tageslicht** (light), **Esse** (dark), and **Screen**. Screen is theme-independent and always dark; it is used by the Esse panel, Kapitel IV, the Werkbank top bar, `#kontakt` and the Bomberman stage. Contrast ratios were computed (WCAG 2.x relative luminance) for this spec. Every **text** token is ≥ 4.5:1 on all three surfaces of its scope, and every UI border is ≥ 3:1.

```css
:root, :root[data-theme="light"] {           /* Tageslicht: kaltes Eisen auf Kalk */
  --bg:        #EDE9E2;
  --surface:   #F8F6F2;
  --surface-2: #E2DCD2;
  --ink:       #171311;   /* 15.25 / 17.10 / 13.54 */
  --muted:     #5B524A;   /*  6.31 /  7.07 /  5.60 */
  --line:      #CFC7BB;   /* decorative hairlines only */
  --control:   #857970;   /*  3.49 /  3.92 /  3.10  (UI borders, ≥ 3:1) */
  --accent:    #A3320E;   /*  5.75 /  6.44 /  5.10  (links, primary buttons) */
  --brand:     #B80D29;   /*  5.55 /  6.22 /  4.92  (logo red) */
  --focus:     #1D4FB3;   /*  6.15 /  6.90 /  5.46 */
  --alloy-web:   #6E5200; /*  6.05 /  6.78 /  5.37  Strohgelb */
  --alloy-games: #7A3796; /*  6.17 /  6.91 /  5.47  Purpur */
  --alloy-ai:    #2A4FA8; /*  6.24 /  6.99 /  5.54  Blau */
  --alloy-film:  #A8261A; /*  5.87 /  6.58 /  5.21  Rotglut */
  --heat-text:   #8A2A08; /*  7.19 /  8.06 /  6.38  „glüht“ label */
  --on-alloy:    var(--surface);   /* filled chips: 6.58–6.99 */
  color-scheme: light;
}
:root[data-theme="dark"] {                   /* Esse */
  --bg:        #0E0C0B;
  --surface:   #1A1614;
  --surface-2: #241E1B;
  --ink:       #F3EEE7;   /* 16.91 / 15.57 / 14.25 */
  --muted:     #AFA59A;   /*  8.06 /  7.42 /  6.79 */
  --line:      #3A322D;
  --control:   #7D7067;   /*  4.08 /  3.75 /  3.44 */
  --accent:    #FF7A3D;   /*  7.53 /  6.93 /  6.35 */
  --brand:     #FF4D5E;   /*  6.02 /  5.54 /  5.07 */
  --focus:     #FFD166;   /* 13.53 / 12.46 / 11.41 */
  --alloy-web:   #E9C46A; /* 11.68 / 10.75 /  9.85 */
  --alloy-games: #D59BF0; /*  9.08 /  8.36 /  7.66 */
  --alloy-ai:    #86AEFF; /*  8.84 /  8.14 /  7.45 */
  --alloy-film:  #FF7D5C; /*  7.75 /  7.14 /  6.53 */
  --heat-text:   #FFB347; /* 10.96 / 10.09 /  9.24 */
  --on-alloy:    var(--bg);        /* filled chips: 7.53–11.68 */
  color-scheme: dark;
}
.screen {                                    /* always dark, both themes */
  --bg: #0E0C0B; --surface: #16120F; --surface-2: #211A16;
  --ink: #F3EEE7;  /* 16.91 / 16.14 / 14.86 */   --muted: #AFA59A; /* 8.06 / 7.69 / 7.08 */
  --control: #7D7067; --accent: #FF7A3D; --focus: #FFD166;
  --alloy-web: #E9C46A; --alloy-games: #D59BF0; --alloy-ai: #86AEFF; --alloy-film: #FF7D5C;
  --heat-text: #FFB347; --on-alloy: #0E0C0B;
  color-scheme: dark; background: var(--bg); color: var(--ink);
}
```

**Heat ramp** (decorative only, **never text**; shared by CSS and GLSL via `js/lib/palette.js`):

```
--heat-0 #2A2522 kaltes Eisen · --heat-1 #5A0E05 dunkle Rotglut · --heat-2 #B3200A Kirschrot
--heat-3 #F2600C Orange · --heat-4 #FFB347 Gelb · --heat-5 #FFF4D6 Weißglut
```

Glow rendering per state: `glueht` → inner shadow heat-3 at 45% + label in `--heat-text`; `warm` → heat-2 at 30%; `abgekuehlt` → none; `fertig` → a thin alloy-film line; `ausgemustert` → plate desaturated to 60%, plus stamp. The text label is always present.

`prefers-contrast: more`: glows and grain off, `--line` = `--muted`, 2 px borders. `forced-colors: active`: plates `1px solid CanvasText`, chips `ButtonText/ButtonFace`, canvases hidden (poster shown with `forced-color-adjust: none`), focus `Highlight`.

### 4.3 Type scale (fluid, rem-based; 320 → 1440 px)

| Token | Font | Size | LH | Tracking / notes |
|---|---|---|---|---|
| `--t-hero` | Instrument Serif | `clamp(3.4rem, 1.4rem + 10vw, 12rem)` | .86 | −.025em. At 320 px: 54 px; „Aus Neugier.“ ≈ 280 px fits 288 px. Container-query step to 3rem below 340 px. |
| `--t-h2` | Instrument Serif | `clamp(2.5rem, 1.2rem + 5.2vw, 6.5rem)` | .92 | −.02em |
| `--t-chapter` | Instrument Serif | `clamp(2.25rem, 1rem + 4.6vw, 5.5rem)` | .95 | −.015em |
| `--t-numeral` | Instrument Serif | `clamp(6rem, 22vw, 20rem)` | .8 | outline via `-webkit-text-stroke: 1px var(--control)`, `aria-hidden` |
| `--t-h3` | Montserrat 650 | `clamp(1.25rem, 1rem + .9vw, 1.75rem)` | 1.15 | −.01em |
| `--t-lead` | Montserrat 420 | `clamp(1.125rem, 1rem + .5vw, 1.375rem)` | 1.45 | – |
| `--t-body` | Montserrat 420 | `1.0625rem` | 1.6 | min 16 px |
| `--t-meta` | JetBrains Mono 500 | `.8125rem` (13 px) | 1.4 | .06em, uppercase, `tabular-nums`. **Never below 12 px.** |
| `--t-quote` | Instrument Serif Italic | `clamp(1.5rem, 1rem + 2vw, 2.5rem)` | 1.15 | YouTube quotes, Theatermon intro |

Rule: at most **one** italic word per heading (the *emphasis* in §2). Numbers in stamps and counters use `font-variant-numeric: tabular-nums`.

### 4.4 Grid and spacing

- Shell: `max-inline-size: 1440px; padding-inline: max(16px, 4vw)` (exactly 16 px at 320).
- Columns: 12 at ≥ 1024 (gap 24), 6 at 640–1023 (gap 20), 4 below 640 (gap 16).
- Spacing (8 px base): `--s1 4 · --s2 8 · --s3 12 · --s4 16 · --s5 24 · --s6 32 · --s7 48 · --s8 64 · --s9 96 · --s10 144 · --s11 208`. Section padding: `clamp(96px, 12vw, 208px)` block.
- Plate grid: `repeat(auto-fill, minmax(min(100%, 300px), 1fr))`, media 16:10 (matches the existing 960×600 assets).
- Radii: 0 on plates and screens (forged steel is square-cut), 2 px on chips and buttons, 50% on rivets.
- Blueprint layer (section headers only): 1 px `--line` column guides with „+“ marks, `aria-hidden`, off under `prefers-contrast: more`.

### 4.5 Materials (procedural, no image downloads)

- **Steel grain**: one inline SVG `feTurbulence` data URI (baseFrequency .9, 2 octaves), about 400 B, at 4% (light) / 6% (dark) with `background-blend-mode: overlay` on plates.
- **Rivets**: 4 × `radial-gradient` in the plate corners via `::before`, 6 px.
- **Rohling** (no image): steel plate, the title engraved in Instrument Serif (`artTitle || title`), category in mono, and one of six engraving patterns per `art` value (sound-wave grooves, viewfinder marks, 98-bevel, organic etch, gauge ticks, film perforations). All CSS/SVG, `aria-hidden`, with the real `h3` outside.
- **Stamp row**: mono, with `clip-path` ink-in on reveal.

### 4.6 Motion tokens and rules

```css
--ease-hammer:  cubic-bezier(.7, 0, .84, 0);     /* accelerate into impact */
--ease-rebound: cubic-bezier(.34, 1.56, .64, 1); /* only strikes may overshoot */
--ease-cool:    cubic-bezier(.16, 1, .3, 1);     /* expo-out, long tails */
--ease-quench:  cubic-bezier(.4, 0, 1, 1);       /* fast exit */
--ease-std:     cubic-bezier(.2, 0, 0, 1);       /* UI default */
--ease-projector: steps(6, jump-none);           /* film texture only (24 fps feel) */
--d-strike: 90ms;  --d-rebound: 260ms;  --d-ui: 180ms;  --d-heat-in: 100ms;
--d-cool: 1600ms;  --d-route: 480ms;    --d-stamp: 420ms; --d-quench: 240ms;
@property --heat      { syntax: "<number>";     inherits: true;  initial-value: 0; }
@property --page-heat { syntax: "<number>";     inherits: true;  initial-value: 1; }
@property --mx        { syntax: "<percentage>"; inherits: false; initial-value: 50%; }
@property --my        { syntax: "<percentage>"; inherits: false; initial-value: 40%; }
@property --p         { syntax: "<number>";     inherits: true;  initial-value: 0; }
```

Rules:
1. **Heat in fast, cool out slow** on every interactive surface.
2. **Mass, not bounce.** Only strikes overshoot.
3. **One burst per component**; ambient loops only in the Esse panel and the Kontakt coals, and both stop off-screen and when the motion toggle is on.
4. **Motion explains state** (reveal, filter, open). Nothing decorative is disconnected from a state change.
5. Animate only `transform`, `opacity`, `clip-path`, registered custom properties, `filter` on ≤ 3 elements, `font-variation-settings` on ≤ 1 element.
6. Motion is **opt-in in CSS**: all non-essential animation lives in `@media (prefers-reduced-motion: no-preference) { :root:not([data-motion="paused"]) … }`.
7. No flashes: no luminance jump > 10% more than twice per second (WCAG 2.3.1). Strike flashes are single frames ≥ 400 ms apart and confined to the Esse panel. Never full-screen white.
8. Content is **never** hidden in base CSS waiting for JS or scroll timelines (no base `opacity: 0`).

### 4.7 Iconography

A single inline `<svg><symbol>` sprite at the top of `<body>` (owned by the lead): `i-arrow-ne` (↗), `i-arrow-se` (↘), `i-arrow-down`, `i-arrow-right`, `i-arrow-left`, `i-close`, `i-play`, `i-pause`, `i-theme`, `i-punze` (hallmark: a shield with „LMF“), `i-rivet`, `i-star`. Use `<svg class="i" aria-hidden="true"><use href="#i-arrow-ne"/></svg>`. Accessible names come from text, never from icons.

---

## 5. Signature interactions

Every interaction lists: what it is, technique (pseudo-code level), perf budget, reduced-motion fallback, mobile, a11y. „Calm“ below means `motion.calm === true`, i.e. `prefers-reduced-motion: reduce` **or** the user pressed „Bewegung pausieren“.

### 5.1 S1: Die Esse (hero panel): repo embers + forged logo (WebGL2, hand-written) · P1 (poster P0)

**What you see.** Inside the dark framed panel: a coal bed across the lower 40%. It is made of **one ember per public repo**, x = `createdAt` (2017 left → asOf right, linear in time), y = a seeded jitter inside the bed, brightness = recency heat. So the right edge (2025/26) is visibly packed and bright. Above it, a glowing billet takes three anvil strikes (400 / 900 / 1400 ms), becomes the LMF logo, and cools through yellow → orange → cherry → dark steel with a thin temper sheen (straw → purple → blue). The pointer reheats the steel locally and throws sparks; click or tap = a strike at that point.

**Technique.**

```text
module js/gl/esse.js (lazy)          ← main.js: after load + requestIdleCallback(1500)
  gate: WebGL2 && !calm && !saveData && (deviceMemory ?? 8) >= 2 && hardwareConcurrency >= 4
  ctx = canvas.getContext("webgl2", { antialias:false, alpha:false, powerPreference:"low-power",
                                       preserveDrawingBuffer:false })
  dpr = min(devicePixelRatio, 1.5)  (mobile: 1)
  sdf  = texture("assets/img/logo-sdf.png")           // baked offline (scripts/bake-logo-sdf.mjs), R8
  heatFBO = ping-pong at ¼ res:
            if ext("EXT_color_buffer_float") || ext("EXT_color_buffer_half_float") → RG16F
            else RGBA8, heat packed in R, "was hot" memory in G (precision fine for decoration)
  embers: Float32Array(140 × 4) = [x, y, heat, seed], heat = recency(pushed, asOf):
            d = days(asOf − pushed); heat = d <= 30 ? 1 : d <= 180 ? .55 : d <= 365 ? .3 : .12
          drawn as gl.POINTS (size 3–7 px × dpr by heat), additive blend, flicker = noise(seed, t) · .15
  frame(t):
     heat' = blur5(heat) · pow(0.35, dt) + splat(pointer, r=.06, amt ∝ speed) + strikeImpulse
     composite: coalBed(fbm domain-warped, lower 40%) → embers → metal(sdf = mix(billet, logo, forgeT))
                metal emissive = blackbody(clamp(intro(t) + heat.r)) using u_ramp[6] = --heat-0..5
                temper sheen when .05 < T < .25 → mix(straw, purple, blue) at ≤ 25%
     sparks: CPU pool 384 particles (x,y,vx,vy,life,seed), v += g·dt; v *= .985
             emit 60–100 per strike, ≤ 20/frame on pointer move; gl.POINTS additive, bufferSubData
  strike(n): forgeT steps 0 → .45 → .8 → 1 (220 ms, rebound curve in JS); 1-frame additive flash
             inside the panel; ±3 px panel shake 120 ms; dispatch CustomEvent("forge:strike",{detail:{n}})
  after strike 3 + cooling (≈ 3.2 s): dispatch "esse:cooled"; sessionStorage lmf-forged = 1
  returning visit in the same session: start cooled, skip the intro
  pauses: IntersectionObserver (<5% visible) · visibilitychange · motion toggle (render 1 static frame, stop rAF)
  governor: avg frame > 22 ms over 30 frames → heat FBO ⅛, sparks 192; still slow → freeze coal fbm
  webglcontextlost → remove canvas, poster stays
```

The H1 listens for `forge:strike` detail n = 3 and runs the stamp on „Gemacht.“ (Instrument Serif Italic scales 1.04 → 1 with `--ease-rebound`, 350 ms). No layout change.

**Poster (P0).** `<picture>` with `assets/img/esse-poster.avif/webp` (the cooled logo over the ember bed, rendered by `render-poster.mjs` from our own shader using the real `repos.json`) sits under the canvas with `fetchpriority="low"`. The canvas fades in (opacity 0 → 1, 400 ms) after the first drawn frame. Until the shader exists, WP3 ships a CSS-only poster: a radial heat gradient plus the logo SVG, clearly decoration.

**Perf.** Lazy module ≤ 24 KB raw / 9 KB gz (no three.js). GPU ≤ 4 ms/frame on an M1 at 1440 × 1.5 DPR. The H1 remains the LCP element. Zero GL before `load`.

**Calm.** No module load. Poster only. „Einmal zuschlagen“ gets `hidden`. Pointer hint not rendered.

**Mobile.** Panel 4:3 below the copy; DPR 1; sparks ≤ 160; tap = strike; no shake; no hover heat.

**A11y.** Canvas `aria-hidden="true"`. The Glut caption is real text. The strike button is a real `<button>` with `aria-describedby="strike-hint"`. Nothing flashes more than 3 times per second (strikes are ≥ 500 ms apart).

### 5.2 S2: Heat grammar (plates, buttons, Glühlinie) · P1 (static glow P0)

**Heat under the hand** (`js/fx/heat.js`, one delegated `pointermove` on `document`, rAF-throttled):

```js
on pointermove(e): el = e.target.closest("[data-heat]"); if (!el) return
  r = el.getBoundingClientRect()            // cached per hovered element, invalidated on scroll/resize
  el.style.setProperty("--mx", (e.clientX - r.left) / r.width * 100 + "%")
  el.style.setProperty("--my", (e.clientY - r.top) / r.height * 100 + "%")
```

```css
[data-heat] { transition: --heat var(--d-cool) var(--ease-cool); }
[data-heat]:is(:hover, :focus-within) { --heat: 1; transition-duration: var(--d-heat-in); }
[data-heat]::after { background: radial-gradient(circle at var(--mx) var(--my),
   color-mix(in oklch, var(--heat-4) calc(var(--heat) * 40%), transparent), transparent 45%); }
.plate { border-color: color-mix(in oklch, var(--alloy) calc(var(--heat) * 100%), var(--line)); }
```

Keyboard focus sets `--heat: 1` with `--mx/--my` at 50%/40%, so focus looks like heat. The **focus ring is separate** (3 px `--focus`, 2 px offset, on the plate via `:focus-within`) and is never removed.

**Amboss-Schlag** (`js/fx/anvil.js`) on `.button`, filter chips, load-more, Probestück buttons: `:active` / `.is-struck` → `translateY(2px) scaleY(.965)` over `--d-strike`, back over `--d-rebound`. The background flashes to `--heat-4` for one frame and cools over `--d-cool`. Sparks: 6 `<i>` in one shared `aria-hidden` overlay at body root, WAAPI, 380–620 ms, cap 30 live page-wide. Sound (P2, opt-in via the omnibox command „Ton an“ only): WebAudio anvil ping (3 inharmonic partials, 380 ms decay, gain .12). Calm: colour flash only, instant; no sparks.

**Glühlinie** (2 px under the header): `@supports (animation-timeline: scroll())` animates `--page-heat` 1 → .15 (first 30%) → .05; its colour is `color-mix(in oklch, var(--heat-3) calc(var(--page-heat)*100%), var(--line))`. Without support or when calm: static at .3.

**Data glow** (P0): plates carry `data-glow="glueht|warm|abgekuehlt|fertig|ausgemustert"` → static styles (§4.2). No motion needed.

### 5.3 S3: Das Lager (archive) · P0 (+ View Transition quench P1)

**State and URL.** `{ g: "all", q: "", s: "lager", v: "regal", limit: 12 }` ↔ `?g=games&q=kniffel&s=neu&v=liste` via `history.replaceState` (keeps any `#werk/…` hash). Parsed on load. `s` ∈ `lager|neu|alt|az`. Defaults are omitted from the URL.

**Search.** `input` debounced 120 ms. `/` focuses it (unless typing in a field). `Esc` clears. Matching uses `normalize()` (§3.13) on both sides, AND across whitespace tokens. `<mark>` highlighting is built from escaped segments in title and summary.

**Filters.** Buttons with `aria-pressed` and exact names „Alle“, „Web & Apps“, „Games“, „KI“, „Film“ (tested). Each shows its live count against the current query, in a mono `<span>`. A chip with 0 gets `aria-disabled="true"` and stays focusable.

**Rendering.** `renderPlates(list)` → one `innerHTML` on `#projects-container` (strings from `js/render/plate.js`, all escaped). Plates are `<article class="project-card plate" data-heat data-glow data-alloy style="--alloy: var(--alloy-web)">` containing `<a class="project-link" href="#werk/{id}" data-project-id="{id}">`. Load-more adds 12 and moves focus to the first new plate's link (`preventScroll`).

**Quench/reheat (P1).** `motion.vt(() => render())` wraps updates in `document.startViewTransition` when supported and not calm. `view-transition-name` is set **only during the transition** (on the ≤ 24 visible plates, then cleared), never permanently. Leaving plates get `quench` (brighten, desaturate, blur 6 px, fade, 240 ms); entering plates get `reheat` (sepia-hot → normal, 520 ms). A split-flap counter animates the visual digits (`aria-hidden`); the real text is in `#project-count`.

**Prerender (P0).** `index.html` contains `<ol id="lager-static">` inside `<!-- prerender:lager -->`: every project as `<li><a href="{external link}">{title}</a> · {category} · {year} — {summary}</li>`. JS sets `hidden` on it after the interactive archive has rendered. On a data failure it stays visible.

**Perf.** Filtering 55 items: one `innerHTML`, ≤ 16 ms on a mid-range phone; INP < 150 ms. Images `loading="lazy"`, `decoding="async"`, explicit width/height, `sizes="(min-width:1024px) 30vw, (min-width:640px) 45vw, 100vw"`.

**Calm.** Instant swaps and a plain text counter.

**Mobile.** Filter chips in a horizontally scrolling row with edge fade. Search is full width and sticky under the header while `#lager` is in view. Sort + view go into a `<details>` „Mehr Optionen“. One-column plates.

**A11y.** `#project-count` `role="status"` (polite). The table has `aria-sort` on the active column. Plates are links (they navigate to a URL state); filters and view toggles are buttons. The chip for the active filter has `aria-pressed="true"`.

### 5.4 S4: Werkbank (deep dive), Punze and the morph · P0 (+ VT morph P1)

**Router** (`js/lib/router.js`, lead-owned):

```js
routes: /^#werk\/([a-z0-9-]+)$/ → open(id); anything else → close()
open from UI:  the link's href is "#werk/id" → hashchange → router.open(id, { from: trigger })
               pushed = true (a new history entry by the browser)
close:         if (pushed) history.back() else history.replaceState(null, "", location.pathname + location.search + "#lager")
prev/next:     location.replace("#werk/" + nextId)       // no history spam; Back still closes
direct load:   after data ready, if hash matches → open; unknown id → announce (§2.11), replaceState to #lager
```

**Open sequence** (`js/werkbank/werkbank.js`):

```js
async function open(id, trigger) {
  const [p, d] = [projects.get(id), await details.get(id)]      // details prefetched on hover/focus
  const media = trigger?.querySelector(".plate-media")
  const swap = () => { render(p, d); dialog.showModal(); focusClose(); }
  if (media && !calm && document.startViewTransition) {
    media.style.viewTransitionName = "werk-hero"
    const vt = document.startViewTransition(() => { media.style.viewTransitionName = ""; swap() })
    // never await vt.finished before the dialog is usable
  } else swap()
}
```

The dialog hero carries `view-transition-name: werk-hero` only while opening/closing. Fallback: `dialog[open]` with `@starting-style { opacity: 0; translate: 0 12px }` and `transition: opacity .24s, translate .24s, overlay .24s allow-discrete, display .24s allow-discrete`. Calm: 120 ms opacity or none.

**Focus.** On open, focus `#close-modal`. The native modal makes the page inert. Keep an explicit Tab wrap (first ↔ last focusable inside `#werkbank`) because browsers differ at the dialog edge. `Esc` → `cancel` → router close → focus returns to the trigger (or to the matching plate in `#lager`, re-rendered if needed; or to the `#lager` heading on a direct load). `←/→` = prev/next when focus is not in a text field or a Probestück stage. Prev/next order = the current Lager result order if opened from the Lager, the chapter order if opened from a chapter, else JSON order.

**Punze** (`js/werkbank/punze.js`): a button „Gepunzt · {n} Quellen“ with `popovertarget`. It opens a native `popover` (fallback: `<details>`) titled „Woher ich das weiß“ with an `<ol>` of `{label} · geprüft am {dd.mm.yyyy} ↗` and the line „Alles hier ist belegt. Wenn was nicht stimmt, sag Bescheid.“ + mailto. Each spec-sheet value carries `<sup><a href="#src-{id}-{n}">{n}</a></sup>` pointing at the footer list (the same list, always in the DOM). The same component is reused on chapter spec sheets and partner cards.

**Language bar** (`js/werkbank/languages.js`): a horizontal stacked bar (`aria-hidden`) from `details.languages`; < 2% grouped as „Rest“; fixed 6-step colour scale derived from the alloy colours at different lightness (all as fills, no text on them). The adjacent real `<ul>` lists „TypeScript 54,7 %“ etc. (German decimal comma via `Intl.NumberFormat("de-DE")`).

**YouTube facade** (`js/werkbank/facade.js`): poster (the project image) + button „Film abspielen (lädt YouTube)“ + DSGVO note. On click → `<iframe src="https://www.youtube-nocookie.com/embed/{id}?autoplay=1&rel=0" title="{realTitle} auf YouTube" allow="autoplay; encrypted-media; picture-in-picture; fullscreen">` in a 16:9 box (9:16 for `aspect: "9:16"`, max-height 80vh). Focus moves into the iframe. Playlists (Selantis) link out only. **Zero requests to YouTube, Google or ytimg before the click** (tested).

**Live preview (P2)** (`js/werkbank/live-frame.js`): only for `project.embed.verifiedAt`. Poster + „Live laden ▶“ (games: „Hier spielen ▶“). Then an iframe (`sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock"`, title „{title}, Live-Version“), unloaded (`src = "about:blank"`, removed) on close or when scrolled out, followed by a button „Fokus aus dem Spiel holen“.

**Details prefetch.** `pointerenter`/`focusin` on a plate → `fetch("data/details/{id}.json", { priority: "low" })` into a Map cache. On open, the title/summary/image render immediately and the story renders when the JSON resolves (no spinner; blocks just appear).

**Mobile.** Full-screen sheet; the sticky bottom bar `[← Voriges] [Schließen] [Nächstes →]` with 48 px targets; the spec sheet moves below the story as a `<details open>` „Werkstattdaten“; the media strip is native horizontal scroll.

**A11y.** `aria-labelledby="modal-title"`. The H2 has `tabindex="-1"` for programmatic focus if needed. External links carry the SR suffix. The Punze popover is reachable by keyboard and closes with `Esc`. `document.title` updates.

### 5.5 S5: Noch warm rail · P0

`js/sections/warm.js`: the top 8 by `repo.pushedAt`. Native `overflow-x: auto; scroll-snap-type: x mandatory`. Visible `‹ ›` buttons call `scrollBy({ left: ±0.9 × clientWidth, behavior: calm ? "auto" : "smooth" })`. The region has `role="region"`, `aria-label="Zuletzt bearbeitet"`, `tabindex="0"`. Plates reuse `render/plate.js` with `variant: "rail"` (85% width on mobile).

### 5.6 S6: Meisterstücke chapters · P0 (layout + static media) / P1 (probes)

`js/sections/meister.js` binds `chapters.json` to the static chapter markup: Werkstattdaten (reusing the Werkbank spec-sheet renderer from `js/render/specsheet.js`, owned by WP2), highlights, Punze, and the probe mount. Probes mount when the stage is within 1 viewport (IntersectionObserver `rootMargin: "100% 0px"`) and unmount (destroy) when > 2 viewports away. Without JS or before the probe loads, the stage shows the project image with the chip „Probestück braucht JavaScript“.

The **Kolpingtheater universe** (Kapitel I) is an inline SVG constellation rendered by `js/sections/universe.js` from `universe.json`: the centre node „Kolpingtheater Ramsen“ and 4 arcs (Web, Werkzeuge, Spiele, Film), each node a real `<a>` (to `#werk/<id>` or the external URL) positioned on the arc. Under 640 px it becomes a grouped list. Node count is computed: „{n} Sachen für eine Theatergruppe“.

### 5.7 S7: Probestücke (toys)

Registry and API (`js/probes/index.js`, WP4):

```js
export const PROBE_IDS = ["bomberman-chain", "melodai-mixer", "theatermon-types", "transcripator-pow", "beatguessr-years"];
const REGISTRY = {
  "bomberman-chain":   { kind: "nachbau", load: () => import("./bomberman.js") },
  "melodai-mixer":     { kind: "nachbau", load: () => import("./mixer.js") },
  "theatermon-types":  { kind: "echt",    load: () => import("./typenrad.js") },
  "transcripator-pow": { kind: "echt",    load: () => import("./hashsuche.js") },
  "beatguessr-years":  { kind: "echt",    load: () => import("./jahresregler.js") },   // P2
};
export async function mountProbe(stage, id, ctx /* {calm, announce, signal} */) {
  const { mount } = await REGISTRY[id].load();
  return mount(stage, ctx);            // → { destroy(), pause(), resume() }
}
```

Common rules: every probe has a visible chip (`Nachbau`/`Echt`) with its explanation sentence; a toolbar of real `<button>`s; keyboard capture **only while the stage has focus**; `Esc` blurs the stage back to its wrapper; `Tab` always leaves; announcements through `ctx.announce` (polite, throttled ≥ 800 ms); `pause()` on the motion toggle; no autoplay sound, ever; attract modes run once and only when not calm.

#### 5.7a Kettenreaktion (Bomberman) · Nachbau · P1

Sources for the mechanics: README `LoggeL/bomberman-web` (15×13 arenas, bricks blow apart, a blast that touches a bomb detonates it „within the same tick“).

```js
grid = Uint8Array(15*13)       // 0 floor, 1 solid (border ring + odd/odd pillars), 2 brick (seeded mulberry32, ~48%, 3×3 clear centre)
bombs = Map<cell, {fuseAt, range: 2}>        // max 12, fuse 1400 ms
tick (fixed 60 Hz accumulator):
  queue = bombs whose fuseAt <= now
  chain = 0
  while (queue.length):                       // SAME TICK resolution
    b = queue.pop(); chain++; bombs.delete(b.cell)
    for dir of 4: for k in 1..range:
      c = step(b.cell, dir, k); if solid(c) break
      flame[c] = now + 380
      if brick(c) { grid[c] = 0; bricks++; break }
      if bombs.has(c) queue.push(bombs.get(c))
  if (chain) readout("Kette: " + chain), best → localStorage "lmf-bomb-best" (try/catch)
render: Canvas 2D, cellPx = floor(min(w/15, h/13)), DPR ≤ 2; arcade palette
        (bg #0D0B1A, text #F3EEE7 16.85:1, magenta #FF3EA5 6.0:1, cyan #34F5FF 14.49:1)
input:  pointerdown → cell → place bomb; keyboard on the focused stage: arrows move the cursor,
        Space/Enter place, Z = „Alles zünden“, R = „Neues Feld“, Esc = leave
toolbar: [Neues Feld] [Alles zünden]      readout (mono): Kette: {n} · Rekord: {best}
announce: „Bombe auf Feld C4.“ · „Kettenreaktion: 4 Bomben, 7 Mauern weg.“
attract: once at ≥ 60% visible: 3 bombs in a row, chain of 3, reset after 1.2 s; any input cancels
```

Stage: `tabindex="0"`, `role="application"`, `aria-roledescription="Spielfeld"`, `aria-label="Bomberman-Nachbau, 15 mal 13 Felder"`, `aria-describedby` → the how-to line „Feld antippen oder mit Pfeiltasten wählen · Leertaste legt eine Bombe · Z zündet alles · Esc: raus“. Calm: no shake, no particles, flames as a static cross for 380 ms, fuse as a numeric countdown ring. Mobile: stage 15:13 at full width, tap to place, toolbar buttons 48 px. Budget ≤ 9 KB gz, ≤ 2 ms/frame.

#### 5.7b Zwei Regler (MelodAI) · Nachbau · P1

Sources: README `LoggeL/MelodAI` (Web Audio API with two GainNodes; word-level karaoke highlighting). **Lyrics are verbatim lines from this site's existing copy only**:

```js
const LINES = [
  "Aus Neugier. Gemacht.",
  "Ich wollte wissen, ob das geht.",
  "So fangen ziemlich viele meiner Projekte an.",
  "Ein paar offene Tabs später …",
];  // words timed at 96 BPM, one word per beat; timing table in the module
```

- Words are `<span class="w">` with a two-stop `background-clip: text` gradient; a word's sweep runs via WAAPI `backgroundPosition 100% → 0%` over its duration. The clock is `performance.now()`, or `AudioContext.currentTime` when sound is on.
- Faders: native `<input type="range">` „Gesang“ and „Instrumental“ (0–100, `aria-valuetext="{n} Prozent"`). Vertical on desktop (`writing-mode: vertical-lr; direction: rtl`).
- Gesang at 0: the current line turns to outline text and the caption „Jetzt du.“ appears.
- **Ton (opt-in button, `aria-pressed`, never autoplay):** creates an `AudioContext` on first press. Two **original synthesized** stems: Instrumental = a triangle bass on roots + a square-wave pad through a 1.2 kHz lowpass; Gesang = a sine lead with vibrato, one note per word from a C-major pentatonic table. Each stem → its own `GainNode` ← its fader → a master gain of .15. Two `AnalyserNode`s draw the stem waveforms; when sound is off, precomputed envelopes are used.
- Controls: `Play/Pause` (`aria-pressed`), `Von vorn`. Space toggles play while the stage has focus.
- Calm: no sweep (words switch colour instantly at their start), no line translate, static waveforms. Mobile: faders horizontal under the lyrics. Budget ≤ 7 KB gz.

#### 5.7c Typenrad (Theatermon) + Universe · Echt · P1

Runs the **real** `typeEff()` from `theatermon/js/data.js` (copied verbatim, §3.11). UI: two radio groups „Angriff“ and „Verteidigung“ with the five types (Schauspiel, Technik, Kostüm, Regie, Website), and a result in Instrument Serif „×1,6 — Technik schlägt Schauspiel.“ The text for each multiplier is generated from the function's output: 1.6 „sehr effektiv“, 0.65 „kaum effektiv“, 1.25 / 1.15 „Glaskanone“ (from the source comment „Regie & Website: Glass Cannon“), 1 „neutral“. A small SVG ring shows the 3-cycle Technik → Schauspiel → Kostüm → Technik. Chip text: „Echt: dieselbe Typen-Regel wie im Spiel (js/data.js).“ Fully keyboard-native (radios). No motion except the result stamp. Budget ≤ 3 KB gz.

#### 5.7d Hashsuche (Transcripator) · Echt · P1 (Werkbank only)

Source: README TranscripatorWeb (the browser searches for a nonce until the SHA-256 hash starts with four zeros, about 65,000 tries on average; the server checks it with one hash).

```js
// js/probes/hash-worker.js
onmessage = async ({ data: { challenge, zeros } }) => {
  const enc = new TextEncoder(); let nonce = 0, t0 = performance.now()
  for (;;) {
    const h = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(challenge + ":" + nonce)))
    const hex = [...h].map(b => b.toString(16).padStart(2, "0")).join("")
    if (hex.startsWith("0".repeat(zeros))) return postMessage({ done: true, nonce, hex, ms: performance.now() - t0 })
    if (++nonce % 2048 === 0) postMessage({ nonce, hex })          // progress, ~20 updates/s max
  }
}
```

UI: button „Rechnen lassen“, a live mono readout `Versuch 18.432 · 3f9a…` (updated at ≤ 10 Hz, `aria-hidden`), and a result announced once: „Gefunden nach {n} Versuchen in {s} Sekunden: 0000…“. Chip text: „Echt: Dein Browser rechnet gerade wirklich. Wie im Transcripator, nur prüft hier kein Server.“ Challenge = `crypto.getRandomValues` hex. A `data-zeros` attribute (default 4) lets tests use 2. Cancel button; the worker is terminated on destroy. Calm: identical (no animation involved). Budget ≤ 2 KB gz.

#### 5.7e Jahresregler (BeatGuessr) · Echt (Daten) · P2

A range input 1960–2025 over `data/probes/beatguessr.json`: shows the year's German context label in Instrument Serif („1963 · Beatlemania“), two example songs in mono, and a decade colour band. The Werkbank Randnotiz carries the Christmas-night origin. Chip: „Echt: die Jahre und Etiketten aus dem Spiel ({n} Songs).“ No audio, no covers.

### 5.8 S8: Projektor (Kapitel IV) · P0 (static gate) / P1 (GL)

**Layout.** A `.screen` block. Left: the **gate** (16:9 still, or a 9:16 frame for Portes du Soleil with the landscape still centre-cropped) with the facade button. Right (below on mobile): the **reel**, a vertical list of 7 buttons (`aria-pressed`) with year, place and duration in mono, and an edge-code strip `LMF ▸ {yy} ▸ {nn}` (decorative). Under the gate: the verbatim YouTube quote in Instrument Serif Italic with the mono label „Beschreibung auf YouTube“.

**Switching.** Clicking a reel entry swaps the gate: a 2-frame **pull-down** (content moves 6% up in `steps(6)`, 250 ms, no flash) via WAAPI, or a VT scoped to `view-transition-name: gate-still` when supported. The new still is decoded first (`img.decode()`).

**GL (P1)** (`js/gl/projector.js`, WebGL1, ≤ 5 KB gz): full-screen triangle over the current still texture. Uniforms `uTex, uFrame` (integer at 24 fps, i.e. the „projector clock“), `uWeave` (vec2, 0.5 px low-frequency noise), `uFlicker` (.97–1.03), `uGrade` (alloy-film). Grain = `hash12(gl_FragCoord.xy + uFrame*17.)` in overlay, halation = 5-tap bright-pass tinted `#FF4A1C`, vignette. The loop draws only when `floor(t*24)` changes; it pauses when < 10% visible, when the tab is hidden, and when calm (then one static grain frame). It is gated like the Esse (plus `hardwareConcurrency ≥ 4`). Without GL, a CSS grain tile (128 × 128 noise generated once on a 2D canvas) animates with `steps(6)` background-position at 12 fps, or stays static when calm.

**A11y.** The reel is a list of buttons with accessible names „{title}, {year}, {duration}“. The gate canvas is `aria-hidden`; the still `<img>` has alt text; the quote is real text. Mobile: the reel becomes a horizontal snap row above the gate; the 9:16 frame is max-height 70svh.

### 5.9 S9: Nachtuhr (Abseits teaser) · P1 (static contact sheet P0)

An SVG arc from 20:00 to 02:00 (6 h = 180°). Each of the 77 photos is a tick at its filename time. Tick length = the photo's night index (17 rings, inner = first night). Hover or focus on a tick (roving tabindex over the tick group, arrow keys step chronologically) shows the `small/*.webp` thumbnail in a fixed preview well beside the arc, with the mono caption `Nacht {nn} · {dd.mm.yyyy} · {hh:mm}`. Enter opens `gallery/#foto-{nn}`. P0 fallback (and no-JS, and < 640 px): a 12-frame contact sheet strip (`<a>` to the large JPGs) with frame numbers and times, prerendered via `<!-- prerender:abseits -->`. Calm: the preview swaps without fade. Budget ≤ 3 KB gz; thumbnails loaded on first interaction only.

### 5.10 S10: Werkzeugwand · P0

Count canonical tools across `details.stack` (fallback `tags`) with a normalize map (`nextjs|next.js|next.js 1x → Next.js`, `typescript → TypeScript`, `javascript (vanilla)|vanilla js|javascript → JavaScript`, `three.js|three.js 0.x|three.js (importmap) → Three.js`, `react|react 18|react 19 → React`, `sqlite|sqlite (…) → SQLite`, `tailwind css|tailwind css v4|tailwindcss → Tailwind CSS`, `python|python 3.12 → Python`, `flask|flask + flask-socketio → Flask`, `web audio|web audio api|webaudio → Web Audio`, `docker|docker compose → Docker`, `github pages → GitHub Pages`, `canvas → Canvas`, `vite|vite 6 → Vite`, `node.js|node.js 24|node → Node.js`; unknown strings kept as written). Show the top 18 as hanging tags `{Tool} ×{count}`. Click → dispatch `lmf:filter {q: tool}` → Lager sets search, updates the URL, scrolls to `#lager` (instant when calm), and announces the result count. Hover heat applies. Keyboard: tags are buttons.

### 5.11 S11: Abspann (generated credits) · P1 (static columns P0)

`js/render/credits.js` (pure) builds the blocks in §2.7 from data. It is prerendered into `<!-- prerender:abspann -->` as two static columns. On desktop, when not calm, a gentle crawl: the section is `height: calc(var(--credits-h) * 1.4)`, the inner viewport is sticky 100svh with a mask fade, and the roll translates by `--p` (scroll-driven with a JS `--p` fallback). That is ~0.7× scroll speed, fully user-controlled, and **not pinned below 1024 px**. Calm/mobile: static columns.

### 5.12 S12: Omnibox (⌘K / Strg+K) · P2

`<dialog id="omnibox">` with an ARIA 1.2 combobox + grouped listbox (Projekte, Abschnitte, Filter, Aktionen), using the shared `normalize()`/score. Enter opens `#werk/<id>`; Alt+Enter opens the external link. Actions: „Gehe zu …“ (sections), „Nur Games zeigen“ etc., „Dunkles/Helles Design“, „Bewegung pausieren“, „Auf gut Glück“ (random project), „Link zu dieser Ansicht kopieren“, „Mail an Logge“. Hidden: „sudo“ → „Netter Versuch.“, „zuschlagen“ → one strike. The shortcut is ignored in inputs. `/` stays bound to the Lager search.

---

## 6. File and module architecture

### 6.1 Tree (ownership in brackets)

```
index.html                         [LEAD]  static skeleton, all copy from §2, mounts, prerender markers, icon sprite
404.html                           [LEAD]
site.webmanifest                   [LEAD]  theme/background colors → new tokens
css/
  tokens.css                       [LEAD]  @font-face, colours (3 scopes), type, space, motion, @property
  base.css                         [LEAD]  @layer reset, base, layout (.shell, grid), header/nav/footer,
                                           buttons, chips, stamp row, focus, utilities, calm gating, forced-colors
  fx.css                           [WP3]   heat, anvil sparks, Glühlinie, grain tile
  sections/esse.css                [WP3]
  sections/film.css                [WP3]   Kapitel IV + projector gate
  sections/warm.css                [WP2]
  sections/lager.css               [WP2]   plates, Rohlinge, table, toolbar, legend
  werkbank.css                     [WP2]   dialog, Punze popover, language bar, facade (lazy <link> on first idle)
  sections/meister.css             [WP4]   chapters I–III, Zwischenstück, universe
  probes.css                       [WP4]   all probe stages (lazy with the first probe)
  sections/schichtbuch.css         [WP5]
  sections/werkstatt.css           [WP5]   about, Knöpfe, Bühne, Werkzeugwand, Zunft, Abspann
  sections/abseits.css             [WP5]
  sections/kontakt.css             [WP5]
js/
  main.js                          [LEAD]  boot, section registry, lazy scheduling, data-bind refresh
  projects.js                      [WP2]   compat: re-exports escapeHtml, safeUrl, filterProjects (signature unchanged)
  lib/dom.js                       [LEAD]  $, $$, html`` (auto-escape), raw(), on()
  lib/motion.js                    [LEAD]  calm signal (reduced || paused), vt(fn), onCalmChange
  lib/router.js                    [LEAD]  #werk/<id> routing (§5.4)
  lib/format.js                    [LEAD]  dates (de-DE), numbers, durations, ordinal night labels
  lib/storage.js                   [LEAD]  try/catch local/sessionStorage
  lib/announce.js                  [LEAD]  polite/assertive live regions, throttle
  lib/palette.js                   [LEAD]  heat ramp + alloy colours as JS arrays (for GL/SVG)
  lib/data.js                      [WP1]   fetch all data files (allSettled), merge, cache details
  lib/derive.js                    [WP1]   pure: alloyOf, glowOf, stockNo, normalize, haystack, reposByYear, nights, bindings
  lib/search.js                    [WP2]   pure: filterProjects, score, highlight
  shell/theme.js  shell/nav.js  shell/motion-toggle.js   [LEAD]
  render/plate.js  render/lager-static.js  render/specsheet.js   [WP2]  pure string renderers
  render/schichtbuch-static.js  render/credits.js  render/abseits-static.js   [WP5]  pure
  sections/warm.js  sections/lager.js                            [WP2]
  werkbank/werkbank.js  werkbank/punze.js  werkbank/languages.js  werkbank/facade.js  werkbank/live-frame.js (P2)  [WP2]
  omnibox.js (P2)                                                [WP2]
  sections/esse.js  sections/film.js                             [WP3]
  gl/gl.js  gl/esse.js  gl/embers.js  gl/sparks.js  gl/shaders.js  gl/projector.js   [WP3]
  fx/heat.js  fx/anvil.js  fx/grain.js                           [WP3]
  sections/meister.js  sections/universe.js                      [WP4]
  probes/index.js  probes/bomberman.js  probes/mixer.js  probes/typenrad.js  probes/theatermon-rules.js
  probes/hashsuche.js  probes/hash-worker.js  probes/jahresregler.js (P2)   [WP4]
  sections/schichtbuch.js  sections/zeitraffer.js  sections/werkstatt.js  sections/abspann.js
  sections/abseits.js  sections/kontakt.js                       [WP5]
data/
  projects.json  partners.json  socials.json                     [WP1]
  details/<id>.json  films.json  repos.json  snapshot.json  milestones.json  chapters.json  universe.json  [WP1]
  probes/beatguessr.json (P2)                                    [WP1 generates, WP4 consumes]
assets/
  fonts/*  (4 woff2 + OFL)                                       [WP1]
  img/logo-sdf.png  esse-poster.{avif,webp}  esse-og.jpg         [WP3]
  img/Skiing2023.webp                                            [WP1]
gallery/index.html  gallery/css/gallery.css                      [WP5]
scripts/*.mjs                                                    [WP1] except render-poster.mjs, bake-logo-sdf.mjs [WP3], build-gallery.mjs [WP5]
scripts/order.json  scripts/repo-allowlist.json                  [WP1]
tests/contract.spec.js                                           [LEAD]  the stable contract (§7.1)
tests/lager.spec.js  tests/werkbank.spec.js                      [WP2]
tests/fire.spec.js                                               [WP3]
tests/probes.spec.js                                             [WP4]
tests/chronik.spec.js  tests/gallery.spec.js                     [WP5]
tests/data.spec.js                                               [WP1]  no-JS, data failure, privacy/network, budgets
tests/portfolio.spec.js                                          [LEAD]  deleted after contract.spec.js is green (its cases move there)
docs/content-sources.md  README.md                               [WP1]
```

### 6.2 Contracts (frozen on day 1 by the lead; changes need a lead-reviewed PR)

**Section module API.**

```js
// js/sections/<name>.js
export async function mount(root /* the <section> */, ctx) { … return { destroy() {} } }
// ctx = { data /* Promise<Data> */, router, motion, announce, bus: document, storage, format }
```

`main.js` mounts `lager` and the Werkbank router **eagerly** (after data), `warm` eagerly, `esse` on idle, and everything else via IntersectionObserver (`rootMargin: "100% 0px"`); a section that is not on screen yet waits for `load` + idle. Section CSS is not render-blocking: `main.js` injects it (see §8) and mounts a section only after its sheets arrived; `werkbank.css` and `probes.css` are injected on first idle.

**Data object** (from `lib/data.js`):

```js
Data = { snapshot, projects: Project[], byId: Map, films: Map, repos: Repo[], milestones, chapters,
         universe, partners, socials, bindings: Record<string,string|number>,
         details: { get(id): Promise<Details|null>, prefetch(id) } }
```

A failure in any single file sets that key to `null`, and its consumers omit their UI. Only `projects` failing triggers the Lager error state.

**Events** (on `document`):

| Event | Detail | Emitted by → consumed by |
|---|---|---|
| `lmf:filter` | `{ q?, g? }` | Werkzeugwand, Werkbank stack chips, omnibox, chapter „Alle Filme“ → Lager |
| `lmf:open` | `{ id, from? }` | any → router (normally just set the hash) |
| `lmf:calm` | `{ calm }` | motion.js → every animated module |
| `forge:strike` | `{ n }` | gl/esse.js → hero H1 |
| `esse:cooled` | – | gl/esse.js → render-poster script |

**Pure renderers.** Every `js/render/*.js` exports `(data, opts) => string`, imports nothing that touches `window`/`document`, and escapes all interpolations via `html```. `scripts/prerender.mjs` imports them in Node; runtime modules import the same functions.

**Prerender markers in `index.html`:** `lager`, `schichtbuch-table`, `abspann`, `abseits`, plus every `data-bind` span. Only `scripts/prerender.mjs` writes inside markers. Nobody hand-edits them.

**CSS conventions.** `@layer reset, tokens, base, sections, fx, utilities;`. Section CSS is scoped under its section id (`#lager …`) or a BEM block prefix unique to the owner (`.plate`, `.wb-`, `.probe-`, `.zr-` for Zeitraffer, `.esse-`). Only tokens from `tokens.css`; no raw hex outside `tokens.css`, `probes.css` (toy worlds, AA-checked, listed in §4.2/§5.7a) and GLSL.

**DOM hooks for tests** are listed in §7.1 and must not be renamed.

### 6.3 Work packages

**WP0 · Lead (foundation, integration, contract)**
- Files: see [LEAD] above.
- Day 1 deliverables: `index.html` with every section shell, **all copy from §2** in place, mount points, prerender markers (empty), icon sprite, alias anchors; `tokens.css`, `base.css`; `lib/*`, `shell/*`, `main.js` with the registry and stub mounts; `contract.spec.js` skeleton; this contract (§6.2) as JSDoc in `main.js`.
- Also: header/nav/theme/motion toggle, footer, 404, manifest, review of every PR that touches a contract.
- Acceptance: header works at 320–1440 in both themes; `#motion-toggle` persists and sets `html[data-motion]`; the theme boot script follows the system without a stored value; every section renders its static copy without JS; the axe run on the static skeleton is clean; `contract.spec.js` passes against stubs.

**WP1 · Data, content and tooling**
- Files: [WP1] above.
- Tasks: apply §3.2 fixes; `import-research.mjs`; `snapshot-github.mjs`; the new data files; the 15 new projects + `skiing-2023` + screenshot swaps; `derive.js`, `data.js`; `prerender.mjs`; `validate.mjs` (all rules §3.15); fonts download + OFL; delete `avifenc.exe`; report unreferenced PNGs; `strip-gps.mjs` (run after approval); update `docs/content-sources.md` (one row per new project, screenshot origin incl. the Arcanum overlay note, AI-generated Infected Origins images, YouTube thumbnail for Ski 2023, fonts) and `README.md` (new structure, scripts, schema).
- Acceptance: `npm run check` green; `projects.length === 55`; `reposByYear` matches the gh output; no validate denylist hits; `data.spec.js` green (no-JS list with 55 items and external links, data failure path, zero third-party requests before interaction, budgets).

**WP2 · Lager, Noch warm, Werkbank (+ omnibox P2)**
- Files: [WP2] above.
- Acceptance: all Lager behaviours in §5.3 including URL round-trip and list view; plates render every field combination (with/without image, repo, year, glow); Werkbank renders every block conditionally for all 55 projects without console errors; Punze on every project with ≥ 1 source; film facade makes zero YouTube requests before the click; focus trap and restore; prev/next; direct deep link; unknown id; `lager.spec.js` + `werkbank.spec.js` green; axe clean with the dialog open in both themes.

**WP3 · Fire: Esse hero, heat grammar, projector**
- Files: [WP3] above.
- Acceptance: the poster is shown with no GL request under calm, reduced data or no WebGL2; GL loads only after `load` + idle; RG16F → RGBA8 fallback verified by stubbing the extensions; ≤ 24 KB raw GL module; context-loss recovery to the poster; strike button hidden when calm; the motion toggle stops the rAF (0 frames drawn over 2 s, asserted via a debug counter on `window.__lmfFrames` in test mode); Kapitel IV works with GL off (static gate + CSS grain); `fire.spec.js` green; the LCP element is the H1.

**WP4 · Meisterstücke I–III, Zwischenstück, Probestücke**
- Files: [WP4] above.
- Acceptance: chapters bind `chapters.json` and hide gracefully without details; the universe renders all nodes with working links (list under 640 px); each probe is keyboard-playable, leaves with Tab/Esc, has its chip text, and destroys cleanly (no timers, workers or AudioContext left: assert via probe `destroy()` return + `performance`/worker tracking in tests); Bomberman chains in the same tick (unit-tested pure function `resolveTick`); the mixer makes no sound until „Ton an“; `typeEff` output matches the source for all 25 pairs; the hash search really finds a `0000…` hash; `probes.spec.js` green; probe JS total ≤ 22 KB gz, each lazy (plus the MelodAI singer, `js/probes/singer.js` ≤ 6 KB gz on its own budget: fetched only after the explicit „Ton an“ opt-in, never on page load or probe mount).

**WP5 · Schichtbuch, Werkstatt, Abseits, Kontakt, Galerie**
- Files: [WP5] above.
- Acceptance: the Zeitraffer renders all repos (named only when allowlisted) with roving tabindex; the list view is the default < 1024 px and when calm; per-year counts equal `reposByYear`; milestones all carry source links; Werkzeugwand counts equal a Node reference computation and clicking filters the Lager; Abspann generated with all blocks; the Nachtuhr is keyboard-navigable, with the contact sheet as fallback; Kontakt links from `socials.json`; the gallery is regenerated with night groups and stays JS-free with 77 links; `chronik.spec.js` + `gallery.spec.js` green.

### 6.4 Zeitraffer layout algorithm (WP5, §2.6)

```js
years = 2014..year(asOf); counts = reposByYear (2014–2016 = 0 → still drawn, milestones live there)
yearWidth(y) = 120 + 14 * counts[y]                        // px at desktop; ×0.7 at 640–1023
x(date) = offset(year) + (dayOfYear / daysInYear) * yearWidth(year)   // linear inside the year
lanes = ["Marker","Portfolio","Glut"]   (fix round 3: no per-language lanes, no lane counts)
every repo → the unlabelled "Glut" row
packing per lane: greedy interval packing with clip width 8 px + 2 px gap → sub-rows; lane height = rows × 12 px
Portfolio lane: repos with an id → labelled clips (title, 140 px wide, thumbnail 40×25), link #werk/<id>
Marker lane: milestones.json as flags (film = alloy-film, code = accent), link to source
ruler: year segments with count „{yyyy} · {n}“ and a heat bar (width ∝ count, colour by heat ramp)
DOM: <div class="zr" role="group" aria-label="Zeitraffer, öffentliche Repos nach Datum"> (no role=application)
     one roving tab stop; ←/→ next/prev clip in time; ↑/↓ lane; Home/End; Enter = open;
     the focused clip is scrolled into view (native smooth unless calm); tooltip role="tooltip" via aria-describedby
container: overflow-x: auto; year chips above („2014 … 2026“) scroll to the year; drag-to-pan with pointer: fine
„Zeitraffer abspielen“ (P2, not calm): scrollLeft animates 0 → max over 12 s; counters tick; any input stops it
list view: per year <h3>{yyyy} · {n} Repos</h3> + <table> Datum · Repo (or „öffentliches Repo“) · Sprache
```

---

## 7. Testing

### 7.1 Stable test contract (DOM + behaviour)

| Hook | Contract |
|---|---|
| `#project-count` | `role="status"`; text `"{visible} von {matching} Projekten"`; on data failure contains „nicht geladen“ |
| `#project-search` | `type="search"`, accessible name „Projekte durchsuchen“ |
| `[data-filter]` | 5 buttons, names exactly „Alle“ (+count), „Web & Apps“, „Games“, „KI“, „Film“, `aria-pressed` |
| `#projects-container .project-card` | one per visible plate; each contains `a.project-link[href="#werk/{id}"][data-project-id="{id}"]` |
| `#load-more` | „Mehr entdecken“; batch 12; focus → first new `.project-link`; hidden when all shown |
| `#empty-state` / `#reset-filters` | „Alle Projekte anzeigen“ resets filter, query, sort and focuses „Alle“ |
| `#sort`, `[data-view="regal"|"liste"]` | native select; view toggle buttons with `aria-pressed` |
| `#lager-static` | prerendered `<ol>` with all projects, external links; `hidden` after JS render |
| `#werkbank` | `<dialog>`; `#close-modal`, `#modal-title` (h2), `#modal-link` (primary external CTA) inside |
| chapter triggers | `#meisterstuecke [data-project-id="{id}"]` links for bomberman-web, melodai, theater-website |
| `#menu-toggle` / `#navigation` | „Menü“; Escape closes and restores focus |
| `#theme-toggle` | „Dunkles/Helles Design aktivieren“; `localStorage lmf-theme`; `html[data-theme]` |
| `#motion-toggle` | name „Bewegung pausieren“ (constant) + `aria-pressed`; title „Bewegung fortsetzen“ while paused; `lmf-motion`; `html[data-motion="paused"]` |
| `.contact-mail` | visible, `mailto:hyper.xjo@gmail.com` |
| gallery | h1 „Abseits der Tabs.“; `.photo-grid a` × 77; first href `assets/img/large/IMG_20200924_233029.jpg` |

### 7.2 Existing tests: keep or adapt (they move into `tests/contract.spec.js`)

| Existing test | Change |
|---|---|
| archive search, combined filters, empty recovery and pagination | `ready()` waits for „12 von 55 Projekten“. Load-more → 24 plates, focus on `.project-card:nth(12) .project-link`. Film + „Infected“ → 2. + Games → `#empty-state` visible. Reset → 12. 4 × load-more → 55 and `#load-more` hidden. Every plate image resolves (`complete && naturalWidth > 0`), including `spyfall.webp`. |
| dialog traps focus, closes with Escape and restores the trigger | Trigger `#meisterstuecke [data-project-id="bomberman-web"]`. After click: URL hash `#werk/bomberman-web`, `#werkbank` open, `#modal-link` href `https://loggel.github.io/bomberman-web/`, focus on `#close-modal`. Shift+Tab → `document.activeElement.closest("#werkbank")` is not null. Tab from the last focusable → `#close-modal`. Escape → dialog closed, trigger focused, hash no longer `#werk/…`. |
| mobile menu, theme persistence, layout and reduced motion | Unchanged steps. Add: motion toggle persists over reload. Overflow check at 320/375/390/768/1024/1440 in **both** themes and once with the Werkbank open. |
| data failure leaves contact and GitHub recovery available | Unchanged assertions (`#project-count` contains „nicht geladen“, `#projects-container a` → GitHub, `.contact-mail` visible). Add: `#lager-static li` count 55 and visible. |
| accessibility and rendering in {theme} theme | Unchanged, with the second axe pass after opening `#meisterstuecke [data-project-id="melodai"]`. Add a third pass with the Punze popover open. `pageerror` list stays empty. |
| gallery works without JavaScript | Unchanged, plus night headings present (`h2` count = `gallery.nights`). |

### 7.3 New tests

**lager.spec.js (WP2)**
- URL round-trip: set `?g=film&q=ski&s=neu&v=liste`, reload → same state, table visible, rows sorted by date.
- Sort options change order as specified; `aria-sort` on the table header.
- `/` focuses search (not while typing in another input); Esc clears.
- Chip counts update with the query; a zero chip has `aria-disabled`.
- Normalization: „kolping“ finds theater-website; „oilberts“ finds oilbert; „ubersee“-style umlaut folding works on a fixture.
- Werkzeugwand click „Three.js“ → Lager query „Three.js“, URL updated, result count announced.

**werkbank.spec.js (WP2)**
- Direct load `/#werk/infected` opens after data. Back closes. `←/→` switch via replaceState and Back still closes.
- Unknown id `/#werk/nope` → status text „Dieses Projekt gibt's hier nicht (mehr).“, dialog closed.
- Film facade: no request matching `/youtube|ytimg|google/` until the click, then an iframe with a title.
- Punze lists ≥ 1 source with „geprüft am“ for every project that has details (iterate all 55 via hash).
- Every `dd` in Werkstattdaten except „Stand“ and „Legierung“ has a `sup a` source mark.
- Guess the Model Werkbank contains none of the spoiler denylist words.
- LoggeRythm has no live CTA except the repo; Marathon shows no goal/PB text.

**fire.spec.js (WP3)**
- `reducedMotion: "reduce"` → no request for `js/gl/`, strike button hidden, poster visible.
- WebGL2 stubbed to null (`addInitScript`) → poster, no page errors.
- Float-FBO extensions stubbed to null → the RGBA8 path renders (debug flag `__lmfEsseFormat === "RGBA8"`).
- Motion toggle on → `__lmfFrames` stops increasing within 500 ms.
- No `js/gl/` request before the `load` event.
- LCP element (PerformanceObserver) is `#hero-title`.

**probes.spec.js (WP4)**
- Bomberman: focus the stage, arrows, Space places, `Z` → readout matches `/Kette: \d+/`; Tab leaves the stage; Esc returns focus to the wrapper. Unit: `resolveTick` fixture with 3 bombs in a row → chain 3 in one tick.
- Mixer: no `AudioContext` created before „Ton an“ (spy on the constructor); faders have names „Gesang“, „Instrumental“; Gesang 0 → „Jetzt du.“ visible.
- Typenrad: Technik vs Schauspiel → „×1,6“; Regie as defender → „×1,25“.
- Hashsuche with `data-zeros="2"` → result hash starts with „00“ and matches `crypto.subtle` recomputation.
- Each probe's `destroy()` leaves no running intervals/workers (count via instrumentation).

**chronik.spec.js (WP5)**
- Zeitraffer per-year labels equal `reposByYear(repos.json)`; total equals `snapshot.github.ownPublicRepos`.
- At 375 px the list view is default; at 1440 the Zeitraffer; the toggle switches.
- Roving tabindex: exactly one clip has `tabindex="0"`; ArrowRight moves focus forward in time.
- No clip exposes a repo name outside the allowlist.
- Milestones: each item has a source link with an https URL.
- Werkzeugwand count for „TypeScript“ equals a reference computation from data.

**gallery.spec.js (WP5)** — no-JS: 77 links, first href, night groups, no script tags on the page.

**data.spec.js (WP1)**
- No-JS index: `#lager-static` has 55 items with external links; `.contact-mail` visible; every `data-bind` span is non-empty.
- Network: scrolling the whole page with no clicks makes no request to hosts other than self and `static.cloudflareinsights.com`.
- Budgets: JS transferred before `load` ≤ 45 KB gz; CSS as in §8 (render-blocking ≤ 18 KB gz, before `load` ≤ 24 KB gz); fonts ≤ 125 KB; HTML ≤ 85 KB raw / 20 KB gz (re-baselined in §8).
- `404.html` renders with a link to `/`.

CI order: `npm run check` (validate incl. prerender freshness) → `npm test` (all specs; Playwright `workers: 3` unchanged).

---

## 8. Performance budget

| Metric / asset | Budget |
|---|---|
| LCP (mid-range mobile, Fast 4G) | **< 2.0 s** (hard < 2.5 s). LCP = `#hero-title` text at ≥ 640 px; below that the hero lead paragraph (`p.hero-lead`) is the larger text block and is an accepted LCP element. Both Instrument Serif cuts of the H1 are preloaded (Montserrat is not: its metric-matched fallback holds the body text). |
| CLS | < 0.03 (fixed aspect ratios, metric-matched serif fallback) |
| INP | < 150 ms |
| HTML (`index.html` incl. all prerendered blocks) | ≤ 85 KB raw / 20 KB gz. Re-baselined by the lead on 28.09.2026 from 70/18: the first budget covered only the Lager list; the no-JS Schichtbuch log, Abspann and contact sheet came later and are worth their ~2 KB gz. Owners still keep their prerender blocks lean (no repeated class soup). |
| CSS | Render-blocking: `tokens`, `base`, `esse`, `warm`, `fx` only. `main.js` injects `lager.css` at once for Noch warm, the other section sheets + `skeletons.css` after `load` (earlier for a section on screen or an in-page jump; `<noscript>` links them without JS); `werkbank.css` + `probes.css` lazy. **Budgets (re-baselined by the lead on 28.09.2026 from „all non-lazy ≤ 90 KB raw / 22 KB gz“, which was set before the Zeitraffer, Nachtuhr, Werkzeugwand, Abspann and projector existed and was only ever measured up to `load`):** render-blocking ≤ 70 KB raw / 18 KB gz; everything before `load` (render-blocking + `lager.css`) ≤ 24 KB gz; all non-lazy sheets together ≤ 195 KB raw / 48 KB gz (1 KB = 1024 B; measured 185.4 / 45.8 KB after the skeleton dedup). This is a cap, not a target: owners trim duplicated rules in their section sheets first (`tests/data.spec.js` measures every non-lazy sheet on disk). |
| JS before `load` (main + lib + shell + data + lager + warm + plate) | ≤ 45 KB gz |
| JS lazy | werkbank ≤ 9 · esse GL ≤ 9 · projector ≤ 5 · zeitraffer ≤ 5 · probes ≤ 22 total (+ singer ≤ 6, only after „Ton an“) · omnibox ≤ 6 (KB gz) |
| Data before interaction | `projects.json` ≤ 40 KB raw, `snapshot.json` ≤ 2 KB, `films.json` and `repos.json` (≤ 12 KB each); details on demand (≤ 6 KB each). **Changed by WP1 on 28.09.2026:** `films.json` and `repos.json` load at boot with the core files (`js/lib/data.js → CORE_KEYS`), not lazily, because the Lager's first paint already needs them (film durations on plates, repo languages in the plate data, the Esse embers). Cost measured (1 KB = 1024 B): films 11.6 KB raw / 1.7 KB gz, repos 8.6 KB raw / 1.7 KB gz. |
| Fonts | 4 files, ≤ 125 KB, 2 preloaded |
| Poster | AVIF ≤ 40 KB, WebP ≤ 70 KB, `fetchpriority="low"` |
| GPU | Esse ≤ 4 ms/frame (M1, 1440 × 1.5); governor degrades before 22 ms |
| Third party | Cloudflare beacon only (existing, `defer`, last). YouTube only after click. |

Techniques: `content-visibility: auto; contain-intrinsic-size: auto 900px` on `#schichtbuch`, `#werkstatt`, `#abseits`; `<link rel="modulepreload">` for `lib/data.js`, `sections/lager.js`, `render/plate.js`; `<link rel="preload" as="fetch" crossorigin href="data/projects.json">`; no scroll listeners except rAF-throttled ones in active modules; one rAF loop per active animated module that stops when idle.

Cleanup (WP1): delete `assets/img/avifenc.exe` (10 MB); report unreferenced `*.png`/`*.jpg` originals; the `.avif`/`.jpg` siblings of existing webp images stay only if referenced by `<picture>` (plates use `<picture>` with avif + webp where both exist).

---

## 9. Accessibility checklist (WCAG 2.2 AA, both themes, dialogs open and closed)

- One `h1`; every section an `h2` via `aria-labelledby`; plates `h3`; the Werkbank `h2`.
- Links navigate (plates, reel titles open YouTube only via the facade button); buttons act.
- Focus ring 3 px `--focus`, 2 px offset, never removed; `scroll-padding-top: 72px` for the sticky header (2.4.11).
- Colour never alone: alloy chips carry text, glow always has its word, the language bar has a list, the Zeitraffer has a table.
- Live regions: `#project-count` (polite), `lib/announce.js` (polite, throttled). No announcements on scroll.
- Motion: the global pause (2.2.2); no flashes > 3/s (2.3.1); all scroll-driven effects behind `@supports` and calm-gated; content visible without animation.
- Keyboard: every probe escapable (Tab/Esc); shortcuts `/`, `←/→` (Werkbank), `⌘K` (P2) ignored in inputs; no single-letter global shortcuts (2.1.4 satisfied by scoping letters to a focused probe stage).
- Targets ≥ 44 × 44 px on touch; 24 × 24 minimum everywhere (2.5.8).
- Language `de`; English titles are plain; English GitHub descriptions in the Zeitraffer tooltip get `lang="en"` when the snapshot flags them.
- `prefers-contrast: more` and `forced-colors` handled (§4.2).
- Reflow at 320 CSS px with no horizontal page scroll (the timeline scrolls inside its own labelled region).

---

## 10. Build order

| Phase | Who | Output |
|---|---|---|
| **Day 1** | Lead | skeleton + copy + tokens/base + lib + contract; WP1 starts §3.2 fixes and the import script in parallel |
| **Days 2–5** (parallel) | WP1 | data complete, validate, prerender, fonts |
| | WP2 | Lager (P0) → Werkbank (P0) → Noch warm |
| | WP3 | poster + static Kapitel IV (P0) → heat grammar → Esse GL → projector GL |
| | WP4 | chapter binding (P0) → Typenrad → Hashsuche → Bomberman → Mixer |
| | WP5 | Schichtbuch list + milestones (P0) → Werkstatt/Zunft/Werkzeugwand → Kontakt → gallery → Zeitraffer → Abspann → Nachtuhr |
| **Day 6** | Lead + all | integration: prerender run, VT morphs, data-bind, full test suite, axe in all states |
| **Day 7** | all | hardening: 320 px, forced colors, calm mode walkthrough, perf budgets, screen-reader pass (VoiceOver: open a Werkbank, play Bomberman by keyboard, use the Zeitraffer), content-sources review against §1.4 |
| **P2 (after launch-ready)** | WP2/WP4/WP5 | omnibox, Jahresregler, live embeds, Zeitraffer abspielen, anvil sound |

Launch gate: all P0 + P1 green, `npm run check && npm test` green, owner decisions §3.16 answered or defaults accepted, GPS strip approved.

---

## 11. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Forge vocabulary becomes cryptic or kitschy | Plain words always present (§1.5); forge words only in headings and stamps; the legend explains. |
| „Dark WebGL hero“ cliché | The H1 sits on the page, the Esse is a framed panel, and its embers are real data with a caption. |
| Numbers drift | One snapshot script, one `asOf`, `data-bind` + prerender freshness check. |
| Parallel teams collide in `index.html` | Only the lead edits it; only the prerender script writes inside markers; sections render into mounts. |
| View Transitions / popover / scroll timelines missing (Firefox/Safari) | Feature-detected; `@starting-style` and `<details>` fallbacks; content never depends on them. |
| WebGL on weak devices | Idle + capability gates, governor, poster, context-loss path, RGBA8 fallback. |
| Privacy and rights | GPS strip gated on approval; no place names; ensemble faces and names never shown; the Disney clip stays tiny; no model spoilers; no Marathon personal data; YouTube strictly click-to-load. |
| A toy simulates something undocumented | Every toy cites its README/source line; `Nachbau` vs `Echt` chips; lyrics are verbatim site copy; audio is original synthesis. |
| Research claims go stale (live pages change) | Every live-derived fact is Stand-dated and lives in `details.facts` with its source; re-run `snapshot` and re-check before each redeploy. |
