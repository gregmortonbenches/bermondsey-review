import Image from "next/image";
import { categoryFamily } from "@/lib/articles";
import { getYouTubeEmbedUrl } from "@/lib/youtube";
import BlockContent from "./BlockContent";
import CoverArt from "./CoverArt";

export default function PostRenderer({ post }) {
  const accent = categoryFamily(post.category);
  const accentHex =
    accent === "brick" ? "var(--color-brick, #9C6B42)" : "var(--color-river, #2B4C73)";
  const embedUrl = post.type === "video" ? getYouTubeEmbedUrl(post.media_url) : null;
  const heroTint = accent === "brick" ? "bg-brick/[0.12]" : "bg-river/[0.1]";

  return (
    <article>
      {/* The lead: a full-width band tinted with the story's own category
          colour (brick or river, the same accent the category label
          already uses), headline block and cover image side by side on
          desktop, stacking on mobile — a proper front-of-section lead
          rather than a plain white header sitting above the image. */}
      <div className={heroTint}>
        <div className="max-w-wide mx-auto grid sm:grid-cols-2 sm:min-h-[420px]">
          <div className="px-4 sm:px-6 lg:px-12 py-10 sm:py-16 flex flex-col justify-center">
            <p
              className={`font-sans text-xs tracking-[0.14em] uppercase mb-3 ${
                accent === "brick" ? "text-brick" : "text-river"
              }`}
            >
              {post.category || "Uncategorised"}
            </p>
            <h1 className="font-display font-700 text-4xl sm:text-5xl text-ink leading-[1.05]">
              {post.title || "Untitled"}
            </h1>
            {post.dek && <p className="font-body text-lg sm:text-xl text-ink/70 mt-4">{post.dek}</p>}
            {post.author && <p className="font-sans text-sm text-ink/70 mt-4">{post.author}</p>}
          </div>
          {post.cover_image_url ? (
            <div className="relative aspect-[4/3] sm:aspect-auto sm:h-full">
              <Image
                src={post.cover_image_url}
                alt={post.cover_image_alt || ""}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <CoverArt category={post.category} className="aspect-[4/3] sm:h-full" />
          )}
        </div>
      </div>

      <div className="max-w-content mx-auto px-4 sm:px-6 py-10">
        {/* Video / podcast player */}
        {post.type === "video" && (
          <div className="aspect-video rounded-sm overflow-hidden bg-ink/5">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <p className="font-sans text-sm text-steel p-6">
                Add a valid YouTube URL to see the player here.
              </p>
            )}
          </div>
        )}
        {post.type === "podcast" && post.media_url && (
          <audio controls className="w-full">
            <source src={post.media_url} />
          </audio>
        )}

        {/* Article body blocks */}
        {post.type === "article" && (
          <BlockContent
            blocks={post.body}
            accentHex={accentHex}
            emptyText="This article doesn't have any content yet."
          />
        )}
      </div>
    </article>
  );
}
