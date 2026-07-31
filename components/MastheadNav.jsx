"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

function HamburgerIcon({ open }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="#1C1B17" strokeWidth="2" strokeLinecap="round">
      {open ? (
        <>
          <line x1="5" y1="5" x2="19" y2="19" />
          <line x1="19" y1="5" x2="5" y2="19" />
        </>
      ) : (
        <>
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </>
      )}
    </svg>
  );
}

export default function MastheadNav({ logoUrl, siteTitle, siteTagline, links }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const wordmark = logoUrl ? (
    <div className="relative h-10 sm:h-14 w-32 sm:w-44 shrink-0">
      <Image src={logoUrl} alt={siteTitle} fill sizes="176px" className="object-contain sm:object-center" priority />
    </div>
  ) : (
    <div className="min-w-0 sm:text-center">
      <h1 className="font-display font-700 text-xl sm:text-[2.5rem] leading-tight sm:leading-none tracking-tight sm:tracking-[0.03em] sm:uppercase text-ink">
        {siteTitle}
      </h1>
      {siteTagline && (
        <p className="hidden sm:block font-sans text-[11px] sm:text-xs tracking-[0.16em] uppercase text-steel mt-2">
          {siteTagline}
        </p>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile: title left, hamburger + Subscribe right (kept
          left-aligned rather than centred — the site title is
          admin-editable free text with no length limit, and centring it
          alongside a shrink-0 button cluster on a narrow screen is what
          previously forced it to truncate; wrapping to two lines here
          still degrades better than a forced centred layout would). */}
      <div className="flex sm:hidden items-center justify-between py-4 hairline-b gap-2">
        <Link href="/" className="group flex items-center gap-3 min-w-0">
          {wordmark}
        </Link>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            className="p-1 -mr-1"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <HamburgerIcon open={menuOpen} />
          </button>
          <Link
            href="/#newsletter"
            className="font-sans text-sm font-600 bg-brick text-paper px-4 py-2 rounded-sm hover:bg-ink transition-colors whitespace-nowrap"
          >
            Subscribe
          </Link>
        </div>
      </div>

      {/* Desktop: wordmark dead-centre, Subscribe pinned right — a true
          3-column grid rather than flex + margin-auto, so the title's
          centring doesn't shift with how wide the right-hand button is. */}
      <div className="hidden sm:grid grid-cols-[1fr_auto_1fr] items-center py-6 hairline-b gap-4">
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

      {/* Desktop nav — a centred row under its own hairline, serif to
          match the wordmark rather than the sans used for body chrome
          elsewhere (buttons, labels) — this is the paper's own section
          list, not an interface control. */}
      <nav className="hidden sm:flex flex-wrap items-center justify-center gap-x-8 gap-y-2 py-4 hairline-b font-display text-sm text-ink">
        {links.map((link) => (
          <Link key={link.label} href={link.href} className="hover:text-river transition-colors">
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Mobile nav — only rendered once the hamburger is tapped */}
      {menuOpen && (
        <nav className="sm:hidden flex flex-col gap-3 py-4 font-sans text-base text-ink">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="hover:text-river transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
