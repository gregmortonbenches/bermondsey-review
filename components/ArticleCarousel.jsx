import Link from "next/link";
import Image from "next/image";
import CoverArt from "./CoverArt";
import SectionHeader from "./SectionHeader";
import { categoryFamily } from "@/lib/articles";
import { carouselWidthVars } from "@/lib/carouselLayout";
import { focalPointStyle } from "@/lib/media";
import { SECTION_HEADER_DEFAULTS } from "@/lib/sections";

/**
 * NO LONGER RENDERED ANYWHERE. The homepage section this used to fill
 * (type "carousel") now renders ArticleGrid — a grid of large square
 * tiles — instead, in both HomePageBody.jsx and the admin layout canvas.
 * Kept in the tree rather than deleted because a couple of the site's
 * shared conventions still point here as their explanation (the `xs:`
 * breakpoint in tailwind.config.js, `justify-safe-center` in
 * globals.css/CartoonsSection.jsx), and because switching the homepage
 * back is otherwise a one-line change. Safe to delete once those
 * comments are rehomed.
 *
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
export default function ArticleCarousel({ articles, mobileCount, desktopCount, headerTitle, headerDescription, hideHeaderDescription }) {
  const widthVars = carouselWidthVars(mobileCount, desktopCount, { defaultMobile: "68%", defaultDesktop: "27%" });
  return (
    <section id="carousel" className="pb-10 scroll-mt-24" style={widthVars || undefined}>
      <SectionHeader
        title={headerTitle || SECTION_HEADER_DEFAULTS.carousel.title}
        description={hideHeaderDescription ? "" : headerDescription || SECTION_HEADER_DEFAULTS.carousel.description}
      />
      {/* justify-safe-center (globals.css) — see its own comment for
          why this needed to be plain CSS rather than a Tailwind
          arbitrary value, and why `safe center` rather than plain
          `center`: centres the row when it's short enough to fit (e.g.
          only one or two articles published so far) without the
          classic flex/overflow trap where centring pushes the first
          item(s) out of scroll reach once there are enough to
          overflow. */}
      <div className="flex justify-safe-center overflow-x-auto snap-x snap-mandatory gap-0 -mx-4 px-4 sm:mx-0 sm:px-0 pb-4 [scrollbar-width:thin]">
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
                <div className="relative overflow-hidden aspect-[4/3]">
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
                <CoverArt category={article.category} className="aspect-[4/3]" />
              )}
              <p className={`font-sans text-[11px] tracking-[0.12em] uppercase mt-3 ${accent === "brick" ? "text-brick" : "text-river"}`}>
                {article.category}
              </p>
              <h3 className="font-display font-700 text-lg text-ink leading-snug mt-1 underline-offset-4 group-hover:underline group-active:underline">
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
