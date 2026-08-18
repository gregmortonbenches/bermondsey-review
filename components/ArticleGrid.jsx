import Link from "next/link";
import CoverArt from "./CoverArt";
import SectionHeader from "./SectionHeader";
import { SECTION_HEADER_DEFAULTS } from "@/lib/sections";

/**
 * The homepage's "more articles" section: a horizontally-scrolling rail
 * of large tiles, one row on desktop with two in view, two rows on
 * mobile with the column peeking at the edge.
 *
 * Laid out with `grid-auto-flow: column`, so items fill top-to-bottom
 * then left-to-right — on mobile the first article is the top-left tile,
 * the second sits under it, the third begins the next column, and so on.
 * That's a genuine CSS grid doing the work, not a JS carousel: the
 * scrolling is native overflow with scroll-snap, same approach the old
 * ArticleCarousel used.
 *
 * No cap on how many articles show. A wrapping grid of big tiles had one
 * (four), because every extra article cost another row of page height; a
 * rail costs none, so the limit came off with the wrapping.
 *
 * Structurally this borrows from Apple's homepage promo tiles — headline
 * leading, artwork holding the rest of the tile — but everything about
 * how it *looks* is this paper's own: square corners, flat grey, no
 * gradients, shadows or pill buttons. See CLAUDE.md.
 *
 * Takes the same header props as every other reorderable homepage
 * section, so the layout builder's title/description fields keep working.
 */
export default function ArticleGrid({ articles, headerTitle, headerDescription, hideHeaderDescription }) {
  const tiles = articles || [];
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
      {/* grid-flow-col + a fixed row count is what makes this fill
          column-major (top, bottom, next column) rather than wrapping
          into new rows. auto-cols sets each column's width, which is
          what decides how many are in view: 72% on mobile so the next
          column peeks at the edge and the rail reads as scrollable,
          and exactly half the container minus one gap on desktop, so
          two sit in view and the third is cut cleanly at the edge.

          The negative margin/padding pair lets the rail bleed to the
          screen edge on mobile while its first tile still lines up with
          the section header above it — same trick the old
          ArticleCarousel used.

          A thin gap, not the site's usual generous gap-6/gap-8: the
          tiles should read as one run of grid rather than separate
          cards floating apart. */}
      <div className="grid grid-flow-col grid-rows-2 sm:grid-rows-1 auto-cols-[72%] sm:auto-cols-[calc(50%_-_0.375rem)] gap-2 sm:gap-3 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 pb-2 [scrollbar-width:thin]">
        {tiles.map((article) => (
            <Link
              key={article.slug}
              href={`/article/${article.slug}`}
              // Portrait on mobile, square on desktop. A tile taller than
              // it is wide reads as a page rather than a panel, which is
              // the right instinct for a paper — and it gives the artwork
              // real vertical room, which matters most once the real
              // per-article illustrations replace the placeholder marks.
              // It costs scroll length, deliberately: four portrait tiles
              // are a long section, but each one is worth stopping at.
              // Desktop keeps the square, where two sit side by side at
              // half a column each and portrait would run absurdly tall.
              //
              // No border: the grey fill is what defines the tile, and an
              // outline around it as well read as a hard box drawn on the
              // page. Hover deepens the fill instead of darkening a line;
              // the headline underlines on hover too, so the affordance
              // doesn't rest on the tile alone.
              className="group snap-start flex flex-col aspect-[3/4] sm:aspect-square overflow-hidden transition-colors bg-steel/[0.05] hover:bg-steel/[0.09]"
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
                  artClass="w-full h-full"
                  toneClass="text-ink"
                />
              </div>
            </Link>
        ))}
      </div>
    </section>
  );
}
