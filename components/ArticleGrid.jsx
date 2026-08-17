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
              // No category tint any more: those were pale washes of
              // brick/river filling the whole square, which read as
              // decoration rather than as colour meaning anything. A
              // barely-there grey gives the tile presence without
              // spending colour on it — grey is structure here, the way
              // the hairlines are.
              //
              // Left-aligned, not centred: the section header above is
              // left-aligned under its rule now, and centred tiles under
              // a left-aligned header read as two different systems.
              //
              // aspect-square: two equal-width grid siblings sharing one
              // fixed ratio come out the same height for free, with no
              // need to stretch either to match its sibling.
              className="group aspect-square flex flex-col items-start text-left px-6 pt-8 pb-4 sm:px-8 sm:pt-10 border border-steel/25 hover:border-ink transition-colors overflow-hidden bg-steel/[0.05]"
            >
              {/* line-clamped: a square is a fixed height budget, unlike
                  a card that can just grow — an unbounded title/dek would
                  quietly eat the room the illustration needs. */}
              <h3 className="font-display font-700 text-xl sm:text-2xl text-ink leading-[1.15] line-clamp-2 group-hover:underline underline-offset-4">
                {article.title}
              </h3>
              {article.dek && (
                <p className="font-body text-sm text-ink/70 mt-2 line-clamp-2 max-w-[46ch]">{article.dek}</p>
              )}
              {/* min-h-0 overrides a flex item's default min-height:auto,
                  so this yields space to the text above it rather than
                  pushing the tile past its own aspect-ratio height.
                  The artwork runs large and low, the way a product shot
                  does in Apple's own tiles — the lower half of the tile
                  is the picture, not a small centred motif with dead
                  colour around it. */}
              {/* Drawn in ink, not the category's brick/river — every
                  illustration being coloured by default is what made the
                  page read as colourful rather than as black and white
                  with colour used for something. */}
              <div className="flex-1 min-h-0 w-full mt-4">
                <CoverArt
                  category={article.category}
                  className="h-full"
                  bare
                  artClass="w-auto h-full max-w-[58%]"
                  toneClass="text-ink"
                />
              </div>
            </Link>
        ))}
      </div>
    </section>
  );
}
