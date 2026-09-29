# CSS-Notizen

Longer explanatory comments moved out of the non-lazy stylesheets on 28.09.2026 so the shipped CSS stays inside the spec §8 budget (`tests/data.spec.js`: all non-lazy sheets ≤ 195 KB raw / 48 KB gz; comments were ~25 KB of it). Each note names the rule it sat above (line numbers are from before the move). Short comments stay in the sheets. Not published (docs/ is excluded in _config.yml).

## css/tokens.css

- `@font-face` (was line 35): Metric-matched fallbacks (low CLS on swap): size-adjust = Instrument Serif's width on real headings (09/2026), ascent/descent = its 0.99 / 0.31 em ÷ size-adjust; one face per local font.
- `--heat-0: #2a2522` (was line 159): Heat ramp kaltes Eisen → Weißglut: decorative only, NEVER text (mirrored in js/lib/palette.js)
- `:root, :root[data-theme="light"]` (was line 186): Tageslicht: kaltes Eisen auf Kalk. Text tokens ≥ 4.5:1 on bg/surface/surface-2, ratios in spec §4.2
- `.screen` (was line 233): Screen: immer dunkel (Esse-Panel, Kapitel IV, Werkbank-Leiste, Kontakt, Footer)

## css/base.css

- `body::before` (was line 102): Steel grain: one static layer behind all content (no blend modes → cheap).
- `#schichtbuch, #werkstatt, #abseits` (was line 271): Placeholder heights ≈ the real ones (09/2026), so jumps don't drift; `auto` keeps the last size.
- `.section-head` (was line 298): Section head: mono eyebrow + serif H2; default spread = Meisterstücke (with guides), modifiers below.
- `.section-head--rail` (was line 348): 01 Noch warm: the title and the rail arrows share one baseline, the dek sits under the title.
- `.section-head--count` (was line 371): 03 Lager: a working room. A big title across ten columns, the stock count as a mono numeral.
- `@media (min-width: 1024px)` (was line 420): 04 Schichtbuch: the two numbers are the hook, so they stand in the title's row.
- `.abseits-stage` (was line 440): 06 Abseits: the dark night panel starts at the title line; the head sits on it.
- `background: color-mix(in srgb, var(--bg) 97%, transparent)` (was line 486): Near-opaque: translucent, it turned grey over .screen sections and muted text fell below 4.5:1.
- `.site-nav a::after` (was line 571): Hot underline: heats in 100 ms from the centre, cools over 1.6 s.
- `order: 3` (was line 671): DOM: right before the sheet it opens (2.4.3); visually the last control.
- `.gluehlinie` (was line 690): Glühlinie (§5.2): static here; fx.css (WP3) animates --page-heat with a scroll timeline.
- `@media (max-width: 1023.98px)` (was line 708): Header, small screens: Menü + opens a sheet. Without JS the nav stays visible as a row.
- `:root:not(.js) .site-header` (was line 762): No JS: brand row + one sideways-scrolling link row, not sticky (never covers a jump target).
- `:root:not(.js) :is(#menu-toggle, #motion-toggle, #theme-toggle, .section-readout)` (was line 800): No JS: no toggles, and no section readout (nothing would update it).
- `.button::before` (was line 841): Hot spot follows the pointer (--mx/--my from fx/heat.js); centre on focus.
- `.hero-readout` (was line 1051): Separators sit in the gap left of each item; at a wrap they are clipped (no line starts with „·“).
- `.esse-panel:not([data-embers]) .esse-caption` (was line 1119): The Glut caption describes the embers; it shows once they exist (esse.js sets data-embers).
- `.esse-hint-pointer, .esse-hint-touch` (was line 1143): Hints show only once esse.js has enabled the strike (data-strike on the panel) and motion is on.
- `.warm-static` (was line 1219): No-JS rows (render/warm-static.js); hidden with JS unless the section gave up.
- `:root:not([data-motion="paused"]) .hero-stamp.is-stamped` (was line 1343): Hero stamp on the third strike (forge:strike n=3 → .is-stamped, set by esse.js).
- `@layer reset` (was line 1367): Calm safety net: reduced motion OR „Bewegung pausieren“. Stops every CSS animation site-wide.
- `@layer sections` (was line 1475): SECTION OPENERS: overrides that must beat the owners' sheets (same layer, higher specificity).
- `#schichtbuch .section-head .counters` (was line 1477): 04 Schichtbuch: the counters sit in the head (no extra gap below them).
- `#werkstatt .about > .knoepfe` (was line 1482): 05 Werkstatt: „I'm just pressing buttons“ + KNOPF fill the column under the title.
- `#abseits .abseits-stage :is(.nu, .contact-sheet)` (was line 1498): 06 Abseits: inside the stage the clock and the strip lose their own frame.

