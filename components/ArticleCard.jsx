import Link from "next/link";
import Image from "next/image";
import CoverArt from "./CoverArt";
import { categoryFamily } from "@/lib/articles";

export default function ArticleCard({ article, size = "regular" }) {
  const accent = categoryFamily(article.category); // "brick" | "river"

  if (size === "featured") {
    // Same lead treatment as the article's own page (PostRenderer.jsx) —
    // a category-tinted band with the headline block and image side by
    // side, so the homepage's lead story and the piece itself feel like
    // the same design moment. Kept as a rounded card within the normal
    // content column rather than a true full-bleed band: "featured" is
    // one of several reorderable homepage sections (see LayoutCanvas.jsx),
    // and going full-bleed would mean pulling it out of that reorderable
    // flow the way the newsletter band already is — a bigger structural
    // change than this was asking for.
    const heroTint = accent === "brick" ? "bg-brick/[0.12]" : "bg-river/[0.1]";
    return (
      <Link href={`/article/${article.slug}`} className={`group block rounded-sm overflow-hidden ${heroTint}`}>
        <div className="grid sm:grid-cols-2 sm:min-h-[360px]">
          <div className="px-6 sm:px-10 py-8 sm:py-10 flex flex-col justify-center">
            <p className={`font-sans text-xs tracking-[0.14em] uppercase mb-3 ${accent === "brick" ? "text-brick" : "text-river"}`}>
              {article.category}
            </p>
            <h3
              className={`font-display font-700 text-3xl sm:text-4xl text-ink leading-tight transition-colors ${
                accent === "brick" ? "group-hover:text-brick" : "group-hover:text-river"
              }`}
            >
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
              />
            </div>
          ) : (
            <CoverArt category={article.category} className="aspect-[4/3] sm:h-full" />
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/article/${article.slug}`}
      className="group grid grid-cols-[96px_1fr] sm:grid-cols-[140px_1fr] gap-4 sm:gap-6 items-start py-6 hairline-b"
    >
      {article.cover_image_url ? (
        <div className="relative overflow-hidden rounded-sm aspect-square">
          <Image
            src={article.cover_image_url}
            alt={article.cover_image_alt || ""}
            fill
            sizes="140px"
            className="object-cover"
          />
        </div>
      ) : (
        <CoverArt category={article.category} className="aspect-square" />
      )}
      <div>
        <p className={`font-sans text-xs tracking-[0.14em] uppercase mb-2 ${accent === "brick" ? "text-brick" : "text-river"}`}>
          {article.category}
        </p>
        <h3
          className={`font-display font-700 text-lg sm:text-xl text-ink leading-tight transition-colors ${
            accent === "brick" ? "group-hover:text-brick" : "group-hover:text-river"
          }`}
        >
          {article.title}
        </h3>
        <p className="font-body text-sm text-steel mt-2 hidden sm:block">{article.dek}</p>
        <p className="font-sans text-xs text-steel mt-3">{article.author}</p>
      </div>
    </Link>
  );
}
