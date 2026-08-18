import Link from "next/link";
import Image from "next/image";
import CoverArt from "./CoverArt";
import Headline from "./Headline";
import { focalPointStyle } from "@/lib/media";
import { categoryInk } from "@/lib/categories";
import { formatCardDate } from "@/lib/articles";

export default function ArticleCard({ article, size = "regular" }) {
  // Author and date share one credit line rather than getting a row
  // each — a middle dot between them is the standard magazine dateline,
  // and it costs no extra vertical rhythm in a card that's already
  // stacking category, headline and dek above it.
  const creditLine = [article.author, formatCardDate(article.published_at)].filter(Boolean).join(" · ");

  if (size === "featured") {
    // Same lead treatment as the article's own page (PostRenderer.jsx) —
    // a category-tinted band with the headline block and image side by
    // side, so the homepage's lead story and the piece itself feel like
    // the same design moment. Kept as a rounded card within the normal
    // content column rather than a true full-bleed band: "featured" is
    // one of several reorderable homepage sections (see LayoutCanvas.jsx),
    // and going full-bleed would mean pulling it out of that reorderable
    // flow — a bigger structural change than this was asking for.
    //
    // The category-colour wash this band used to carry is gone, same as
    // on the article page itself: a hairline box on paper instead, with
    // colour left to the category label.
    return (
      <Link
        href={`/article/${article.slug}`}
        // Same treatment as the grid tiles below it: a faint grey block
        // rather than an outlined box, so the two read as one family.
        className="group block overflow-hidden bg-steel/[0.05] hover:bg-steel/[0.09] transition-colors"
      >
        <div className="grid sm:grid-cols-2 sm:min-h-[360px]">
          <div className="px-6 sm:px-10 py-8 sm:py-10 flex flex-col justify-center">
            {/* Category ink, not the fixed river blue every kicker used to
                share — see lib/categories.js. */}
            <p className="font-sans text-xs tracking-[0.14em] uppercase mb-3" style={{ color: categoryInk(article.category) }}>
              {article.category}
            </p>
            <Headline className="font-display font-700 text-3xl sm:text-4xl text-ink leading-tight">
              {article.title}
            </Headline>
            {article.dek && <p className="font-body italic text-base sm:text-lg text-ink/70 mt-3">{article.dek}</p>}
            {creditLine && <p className="font-sans text-sm uppercase tracking-[0.06em] text-ink/70 mt-3">{creditLine}</p>}
          </div>
          {article.cover_image_url ? (
            <div className="relative aspect-[4/3] sm:aspect-auto sm:h-full">
              <Image
                src={article.cover_image_url}
                alt={article.cover_image_alt || ""}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover"
                style={focalPointStyle(article)}
              />
            </div>
          ) : (
            // `bare`: the card itself now paints the grey, and CoverArt's
            // own would stack on top of it — showing the image half as a
            // visibly darker panel than the text half.
            <CoverArt
              category={article.category}
              className="aspect-[4/3] sm:h-full p-8"
              bare
              // Fills its half of the band, matching the scale the grid
              // tiles below now draw at — the default half-size mark read
              // as a small icon next to their much larger artwork.
              artClass="w-full h-full"
            />
          )}
        </div>
      </Link>
    );
  }

  // Text-only, no thumbnail — NYRA's own listings read as a dense index,
  // not a grid of photos. The one deliberate exception is "featured"
  // above: a single lead image per page is a reasonable visual anchor,
  // repeating one in every row of every listing isn't. Tighter py-4 (was
  // py-6) since there's no longer a 96-140px-tall image setting the
  // row's minimum height.
  return (
    <Link href={`/article/${article.slug}`} className="group block py-4 hairline-b">
      <p className="font-sans text-xs tracking-[0.14em] uppercase mb-2" style={{ color: categoryInk(article.category) }}>
        {article.category}
      </p>
      <Headline className="font-display font-700 text-lg sm:text-xl text-ink leading-tight">
        {article.title}
      </Headline>
      <p className="font-body italic text-sm text-steel mt-2 hidden sm:block">{article.dek}</p>
      {creditLine && <p className="font-sans text-xs uppercase tracking-[0.06em] text-steel mt-3">{creditLine}</p>}
    </Link>
  );
}
