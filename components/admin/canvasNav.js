// Real production components rendered inside an admin editing canvas
// (Masthead, Footer, article/nav links) carry real <a href> links —
// without this, clicking any of them navigates away from the canvas
// entirely, exactly as it does on the live site. Caught in the capture
// phase so it runs before the link's own navigation; scoped to just
// anchor clicks so the admin's own button controls (never <a>s) are
// completely unaffected. Real navigation still works from a canvas's
// own "Preview" link, which opens the actual page.
//
// A link with data-canvas-allow is the one deliberate exception — an
// in-canvas pointer to a *different admin screen* (e.g. "manage rounds
// in Guess the Spot" next to a read-only round preview), not a public
// link a visitor would follow. Suppressing that too would make it
// permanently unreachable from inside the canvas.
export function suppressCanvasNavigation(e) {
  const link = e.target.closest("a");
  if (link && !link.dataset.canvasAllow) e.preventDefault();
}

// Maps a public link's own href to what clicking it should actually do
// inside /admin/layout, now that plain suppression isn't the only
// outcome — see AdminLayoutTabs.jsx's own wrapping click handler, which
// tries this first and only falls back to suppressCanvasNavigation's
// "do nothing" above for anything this doesn't recognise.
//
// Hrefs are matched on their path, hash stripped off separately —
// nav_links are admin-editable text, not a fixed enum, so this is a
// best-effort map of the destinations that already have a real place to
// land inside this admin (a tab, or a section on the Home tab), not an
// exhaustive router. An unrecognised path (a page with no tab yet, like
// /crossword; a truly external link) still resolves to nothing, and
// falls through to the same safe "do nothing" as before this existed.
const HREF_TO_TAB = {
  "/": "home",
  "/latest": "archive",
  "/latest-article": "archive",
  "/geoguesser": "geoguesser",
  "/submissions": "submissions",
};

export function resolveCanvasNav(href) {
  if (!href) return null;
  const [path, hash] = href.split("#");
  const tab = HREF_TO_TAB[path || "/"];
  if (tab) return { type: "tab", tab };
  // A same-page anchor pointing at the site root (`/#puzzles`,
  // `/#cartoons` — the only shape nav_links actually uses today) means
  // "scroll to this section," not "leave /admin/layout for the real
  // homepage" — letting the browser's own anchor navigation run would
  // do the latter, since the href's path is `/`, not the current
  // `/admin/layout`.
  if (hash && (path === "" || path === "/")) return { type: "scroll", id: hash };
  return null;
}
