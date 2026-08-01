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