## css/sections/esse.css

- `#esse .hero-title` (was line 9): One text block for both lines, so the whole H1 is the LCP element (block spans would split it).
- `#esse .esse-axis` (was line 96): Year scale (data: 1 January of every year, same mapping as the embers)
- `#esse .esse-hint` (was line 170): The hint is the last row of the instrument, only while the strike is live.
- `#esse .esse-hint` (was line 183): Reserved rows (CLS budget §8): with JS the axis (30 px), the caption and the hint line hold their space from first paint; mounting only fills them. The caption stays invisible until the embers it describes exist; the hint line stays empty while the strike is off (calm, no WebGL).
- `@layer sections` (was line 252): Motion (opt-in, calm-gated): the canvas fades in after its first frame; the word cools slowly.

## css/fx.css

- `@layer base` (was line 22): Heat under the hand: generic hot spot for [data-heat] (buttons and the brand have their own)

## css/sections/lager.css

- `.lager-static > li` (was line 622): no 01, 02 … counter: it contradicted the real Nº (year order) on plates and in the Werkbank

## css/sections/meister.css

(Owner update „Portfolio statt Report“: the notes on `.specsheet`, `.punze-slot`, `.punze-list`, `.punze-i` and the ruler marks are removed with the rules they described.)

- `#meisterstuecke .chapter:not(#kapitel-iv)::before` (was line 12): the huge outlined numeral, decorative (the kicker carries the real text)
- `#meisterstuecke .chapter:not(#kapitel-iv) .chapter-body` (was line 43): Chapter layout Phones/tablets: head, stage, story, facts, universe. From 1024 px head + story beside the stage (5 : 7, alternating), so a chapter is about one stage tall. DOM = reading = tab order.
- `#meisterstuecke .chapter:not(#kapitel-iv)::before` (was line 111): the outlined numeral: a watermark in the top corner of the text column, where the short title lines leave room, never behind the stage
- `:root[data-booted] .probe-stage[data-probe]` (was line 127): Probestück stage: final size reserved before the toy mounts The ::after spacer shares the grid cell with the poster/probe and carries the measured live height per stage width (work/wp4r2/fit.mjs, +6 px), so mounting and unmounting never move the page. Werkbank variants live in werkbank.css.
- `:root[data-booted] .probe-stage[data-probe] > img` (was line 146): With JS the toy draws its own view: display: none keeps the lazy poster from downloading. Until the toy is there the stage is one even plate with a centred „Probestück lädt …“.
- `#meisterstuecke .chapter .probe-stage.is-live::before` (was line 189): a stamped tab on the live stage: „Probestück · Nachbau/Echt“ is carried by the chip row below
- `#meisterstuecke .story-more` (was line 295): „Weiterlesen“: every chapter shows its first paragraph; the rest (more paragraphs, the rivets, on phones and tablets also the MelodAI pipeline) opens on request, or in the Werkbank
- `@media (max-width: 759.98px)` (was line 422): phones: the three worlds side by side in a snapping row (one card and a peek of the next) instead of three screens of stacked cards
- `@media (min-width: 1024px)` (was line 610): From 1024 px: the head on the left, the three worlds on the right, so the Zwischenstück is a breath between chapters, not a chapter of its own (the 81-second ruler is gone: owner update, fix round 2)
- `#kapitel-iii .pipeline` (was line 647): Pipeline (Kapitel III): six stations on one wire. While the mixer plays (lmf:probe), 05–06 heat up in 90 ms and cool over 1.6 s. Phones: the same wire, vertical.
- `@media (prefers-reduced-motion: no-preference)` (was line 769): a pulse runs down the hot wire while the song plays (never when calm)
- `:root[data-booted] #meisterstuecke:not([data-mounted]) .universe:empty` (was line 791): reserved until the section mounts (then it is either filled or, without data, gone): the folded universe is head + four previews (1 / 2 / 4 columns). Measured, box height against its width (work/wp4r3/uvh.mjs): 288→859, 358→734, 442→684, 588→614 · 589→481, 707→435, 941→370 · 942→304, 1086→280, 1325→257 px
- `.uv-map` (was line 1000): Folded on every width: head + a preview of four in a row („Alle 11 zeigen“ in the head). Open: the map from 640 px, the whole grouped list below.
- `.uv-list:not(.is-open) :is(.uv-li--more, .uv-group--more)` (was line 1032): the preview: four (one per kind); „Alle 11 zeigen“ opens the rest

## css/sections/film.css

