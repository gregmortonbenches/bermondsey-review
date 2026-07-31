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

  return (
    <>
      <div className="flex items-center justify-between py-4 hairline-b gap-2">
        <Link href="/" className="group flex items-center gap-3 min-w-0">
          {logoUrl ? (
            <div className="relative h-10 sm:h-14 w-32 sm:w-44 shrink-0">
              <Image src={logoUrl} alt={siteTitle} fill sizes="176px" className="object-contain object-left" priority />
            </div>
          ) : (
            <div className="min-w-0">
              <h1 className="font-display font-700 text-xl sm:text-[2.75rem] leading-tight sm:leading-none tracking-tight text-ink">
                {siteTitle}
              </h1>
              {siteTagline && (
                <p className="hidden sm:block font-sans text-[11px] sm:text-xs tracking-[0.16em] uppercase text-steel mt-1">
                  {siteTagline}
                </p>
              )}
            </div>
          )}
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
