import Image from "next/image";
import Link from "next/link";
import { HeaderArchesBackground, HeaderTrain } from "./HeaderArches";

// No "use client" any more — the hamburger/collapsible-menu toggle was
// the only reason this needed client-side state at all. Mobile now
// shows the nav links directly under the wordmark, same as desktop,
// rather than hiding them behind a menu button — so there's nothing
// left here that needs interactivity.
export default function MastheadNav({ logoUrl, siteTitle, links }) {
  const wordmark = logoUrl ? (
    <div className="relative h-10 sm:h-14 w-32 sm:w-44 shrink-0">
      <Image src={logoUrl} alt={siteTitle} fill sizes="176px" className="object-contain sm:object-center" priority />
    </div>
  ) : (
    <div className="min-w-0 sm:text-center">
      <h1 className="font-display font-700 text-xl sm:text-[2.5rem] leading-tight sm:leading-none tracking-tight sm:tracking-[0.03em] sm:uppercase text-ink">
        {siteTitle}
      </h1>
    </div>
  );

  return (
    <>
      {/* Mobile: just the title now — no Subscribe button, no hamburger.
          Left-aligned rather than centred: the site title is
          admin-editable free text with no length limit, and past a
          certain length a centred title reads worse on a narrow column
          than a left-aligned one that's free to wrap.
          `isolate` matters here, not just `relative`: HeaderArchesBackground
          sits at z-[-10] to stay behind the title, but a `relative` element
          with no z-index of its own doesn't establish a new stacking
          context — without `isolate`, that negative z-index escapes this
          row entirely and the arches render behind the header's own
          background instead, invisible. */}
      <div className="relative isolate overflow-hidden flex sm:hidden items-center py-4 hairline-b gap-2">
        <HeaderArchesBackground id="mobile" />
        <HeaderTrain />
        <Link href="/" className="group flex items-center gap-3 min-w-0">
          {wordmark}
        </Link>
      </div>

      {/* Desktop: wordmark dead-centre, Subscribe pinned right — a true
          3-column grid rather than flex + margin-auto, so the title's
          centring doesn't shift with how wide the right-hand button is. */}
      <div className="relative isolate overflow-hidden hidden sm:grid grid-cols-[1fr_auto_1fr] items-center py-6 hairline-b gap-4">
        <HeaderArchesBackground id="desktop" parapetY="78%" />
        <HeaderTrain topY="78%" />
        <span aria-hidden="true" />
        <Link href="/" className="group justify-self-center">
          {wordmark}
        </Link>
        <div className="justify-self-end">
          <Link
            href="/#newsletter"
            className="font-sans text-sm font-600 bg-brick text-paper px-4 py-2 rounded-sm hover:bg-ink transition-colors whitespace-nowrap"
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