- `#kapitel-iv::before` (was line 14): The outlined chapter numeral (same device as Kapitel I–III), decorative.
- `#kapitel-iv::after` (was line 31): a low red glow from below, like the light spill of a projector room
- `#kapitel-iv .projector-film` (was line 88): the film is in flow: the picture between the sprocket margins is exactly 16:9, so a poster shows whole at every width (the frame is 16:9 plus the two margins)
- `#kapitel-iv .projector-pic .projector-still` (was line 137): the gate crops 1.5 % off every edge, like a real aperture (and like gl/projector.js GATE): hides the coloured edge rows some YouTube thumbnails carry
- `#kapitel-iv .projector-meta` (was line 207): separators live in the gap, left of each item: one that starts a line falls outside the box and is clipped, so a wrapped line never opens with „·“
- `#kapitel-iv .film-more` (was line 375): full shell width: the reel list on one line
- `@layer sections` (was line 456): Motion (opt-in, calm-gated): heat in fast, cool out slow; the red bar strikes in.

## css/sections/schichtbuch.css

- `#schichtbuch.section` (was line 10): The outro is a closing line; the Werkstatt brings its own top padding (no double gap).
- `.sb-year-title::after` (was line 83): Heat bar: as long as the year was busy (share of the busiest year). Decorative; the count is text.
- `.sb-older-summary` (was line 188): Phones: older years behind one disclosure (js/sections/schichtbuch.js); always open ≥ 640 px.
- `.zr-yearchip:hover` (was line 362): Hover only brightens the digits; the current year (exactly one) is the filled chip.
- `overflow-x: clip` (was line 414): The track ends at the Stand + half a viewport; the rest of the current year is cut.
- `.zr-lines span[data-span]` (was line 480): Year-only milestone: a bracket over the whole year instead of a line on 1 January.
- `background: var(--zr-lane-bg)` (was line 515): Opaque, with a soft shadow: clips and flags slide under the label column, never over it.
- `.zr-pclip-title` (was line 594): Two lines, so the names stay whole („PowerPoint Karaoke“, „ShareX · Capture Engine“).
- `.zr-flag` (was line 622): Flag: date line + three lines of story; hover or focus unfolds the rest (and the tooltip has it).
- `:is(.zr-flag, .zr-pclip).is-under` (was line 653): A chip or flag whose start slid under the sticky lane labels steps back (no „nscripator“).
- `.zr-lead` (was line 658): Leader in the gap under a flag that had to slide right: ties it back to its date.
- `.zr-future` (was line 706): The Stand (snapshot.asOf): a line, a label on the ruler, nothing drawn after it.
- `.zr-now-label` (was line 830): Narrow: its own line between the sticky year label (10–24 px) and the heat bar (40 px).

## css/sections/werkstatt.css

- `#werkstatt :is(.werkzeugwand, .zunft, .abspann)` (was line 6): Block rhythm inside the Werkstatt: a little tighter than the skeleton default (the „Bühne“ block is gone: the Zunft covers it).
- `.knopf-said` (was line 66): „Siehste.“: a separate ink stamp next to the cap (aria-hidden; the name stays „Knopf“).
- `.zunft-mark--blank` (was line 245): No logo (or it failed to load): a monogram on brushed steel, the plates' Rohling language.
- `white-space: normal` (was line 412): the trailing space is the only break opportunity between the nowrap items
- `.is-windowed .abspann-stage` (was line 465): Windowed credits (JS): a fixed window instead of 2–3 screens of page. The layout is the end-credits axis: role right-aligned on the left, names on the right (stacked on phones).
- `.is-rolling .credits-reel` (was line 542): The roll: transform only (compositor), paused off screen, on hover and while focused.
- `.zunft-list` (was line 644): Zunft on phones: two columns, small marks, category + description.

## css/sections/abseits.css

- `.nu-tick:focus-visible .nu-hit` (was line 177): Focus halo: an opaque focus-colour capsule around the tick (≥ 3:1 on the dial), the mark stays on top of it in the dial colour so the tick itself still reads.
- `.nu-frame` (was line 198): A print, not a placeholder: square, the photo fills it (landscape and portrait alike).
- `:root:not([data-motion="paused"]) .nu-img` (was line 260): Crossfade: the new print heats in (90 ms), the old one cools out (400 ms).

## css/sections/kontakt.css

- `.kontakt-coals` (was line 35): Coal bed: the Esse's Voronoi cells as a static SVG (js/sections/kontakt.js). Matte cells, glowing cracks; only the hot spots under the cracks breathe.
- `.kontakt-warm` (was line 53): Wide screens: the newest public repo („Zuletzt angelegt“), in the empty column next to the mail.
