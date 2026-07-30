"use client";

import { useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/", label: "The Latest" },
  { href: "/archive", label: "Reviews" },
  { href: "/archive?category=Cartoon", label: "Cartoons" },
  { href: "/#puzzles", label: "Puzzles" },
];

/**
 * Hand-drawn-style skyline strip: crane, warehouse chimneys, the Shard,
 * and a river wave — inked in the site's blue, since this mark identifies
 * the whole paper, not any one piece of content. The solid brick bar
 * directly beneath it is the wharf line: the one place brown and blue
 * meet edge-to-edge, on every page.
 */
function SkylineStrip() {
  return (
    <svg
      viewBox="0 0 1200 90"
      preserveAspectRatio="none"
      className="w-full h-[52px] sm:h-[70px] text-river"
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {/* river wave baseline */}
        <path d="M0 80 Q 30 72 60 80 T 120 80 T 180 80 T 240 80 T 300 80 T 360 80 T 420 80 T 480 80 T 540 80 T 600 80 T 660 80 T 720 80 T 780 80 T 840 80 T 900 80 T 960 80 T 1020 80 T 1080 80 T 1140 80 T 1200 80" />

        {/* warehouse block, left */}
        <rect x="40" y="40" width="70" height="40" />
        <path d="M40 40 L75 20 L110 40" />
        <rect x="60" y="55" width="14" height="18" />
        <rect x="82" y="55" width="14" height="18" />

        {/* crane */}
        <line x1="180" y1="80" x2="180" y2="20" />
        <line x1="180" y1="20" x2="240" y2="20" />
        <line x1="180" y1="30" x2="205" y2="20" />
        <line x1="230" y1="20" x2="230" y2="35" />

        {/* row of chimneys */}
        <rect x="290" y="50" width="10" height="30" />
        <rect x="308" y="42" width="10" height="38" />
        <rect x="326" y="55" width="10" height="25" />

        {/* the Shard, right of centre */}
        <path d="M560 80 L595 12 L630 80 Z" />
        <line x1="580" y1="80" x2="580" y2="35" />
        <line x1="610" y1="80" x2="610" y2="35" />

        {/* second small crane, right side */}
        <line x1="820" y1="80" x2="820" y2="25" />
        <line x1="820" y1="25" x2="870" y2="25" />
        <line x1="855" y1="25" x2="855" y2="45" />

        {/* terraced roofline, far right */}
        <path d="M950 80 L950 55 L970 55 L970 45 L990 45 L990 55 L1010 55 L1010 80" />
        <path d="M1030 80 L1030 60 L1050 60 L1050 80" />
      </g>
    </svg>
  );
}

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

export default function Masthead() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-paper">
      <SkylineStrip />
      <div className="h-[5px] bg-brick" aria-hidden="true" />
      <div className="max-w-wide mx-auto px-4 sm:px-6 lg:px-12">
        {/* On mobile this row is just the title, hamburger, and Subscribe —
            the strapline and full nav are hidden until you tap the menu. */}
        <div className="flex items-center justify-between py-4 hairline-b gap-2">
          <Link href="/" className="group">
            <h1 className="font-display font-700 text-[1.7rem] sm:text-[2.75rem] leading-none tracking-tight text-ink">
              The Bermondsey Review
            </h1>
            <p className="hidden sm:block font-sans text-[11px] sm:text-xs tracking-[0.16em] uppercase text-steel mt-1">
              Free, fortnightly, from SE16 &amp; thereabouts
            </p>
          </Link>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              className="sm:hidden p-1 -mr-1"
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

        {/* Desktop nav — always visible from sm upward */}
        <nav className="hidden sm:flex flex-wrap gap-x-5 gap-y-2 py-3 font-sans text-sm text-ink">
          {NAV_LINKS.map((link) => (
            <Link key={link.label} href={link.href} className="hover:text-river transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile nav — only rendered once the hamburger is tapped */}
        {menuOpen && (
          <nav className="sm:hidden flex flex-col gap-3 py-4 font-sans text-base text-ink">
            {NAV_LINKS.map((link) => (
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
      </div>
    </header>
  );
}
