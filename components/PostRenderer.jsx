import Image from "next/image";
import { categoryFamily } from "@/lib/articles";
import { getYouTubeEmbedUrl } from "@/lib/youtube";
import BlockContent from "./BlockContent";
import CoverArt from "./CoverArt";
import { focalPointStyle } from "@/lib/media";

export default function PostRenderer({ post }) {
  const accent = categoryFamily(post.category);
  const accentHex =
    accent === "brick" ? "var(--color-brick, #F5C518)" : "var(--color-river, #1D4ED8)";
  const embedUrl = post.type === "video" ? getYouTubeEmbedUrl(post.media_url) : null;
  const heroTint = accent === "brick" ? "bg-brick/[0.12]" : "bg-river/[0.1]";

  // A single illustration doesn't read as a headline-and-standfirst piece,
  // so cartoons skip the split hero band below entirely for their own
  // compact, centred layout: the full image — uncropped (object-contain,
  // not object-cover; cropping a single-panel joke can cut off the
  // punchline, unlike the homepage rail's thumbnail, which can afford to)
  // — with the caption (post.title, same field CartoonsSection shows
  // under the thumbnail) and artist underneath. No body content section:
  // a cartoon post has no blocks to render, same as it always has.
  if (post.type === "cartoon") {
    return (
      <article className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
        <p className="font-sans text-xs tracking-[0.14em] uppercase mb-4 text-brick">Cartoon</p>
        {post.cover_image_url ? (
          <div className="relative w-full aspect-[4/3] bg-steel/[0.05] overflow-hidden">
            <Image
              src={post.cover_image_url}
              alt={post.cover_image_alt || post.title || "Cartoon"}
              fill
              sizes="(max-width: 640px) 100vw, 42rem"
              className="object-contain"
              priority
            />
          </div>
        ) : (
          <CoverArt category={post.category} className="aspect-[4/3]" />
        )}
        {post.title && <p className="font-display italic text-xl text-ink mt-6">{post.title}</p>}
        {post.author && <p className="font-sans text-sm text-steel mt-2">{post.author}</p>}
      </article>
    );
  }

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
                style={focalPointStyle(post)}
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
          <div className="aspect-video overflow-hidden bg-ink/5">
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
