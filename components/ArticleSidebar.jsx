"use client";

import { useEffect, useState } from "react";

// Three presets, not a continuous slider — "medium" is deliberately the
// same 1.125rem paragraph text already used everywhere else (see
// BlockContent.jsx's own comment on --article-font-size), so a visitor
// who never touches this control sees exactly what always shipped; only
// choosing "small" or "large" changes anything.
const TEXT_SIZES = [
  { id: "small", rem: "1rem", glyphClass: "text-xs" },
  { id: "medium", rem: "1.125rem", glyphClass: "text-sm" },
  { id: "large", rem: "1.35rem", glyphClass: "text-base" },
];

// First use of localStorage in this codebase — a genuinely per-visitor
// preference, not per-article or site-wide content, so there's no
// server-side equivalent to fall back on; a fresh visitor just gets the
// "medium" default below.
const STORAGE_KEY_SIZE = "bermondsey-review:article-text-size";

function MailIcon() {
  return (
    <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.5" y="4.5" width="15" height="11" />
      <path d="M2.5 5 L10 11 L17.5 5" />
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8.5 11.5 L11.5 8.5" />
      <path d="M9.5 6 L11 4.5 A3 3 0 0 1 15.5 9 L14 10.5" />
      <path d="M10.5 14 L9 15.5 A3 3 0 0 1 4.5 11 L6 9.5" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 10.5 L8 14.5 L16 5.5" />
    </svg>
  );
}

/**
 * The article's own metadata rail — author/illustrator credits, a text-
 * size control, share, and the publish date/category. Rendered by
 * PostRenderer.jsx as a sibling of the article body, not a wrapper
 * around it — the two communicate only through --article-font-size, a
 * CSS custom property written to document.documentElement (same
 * technique HeaderWormSpeed.jsx already uses for the header worm's
 * animation speed), which BlockContent.jsx's paragraph text reads
 * regardless of where in the component tree either one actually sits —
 * plain DOM/CSS cascade, not React state, so this needed no context or
 * lifting state up into PostRenderer itself.
 *
 * Text size only affects paragraph body text, not headings, quotes, or
 * captions — matches how most "reading mode" font-size controls work
 * elsewhere (NYT, Medium, etc.): the bulk reading content resizes, the
 * piece's own designed structure doesn't.
 *
 * A reading-progress toggle (plus the fixed progress bar it turned on)
 * shipped alongside this and was removed again shortly after — this is
 * the one piece of the original reference design that didn't stay.
 */
export default function ArticleSidebar({ author, illustrator, publishedAt, category, title, slug }) {
  const [textSize, setTextSize] = useState("medium");
  const [copied, setCopied] = useState(false);

  // Reads any saved preference once on mount — after the "medium"
  // default above has already rendered, so there's a brief flash of it
  // for a returning visitor with a different saved size. Avoiding that
  // would need a blocking inline script in <head> to read localStorage
  // before first paint; not worth it for a cosmetic preference that
  // settles within one frame.
  useEffect(() => {
    const storedSize = localStorage.getItem(STORAGE_KEY_SIZE);
    if (TEXT_SIZES.some((s) => s.id === storedSize)) setTextSize(storedSize);
  }, []);

  useEffect(() => {
    const size = TEXT_SIZES.find((s) => s.id === textSize) || TEXT_SIZES[1];
    document.documentElement.style.setProperty("--article-font-size", size.rem);
    localStorage.setItem(STORAGE_KEY_SIZE, textSize);
  }, [textSize]);

  async function handleCopyLink() {
    const url = `${window.location.origin}/article/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/article/${slug}` : `/article/${slug}`;
  const mailHref = `mailto:?subject=${encodeURIComponent(title || "An article from The Bermondsey Review of Books")}&body=${encodeURIComponent(shareUrl)}`;
  const dateLabel = publishedAt
    ? new Date(publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="space-y-7">
      {author && (
        <div>
          <p className="font-sans text-xs text-steel mb-1">Author</p>
          <p className="font-display text-lg text-ink leading-snug">{author}</p>
        </div>
      )}
      {illustrator && (
        <div>
          <p className="font-sans text-xs text-steel mb-1">Illustration</p>
          <p className="font-display text-lg text-ink leading-snug">{illustrator}</p>
        </div>
      )}

      <div>
        <p className="font-sans text-xs text-steel mb-2">Text size</p>
        <div className="flex gap-1.5">
          {TEXT_SIZES.map((size) => (
            <button
              key={size.id}
              type="button"
              onClick={() => setTextSize(size.id)}
              aria-label={`${size.id} text`}
              aria-pressed={textSize === size.id}
              className={`w-8 h-8 flex items-center justify-center font-display border transition-colors ${size.glyphClass} ${
                textSize === size.id
                  ? "bg-ink text-paper border-ink"
                  : "border-steel/30 text-steel hover:border-ink hover:text-ink"
              }`}
            >
              A
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="font-sans text-xs text-steel mb-2">Share</p>
        <div className="flex gap-2">
          <a
            href={mailHref}
            aria-label="Share by email"
            title="Share by email"
            className="w-8 h-8 flex items-center justify-center border border-steel/30 text-ink hover:border-ink transition-colors"
          >
            <MailIcon />
          </a>
          <button
            type="button"
            onClick={handleCopyLink}
            aria-label="Copy link to this article"
            title="Copy link to this article"
            className={`w-8 h-8 flex items-center justify-center border transition-colors ${
              copied ? "border-river text-river" : "border-steel/30 text-ink hover:border-ink"
            }`}
          >
            {copied ? <CheckIcon /> : <LinkIcon />}
          </button>
        </div>
      </div>

      {(dateLabel || category) && (
        <div className="pt-1 space-y-1">
          {dateLabel && <p className="font-sans text-sm text-ink">{dateLabel}</p>}
          {category && <p className="font-sans text-xs tracking-[0.08em] uppercase text-steel/70">{category}</p>}
        </div>
      )}
    </div>
  );
}
