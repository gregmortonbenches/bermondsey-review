import Link from "next/link";
import CoverArt from "./CoverArt";
import SectionHeader from "./SectionHeader";
import { SECTION_HEADER_DEFAULTS } from "@/lib/sections";

/**
 * The homepage's "more articles" section: a horizontally-scrolling rail
 * of large tiles, one row on desktop with two in view, two rows on
 * mobile with one column in view at a time.
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
          what decides how many are in view: 100% on mobile, so exactly
          one column (two tiles, stacked) shows at a time, and exactly
          half the container minus one gap on desktop, so two sit in
          view and the third is cut cleanly at the edge.

          No horizontal bleed on mobile any more (this used to be
          -mx-4 px-4, matching the old ArticleCarousel, so the rail's
          own edges lined up with the true screen edge rather than the
          page's usual padded column). Tried that first, but it doesn't
          actually give a clean cut: CSS padding never clips overflowing
          content, it only positions the *laid-out* track relative to
          the box, so the next column's grid track — which legitimately
          overflows past the content box by design, that's what makes it
          scrollable — kept rendering a few pixels into the reserved
          padding-right space, and that overflow is exactly as visible
          as the "real" content since only the element's own border-box
          edge (not its padding edge) is what overflow-x-auto actually
          clips. Confirmed directly: even after fixing the *initial*
          scroll position (see below), a sliver the width of the gap
          between columns kept showing on the right. Dropping the bleed
          removes the problem at the root — the rail's own border-box
          edge now *is* the padded column's edge, so there's no padding
          area left for an overflowing track to show through, and the
          cut is exact regardless of gap width. It costs the tiles their
          old edge-to-edge feel on mobile; they now sit inset the same
          amount as everything else on the page, including the section
          header directly above them.

          A thin gap, not the site's usual generous gap-6/gap-8: the
          tiles should read as one run of grid rather than separate
          cards floating apart. */}
      <div className="grid grid-flow-col grid-rows-2 sm:grid-rows-1 auto-cols-[100%] sm:auto-cols-[calc(50%_-_0.375rem)] gap-2 sm:gap-3 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:thin]">
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
              {/* Illustration leads, headline follows — reversed from an
                  earlier version with the text on top. Leading with the
                  picture reads as a proper editorial tile (an image with
                  a caption under it) rather than a text card that happens
                  to have art stapled to the bottom, and it means the
                  first thing a scrolling thumb hits is the artwork, which
                  is the whole point of these tiles once real per-article
                  illustrations replace the placeholder marks — see
                  CLAUDE.md.
                  min-h-0 lets this yield space to the text below rather
                  than pushing the tile past its own aspect ratio. Only
                  top padding, no horizontal or bottom padding: the
                  artwork fills the width of the tile edge to edge, and
                  the text block below supplies its own top margin instead
                  of this needing a matching bottom one. */}
              <div className="flex-1 min-h-0 w-full pt-6 sm:pt-8">
                <CoverArt
                  category={article.category}
                  className="h-full w-full"
                  bare
                  artClass="w-full h-full"
                  toneClass="text-ink"
                />
              </div>
              <div className="px-6 mt-3 pb-5 sm:px-8 sm:pb-7">
                {/* Bigger and tighter than a card headline would be: this
                    is the tile's whole subject, and at this size it holds
                    the space the way a product name does in Apple's own
                    tiles. Tight tracking and near-solid leading keep a
                    two- or three-line headline reading as one block
                    rather than a stack of separate lines.
                    The underline lives on an inner span, not the h3
                    itself: line-clamp-3 puts the h3 in display:-webkit-box,
                    and a hover underline painted directly on that box only
                    renders under the first line in Chrome/Safari — a span
                    is genuinely inline, so its underline follows every
                    wrapped line correctly. */}
                <h3 className="font-display font-700 text-[1.5rem] sm:text-[2rem] text-ink leading-[1.03] tracking-[-0.015em] line-clamp-3">
                  <span className="group-hover:underline underline-offset-4">{article.title}</span>
                </h3>
                {article.author && (
                  <p className="font-sans text-xs uppercase tracking-[0.06em] text-steel mt-2 sm:mt-3">{article.author}</p>
                )}
              </div>
            </Link>
        ))}
      </div>
    </section>
  );
}
