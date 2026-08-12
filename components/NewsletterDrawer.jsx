"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// The sign-up drawer itself — Masthead.jsx mounts one instance (via
// Newsletter.jsx, which supplies `tagline` and the actual Supascribe
// embed as `children`) alongside every masthead, so it's present on
// every page the Subscribe button appears on, not just the homepage.
// Was a static full-width band, in-page-flow, homepage (and article
// pages) only; this is a fixed overlay instead, triggered from anywhere.
//
// Open state is driven entirely by the URL hash (`#newsletter`), not
// local click handling on the Subscribe button itself: MastheadNav's
// Subscribe link is a plain `<Link href="#newsletter">` (see its own
// comment), which needs no client-side code of its own to open this —
// a same-page hash link works whether or not this component has even
// hydrated yet, and it means Subscribe can stay a genuinely static
// server-rendered link rather than needing MastheadNav to become a
// Client Component just for this one button. Closing clears the hash
// again (via replaceState, not another navigation) so reload/back
// doesn't reopen it, and the drawer still fully supports Escape/
// backdrop-click/close-button on top of that.
export default function NewsletterDrawer({ tagline, children }) {
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef(null);

  const close = useCallback(() => {
    setOpen(false);
    if (typeof window !== "undefined" && window.location.hash === "#newsletter") {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  // Checks the hash once on mount (so a direct link to /#newsletter, or
  // a page reload while it's open, opens the drawer immediately) and
  // again on every hashchange after that — covers both the Subscribe
  // link itself and any other in-page link that might point at
  // #newsletter (PuzzlesSection/Newsletter's old anchor convention).
  useEffect(() => {
    function syncFromHash() {
      setOpen(window.location.hash === "#newsletter");
    }
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();

    function onKeyDown(e) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);

    // Locks background scroll while the drawer's open — otherwise the
    // page behind it keeps scrolling under a fixed-position overlay,
    // which reads as broken rather than modal.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  return (
    <>
      <div
        onClick={close}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-ink/50 transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      {/* translate-x-full at rest, not display:none/unmounted — the
          Supascribe embed div inside `children` needs to stay in the DOM
          from first paint so its loader script (which scans for it once,
          see Newsletter.jsx) always finds it, regardless of whether
          anyone's opened the drawer yet. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Newsletter sign-up"
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-river text-paper shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full overflow-y-auto px-6 py-8 sm:px-8 sm:py-10 flex flex-col">
          <button
            ref={closeButtonRef}
            type="button"
            onClick={close}
            aria-label="Close"
            className="self-end font-sans text-2xl leading-none text-paper/80 hover:text-paper -mt-2 -mr-2 p-2"
          >
            ×
          </button>
          <h2 className="font-display font-700 text-2xl sm:text-3xl mt-2">Get the newsletter</h2>
          {tagline && (
            <p className="font-sans text-xs tracking-[0.1em] uppercase text-paper/70 mt-2">{tagline}</p>
          )}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </>
  );
}
