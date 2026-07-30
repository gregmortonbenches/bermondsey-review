import Link from "next/link";
import Image from "next/image";
import CoverArt from "./CoverArt";
import { categoryFamily } from "@/lib/articles";

export default function ArticleCard({ article, size = "regular" }) {
  const isFeatured = size === "featured";
  const accent = categoryFamily(article.category); // "brick" | "river"
  const coverClassName = isFeatured ? "aspect-[4/3] order-2 sm:order-1" : "aspect-square";

  return (
    <Link
      href={`/article/${article.slug}`}
      className={`group grid ${isFeatured ? "sm:grid-cols-[1.1fr_1fr] gap-6 sm:gap-10" : "grid-cols-[96px_1fr] sm:grid-cols-[140px_1fr] gap-4 sm:gap-6"} items-start py-6 hairline-b`}
    >
      {article.cover_image_url ? (
        <div className={`relative overflow-hidden rounded-sm ${coverClassName}`}>
          <Image
            src={article.cover_image_url}
            alt=""
            fill
            sizes={isFeatured ? "(max-width: 640px) 100vw, 50vw" : "140px"}
            className="object-cover"
          />
        </div>
      ) : (
        <CoverArt category={article.category} className={coverClassName} />
      )}
      <div className={isFeatured ? "order-1 sm:order-2" : ""}>
        <p className={`font-sans text-xs tracking-[0.14em] uppercase mb-2 ${accent === "brick" ? "text-brick" : "text-river"}`}>
          {article.category}
        </p>
        <h3
          className={`font-display font-700 text-ink leading-tight transition-colors ${
            accent === "brick" ? "group-hover:text-brick" : "group-hover:text-river"
          } ${isFeatured ? "text-3xl sm:text-4xl" : "text-lg sm:text-xl"}`}
        >
          {article.title}
        </h3>
        <p className={`font-body text-steel mt-2 ${isFeatured ? "text-base sm:text-lg" : "text-sm hidden sm:block"}`}>
          {article.dek}
        </p>
        <p className="font-sans text-xs text-steel mt-3">{article.author}</p>
      </div>
    </Link>
  );
}
