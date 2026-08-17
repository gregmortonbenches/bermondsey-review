import Link from "next/link";
import CoverArt from "./CoverArt";
import SectionHeader from "./SectionHeader";
import { SECTION_HEADER_DEFAULTS } from "@/lib/sections";

// A grid of large squares is a lot taller per item than the scrolling
// rail it replaced, where any number of articles cost the same vertical
// space. Showing every past article as its own square would run the
// homepage to many screens, so this shows a fixed handful — two clean
// rows on desktop — and the full archive stays one click away behind the
// nav's own Reviews link (/latest).
const MAX_TILES = 4;

/**
 * The homepage's "more articles" section: two large square tiles per row
 * on desktop, stacked on mobile. Replaced ArticleCarousel (a horizontal
 * scroll-snap rail) in that slot — that component is still in the tree
 * but no longer rendered anywhere.
 *
 * Structured like Apple's own homepage promo tiles — one continuous
 * coloured square per item, headline at the top, artwork floating in the
 * space below it — rather than the split "text band above, photo band
 * below" a card usually gets here. That structure depends on the artwork
 * being a line illustration on a transparent ground (which reads as
 * floating *in* the tile's colour) rather than a rectangular photo
 * (which would need its own hard edge and re-introduce the seam). The
 * article's actual cover photo isn't used here at all — it stays at the
 * top of the piece itself.
 *
 * Everything else stays in this paper's own visual language rather than
 * Apple's: square corners, flat category tints, a hairline border, no
 * gradients, shadows, or pill buttons.
 *
 * Trades breadth for presence: a capped 2-up grid shows far fewer
 * articles than the scrolling rail it replaced, so it reads as a
 * "recent highlights" spread rather than the site's way to reach older
 * content — /latest is that.
 *
 * Takes the same header props as every other reorderable homepage
 * section, so the layout builder's own title/description fields keep
 * working exactly as they did for the carousel.
 */
export default function ArticleGrid({ articles, headerTitle, headerDescription, hideHeaderDescription }) {
  const tiles = (articles || []).slice(0, MAX_TILES);
  if (tiles.length === 0) return null;

  return (
    // id="carousel" is deliberate, not a leftover: saved page_layouts
    // rows already store this section's type as "carousel", so the id
    // stays aligned with the type (and with any existing deep link)
    // rather than the two drifting apart over what is only a change of
    // how the same section renders.
    <section id="carousel" className="pb-10 scroll-mt-24">
      <SectionHeader
        title={headerTitle || SECTION_HEADER_DEFAULTS.carousel.title}
        description={hideHeaderDescription ? "" : headerDescription || SECTION_HEADER_DEFAULTS.carousel.description}
        viewAllHref="/latest"
      />
      {/* A thin gap, not the site's usual generous gap-6/gap-8 — the
          tiles read as one block of grid rather than four separate
          cards floating apart from each other. */}
      <div className="grid sm:grid-cols-2 gap-2 sm:gap-3">
        {tiles.map((article) => (
            <Link
              key={article.slug}
              href={`/article/${article.slug}`}
              // A rectangle on mobile, a square on desktop. A full-width
              // square on a phone is enormous — four of them ran to well
              // over a screen and a half of scrolling for four headlines
              // — and the artwork doesn't need that much height to read.
              // Desktop keeps the square, where two side by side are only
              // half the column each.
              //
              // No border: the grey fill is what defines the tile, and an
              // outline around it as well read as a hard box drawn on the
              // page. Hover deepens the fill instead of darkening a line;
              // the headline underlines on hover too, so the affordance
              // doesn't rest on the tile alone.
              className="group flex flex-col aspect-[4/3] sm:aspect-square overflow-hidden transition-colors bg-steel/[0.05] hover:bg-steel/[0.09]"
            >
              <div className="px-6 pt-6 sm:px-8 sm:pt-8">
                {/* Bigger and tighter than a card headline would be: this
                    is the tile's whole subject, and at this size it holds
                    the space the way a product name does in Apple's own
                    tiles. Tight tracking and near-solid leading keep a
                    two- or three-line headline reading as one block
                    rather than a stack of separate lines. */}
                <h3 className="font-display font-700 text-[1.5rem] sm:text-[2rem] text-ink leading-[1.03] tracking-[-0.015em] line-clamp-3 group-hover:underline underline-offset-4">
                  {article.title}
                </h3>
                {article.author && (
                  <p className="font-sans text-xs text-steel mt-2 sm:mt-3">{article.author}</p>
                )}
              </div>
              {/* The artwork fills the rest of the tile and bleeds off its
                  bottom and sides rather than floating in the middle with
                  dead grey around it — scaled past its own box and
                  anchored to the bottom, so it reads as a picture the tile
                  frames rather than an icon sitting on a panel. Tried
                  scaling it past its box for a real bleed first — at the
                  scale that actually bled, it climbed into the headline,
                  so it fills its own share of the tile instead.
                  The dek is gone: at this headline size it was competing
                  rather than supporting, and the space buys the artwork
                  room instead.
                  min-h-0 lets this yield space to the text above rather
                  than pushing the tile past its own aspect ratio. */}
              <div className="flex-1 min-h-0 w-full mt-3 pb-5 sm:pb-7">
                <CoverArt
                  category={article.category}
                  className="h-full w-full"
                  bare
                  artClass="w-full h-full scale-[1.18] sm:scale-100"
                  toneClass="text-ink"
                />
              </div>
            </Link>
        ))}
      </div>
    </section>
  );
}
