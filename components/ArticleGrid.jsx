import Link from "next/link";
import { categoryFamily } from "@/lib/articles";
import CoverArt from "./CoverArt";

/**
 * MOCKUP — not yet wired into HomePageBody.jsx. A large-square-tile
 * alternative to ArticleCarousel's horizontal scroll rail: two tiles per
 * row on desktop, stacked on mobile.
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
 * Trades breadth for presence: a 2-up grid shows far fewer articles at a
 * glance than the scrolling carousel it'd replace, so this reads best as
 * a small "recent highlights" spread rather than the site's only way to
 * reach older content.
 */
export default function ArticleGrid({ articles }) {
  if (!articles || articles.length === 0) return null;

  return (
    // A thin gap, not the site's usual generous gap-6/gap-8 — Apple's own
    // tile grids run nearly edge-to-edge with barely a seam of page
    // background between them, a deliberately tighter feel than this
    // paper's normal whitespace-heavy spacing (PuzzlesSection, the
    // article carousel, etc).
    <div className="grid sm:grid-cols-2 gap-2 sm:gap-3">
      {articles.map((article) => {
        // The category still drives the tile's tint and its illustration
        // — it just isn't spelled out as a label any more.
        const accent = categoryFamily(article.category);
        const tint = accent === "brick" ? "bg-brick/[0.12]" : "bg-river/[0.1]";

        return (
          <Link
            key={article.slug}
            href={`/article/${article.slug}`}
            // aspect-square: two equal-width grid siblings sharing one
            // fixed ratio come out the same height for free, with no need
            // to stretch either to match its sibling.
            className={`group aspect-square flex flex-col items-center text-center px-6 pt-8 pb-4 sm:px-8 sm:pt-10 border border-steel/25 hover:border-ink transition-colors overflow-hidden ${tint}`}
          >
            {/* line-clamped: a square is a fixed height budget, unlike a
                card that can just grow — an unbounded title/dek would
                quietly eat the room the illustration needs. */}
            <h3 className="font-display font-700 text-xl sm:text-2xl text-ink leading-[1.15] line-clamp-2 group-hover:underline underline-offset-4">
              {article.title}
            </h3>
            {article.dek && (
              <p className="font-body text-sm text-ink/70 mt-2 line-clamp-2 max-w-[46ch]">{article.dek}</p>
            )}
            {/* min-h-0 overrides a flex item's default min-height:auto,
                so this yields space to the text above it rather than
                pushing the tile past its own aspect-ratio height. */}
            {/* The artwork runs large and low in the tile, the way a
                product shot does in Apple's own — the tile's whole lower
                half is the picture, not a small centred motif with dead
                colour around it. */}
            <div className="flex-1 min-h-0 w-full mt-4">
              <CoverArt category={article.category} className="h-full" bare artClass="w-auto h-full max-w-[70%]" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
