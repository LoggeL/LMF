# Frontend contract (`js/main.js`)

Frozen by the lead (spec §6.2). Changes need a lead-reviewed PR. This used to be the header comment of
`js/main.js`; it lives here so the comment is not shipped to every visitor before `load` (JS budget, spec §8).

```text
── Section module API ─────────────────────────────────────────────────────────────────────────────
  // js/sections/<name>.js
  export async function mount(root, ctx) { …; return { destroy() {} } }

  root  the element matched by the registry selector below (usually the <section>;
        for `film` the Kapitel-IV <article>, for `abspann` the #abspann block,
        for `werkbank` the <dialog id="werkbank">).
  Mount points inside a root are marked with data-mount="…" in index.html
  (e.g. [data-mount="warm-plates"], [data-mount="probe"][data-probe="bomberman-chain"]).
  Static copy outside mount points belongs to index.html and is not re-rendered by modules.

@typedef {Object} Ctx
@property {Promise<Data>} data      resolves once; never rejects (failed files are null)
@property {typeof import("./lib/router.js").router} router
@property {typeof import("./lib/motion.js").motion} motion   .calm, .onCalmChange(fn), .vt(fn)
@property {typeof import("./lib/announce.js").announce} announce   announce(text, {assertive}); announce.toast(text)
@property {Document} bus            dispatch/listen CustomEvents (see Events)
@property {typeof import("./lib/storage.js").default} storage     { local, session } with get/set/remove
@property {typeof import("./lib/format.js").default} format       date, number, percent, duration, …
@property {string} name             registry name of this section

── Data object (js/lib/data.js, WP1: `export async function loadData(): Promise<Data>`) ───────────
@typedef {Object} Data
@property {Object|null} snapshot     data/snapshot.json
@property {Array|null}  projects     data/projects.json (Lager order); null → Lager error state
@property {Map}         byId         id → project
@property {Map|null}    films        id → film (data/films.json)
@property {Array|null}  repos        repos.json → .repos
@property {Array|null}  milestones
@property {Array|null}  chapters
@property {Array|null}  universe
@property {Array|null}  partners
@property {Array|null}  socials
@property {Record<string,string|number>} bindings   see js/lib/derive.js → bindings()
@property {{get(id:string):Promise<Object|null>, prefetch(id:string):void}} details
A failure in any single file sets that key to null and its consumers omit their UI.
Only `projects` failing triggers the Lager error state.

── Events (on document) ───────────────────────────────────────────────────────────────────────────
  lmf:filter   {q?, g?}       Werkzeugwand, Werkbank stack chips, omnibox, „Alle Filme“ → Lager
  lmf:open     {id, from?}    any → router (normally just link to "#werk/<id>")
  lmf:calm     {calm}         motion.js → every animated module
  lmf:theme    {theme}        shell/theme.js → canvases that bake theme colours
  lmf:data     {data}         main.js, once data is ready (after data-bind refresh)
  forge:strike {n}            gl/esse.js → hero H1 (add .is-stamped to .hero-stamp on n = 3)
  esse:cooled  –              gl/esse.js → scripts/render-poster.mjs

── data-bind ──────────────────────────────────────────────────────────────────────────────────────
  <span data-bind="repos.total">140</span>  — prerendered by scripts/prerender.mjs, refreshed here
  from data.bindings. Unknown keys keep their prerendered text.
  <el data-show-if="flag">                  — hidden unless the flag below is true (FLAGS).

── Pure renderers ─────────────────────────────────────────────────────────────────────────────────
  js/render/*.js export (data, opts) => string; they import nothing that touches window/document
  and escape via html`` from js/lib/dom.js. Prerender markers in index.html: lager,
  schichtbuch-table, abspann, abseits. Only scripts/prerender.mjs writes inside them.

── CSS ────────────────────────────────────────────────────────────────────────────────────────────
  @layer reset, tokens, base, sections, fx, utilities; — section CSS is scoped under its section id
  or an owner prefix (.plate, .wb-, .probe-, .zr-, .esse-). Tokens only, no raw hex.
```
