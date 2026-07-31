import Link from "next/link";

/**
 * Colour-card format inspired by the New Yorker's "Puzzles & Games" rail:
 * a flat colour block, a single cute line-drawn character, title,
 * one-line description, and a "Play" link pinned to the bottom.
 * Card colours are tints pulled from the site's own palette so it still
 * reads as the Bermondsey Review, not a copy of the reference.
 */
const GAMES = [
  {
    slug: "crossword",
    title: "The Crossword",
    description: "Fourteen clues, all with a Bermondsey twist. New grid every issue.",
    cta: "Solve the latest puzzle",
    bg: "color-mix(in srgb, var(--color-river, #2B4C73) 45%, white)",
    Illustration: () => (
      <svg viewBox="0 0 120 120" className="w-24 h-24" aria-hidden="true">
        <g fill="none" stroke="#1C1B17" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* pigeon body */}
          <circle cx="46" cy="70" r="26" />
          <circle cx="46" cy="42" r="15" />
          <circle cx="52" cy="38" r="2" fill="#1C1B17" />
          <path d="M60 41 L68 44 L60 47 Z" fill="#1C1B17" />
          {/* pencil */}
          <line x1="76" y1="86" x2="94" y2="30" />
          <path d="M91 39 L97 41 L94 30 Z" fill="#1C1B17" />
          {/* crossword grid held under wing */}
          <rect x="24" y="82" width="36" height="30" />
          <line x1="36" y1="82" x2="36" y2="112" />
          <line x1="48" y1="82" x2="48" y2="112" />
          <line x1="24" y1="92" x2="60" y2="92" />
          <line x1="24" y1="102" x2="60" y2="102" />
          <rect x="24" y="92" width="12" height="10" fill="#1C1B17" />
          <rect x="48" y="102" width="12" height="10" fill="#1C1B17" />
        </g>
      </svg>
    ),
  },
  {
    slug: "geoguesser",
    title: "Guess the Spot",
    description: "Five photos from around SE16. How many can you place?",
    cta: "Play today's round",
    bg: "color-mix(in srgb, var(--color-brick, #9C6B42) 55%, white)",
    Illustration: () => (
      <svg viewBox="0 0 120 120" className="w-24 h-24" aria-hidden="true">
        <g fill="none" stroke="#1C1B17" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* fox head */}
          <path d="M35 30 L48 52 L22 52 Z" />
          <path d="M85 30 L98 52 L72 52 Z" />
          <path d="M60 34 C 84 34 92 58 92 72 C 92 92 76 104 60 104 C 44 104 28 92 28 72 C 28 58 36 34 60 34 Z" />
          <circle cx="50" cy="70" r="2.4" fill="#1C1B17" />
          <circle cx="70" cy="70" r="2.4" fill="#1C1B17" />
          <path d="M54 84 Q60 90 66 84" />
          {/* compass held in front */}
          <circle cx="60" cy="98" r="14" fill="#FFFFFF" />
          <line x1="60" y1="90" x2="60" y2="106" />
          <line x1="52" y1="98" x2="68" y2="98" />
          <path d="M60 92 L63 98 L60 104 L57 98 Z" fill="#1C1B17" />
        </g>
      </svg>
    ),
  },
];

// The default title/description/cta per game, keyed by slug — exported
// so the layout builder's settings panel can show them as placeholders
// (making it obvious what ships if a field is left blank) without
// duplicating the copy.
export const PUZZLE_DEFAULTS = Object.fromEntries(GAMES.map((g) => [g.slug, { title: g.title, description: g.description, cta: g.cta }]));

// `overrides` (from the homepage layout's "puzzles" section — see
// lib/layout.js and components/admin/LayoutCanvas.jsx) lets an admin
// customise each card's title/description/cta without touching code; a
// missing or blank field falls back to the default above, so an
// unconfigured site looks exactly as it always has.
export default function PuzzlesSection({ overrides }) {
  return (
    <section id="puzzles" className="py-14 hairline-b scroll-mt-24">
      <div className="text-center mb-8">
        <h2 className="font-display font-700 text-3xl sm:text-4xl text-ink">Puzzles &amp; Games</h2>
      </div>
      <div className="grid sm:grid-cols-2 gap-6">
        {GAMES.map(({ slug, title, description, cta, bg, Illustration }) => {
          const override = overrides?.[slug];
          return (
            <Link
              key={slug}
              href={`/${slug}`}
              className="group flex flex-col items-center justify-between text-center rounded-md p-6 min-h-[280px] transition-transform hover:-translate-y-1"
              style={{ backgroundColor: bg }}
            >
              <div>
                <h3 className="font-display font-700 text-2xl text-ink">{override?.title || title}</h3>
                <p className="font-body text-ink/80 mt-2 max-w-[26ch] mx-auto">{override?.description || description}</p>
              </div>
              <Illustration />
              <span className="font-sans text-sm font-600 text-ink underline-offset-4 group-hover:underline">
                {override?.cta || cta} »
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
