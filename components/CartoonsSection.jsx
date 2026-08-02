"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import CoverArt from "./CoverArt";
import SectionHeader from "./SectionHeader";
import { focalPointStyle } from "@/lib/media";

function ShareIcon() {
  return (
    <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="15" cy="5" r="2.2" />
      <circle cx="5" cy="10" r="2.2" />
      <circle cx="15" cy="15" r="2.2" />
      <path d="M6.9 8.8 L13.1 6.2 M6.9 11.2 L13.1 13.8" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10.5 L8 14.5 L16 5.5" />
    </svg>
  );
}

// Copies a direct link to this cartoon's own page — New Yorker-style,
// where a cartoon shown on the homepage still has a "share" affordance
// pointing at itself in isolation, rather than only being findable by
// scrolling back to this section. That page is the same PostRenderer
// every other post uses (a cartoon is a post like any other, just with
// its own type) — nothing new to build there, just something to link to.
function ShareButton({ slug }) {
  const [copied, setCopied] = useState(false);

  async function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/article/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Copy a link to this cartoon"
      aria-label="Copy a link to this cartoon"
      className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-colors ${
        copied ? "bg-river text-paper" : "bg-paper/90 text-ink hover:bg-paper"
      }`}
    >
      {copied ? <CheckIcon /> : <ShareIcon />}
    </button>
  );
}

/**
 * Cartoons get their own section instead of being mixed into the
 * regular article flow (the featured slot, the carousel, the archive) —
 * a single illustration doesn't read well next to a headline-and-dek
 * list row built for text-first pieces. Shown large, near the bottom of
 * the homepage, closer to how a paper actually runs its cartoon strip.
 * See lib/layout.js's withCartoonsSection for how an already-live site's
 * saved layout picks this section up automatically.
 */
export default function CartoonsSection({ cartoons }) {
  if (!cartoons?.length) return null;

  return (
    <section id="cartoons" className="pb-10 scroll-mt-24">
      <SectionHeader title="Cartoons" description="This fortnight's drawings." />
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 -mx-4 px-4 sm:mx-0 sm:px-0 pb-4 [scrollbar-width:thin]">
        {cartoons.map((cartoon) => (
          <div key={cartoon.slug} className="shrink-0 snap-start w-[80%] xs:w-[55%] sm:w-[38%] lg:w-[30%]">
            <div className="relative aspect-[4/3] rounded-sm overflow-hidden bg-steel/[0.08]">
              <Link href={`/article/${cartoon.slug}`} className="absolute inset-0 block">
                {cartoon.cover_image_url ? (
                  <Image
                    src={cartoon.cover_image_url}
                    alt={cartoon.cover_image_alt || ""}
                    fill
                    sizes="(max-width: 640px) 80vw, 30vw"
                    className="object-cover"
                    style={focalPointStyle(cartoon)}
                  />
                ) : (
                  <CoverArt category={cartoon.category} className="w-full h-full" />
                )}
              </Link>
              <ShareButton slug={cartoon.slug} />
            </div>
            <Link href={`/article/${cartoon.slug}`} className="group block mt-2">
              <p className="font-display font-700 text-base text-ink group-hover:text-river transition-colors">
                {cartoon.title}
              </p>
              {cartoon.author && <p className="font-sans text-xs text-steel mt-0.5">{cartoon.author}</p>}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
