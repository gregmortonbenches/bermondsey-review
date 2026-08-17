import { categoryFamily } from "@/lib/articles";

// Simple, cute, single-colour line illustrations standing in for real
// cover art per category. Swap for uploaded images in step 2 —
// each one keeps the same aspect ratio so the layout won't shift.

const ICONS = {
  Bermondsey: (
    <>
      <rect x="14" y="30" width="44" height="30" />
      <path d="M14 30 L36 14 L58 30" />
      <rect x="26" y="42" width="8" height="10" />
      <rect x="42" y="42" width="8" height="10" />
    </>
  ),
  Books: (
    <>
      <path d="M14 18 H34 V54 H14 Z" />
      <path d="M34 18 H58 V54 H34 Z" />
      <path d="M34 18 V54" />
      <path d="M19 26 H29" />
      <path d="M19 32 H29" />
    </>
  ),
  Film: (
    <>
      <rect x="14" y="18" width="44" height="32" rx="2" />
      <circle cx="36" cy="34" r="9" />
      <path d="M14 18 L24 26 M58 18 L48 26 M14 50 L24 42 M58 50 L48 42" />
    </>
  ),
  Culture: (
    <>
      <path d="M36 14 L58 26 L36 38 L14 26 Z" />
      <path d="M20 30 V44 L36 52 L52 44 V30" />
    </>
  ),
  Cartoon: (
    <>
      <circle cx="36" cy="34" r="20" />
      <circle cx="29" cy="30" r="2.2" fill="currentColor" />
      <circle cx="43" cy="30" r="2.2" fill="currentColor" />
      <path d="M27 41 Q36 47 45 41" />
    </>
  ),
};

// Brown for place-rooted pieces, blue for culture pieces — see
// categoryFamily in lib/articles.js for the reasoning. Uses currentColor
// + a Tailwind text-* class (rather than a hardcoded hex) so this
// responds automatically if the theme editor changes brick/river.
const FAMILY_STYLES = {
  brick: { tint: "bg-brick/[0.08]", textClass: "text-brick" },
  river: { tint: "bg-river/[0.07]", textClass: "text-river" },
};

// `bare` drops this component's own background tint, for a caller that
// already paints one behind it — ArticleGrid's tiles are a single
// continuous coloured square with the illustration floating inside,
// where a second tint stacked on the first would show up as a visible
// darker panel rather than one flat colour.
export default function CoverArt({ category, className = "", bare = false, artClass = "w-1/2 h-1/2" }) {
  const icon = ICONS[category] || ICONS.Culture;
  const { tint, textClass } = FAMILY_STYLES[categoryFamily(category)];
  return (
    <div className={`${bare ? "" : tint} flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 72 68" className={`${artClass} ${textClass}`} aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </g>
      </svg>
    </div>
  );
}
