# Inhaltsquellen

Stand der Fakten: **28.09.2026**. Alle Texte, Zahlen und Bilder der Seite stammen aus den hier genannten Quellen. Die maschinenlesbaren Quellen pro Projekt stehen in `data/details/<id>.json → sources` (mit `checkedAt`) und werden auf der Seite als „Punze“ angezeigt. Rohmaterial: `docs/research/projects-deep.json`, `docs/research/film-network-persona.json`, `docs/research/new-work.json` (alle erstellt am 28.09.2026 aus READMEs, Repo-Metadaten per `gh api`, Live-Prüfungen mit Playwright und YouTube-Watch-Seiten).

Übernommen werden nur Angaben mit Quelle. **Nicht** übernommen: Ideen und Vorbehalte aus der Recherche (`interactionIdeas`, `caveats`), Fakten aus privaten READMEs, die als „nicht verwenden“ markiert sind, persönliche Marathon-Daten (Zielzeit, Bestzeit, Renntermin, Kalender), Spotify-Berichte anderer Personen, Ensemble-Namen und -Gesichter, Ortsnamen der Nachtfotos.

## Zahlen und Stichtag

| Wert | Quelle | Erzeugt von |
| --- | --- | --- |
| Öffentliche Repos (140), pro Jahr, Glut, Sterne, Repo- und Push-Daten | GitHub API: `gh repo list LoggeL --visibility public --source`, `repos/<name>` | `scripts/snapshot-github.mjs` → `data/repos.json`, `data/snapshot.json`, `projects.json → repo` |
| Commits, Sprachen, Commit-Anteil (Theater, Poolparty) | GitHub API: `commits?per_page=1` (Link-Header), `languages`, `contributors` | `scripts/snapshot-github.mjs` → `data/details/*.json` |
| GitHub seit 15.04.2015, Bio „I'm just pressing buttons“ | https://api.github.com/users/LoggeL | Snapshot |
| Erstes Video „AE Test“, 22.11.2014, 7 s | https://www.youtube.com/watch?v=wHEcSFBkM0s | `data/snapshot.json` |
| 77 Fotos, 17 Nächte, 24.09.–26.10.2020, 20 bis 2 Uhr | Dateinamen in `gallery/assets/data/images.json` | `js/lib/derive.js → galleryStats()` (ein Foto vor 12 Uhr gehört zur Nacht davor; die Recherche zählt 19 Kalendertage) |
| 81 Sekunden zwischen den drei ShareX-Repos | `created_at` der drei Repos | `derive.js → sharexStats()` |
| „Stand“-Fakten (68 Themen, 68 Plätze, 11 Experimente, 17 Decks …) | geprüfte Live-Seiten, siehe `details.facts[].source` | `scripts/import-research.mjs` |

Jede Zahl im Seitentext steht in einem `data-bind`-Element und wird aus diesen Daten berechnet, nie getippt (`npm run check`, Regel 18).

## Korrekturen an bestehenden Daten (Spec §3.2)

| Projekt | Befund | Korrektur |
| --- | --- | --- |
| Skiing 2019 · Feldberg | Link `watch?v=VTPliFOTA0` nicht verfügbar | `watch?v=-VTPliFOTA0` (LMF-Playlist, jupeters.de) |
| Setlist → Bands | setlist.logge.top liefert 404; Commit „Rebrand Setlist to Bands“ (20.07.2026) | Titel „Bands“, Link https://bands.logge.top (Besitzer-Standard §3.16 #4), `id` bleibt `setlist` |
| Palatina Films (Website) | palatina-films.de hat kein DNS mehr | Archiv https://loggel.github.io/PalatinaFilms/ |
| Voll-O-Meter | kein Service Worker im Repo | „Offline-Modus“ gestrichen; installierbar, Daten bleiben im Browser |
| Marathon Trainer | „Strava-Anbindung“ ist nur ein URL-Feld, die KI läuft extern; `MarathonTrainer.webp` zeigt Lauf, Datum, Zielzeit, Pace und Trainingslog | neue Beschreibung; keine Ziel-, Bestzeit- oder Termindaten. Das Bild ist nicht mehr verknüpft (bleibt unbenutzt in `assets/img/`), die Kachel ist ein Rohling (`art: "widget"`). |
| Transcripator | Flask, nicht Next.js | Tags `python, flask, whisper, gemini`, Quelle TranscripatorWeb |
| JP Poolparty | jpCore nutzt Fastify 5, Frontend gemeinsam mit realjupeters | neue Beschreibung, Quelle realjupeters/realjupeters.github.io |
| GeoGames | Next.js 16 / React 19, nicht vanilla-js | Tags korrigiert |
| Oilbert’s Adventure | README: HTML/CSS-Rendering; Daten sagten Canvas | Quellcode geprüft (LoggeL/OilbertsAdventure@a467686, `game.js`, `index.html`): kein `getContext`, kein `<canvas>` → „gebaut mit JavaScript, HTML und CSS“ |
| Kolpingtheater Ramsen | Gruppe `ai` ohne Beleg; Repo liegt in der Organisation | Gruppe `web`, Quelle Kolpingtheater-Ramsen/next-theater |
| Sailing 2019 / 2022 | Gruppe `ai` ohne Beleg | nur `film` |
| Spyfall | Bildpfad `Spyfall.webp`, im Repo `spyfall.webp` | exakte Schreibweise |
| „Neu dabei“ | sieben alte Markierungen | nur die neuen Projekte aus Spec §3.4 und Ski 2023; nach den Ausschlüssen des Besitzers sind das sechs (Arcanum, Voxel Blitz, Bulli Drive, Strahlschlaufenreaktor, PowerPoint Karaoke, Ski 2023) |
| CFW (Partner) | „Züge und Boote“ passt nicht zum Kanal | „Ein YouTube-Kanal über Ausflüge, Reisen und Wanderungen“, Bezug über Repo LoggeL/kartei |
| Infected, Exception | „48 Stunden“ nur in bestehenden Daten | Wortlaut der Beschreibung bleibt, nie Überschrift oder Fakt |
| Portes du Soleil (Ski 2026) | Kategorie „Film · 2026“ wiederholte das Jahr | „Aftermovie“ wie bei den anderen Ski-Filmen |

