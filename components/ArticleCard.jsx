import Link from "next/link";
import Image from "next/image";
import CoverArt from "./CoverArt";
import { focalPointStyle } from "@/lib/media";

export default function ArticleCard({ article, size = "regular" }) {
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
      <Link href={`/article/${article.slug}`} className="group block overflow-hidden border border-steel/25 hover:border-ink transition-colors">
        <div className="grid sm:grid-cols-2 sm:min-h-[360px]">
          <div className="px-6 sm:px-10 py-8 sm:py-10 flex flex-col justify-center">
            <p className="font-sans text-xs tracking-[0.14em] uppercase mb-3 text-river">
              {article.category}
            </p>
            <h3 className="font-display font-700 text-3xl sm:text-4xl text-ink leading-tight underline-offset-4 group-hover:underline group-active:underline">
              {article.title}
            </h3>
            {article.dek && <p className="font-body text-base sm:text-lg text-ink/70 mt-3">{article.dek}</p>}
            {article.author && <p className="font-sans text-sm text-ink/70 mt-3">{article.author}</p>}
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
            <CoverArt category={article.category} className="aspect-[4/3] sm:h-full" />
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
      <p className="font-sans text-xs tracking-[0.14em] uppercase mb-2 text-river">
        {article.category}
      </p>
      <h3 className="font-display font-700 text-lg sm:text-xl text-ink leading-tight underline-offset-4 group-hover:underline group-active:underline">
        {article.title}
      </h3>
      <p className="font-body text-sm text-steel mt-2 hidden sm:block">{article.dek}</p>
      <p className="font-sans text-xs text-steel mt-3">{article.author}</p>
    </Link>
  );
}
