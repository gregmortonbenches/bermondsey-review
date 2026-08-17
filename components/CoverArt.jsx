
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

// Grey and ink, not a colour per category family. These used to be tinted
// brick or river depending on the piece's category — but a cover-art
// placeholder appears wherever an article has no photo, which on a
// listing page means most of them, so "every illustration is coloured"
// was most of what made the site read as colourful. Colour is spent on
// small deliberate marks now (category labels, the drop cap, Subscribe);
// the artwork itself is black on grey, like a printed page.
const ART_TINT = "bg-steel/[0.05]";
const ART_TONE = "text-ink";

// `bare` drops the background tint, for a caller that already paints one
// behind it — ArticleGrid's tiles carry their own, and two stacked greys
// would show as a visibly darker panel rather than one flat surface.
// `toneClass` overrides the artwork's colour for the same sort of reason.
export default function CoverArt({ category, className = "", bare = false, artClass = "w-1/2 h-1/2", toneClass }) {
  const icon = ICONS[category] || ICONS.Culture;
  return (
    <div className={`${bare ? "" : ART_TINT} flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 72 68" className={`${artClass} ${toneClass || ART_TONE}`} aria-hidden="true">
        <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </g>
      </svg>
    </div>
  );
}