## Neue Projekte (Spec §3.4)

Beschreibungen, Highlights und Stack aus `docs/research/new-work.json`; jede Zeile nennt die Belege der Recherche. Serotonin ist bewusst **nicht** aufgenommen (Besitzer-Standard §3.16 #1), das Bild liegt unbenutzt in `assets/img/Serotonin.webp`.

Auf Wunsch des Besitzers (28.09.2026) sind zwölf recherchierte Projekte nicht im Portfolio. Die Liste steht in `docs/decisions.json` → `excludedProjects`; `scripts/import-research.mjs` lässt sie überall weg, `scripts/validate.mjs` (Regel 8) prüft das. Ihre Bilder bleiben unbenutzt in `assets/img/`.

| Projekt | Quelle | Belege | Bild |
| --- | --- | --- | --- |
| Arcanum | https://github.com/LoggeL/arcanum | Repo-Beschreibung, `index.html`, `main.js`; Live-Seite: HTTP 200, WebGL | `Arcanum.webp`: echter Render der Kammer. **Das Titel-Overlay wurde für den Screenshot per DOM ausgeblendet**, weil der Start Pointer-Lock verlangt; so steht es auch in der Bildunterschrift. |
| Voxel Blitz | https://github.com/LoggeL/voxel-blitz | README; keine Pages-Seite (Server nötig) | `VoxelBlitz.webp`: offizieller Screenshot aus dem Repo (`docs/screenshots/main-menu.png`) |
| Bulli Drive | https://github.com/LoggeL/Bulli-Drive | README; keine Pages-Seite (Server nötig); VW Bulli wie Oilbert (README + Sprite) | `BulliDrive.webp`: offizieller Screenshot aus dem Repo (`docs/screenshot.jpg`, 1440×810) |
| Strahlschlaufenreaktor | https://github.com/LoggeL/jet-loop-reactor | README (Korrelationen, Literatur); Live-Seite, WebGL | `JetLoopReactor.webp`: Live-Screenshot |
| PowerPoint Karaoke | https://github.com/LoggeL/PowerPointKaraoke | README (image-first decks); Live-Seite „17 Präsentationen“ | `PowerPointKaraoke.webp`: Live-Screenshot der Deck-Galerie |
| Ski 2023 | https://www.youtube.com/watch?v=CLalueWRmLI | YouTube (Titel „Aftermovie Ski 2023“, Upload 29.07.2023, 4:52, Beschreibung); auf jupeters.de als „Skifahren 2023“ | `Skiing2023.webp` (640×360): Logges eigenes YouTube-Vorschaubild, geladen von `https://i.ytimg.com/vi/CLalueWRmLI/hqdefault.jpg` mit `scripts/fetch-film-stills.mjs` (28.09.2026). `maxresdefault`, `sddefault` und `hq720` liefern HTTP 404; das 480×360-Bild hat schwarze Balken, das Skript schneidet den 16:9-Streifen (480×270) aus und skaliert auf 640×360 wie die anderen Filmstills. Alt-Text: „Vorschaubild des Videos „Aftermovie Ski 2023““. |

## Bilder, die Kacheln ersetzen (Spec §3.5)

| Projekt | Datei | Herkunft |
| --- | --- | --- |
| ShareX · Capture Engine | `assets/img/ShareXCaptureEngine.webp` | Live-Screenshot, 1440×900 |
| ShareX · Windows 98 | `assets/img/ShareXWin98.webp` | Live-Screenshot, 1440×900 |
| ShareX · Afterimage | `assets/img/ShareXAfterimage.webp` | Live-Screenshot, 1440×900 |
| LoggeRythm | `assets/img/LoggeRythm.webp` | offizieller Screenshot aus `LoggeL/LoggeRythm`, `docs/screenshots/01-queue.png` (2880×1800 → 1440×900); keine Live-Instanz (privates Demo-Projekt) |
| Codex Quota Widget | `assets/img/CodexQuotaWidget.webp` | offizielle Vorschau aus `docs/widget-preview.png` (945×147, laut README mit Testdaten „Privat“/„Arbeit“). Nur in der Werkbank auf eigener dunkler Bühne, die Kachel bleibt ein Rohling. |

| Kolpingtheater Ramsen | `assets/img/KolpingtheaterSaalplan.webp` | Live-Screenshot vom 28.09.2026 (Playwright, 1440×900, cwebp q 82) von https://kolpingtheater-ramsen.de/booking, Schritt „Plätze“ der Vorstellung am 28.12.2026, 19:30 Uhr. Nichts gebucht, keine Daten eingegeben. Ersetzt `Kolpingtheater.webp` (bleibt im Ordner), weil dieses Bild Gesichter aus dem Ensemble zeigt (Spec §2.3: keine Ensemble-Namen oder -Gesichter). |

Bestehende Bilder: vorhandene Dateien in `assets/img/`. `Bomberman.webp` stammt aus `LoggeL/bomberman-web`, `client/public/splashes/neon-reactor.webp` (Spielmotiv, kein Screenshot einer Runde). `MelodAI-player.webp` ist der offizielle Screenshot `docs/screenshots/02-player.png` aus `LoggeL/MelodAI`.

## Filme

`data/films.json` stammt aus den YouTube-Watch-Seiten (Titel, Upload, Länge, Beschreibung) und jupeters.de (dort als Filme der Gruppe verlinkt). Zitate sind wörtlich, auch mit Tippfehlern („Erwatungen“). Orte nur aus Titeln oder bestehenden Daten. Selantis: Teile, Längen und Rollen aus der Playlist und `selantis.html`/`team.html` der Palatina-Films-Website; Teil 1 heißt „Dunkle Mächte“ (YouTube, selantis.html).

## Partner

Neue Felder `place` und `sources` in `data/partners.json`. Ramsen für Kolpingtheater und JP laut jpCore-README („the annual event in Ramsen, Germany“) und Teamseite. Die Auszeichnungen des Kolpingtheaters gehören dem Theater und werden so formuliert.

## Schriften

Vier Dateien, zusammen 118,7 KB, alle SIL Open Font License 1.1, heruntergeladen mit `scripts/fetch-fonts.mjs` (gepinnte Versionen):

| Datei | Quelle | Lizenz |
| --- | --- | --- |
| `assets/fonts/InstrumentSerif-Regular.woff2` | `@fontsource/instrument-serif@5.3.0` (latin 400 normal) | `OFL-InstrumentSerif.txt` (github.com/Instrument/instrument-serif) |
| `assets/fonts/InstrumentSerif-Italic.woff2` | `@fontsource/instrument-serif@5.3.0` (latin 400 italic) | `OFL-InstrumentSerif.txt` |
| `assets/fonts/Montserrat-var.woff2` | `@fontsource-variable/montserrat@5.3.0` (latin, wght) | `OFL-Montserrat.txt` (github.com/JulietaUla/Montserrat) |
| `assets/fonts/JetBrainsMono-var.woff2` | `@fontsource-variable/jetbrains-mono@5.3.0` (latin, wght) | `OFL-JetBrainsMono.txt` (github.com/JetBrains/JetBrainsMono) |

Die alte `Montserrat.woff2` bleibt, bis Galerie und Startseite die neue Datei nutzen.

## Galerie und Datenschutz

Die 77 Nachtfotos (Xiaomi Mi 9T Pro, Herbst 2020) werden ohne Ortsnamen gezeigt (Besitzer-Standard §3.16 #3). 60 der 77 Originale in `gallery/assets/img/original/` tragen noch GPS-Koordinaten im EXIF. `scripts/strip-gps.mjs` ist vorbereitet (reines JavaScript, ändert nur den GPS-Block), wurde aber **nicht ausgeführt**: Das geschieht erst nach Logges Freigabe, danach prüft `npm run check` (Regel 21), dass keine GPS-Daten mehr ausgeliefert werden.

## Probestück „Saalplan“ (Kapitel I)

Nachbau der Platzwahl von https://kolpingtheater-ramsen.de/booking, live geprüft am 28.09.2026 (`docs/research/projects-deep.json` → `theater-website.liveCheck`: „Romeo und Julia“, Wintertheater, Eintritt frei, je 68 Plätze). Aufbau nach dem Screenshot `assets/img/KolpingtheaterSaalplan.webp` (Vorstellung Montag, 28.12.2026, 19:30 Uhr): Reihe A Plätze 2–9, Reihen B–G Plätze 1–10, Gang zwischen 5 und 6, Legende „Frei / Deine Auswahl / Belegt“, Zähler „0 von 5 Plätzen“ und der Hinweis zu einzelnen freien Plätzen (wörtlich übernommen). Keine erfundene Belegung, keine Preise, kein Netzwerk. Der QR-artige Block auf dem Ticket ist ein Deko-Muster aus einem Zufallsgenerator und codiert nichts.
