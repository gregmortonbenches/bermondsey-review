import Image from "next/image";
import Link from "next/link";
import { HeaderArchesBackground, HeaderWorm } from "./HeaderArches";
import HeaderWormSpeed from "./HeaderWormSpeed";

// No "use client" any more — the hamburger/collapsible-menu toggle was
// the only reason this needed client-side state at all. Mobile now
// shows the nav links directly under the wordmark, same as desktop,
// rather than hiding them behind a menu button — so there's nothing
// left here that needs interactivity.
export default function MastheadNav({ logoUrl, siteTitle, links, isHomepage = false }) {
  // A page should have exactly one <h1> — the thing that page is
  // actually about. Masthead renders on every page, so the site name
  // can only correctly be an <h1> on the homepage, where the site name
  // genuinely is what the page is about; everywhere else (an article,
  // a custom page, the crossword, a form) the real content already
  // supplies its own <h1>. But the wordmark markup below is duplicated
  // (mobile row + desktop row both stay in the DOM always, toggled only
  // by CSS `display` per breakpoint) — tagging the visible wordmark
  // itself as <h1> would put two <h1>s in the DOM at once on the
  // homepage. So the wordmark is always a plain <p>, and on the
  // homepage a single visually-hidden <h1> carries the real heading
  // semantics instead, once, outside both responsive rows.
  const wordmark = logoUrl ? (
    <div className="relative h-10 sm:h-14 w-32 sm:w-44 shrink-0">
      <Image src={logoUrl} alt={siteTitle} fill sizes="176px" className="object-contain sm:object-center" priority />
    </div>
  ) : (
    // Centred and reasonably sized at every width now — mobile used to
    // stay small and left-aligned specifically to avoid truncating next
    // to the Subscribe/hamburger button cluster; now that mobile has
    // neither (see below), that constraint's gone, so there's no reason
    // left for the title to look different on a phone than everywhere
    // else. text-2xl rather than matching desktop's 2.5rem exactly —
    // checked at 320px (the narrowest common phone width): 2.5rem and
    // text-3xl both wrap even the shorter "Bermy Review"-era names onto
    // two lines there. Wrapping itself isn't broken, though: this row's
    // pb-12 is padding *after* the title, so the row's own height (and
    // the arch band bottom-anchored to it) grows to match however many
    // lines the title takes, preserving the same ~8px gap above the arch
    // band whether it's one line or two — confirmed by measuring both
    // against the current site name, "The Bermondsey Review of Books"
    // (which wraps to two lines here). text-2xl is just the largest
    // size that still fits *this* name on one line; a longer `siteTitle`
    // (it's admin-editable) wrapping to two is an accepted, handled
    // outcome, not a bug — same as desktop's own row a bit further down.
    <div className="min-w-0 text-center">
      <p className="font-display font-700 text-2xl sm:text-[2.5rem] leading-tight sm:leading-none tracking-tight sm:tracking-[0.03em] sm:uppercase text-ink">
        {siteTitle}
      </p>
    </div>
  );

  return (
    <>
      {/* Renders nothing — just keeps .header-worm's crossing speed
          constant across viewport widths. One instance covers both
          wordmark rows below, since it only sets shared CSS variables
          on the document root. See its own comment for why this needs
          JS at all rather than being pure CSS. */}
      <HeaderWormSpeed />
      {isHomepage && <h1 className="sr-only">{siteTitle}</h1>}
      {/* Mobile: just the title now — no Subscribe button, no hamburger —
          centred, same as desktop.
          Extra bottom padding (pb-12, vs. a plain py-4) beyond what the
          title itself needs: HeaderArchesBackground's arch band is
          bottom-anchored (`bottom: 0`) so its ground level always abuts
          this row's own hairline, and the row needs enough room below
          the title for that fixed-height band to show without
          `overflow-hidden` clipping it down to a sliver. pb-12 gives an
          8px gap between the title and the parapet above the arches
          (pb-12's 48px, minus the band's own 40px height).
          `isolate` matters here, not just `relative`: HeaderArchesBackground
          sits at z-[-10] to stay behind the title, but a `relative` element
          with no z-index of its own doesn't establish a new stacking
          context — without `isolate`, that negative z-index escapes this
          row entirely and the arches render behind the header's own
          background instead, invisible. */}
      <div className="relative isolate overflow-hidden flex sm:hidden items-center justify-center pt-4 pb-12 hairline-b gap-2">
        <HeaderArchesBackground id="mobile" />
        <HeaderWorm />
        <Link href="/" className="group flex items-center gap-3 min-w-0">
          {wordmark}
        </Link>
      </div>

      {/* Desktop: wordmark dead-centre, Subscribe pinned right — a true
          3-column grid rather than flex + margin-auto, so the title's
          centring doesn't shift with how wide the right-hand button is.
          Same extra-bottom-padding reasoning as the mobile row above —
          pb-14's 56px leaves a 16px gap above the arch band. */}
      <div className="relative isolate overflow-hidden hidden sm:grid grid-cols-[1fr_auto_1fr] items-center pt-6 pb-14 hairline-b gap-4">
        <HeaderArchesBackground id="desktop" />
        <HeaderWorm />
        <span aria-hidden="true" />
        <Link href="/" className="group justify-self-center">
          {wordmark}
        </Link>
        <div className="justify-self-end">
          {/* Literal `#F5C518`, not `bg-brick` — this button used to
              track the theme's brick colour, which defaults to this
              exact bright yellow, but an admin-set (or stale-deployed)
              theme value can drift away from it; a fixed value is the
              only way to guarantee this specific button reads as bright
              yellow regardless, matching the worm/crossword-highlight/
              drop-cap precedent for this one accent elsewhere on the
              site. `text-ink`, not `text-paper` — white text on this
              light a yellow fails contrast; every other place this
              yellow is used as a background (the puzzles cards) already
              pairs it with dark text, not white. */}
          <Link
            href="/#newsletter"
            className="font-sans text-sm font-600 bg-[#F5C518] text-ink px-4 py-2 hover:bg-ink hover:text-paper transition-colors whitespace-nowrap"
          >
            Subscribe
          </Link>
        </div>
      </div>

      {/* Nav — a centred row under its own hairline, serif to match the
          wordmark rather than the sans used for body chrome elsewhere
          (buttons, labels) — this is the paper's own section list, not
          an interface control. Shown at every width now, same row as
          desktop's; flex-wrap is what keeps four items fitting on a
          narrow screen instead of needing a collapsible menu. */}
      <nav className="flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-8 gap-y-2 py-4 hairline-b font-display text-sm text-ink">
        {links.map((link) => (
          <Link key={link.label} href={link.href} className="underline-offset-4 hover:underline active:underline">
            {link.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
