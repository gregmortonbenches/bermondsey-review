import Link from "next/link";
import Image from "next/image";
import SectionHeader from "./SectionHeader";
import { SECTION_HEADER_DEFAULTS } from "@/lib/sections";

/**
 * Horizontal card format — icon beside the text rather than stacked
 * above it, no filled background colour. A prior version used a New
 * Yorker-style flat colour block per card (a tint pulled from the
 * site's own brick/river palette); with only ever two games to show,
 * that read as two oversized, overly prominent tiles rather than a
 * modest "here are the games" module. This is shorter (no more forced
 * min-height — the row sizes to its own content) and much quieter.
 *
 * The flat grey fill matches the same `bg-steel/[0.05] hover:bg-steel/
 * [0.09]` every other card and tile on the site uses now (ArticleCard,
 * ArticleGrid) — this used to be a hairline border instead, from before
 * that flat-fill idiom existed elsewhere. The border wasn't wrong on its
 * own terms, but it had become the one card format on the page still
 * drawing a line around itself while everything else defines its edge
 * with fill alone.
 * An admin can still swap either illustration for an uploaded photo from
 * the homepage layout builder's Puzzles & Games settings — see
 * PuzzleCardFields in components/admin/LayoutCanvas.jsx — the default
 * line drawing only shows when no image has been set.
 */
const GAMES = [
  {
    slug: "crossword",
    title: "The crossword",
    description: "Fourteen clues, all with a Bermondsey twist. New grid every issue.",
    cta: "Solve the latest puzzle",
    Illustration: () => (
      <svg viewBox="0 0 120 120" className="w-16 h-16 sm:w-20 sm:h-20" aria-hidden="true">
        <g fill="none" stroke="#1C1B17" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* a plain crossword grid — no character, just the puzzle itself */}
          <rect x="20" y="20" width="80" height="80" />
          <line x1="36" y1="20" x2="36" y2="100" />
          <line x1="52" y1="20" x2="52" y2="100" />
          <line x1="68" y1="20" x2="68" y2="100" />
          <line x1="84" y1="20" x2="84" y2="100" />
          <line x1="20" y1="36" x2="100" y2="36" />
          <line x1="20" y1="52" x2="100" y2="52" />
          <line x1="20" y1="68" x2="100" y2="68" />
          <line x1="20" y1="84" x2="100" y2="84" />
          <rect x="36" y="20" width="16" height="16" fill="#1C1B17" stroke="none" />
          <rect x="68" y="36" width="16" height="16" fill="#1C1B17" stroke="none" />
          <rect x="20" y="52" width="16" height="16" fill="#1C1B17" stroke="none" />
          <rect x="84" y="68" width="16" height="16" fill="#1C1B17" stroke="none" />
          <rect x="52" y="84" width="16" height="16" fill="#1C1B17" stroke="none" />
        </g>
      </svg>
    ),
  },
  {
    slug: "geoguesser",
    title: "Bermy on the map, SE1",
    description: "Five photos from around SE16. How many can you place?",
    cta: "Play today's round",
    Illustration: () => (
      <svg viewBox="0 0 120 120" className="w-16 h-16 sm:w-20 sm:h-20" aria-hidden="true">
        <g fill="none" stroke="#1C1B17" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Tower Bridge — the landmark most people would actually place
              near Bermondsey, rather than an unrelated character */}
          <path d="M6 92 Q18 86 30 92 T54 92 T78 92 T102 92 T114 92" />
          <rect x="24" y="34" width="20" height="58" />
          <path d="M24 34 L34 18 L44 34" />
          <line x1="34" y1="18" x2="34" y2="34" />
          <rect x="76" y="34" width="20" height="58" />
          <path d="M76 34 L86 18 L96 34" />
          <line x1="86" y1="18" x2="86" y2="34" />
          <line x1="44" y1="46" x2="76" y2="46" />
          <line x1="44" y1="54" x2="76" y2="54" />
          <line x1="0" y1="76" x2="24" y2="76" />
          <line x1="96" y1="76" x2="120" y2="76" />
          <line x1="44" y1="76" x2="76" y2="76" />
          <line x1="0" y1="82" x2="24" y2="82" />
          <line x1="96" y1="82" x2="120" y2="82" />
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
export default function PuzzlesSection({ overrides, headerTitle, headerDescription, hideHeaderDescription }) {
  return (
    <section id="puzzles" className="pb-14 scroll-mt-24">
      <SectionHeader
        title={headerTitle || SECTION_HEADER_DEFAULTS.puzzles.title}
        description={hideHeaderDescription ? "" : headerDescription || SECTION_HEADER_DEFAULTS.puzzles.description}
      />
      <div className="grid sm:grid-cols-2 gap-6">
        {GAMES.map(({ slug, title, description, cta, Illustration }) => {
          const override = overrides?.[slug];
          return (
            <Link
              key={slug}
              href={`/${slug}`}
              className="group flex items-center gap-5 sm:gap-6 p-5 sm:p-6 bg-steel/[0.05] hover:bg-steel/[0.09] transition-colors"
            >
              <div className="shrink-0">
                {override?.imageUrl ? (
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 overflow-hidden">
                    <Image src={override.imageUrl} alt="" fill sizes="80px" className="object-cover" />
                  </div>
                ) : (
                  <Illustration />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-display font-700 text-lg sm:text-xl text-ink">{override?.title || title}</h3>
                <p className="font-body text-steel mt-1">{override?.description || description}</p>
                <span className="font-sans text-sm font-600 text-ink underline-offset-4 group-hover:underline mt-2 inline-block">
                  {override?.cta || cta} »
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
