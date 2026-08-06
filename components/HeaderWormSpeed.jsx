"use client";

import { useEffect } from "react";

// The worm's crossing always took a fixed ~7s regardless of viewport
// width, but the *distance* it has to cover doesn't stay fixed — the
// crossing endpoint (`translateX(110vw)` in globals.css) is relative to
// the viewport, so a wide desktop window makes it travel much further
// than a narrow phone in that same fixed time. Same time, different
// distance reads as different speed, even though nothing about the
// animation itself changed between screens.
//
// Genuinely constant speed needs the animation's own *duration* to
// scale with viewport width too — not expressible in pure CSS (there's
// no way to derive a time value from a length value in calc()), so
// this computes it in JS instead and hands it to the stylesheet as a
// couple of CSS custom properties on the document root, which every
// `.header-worm` instance (mobile row, desktop row — only one is ever
// visible at a time, both inherit from the same root) reads via
// `var(...)` in globals.css. Falls back to fixed values there before
// this runs (or if JS is disabled) — kept in sync with whatever
// WORM_SPEED_PX_PER_S computes for a ~1280px desktop, see its own
// comment.
//
// Renders nothing itself — this component's only job is setting those
// two variables, once on mount and again on resize.
const WORM_SPEED_PX_PER_S = 180; // slowed slightly again (was 210, originally 245.8px/s — see git history) — applies equally on every screen size, since this one constant drives the whole calculation below regardless of viewport
const HOLD_FRACTION = 0.77; // must match header-worm-cross's own 77%/100% keyframe split in globals.css
const CROSS_FRACTION = 1 - HOLD_FRACTION;
const FIRST_CROSSING_AT_S = 0.5; // must match the intent the fallback animation-delay in globals.css was tuned for

function updateWormSpeedVars() {
  // Two instances exist (MastheadNav's mobile/desktop rows) but only
  // one is ever visible — display:none collapses the other's
  // getBoundingClientRect() to zero, which is exactly how "find the
  // real one" works here without needing to know which breakpoint is
  // active.
  const worm = Array.from(document.querySelectorAll(".header-worm")).find(
    (el) => el.getBoundingClientRect().width > 0
  );
  if (!worm) return;
  const wormWidth = worm.getBoundingClientRect().width;

  const crossDistance = window.innerWidth * 1.1 + wormWidth;
  const crossDuration = crossDistance / WORM_SPEED_PX_PER_S;
  const cycleDuration = crossDuration / CROSS_FRACTION;
  const holdDuration = cycleDuration * HOLD_FRACTION;
  // Same negative-delay technique as the fixed value it replaces: how
  // much of the hold phase is left once FIRST_CROSSING_AT_S has been
  // carved out of it, expressed as a negative offset into the cycle.
  const delay = -(holdDuration - FIRST_CROSSING_AT_S);

  const root = document.documentElement.style;
  root.setProperty("--worm-cycle-duration", `${cycleDuration.toFixed(3)}s`);
  root.setProperty("--worm-cross-delay", `${delay.toFixed(3)}s`);
}

export default function HeaderWormSpeed() {
  useEffect(() => {
    updateWormSpeedVars();
    // Debounced, not on every resize event — a browser fires many of
    // these per second during an active drag-resize, and re-measuring
    // that often buys nothing (the worm's crossing is a single ~7s
    // animation, not something that needs frame-accurate updates).
    let timer;
    function handleResize() {
      clearTimeout(timer);
      timer = setTimeout(updateWormSpeedVars, 200);
    }
    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return null;
}
