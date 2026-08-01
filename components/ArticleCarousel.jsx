import Link from "next/link";
import Image from "next/image";
import CoverArt from "./CoverArt";
import { categoryFamily } from "@/lib/articles";
import { carouselWidthVars } from "@/lib/carouselLayout";
import { focalPointStyle } from "@/lib/media";

/**
 * Horizontal scrolling rail: image on top, title below, byline below that,
 * with a hairline divider between items — same device as the reference
 * screenshot, built with native scroll-snap rather than a JS carousel
 * library, so it works without any client-side state.
 *
 * `mobileCount`/`desktopCount` (set in the homepage layout builder) pick
 * an explicit number of items per view instead of the default 3-tier peek
 * layout (68%/46%/27% width) — see lib/carouselLayout.js. Left unset,
 * this looks exactly as it did before that setting existed.
 */
export default function ArticleCarousel({ articles, mobileCount, desktopCount }) {
  const widthVars = carouselWidthVars(mobileCount, desktopCount, { defaultMobile: "68%", defaultDesktop: "27%" });
  return (
    <section id="carousel" className="py-10 scroll-mt-24" style={widthVars || undefined}>
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-0 -mx-4 px-4 sm:mx-0 sm:px-0 pb-4 [scrollbar-width:thin]">
        {articles.map((article, i) => {
          const accent = categoryFamily(article.category);
          return (
            <Link
              key={article.slug}
              href={`/article/${article.slug}`}
              className={`group shrink-0 snap-start pr-6 mr-6 ${
                widthVars ? "w-[var(--carousel-item-w-mobile)] sm:w-[var(--carousel-item-w-desktop)]" : "w-[68%] xs:w-[46%] sm:w-[27%]"
              } ${i !== articles.length - 1 ? "border-r border-steel/25" : ""}`}
            >
              {article.cover_image_url ? (
                <div className="relative overflow-hidden rounded-sm aspect-[4/5]">
                  <Image
                    src={article.cover_image_url}
                    alt={article.cover_image_alt || ""}
                    fill
                    sizes="(max-width: 640px) 68vw, 27vw"
                    className="object-cover"
                    style={focalPointStyle(article)}
                  />
                </div>
              ) : (
                <CoverArt category={article.category} className="aspect-[4/5] rounded-sm" />
              )}
              <p className={`font-sans text-[11px] tracking-[0.12em] uppercase mt-3 ${accent === "brick" ? "text-brick" : "text-river"}`}>
                {article.category}
              </p>
              <h3
                className={`font-display font-700 text-lg text-ink leading-snug mt-1 transition-colors ${
                  accent === "brick" ? "group-hover:text-brick" : "group-hover:text-river"
                }`}
              >
                {article.title}
              </h3>
              <p className="font-sans text-xs font-600 text-steel mt-2">{article.author}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
