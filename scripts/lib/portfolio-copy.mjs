/**
 * Portfolio copy (OWNER UPDATE „Portfolio statt Report“, 28.09.2026)
 *
 * The research reads like an audit („laut Commits …“, „angelegt um 00:46 Uhr“, „Stand …“). The page
 * is a portfolio, so scripts/import-research.mjs runs every file it writes through polish() last:
 * the same facts, phrased for visitors, minus the forensics. The data keeps every source.
 *
 * Each text edit must match, otherwise the import stops (the research changed; take a look).
 */

/** file → [[from, to], …]: literal replacements inside string values. */
const TEXT = {
  "data/details/beatguessr.json": [
    [" Die Idee begleitet mich schon länger: Ein öffentliches Vorgänger-Repo gibt es seit 2020.", ""],
    // Nebenbei: one line for visitors, no clock times, no folder names
    ["Angelegt habe ich das Repo in der Weihnachtsnacht, um 00:46 Uhr deutscher Zeit, gleich mit README und Pages-Deploy.", "Einen ersten Anlauf gab es schon 2020, damals noch mit Discord."],
    [" BeatGuessr2 (2020–2021) war ein früherer Anlauf mit Discord- und Socket-Ordnern.", ""],
  ],
  "data/details/bodensee-2020.json": [
    ["Eines der ersten Videos, nachdem ich das Repo dieser Seite angelegt hatte. In der YouTube-Beschreibung steht nur der Link zu lmf.logge.top.", "Eines der ersten Videos aus der Zeit, in der diese Seite entstanden ist."],
  ],
  "data/details/bomberman-web.json": [
    [" werden laut Commit-Historie prozedural erzeugt.", " werden prozedural erzeugt."],
    // hosting notes are for the README, not the portfolio
    [" Auf GitHub Pages läuft der lokale Modus; für Raumcode-Matches braucht es einen eigenen Node-Host.", ""],
    [" (shared/engine.js)", ""],
  ],
  "data/details/coop-sudoku.json": [
    [" Das erste Commit ist vom ersten Weihnachtstag 2025.", ""],
    ["Initial Commit am 25.12.2025 um 02:37 Uhr deutscher Zeit, keine drei Stunden nach dem Start von BeatGuessr. Beides sind Projekte aus der Weihnachtsnacht.", "Entstanden in derselben Weihnachtsnacht wie BeatGuessr, keine drei Stunden später."],
  ],
  "data/details/geo-game.json": [["und laut Commits wurde BorderRun extra angepasst", "und BorderRun wurde extra angepasst"]],
  "data/details/kniffel.json": [
    ["(laut Commit 25+)", "(25+)"],
    // said once, in the story; the Nebenbei (tool name) goes, see SHAPE
  ],
  "data/details/learn-ai.json": [["Der neueste Artikel beim Check hieß „Mega-Kernels“.", "Zuletzt dazugekommen ist der Artikel „Mega-Kernels“."]],
  "data/details/loggerythm.json": [["heißt laut README „spotifrei.db“", "heißt „spotifrei.db“"]],
  "data/details/melodai.json": [
    ["Lyrics-Übersetzungen (seit Juni 2026)", "Lyrics-Übersetzungen"],
    // the strip already says „6 Schritte“; the bullet keeps the tools
    ["Sechsstufige Pipeline: Suche, Download, Stimmtrennung (Demucs), Transkription (WhisperX), LLM-Zeilenbildung, Wiedergabe", "Stimmtrennung mit Demucs, Wort-Timing mit WhisperX, Zeilen per LLM"],
  ],
  "data/details/palatina-films-website.json": [
    ["Laut Commits gab es sogar", "Es gab sogar"],
    ["(laut Commits Juni/Juli 2018)", "(Juni/Juli 2018)"],
  ],
  "data/details/setlist.json": [["Namensgeschichte laut Commits:", "Namensgeschichte:"]],
  "data/details/sharex-afterimage.json": [
    [" Wie die anderen beiden ein unabhängiges Designkonzept.", ""],
    [" (laut Repo-Beschreibung)", ""],
  ],
  "data/details/sharex-capture-engine.json": [
    ["Eine von drei unabhängigen Neuinterpretationen", "Eine von drei eigenen Neuinterpretationen"],
    [" Ein Designkonzept, kein offizieller ShareX-Auftritt.", ""],
  ],
  "data/details/skiing-2020.json": [[" In der Videobeschreibung auf YouTube steht dazu ein Vergleich.", ""]],
  "data/details/spyfall.json": [["33 Orte (laut Live-Seite) mit", "33 Orte mit"]],
  "data/details/theater-website.json": [
    ["Google-Wallet-Tickets (Commits vom September 2026)", "Google-Wallet-Tickets"],
    ["Davor gab es schon eigene Vorgänger: eine Theaterseite ab 2020 und ein kleines Ticketsystem mit Turnstile-Captcha und Mailbestätigung.", "Davor gab es schon eine eigene Theaterseite (ab 2020) und ein kleines Ticketsystem."],
    ["entstanden, alle als öffentliche Repos, zum Beispiel", "entstanden, zum Beispiel"],
  ],
  "data/details/transcripator.json": [[", laut README im Schnitt", ", im Schnitt"]],
  "data/milestones.json": [
    ["Selantis Teil 1 geht auf YouTube, Teil 2 am Tag danach.", "Selantis Teil 1 und 2 sind fertig."],
    ["Feldberg 2019, der erste Ski-Aftermovie in meiner LMF-Playlist.", "Feldberg 2019: mein erster Ski-Aftermovie."],
    ["Kurzfilm „Infected“, 12:22.", "Kurzfilm „Infected“."],
    [" Am selben Tag lege ich das Repo dieser Seite an.", ""],
    ["Weihnachtsnacht: Kurz nach Mitternacht (00:46 Uhr) lege ich BeatGuessr an, um 02:37 Uhr kommt das erste Commit von Coop Sudoku.", "BeatGuessr und Coop Sudoku: zwei Spiele in einer Weihnachtsnacht."],
    ["Drei ShareX-Konzepte in {sharex.seconds} Sekunden angelegt.", "Drei ShareX-Konzepte, drei Welten."],
  ],
  "data/partners.json": [
    [" Der Einladungslink hier stammt von meinem Account.", ""],
    ["Website, Werkzeuge, ein Kartenspiel und 2026 eine Rolle auf der Bühne.", "Website, Werkzeuge und ein Kartenspiel."],
    [" Kein offizieller Xenon-Bot.", ""],
    ["Mein eigenes Projekt: ein KI-Support-Bot, der nur aus der offiziellen Xenon-Doku antwortet.", "Ein KI-Support-Bot, der Fragen direkt aus der Xenon-Doku beantwortet."],
  ],
  "data/projects.json": [
    ["Stand 28.09.2026 sind es 17 deutsche Präsentationen", "Inzwischen sind es 17 deutsche Präsentationen"],
    // one archive signal (the „Ausgemustert“ state). The Corona Board's lede and category and the
    // Bomberman lede were edited in data/projects.json itself (it is its own input).
    ["Zum Archiv", "Ansehen"],
  ],
};

/** file → (value) => value: structural edits (a paragraph, a fact or a milestone that goes). */
const SHAPE = {
  // one archive signal is enough (the „ausgemustert“ state and the note in the Werkbank)
  "data/details/corona-board.json": (d) => {
    d.story = d.story.filter((s) => !/^Heute ist es ein Archiv\./.test(s));
    d.highlights = d.highlights.filter((h) => !/^Verweise auf /.test(h));
    delete d.funFact; // commit accounting („sechs Commits, der letzte vom …“)
    return d;
  },
  // CI and CodeQL are repo hygiene, not something a visitor sees; the strip gets the pipeline
  // (six steps, README = source 0, the same list as the first highlight)
  // The second paragraph was a stub (mixing is in the lede, the QA checklist is for the repo,
  // „Repo ansehen“ says open source): its one visitor fact joins the first paragraph.
  "data/details/melodai.json": (d) => {
    const [first, ...rest] = d.story;
    if (!first.endsWith(" zu singbaren Zeilen.") || !rest.every((p) => /^Im Player wird Wort für Wort hervorgehoben/.test(p)))
      throw new Error("portfolio-copy: melodai story changed, take a look");
    d.story = [first.replace(/ zu singbaren Zeilen\.$/, " zu singbaren Zeilen; im Player läuft das Wort für Wort mit.")];
    d.highlights = d.highlights.filter((h) => !/^CI, CodeQL/.test(h));
    d.facts = [{ key: "pipeline", label: "Pipeline", value: "6 Schritte", source: 0 }];
    return d;
  },
  // the strip shows the game's own numbers (all from the README = source 0, as in the highlights
  // and the story), not commits and stars
  "data/details/bomberman-web.json": (d) => {
    d.facts = [
      { key: "arenas", label: "Arenen", value: "6", source: 0 },
      { key: "powerups", label: "Power-ups", value: "9", source: 0 },
      { key: "ticks", label: "Ticks/s", value: "60", source: 0 },
    ];
    return d;
  },
  // the story only repeated the lede and the quote; the quote stays as the film's own words
  "data/details/skiing-2026.json": (d) => {
    delete d.story;
    return d;
  },
  // strip: seats; the play only backs the Saalplan Probestück (kind „probe“, not shown); the
  // nomination becomes one sentence under the title (kind „ribbon“)
  "data/details/theater-website.json": (d) => {
    d.facts = d.facts
      .map((f) => {
        if (f.key === "play") return { key: f.key, kind: "probe", label: f.label, value: f.value, source: f.source };
        if (f.key === "seats") return { ...f, label: "Plätze" };
        if (f.key === "nomination")
          return { key: f.key, kind: "ribbon", label: "Nominiert", value: f.value, text: "Das Theater ist für den Deutschen Engagementpreis 2026 nominiert.", source: f.source };
        return f;
      });
    return d;
  },
  // the commit quote is a story for the gallery repo, not for the timeline
  // the hero already says „Auf GitHub seit 2015“
  // the Creepshow role is said once, in Kapitel I (the spec's home for it)
  "data/milestones.json": (list) => list.filter((m) => !/^Commit in der Galerie/.test(m.text) && !/^GitHub-Account angelegt/.test(m.text) && !/^„Creepshow“/.test(m.text)),
  // the Nebenbei is now about the 2020 attempt: point it at that repo
  "data/details/beatguessr.json": (d) => {
    const i = d.sources.findIndex((s) => /BeatGuessr2/.test(s.label));
    if (d.funFact && i >= 0) d.funFact.source = i;
    return d;
  },
  // the AI background is said once, in the story
  "data/details/kniffel.json": (d) => {
    delete d.funFact;
    return d;
  },
};

const used = new Set();

function replaceStrings(value, edits, file) {
  if (typeof value === "string") {
    let out = value;
    edits.forEach(([from, to], i) => {
      if (out.includes(from)) {
        out = out.split(from).join(to);
        used.add(`${file}#${i}`);
      }
    });
    return out;
  }
  if (Array.isArray(value)) return value.map((v) => replaceStrings(v, edits, file));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, replaceStrings(v, edits, file)]));
  return value;
}

/** The portfolio phrasing for one output file (`file` relative to the repo root). */
export function polish(file, value) {
  let out = SHAPE[file] ? SHAPE[file](structuredClone(value)) : value;
  if (TEXT[file]) out = replaceStrings(out, TEXT[file], file);
  return out;
}

/** Throws when an edit never matched (call once after every file is written). */
export function assertPolished() {
  const missing = Object.entries(TEXT).flatMap(([file, edits]) => edits.map((e, i) => [`${file}#${i}`, e[0]])).filter(([k]) => !used.has(k));
  if (missing.length) throw new Error(`portfolio-copy: edits no longer match the research:\n${missing.map(([k, from]) => `  ${k}: ${from}`).join("\n")}`);
}
